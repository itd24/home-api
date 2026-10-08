import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Response schema for POST /matching/examples.
 */
export const storeExampleResultSchema = z.object({
  id: z.string().meta({
    description: 'ID of the newly stored classification example',
    example: '7d3c8e2a-1f4b-4c9a-9b2e-2a1f4b4c9a9b',
  }),
});

export class StoreExampleResultDto extends createZodDto(storeExampleResultSchema) {}

export type StoreExampleResult = z.infer<typeof storeExampleResultSchema>;
