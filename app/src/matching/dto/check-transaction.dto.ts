import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Input for POST /matching/transactions/check */
export const checkTransactionSchema = z.object({
  id: z.string().min(1).meta({
    description:
      'Globally unique transaction id from the source system (you confirmed ' +
      'this is unique even across different import sources).',
    example: 'revolut-current-3681432000',
  }),
});
export class CheckTransactionDto extends createZodDto(checkTransactionSchema) {}

/** Output for POST /matching/transactions/check */
export const checkTransactionResultSchema = z.object({
  exists: z.boolean().meta({
    description: 'true if this transaction has already been imported',
    example: false,
  }),
  transactionHash: z.string().meta({
    description: 'The computed dedup hash (sha256 hex) for this transaction id',
  }),
  id: z.string().optional().meta({
    description: 'Row id in matching.imported_transactions, if it exists',
  }),
  fireflyTransactionId: z.string().nullable().optional().meta({
    description: 'Firefly III transaction id recorded for this hash, if any',
  }),
});
export class CheckTransactionResultDto extends createZodDto(checkTransactionResultSchema) {}

export type CheckTransactionResult = z.infer<typeof checkTransactionResultSchema>;
