import { Test, TestingModule } from '@nestjs/testing';
import { LatexService } from './latex.service';

describe('LatexService', () => {
  let service: LatexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LatexService],
    }).compile();

    service = module.get<LatexService>(LatexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
