import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Input for POST /matching/match
 */
export const matchTransactionSchema = z.object({
  description: z.string().min(1, 'description is required'),
  amount: z.number().optional(),
  currency: z.string().optional(),
  iban: z.string().optional(),
});

export type MatchTransactionDto = z.infer<typeof matchTransactionSchema>;
