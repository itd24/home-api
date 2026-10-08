import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Response schema for POST /matching/match.
 *
 * This is the single source of truth: the DTO class is used by @ZodResponse
 * (serialization + Swagger), and the inferred types are reused by the service
 * so the runtime, compile-time, and docs-time shapes can't drift apart.
 *
 * `.meta({ id })` hoists the nested object into components.schemas as a $ref.
 */
export const bestMatchSchema = z
  .object({
    merchant: z.string().meta({ example: 'Spar' }),
    category: z.string().meta({ example: 'Groceries' }),
    budget: z.string().nullable().meta({ example: 'Household' }),
    tags: z.array(z.string()).meta({ example: ['food'] }),
  })
  .meta({ id: 'BestMatch' });

export const matchResultSchema = z.object({
  confidence: z.number().meta({
    description: 'Blended vector + fuzzy score of the best candidate (0–1)',
    example: 0.93,
  }),
  needsAi: z.boolean().meta({
    description: 'true when confidence < 0.75; caller should run AI classification',
    example: false,
  }),
  flagged: z.boolean().meta({
    description: 'true when 0.75 ≤ confidence < 0.90 (accepted, but worth a check)',
    example: false,
  }),
  bestMatch: bestMatchSchema.optional(),
  exampleId: z.string().optional().meta({
    description: 'ID of the matched classification example',
  }),
});

export class MatchResultDto extends createZodDto(matchResultSchema) {}

export type BestMatch = z.infer<typeof bestMatchSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;
