import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Response for GET /matching/entities.
 *
 * Each array holds the `normalized_name` values of existing rows — the minimal
 * payload an AI step needs to reuse existing entities and only create new ones
 * when nothing matches.
 */
export const entityListSchema = z.object({
  merchants: z.array(z.string()).meta({ example: ['spar', 'lidl', 'mercator'] }),
  budgets: z.array(z.string()).meta({ example: ['household', 'leisure'] }),
  categories: z.array(z.string()).meta({ example: ['groceries', 'transport'] }),
  tags: z.array(z.string()).meta({ example: ['food', 'recurring'] }),
});

export class EntityListDto extends createZodDto(entityListSchema) {}

export type EntityListResult = z.infer<typeof entityListSchema>;
