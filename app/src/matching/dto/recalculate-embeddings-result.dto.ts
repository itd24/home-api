import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Response schema for POST /matching/examples.
 */
export const recalculateEmbeddingsSchema = z.object({
  processed: z.number().meta({
    description: 'The amount of processed entities',
    example: '10',
  }),
  failed: z.number().meta({
    description: 'The amount of entities where processing failed',
    example: '5',
  }),
});

/*
{ processed: number; failed: number }
*/

export class RecalculateEmbeddingsDto extends createZodDto(recalculateEmbeddingsSchema) {}

export type RecalculateEmbeddingsResult = z.infer<typeof recalculateEmbeddingsSchema>;
