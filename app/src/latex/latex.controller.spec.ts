import { Test, TestingModule } from '@nestjs/testing';
import { LatexController } from './latex.controller';
import { LatexService } from './latex.service';

describe('LatexController', () => {
  let controller: LatexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LatexController],
      providers: [LatexService],
    }).compile();

    controller = module.get<LatexController>(LatexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
