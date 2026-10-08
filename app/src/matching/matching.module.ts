import { Module } from '@nestjs/common';

import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { EmbeddingService } from './embedding/embedding.service';
import { FireflyPrismaService } from './prisma/firefly-prisma.service';
import { ImportedTransactionsController } from './imported-transactions.controller';
import { ImportedTransactionsService } from './imported-transactions.service';

@Module({
  controllers: [MatchingController, ImportedTransactionsController],
  providers: [
    MatchingService,
    EmbeddingService,
    FireflyPrismaService,
    ImportedTransactionsService
  ],
  exports: [MatchingService, ImportedTransactionsService],
})
export class MatchingModule {}