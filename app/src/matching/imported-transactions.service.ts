import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

import { FireflyPrismaService } from './prisma/firefly-prisma.service';
import { CheckTransactionDto, CheckTransactionResult } from './dto/check-transaction.dto';
import { RecordTransactionDto, RecordTransactionResult } from './dto/record-transaction.dto';

interface ImportedTransactionRow {
  id: string;
  firefly_transaction_id: string | null;
}

@Injectable()
export class ImportedTransactionsService {
  constructor(private readonly firefly: FireflyPrismaService) {}

  /**
   * Hash of the source transaction id. The id is already guaranteed globally
   * unique, so hashing isn't strictly required for correctness — it's done to
   * keep a fixed length (fits transaction_hash varchar(128) regardless of how
   * long source ids get) and to keep that column's semantics consistent.
   */
  private computeHash(id: string): string {
    return createHash('sha256').update(id).digest('hex');
  }

  async check(dto: CheckTransactionDto): Promise<CheckTransactionResult> {
    const transactionHash = this.computeHash(dto.id);

    const rows = await this.firefly.$queryRawUnsafe<ImportedTransactionRow[]>(
      `SELECT id, firefly_transaction_id
         FROM matching.imported_transactions
        WHERE transaction_hash = $1
        LIMIT 1`,
      transactionHash,
    );

    if (rows.length === 0) {
      return { exists: false, transactionHash };
    }
    return {
      exists: true,
      transactionHash,
      id: rows[0].id,
      fireflyTransactionId: rows[0].firefly_transaction_id,
    };
  }

  /**
   * Idempotent: if this id was already recorded, the existing row is left
   * untouched (no update) and `alreadyExisted: true` is returned. Safe to
   * call more than once for the same transaction.
   */
  async record(dto: RecordTransactionDto): Promise<RecordTransactionResult> {
    const transactionHash = this.computeHash(dto.id);
    const id = randomUUID();

    const inserted = await this.firefly.$queryRawUnsafe<ImportedTransactionRow[]>(
      `INSERT INTO matching.imported_transactions
          (id, transaction_hash, external_id, firefly_transaction_id)
       VALUES (uuid($1), $2, $3, $4)
       ON CONFLICT (transaction_hash) DO NOTHING
       RETURNING id, firefly_transaction_id`,
      id, 
      transactionHash,
      dto.id,
      dto.firefly_transaction_id ?? null,
    );

    if (inserted.length > 0) {
      return { id: inserted[0].id, transactionHash, alreadyExisted: false };
    }

    // Conflict happened — fetch the existing row to return its id.
    const existing = await this.firefly.$queryRawUnsafe<ImportedTransactionRow[]>(
      `SELECT id, firefly_transaction_id
         FROM matching.imported_transactions
        WHERE transaction_hash = $1
        LIMIT 1`,
      transactionHash,
    );

    return { id: existing[0].id, transactionHash, alreadyExisted: true };
  }
}
