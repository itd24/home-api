import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ImportedTransactionsService } from './imported-transactions.service';
import { CheckTransactionDto, CheckTransactionResultDto } from './dto/check-transaction.dto';
import { RecordTransactionDto, RecordTransactionResultDto } from './dto/record-transaction.dto';

@ApiTags('Banking')
@Controller('matching/transactions')
export class ImportedTransactionsController {
  constructor(private readonly importedTransactionsService: ImportedTransactionsService) {}

  /**
   * POST /matching/transactions/check
   * Call this FIRST, before /matching/candidates or /matching/match — no point
   * spending embedding/AI work on a transaction that's already been imported.
   * Input is just the source transaction id.
   */
  @Post('check')
  @ApiOperation({ summary: 'Check whether a transaction has already been imported' })
  @ZodResponse({ status: 200, type: CheckTransactionResultDto })
  check(@Body() dto: CheckTransactionDto) {
    return this.importedTransactionsService.check(dto);
  }

  /**
   * POST /matching/transactions
   * Call this AFTER a transaction has actually been imported into Firefly III.
   * Idempotent: calling it again for the same transaction is a no-op.
   */
  @Post()
  @ApiOperation({ summary: 'Record a transaction as imported (idempotent)' })
  @ZodResponse({ status: 200, type: RecordTransactionResultDto })
  record(@Body() dto: RecordTransactionDto) {
    return this.importedTransactionsService.record(dto);
  }
}
