import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { ScanningService } from './scanning.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [DocumentsController],
  providers: [ScanningService],
  imports: [HttpModule]
})
export class DocumentsModule {}
