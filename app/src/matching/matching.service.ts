import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { fuzzy } from 'fast-fuzzy';

import { normalizeText } from './common/normalize';

import { FireflyPrismaService } from './prisma/firefly-prisma.service';
import { EmbeddingService } from './embedding/embedding.service';
import { MatchTransactionDto } from './dto/match-transaction.dto';
import { StoreExampleDto, EMBEDDING_DIMENSIONS } from './dto/store-example.dto';
import { MatchResult } from './dto/match-result.dto';
import { StoreExampleResult } from './dto/store-example-result.dto';
import { EntityListResult } from './dto/entity-list.dto';

interface CandidateRow {
  id: string;
  normalized_description: string | null;
  merchant_name_snapshot: string | null;
  category_name: string | null;
  budget_name: string | null;
  distance: number | string;
}

// ---- Scoring / decision constants (see SYSTEM OVERVIEW "CONFIDENCE RULES") ----
const VECTOR_WEIGHT = 0.7;
const FUZZY_WEIGHT = 0.3;
const AUTO_ACCEPT = 0.9; // >= => auto accept
const AI_THRESHOLD = 0.75; // <  => send to AI
const CANDIDATE_LIMIT = 20;

// Fully schema-qualified so `::vector` casts work regardless of the
// connection's search_path (pgvector defaults to installing into `public`).
// If your `vector` extension lives in a different schema, change ONLY this.
const VECTOR_TYPE = 'matching.vector';

// Allow-list of lookup tables used by findOrCreate (prevents SQL identifier injection).
type LookupTable = 'merchants' | 'categories' | 'budgets' | 'tags';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly firefly: FireflyPrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  normalize(text: string): string {
    return normalizeText(text);
  }

  /** pgvector accepts a `[a,b,c]` text literal cast to ::vector */
  private toVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  // ---------------------------------------------------------------------------
  // MATCH PIPELINE
  // ---------------------------------------------------------------------------

  async match(dto: MatchTransactionDto): Promise<MatchResult> {
    const normalizedInput = this.normalize(dto.description);

    // Step 2 — embedding
    const embedding = await this.embeddingService.embed(normalizedInput);

    // Step 3 — vector search (top-N by cosine distance, never a full scan)
    const candidates = await this.vectorSearch(embedding);
    if (candidates.length === 0) {
      return { confidence: 0, needsAi: true, flagged: false };
    }

    // Step 4 — fuzzy rerank
    let best: CandidateRow | null = null;
    let bestScore = -Infinity;

    for (const c of candidates) {
      const distance = Number(c.distance);
      const vectorScore = 1 - distance; // cosine distance -> similarity
      const fuzzyScore = fuzzy(normalizedInput, c.normalized_description ?? '');
      const score = VECTOR_WEIGHT * vectorScore + FUZZY_WEIGHT * fuzzyScore;

      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }

    const confidence = Math.max(0, Math.min(1, bestScore));
    const needsAi = confidence < AI_THRESHOLD;
    const flagged = confidence >= AI_THRESHOLD && confidence < AUTO_ACCEPT;

    // Step 5 — decision
    if (needsAi || !best) {
      return { confidence, needsAi: true, flagged: false };
    }

    const tags = await this.fetchTags(best.id);

    // Optional improvement: track how often an example gets matched.
    // Fire-and-forget so it never blocks the response.
    void this.incrementUsage(best.id);

    // Step 6 — structured response
    return {
      confidence,
      needsAi,
      flagged,
      exampleId: best.id,
      bestMatch: {
        merchant: best.merchant_name_snapshot ?? '',
        category: best.category_name ?? '',
        budget: best.budget_name ?? null,
        tags,
      },
    };
  }

  private async vectorSearch(embedding: number[]): Promise<CandidateRow[]> {
    const vector = this.toVectorLiteral(embedding);

    return this.firefly.$queryRawUnsafe<CandidateRow[]>(
      `SELECT ce.id,
              ce.normalized_description,
              ce.merchant_name_snapshot,
              c.name AS category_name,
              b.name AS budget_name,
              (ce.embedding <=> $1::${VECTOR_TYPE}) AS distance
         FROM matching.classification_examples ce
         LEFT JOIN matching.categories c ON c.id = ce.category_id
         LEFT JOIN matching.budgets    b ON b.id = ce.budget_id
        WHERE ce.is_active = true
        ORDER BY ce.embedding <=> $1::${VECTOR_TYPE}
        LIMIT $2`,
      vector,
      CANDIDATE_LIMIT,
    );
  }

  private async fetchTags(exampleId: string): Promise<string[]> {
    const rows = await this.firefly.$queryRawUnsafe<{ name: string }[]>(
      `SELECT t.name
         FROM matching.classification_example_tags cet
         JOIN matching.tags t ON t.id = cet.tag_id
        WHERE cet.classification_example_id = $1::uuid`,
      exampleId,
    );
    return rows.map((r) => r.name);
  }

  private async incrementUsage(exampleId: string): Promise<void> {
    try {
      await this.firefly.$executeRawUnsafe(
        `UPDATE matching.classification_examples
            SET usage_count = usage_count + 1
          WHERE id = $1::uuid`,
        exampleId,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to increment usage_count for ${exampleId}: ${(err as Error).message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // LOOKUP / READ (for AI entity selection)
  // ---------------------------------------------------------------------------

  /**
   * Given only a transaction description, returns the entities used by the most
   * similar past examples — the relevance signal comes from embedding similarity
   * (same as /match), not from string-matching entity names. Works for
   * categories/budgets/tags too, since those ride along with similar examples.
   *
   * Results per type are ranked by how often they appear among the nearest
   * `neighbors` examples (frequency = relevance), then capped at `limit`.
   */
  async candidateEntities(
    description: string,
    neighbors: number,
    limit: number,
  ): Promise<EntityListResult> {
    const embedding = await this.embeddingService.embed(this.normalize(description));
    const vector = this.toVectorLiteral(embedding);

    const rows = await this.firefly.$queryRawUnsafe<
      {
        id: string;
        merchant: string | null;
        category: string | null;
        budget: string | null;
      }[]
    >(
      `SELECT ce.id,
              m.normalized_name AS merchant,
              c.normalized_name AS category,
              b.normalized_name AS budget
         FROM matching.classification_examples ce
         LEFT JOIN matching.merchants  m ON m.id = ce.merchant_id
         LEFT JOIN matching.categories c ON c.id = ce.category_id
         LEFT JOIN matching.budgets    b ON b.id = ce.budget_id
        WHERE ce.is_active = true
        ORDER BY ce.embedding <=> $1::${VECTOR_TYPE}
        LIMIT $2`,
      vector,
      neighbors,
    );

    if (rows.length === 0) {
      return { merchants: [], budgets: [], categories: [], tags: [] };
    }

    const tags = await this.neighborTags(
      rows.map((r) => r.id),
      limit,
    );

    return {
      merchants: this.topByFrequency(rows.map((r) => r.merchant), limit),
      budgets: this.topByFrequency(rows.map((r) => r.budget), limit),
      categories: this.topByFrequency(rows.map((r) => r.category), limit),
      tags,
    };
  }

  /** Tags (normalized) attached to the given neighbor examples, frequency-ranked. */
  private async neighborTags(exampleIds: string[], limit: number): Promise<string[]> {
    if (exampleIds.length === 0) return [];
    // Dynamic, bound placeholders ($1::uuid, $2::uuid, ...) — avoids array-param quirks.
    const placeholders = exampleIds.map((_, i) => `$${i + 1}::uuid`).join(', ');
    const rows = await this.firefly.$queryRawUnsafe<{ tag: string }[]>(
      `SELECT t.normalized_name AS tag
         FROM matching.classification_example_tags cet
         JOIN matching.tags t ON t.id = cet.tag_id
        WHERE cet.classification_example_id IN (${placeholders})`,
      ...exampleIds,
    );
    return this.topByFrequency(
      rows.map((r) => r.tag),
      limit,
    );
  }

  /** Count occurrences, sort by frequency desc (ties alphabetical), cap at limit (0 = all). */
  private topByFrequency(values: (string | null)[], limit: number): string[] {
    const counts = new Map<string, number>();
    for (const v of values) {
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
    return limit > 0 ? sorted.slice(0, limit) : sorted;
  }

  // ---------------------------------------------------------------------------
  // STORE AI RESULT FLOW
  // ---------------------------------------------------------------------------

  async storeExample(dto: StoreExampleDto): Promise<StoreExampleResult> {
    // The caller MAY pass a precomputed embedding (e.g. n8n already produced one
    // during AI classification). If not, generate it here using the SAME model
    // and normalization as the /match path — this is the safe default and keeps
    // stored vectors comparable to query vectors.
    let embedding = dto.embedding;
    if (!embedding) {
      embedding = await this.embeddingService.embed(this.normalize(dto.description));
    } else if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding must be ${EMBEDDING_DIMENSIONS}-dimensional, got ${embedding.length}`,
      );
    }

    const vector = this.toVectorLiteral(embedding);

    return this.firefly.$transaction(async (tx) => {
      // Step 1 — ensure lookup entities exist (independent of each other)
      const merchantId = dto.merchant_name ? await this.findOrCreate(tx, 'merchants', dto.merchant_name) : null;
      const categoryId = dto.category_name ? await this.findOrCreate(tx, 'categories', dto.category_name) : null;
      const budgetId = dto.budget_name
        ? await this.findOrCreate(tx, 'budgets', dto.budget_name)
        : null;

      // Step 2 — insert the classification example
      const inserted = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO matching.classification_examples (
            description,
            normalized_description,
            raw_transaction,
            merchant_id,
            merchant_name_snapshot,
            category_id,
            budget_id,
            source,
            confidence,
            embedding
         )
         VALUES ($1, $2, $3::jsonb, $4::uuid, $5, $6::uuid, $7::uuid, $8, $9, $10::${VECTOR_TYPE})
         RETURNING id`,
        dto.description,
        dto.normalized_description,
        JSON.stringify(dto.raw_transaction ?? null),
        merchantId,
        dto.merchant_name,
        categoryId,
        budgetId,
        dto.source,
        dto.confidence,
        vector,
      );
      const exampleId = inserted[0].id;

      // Step 3 — link tags (find-or-create each, then join row)
      for (const tagName of dto.tags) {
        if (!tagName?.trim()) continue;
        const tagId = await this.findOrCreate(tx, 'tags', tagName);
        await tx.$executeRawUnsafe(
          `INSERT INTO matching.classification_example_tags
              (classification_example_id, tag_id)
           VALUES ($1::uuid, $2::uuid)
           ON CONFLICT DO NOTHING`,
          exampleId,
          tagId,
        );
      }

      return { id: exampleId };
    });
  }

  // ---------------------------------------------------------------------------
  // RECALCULATE EMBEDDINGS (backfill rows where embedding IS NULL)
  // ---------------------------------------------------------------------------

  /**
   * Regenerates `embedding` for every classification_example row where it's
   * currently NULL — e.g. after the column was dropped/recreated, or after a
   * bulk import that didn't compute embeddings.
   *
   * Processes in batches (never loads the whole table into memory) and keeps
   * going past individual row failures, the same way incrementUsage does, so
   * one bad row can't abort the whole backfill.
   *
   * IMPORTANT: pagination is cursor-based (`id > lastId`), NOT a repeated
   * `WHERE embedding IS NULL` re-query. A row that fails stays NULL — if we
   * re-queried by that condition alone, a failing row would be re-fetched
   * forever and the loop would never terminate. The cursor guarantees forward
   * progress through the table regardless of per-row success or failure, so
   * each row is attempted at most once per call.
   */
  async recalculateEmbeddings(
    batchSize = 50,
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;
    let lastId = '00000000-0000-0000-0000-000000000000';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const rows = await this.firefly.$queryRawUnsafe<
        { id: string; description: string; normalized_description: string | null }[]
      >(
        `SELECT id, description, normalized_description
           FROM matching.classification_examples
          WHERE embedding IS NULL
            AND id > $1::uuid
          ORDER BY id
          LIMIT $2`,
        lastId,
        batchSize,
      );

      if (rows.length === 0) break;

      for (const row of rows) {
        try {
          const text = row.normalized_description?.trim() || this.normalize(row.description);
          const embedding = await this.embeddingService.embed(text);
          const vector = this.toVectorLiteral(embedding);

          await this.firefly.$executeRawUnsafe(
            `UPDATE matching.classification_examples
                SET embedding = $1::${VECTOR_TYPE}
              WHERE id = $2::uuid`,
            vector,
            row.id,
          );
          processed++;
        } catch (err) {
          failed++;
          this.logger.warn(
            `Failed to recalculate embedding for ${row.id}: ${(err as Error).message}`,
          );
        }
      }

      // Advance the cursor past this whole batch regardless of per-row outcome.
      lastId = rows[rows.length - 1].id;

      this.logger.log(`Recalculated embeddings: ${processed} done, ${failed} failed so far...`);
    }

    this.logger.log(`Finished recalculating embeddings. processed=${processed} failed=${failed}`);
    return { processed, failed };
  }

  /**
   * Find a lookup row by normalized_name, inserting it if missing.
   * `table` is constrained to a fixed allow-list, so interpolating it into the
   * SQL string is safe (no injection surface). All values are parameterized.
   */
  private async findOrCreate(
    tx: Prisma.TransactionClient,
    table: LookupTable,
    name: string,
  ): Promise<string> {
    const normalized = this.normalize(name);

    const found = await tx.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM matching.${table} WHERE normalized_name = $1 LIMIT 1`,
      normalized,
    );
    if (found.length > 0) return found[0].id;

    try {
      const created = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO matching.${table} (name, normalized_name)
         VALUES ($1, $2)
         RETURNING id`,
        name,
        normalized,
      );
      return created[0].id;
    } catch {
      // Possible race with a concurrent insert; re-select once.
      const retry = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM matching.${table} WHERE normalized_name = $1 LIMIT 1`,
        normalized,
      );
      if (retry.length > 0) return retry[0].id;
      throw new Error(`Could not find or create ${table} "${name}"`);
    }
  }
}