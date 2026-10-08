import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { FireflyMetadataService } from './firefly-metadata.service';
import {
  EnsureBudgetDto,
  EnsureCategoryDto,
  EnsureTagDto,
  FireflyResourceResponseDto,
} from './DTOs/firefly-metadata.dto';

@ApiTags('firefly')
@Controller('firefly')
export class FireflyMetadataController {
  constructor(private readonly fireflyMetadata: FireflyMetadataService) {}

  /** Looks up the budget by name, creating it if it doesn't exist. Returns its id. */
  @Post('budgets')
  async ensureBudget(@Body() body: EnsureBudgetDto): Promise<FireflyResourceResponseDto> {
    const id = await this.fireflyMetadata.ensureBudget(body.name);
    return { id };
  }

  /** Looks up the category by name, creating it if it doesn't exist. Returns its id. */
  @Post('categories')
  async ensureCategory(@Body() body: EnsureCategoryDto): Promise<FireflyResourceResponseDto> {
    const id = await this.fireflyMetadata.ensureCategory(body.name);
    return { id };
  }

  /** Looks up the tag, creating it if it doesn't exist. Returns its id. */
  @Post('tags')
  async ensureTag(@Body() body: EnsureTagDto): Promise<FireflyResourceResponseDto> {
    const id = await this.fireflyMetadata.ensureTag(body.tag);
    return { id };
  }
}
