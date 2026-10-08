import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Must match EmbeddingService.DIMENSIONS (all-MiniLM-L6-v2 => 384).
export const EMBEDDING_DIMENSIONS = 384;

/**
 * Input for POST /matching/examples
 * Used after an external AI classification (e.g. via n8n) returns a result.
 */
export const storeExampleSchema = z.object({
  description: z.string().min(1).meta({
    description: 'Original transaction description',
    example: 'SPAR DOO MARIBOR CARD 1234',
  }),
  normalized_description: z.string().min(1).meta({
    description: 'Lowercased, stripped description used for fuzzy matching',
    example: 'spar doo maribor card 1234',
  }),
  raw_transaction: z.any().meta({
    description: 'Arbitrary original transaction payload, stored as JSONB',
  }),
  merchant_name: z.string().optional().meta({ example: 'Spar' }),
  category_name: z.string().optional().meta({ example: 'Groceries' }),
  budget_name: z.string().optional().meta({ example: 'Household' }),
  tags: z.array(z.string()).default([]).meta({ example: ['food'] }),
  embedding: z
    .array(z.number())
    .length(EMBEDDING_DIMENSIONS, `embedding must be ${EMBEDDING_DIMENSIONS}-dimensional`)
    .optional()
    .meta({
      description:
        `Optional precomputed ${EMBEDDING_DIMENSIONS}-d embedding. ` +
        `Omit it and the module generates one from the description using the ` +
        `same model as /match. Only pass one if it came from all-MiniLM-L6-v2.`,
    }),
  source: z.enum(['ai', 'manual', 'imported']).meta({ example: 'ai' }),
  confidence: z.number().min(0).max(1).meta({ example: 0.87 }),
});

export class StoreExampleDto extends createZodDto(storeExampleSchema) {}