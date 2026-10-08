import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { MatchingService } from './matching.service';
import { MatchTransactionDto } from './dto/match-transaction.dto';
import { StoreExampleDto } from './dto/store-example.dto';
import { MatchResultDto } from './dto/match-result.dto';
import { StoreExampleResultDto } from './dto/store-example-result.dto';
import { JwtOrApikeyAuthGuard } from '@auth/jwt-or-apikey-auth.guard';
import { EntityListDto } from './dto/entity-list.dto';
import { CandidateEntitiesDto } from './dto/candidate-entities.dto';
import { RecalculateEmbeddingsDto } from './dto/recalculate-embeddings-result.dto';

@ApiTags('Banking')
@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * POST /matching/match
   * @ZodResponse sets the status code (@HttpCode), documents the response in
   * Swagger (@ApiResponse), serializes the return value through the schema
   * (@ZodSerializerDto), and compile-checks that the handler returns a matching
   * shape — all from one DTO. Requires ZodSerializerInterceptor + cleanupOpenApiDoc.
   */
  @Post('match')  
  @ApiBearerAuth()
  @UseGuards(JwtOrApikeyAuthGuard)
  @ApiOperation({ summary: 'Find the best historical classification for a transaction' })
  @ZodResponse({ status: 200, type: MatchResultDto })
  match(@Body() dto: MatchTransactionDto) {
    return this.matchingService.match(dto);
  }

  @Post('examples')
  @ApiBearerAuth()
  @UseGuards(JwtOrApikeyAuthGuard)
  @ApiOperation({ summary: 'Store a classification result as a new training example' })
  @ZodResponse({ status: 201, type: StoreExampleResultDto })
  store(@Body() dto: StoreExampleDto) {
    return this.matchingService.storeExample(dto);
  }

    /**
   * POST /matching/candidates
   * Given only a transaction description, suggest the existing entities used by
   * the most similar past examples (frequency-ranked). Feed these to an AI step:
   * it reuses what's returned, and creates a new entity only when a list is empty.
   */
    @Post('candidates')
    @ApiBearerAuth()
    @UseGuards(JwtOrApikeyAuthGuard)
    @ApiOperation({
      summary: 'Suggest existing entities relevant to a transaction description',
    })
    @ZodResponse({ status: 200, type: EntityListDto })
    candidates(@Body() dto: CandidateEntitiesDto) {
      return this.matchingService.candidateEntities(dto.description, dto.neighbors, dto.limit);
    }

      /**
   * POST /matching/candidates
   * Given only a transaction description, suggest the existing entities used by
   * the most similar past examples (frequency-ranked). Feed these to an AI step:
   * it reuses what's returned, and creates a new entity only when a list is empty.
   */
      @Get('recalculate-embeddings')
      @ApiBearerAuth()
      @UseGuards(JwtOrApikeyAuthGuard)
      @ApiOperation({
        summary: 'Recalculate the embeddings',
      })
      @ZodResponse({ status: 200, type: RecalculateEmbeddingsDto})
      recalculateEmbeddings() {
        return this.matchingService.recalculateEmbeddings(500);
      }
}
