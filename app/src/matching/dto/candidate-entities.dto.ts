import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Input for POST /matching/candidates
 *
 * Given only a transaction description, returns the existing entities used by
 * the most similar past examples — so an AI step can reuse them instead of
 * guessing entity names or creating duplicates.
 */
export const candidateEntitiesSchema = z.object({
  description: z.string().min(1).meta({
    description: 'Raw transaction description',
    example: 'SPAR DOO MARIBOR CARD 1234',
  }),
  neighbors: z
    .number()
    .int()
    .min(1)
    .max(500)
    .default(100)
    .meta({
      description: 'How many nearest past examples to scan for candidate entities',
      example: 100,
    }),
  limit: z
    .number()
    .int()
    .min(0)
    .default(20)
    .meta({
      description: 'Max candidates returned per type (ranked by frequency). 0 = all found.',
      example: 20,
    }),
});

export class CandidateEntitiesDto extends createZodDto(candidateEntitiesSchema) {}

export type CandidateEntities = z.infer<typeof candidateEntitiesSchema>;
