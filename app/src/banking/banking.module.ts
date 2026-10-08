import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FireflyMetadataService } from './firefly-metadata.service';
import { FireflyMetadataController } from './firefly-metadata.controller';

@Module({
  imports: [HttpModule],
  controllers: [FireflyMetadataController],
  providers: [FireflyMetadataService],
  exports: [FireflyMetadataService]
})
export class BankingModule {}
