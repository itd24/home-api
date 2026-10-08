import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Input for POST /matching/transactions
 * Call this AFTER a transaction has actually been imported into Firefly III,
 * so future /transactions/check calls catch it as a duplicate.
 */
export const recordTransactionSchema = z.object({
  id: z.string().min(1).meta({
    description: 'Globally unique transaction id from the source system',
    example: 'revolut-current-3681432000',
  }),
  firefly_transaction_id: z.string().optional().meta({
    description: 'Firefly III transaction id, if already known at record time',
    example: '12981',
  }),
});
export class RecordTransactionDto extends createZodDto(recordTransactionSchema) {}

/** Output for POST /matching/transactions */
export const recordTransactionResultSchema = z.object({
  id: z.string().meta({ description: 'Row id in matching.imported_transactions' }),
  transactionHash: z.string(),
  alreadyExisted: z.boolean().meta({
    description:
      'true if this id was already recorded (call is idempotent; the ' +
      'existing row was left untouched, not overwritten)',
    example: false,
  }),
});
export class RecordTransactionResultDto extends createZodDto(recordTransactionResultSchema) {}

export type RecordTransactionResult = z.infer<typeof recordTransactionResultSchema>;
