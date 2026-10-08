import { Module } from '@nestjs/common';
import { LatexService } from './latex.service';
import { LatexController } from './latex.controller';

@Module({
  controllers: [LatexController],
  providers: [LatexService],
})
export class LatexModule {}
