import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

type FeatureExtractionPipeline = (
  text: string | string[],
  options?: { pooling?: 'mean' | 'cls' | 'none'; normalize?: boolean },
) => Promise<{ data: Float32Array | number[] }>;

/**
 * Generates 384-dimensional sentence embeddings in-process using
 * `Xenova/all-MiniLM-L6-v2`.
 *
 * The model is loaded lazily (and warmed at startup). The first call will
 * download the model weights to the local transformers cache.
 *
 * NOTE: Whatever generates embeddings for STORED examples must use the same
 * model, otherwise cosine distances are meaningless. If you generate stored
 * embeddings externally, make sure they also come from all-MiniLM-L6-v2.
 */
@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

  private static readonly MODEL = 'Xenova/all-MiniLM-L6-v2';
  static readonly DIMENSIONS = 384;

  private getExtractor(): Promise<FeatureExtractionPipeline> {
    if (!this.extractorPromise) {
      this.extractorPromise = (async () => {
        // @huggingface/transformers is ESM-only; use a dynamic import so this
        // works from a CommonJS NestJS build.
        const { pipeline } = await import('@huggingface/transformers');
        this.logger.log(`Loading embedding model ${EmbeddingService.MODEL}...`);
        const extractor = (await pipeline(
          'feature-extraction',
          EmbeddingService.MODEL,
        )) as unknown as FeatureExtractionPipeline;
        this.logger.log('Embedding model ready.');
        return extractor;
      })();
    }
    return this.extractorPromise;
  }

  /**
   * Returns a normalized 384-d embedding for the given text.
   */
  async embed(text: string): Promise<number[]> {
    const extractor = await this.getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data as Iterable<number>);

    if (vector.length !== EmbeddingService.DIMENSIONS) {
      throw new Error(
        `Unexpected embedding dimension ${vector.length}, expected ${EmbeddingService.DIMENSIONS}`,
      );
    }
    return vector;
  }

  /** Warm the model at boot so the first real request isn't penalized. */
  async onModuleInit(): Promise<void> {
    try {
      await this.embed('warmup');
    } catch (err) {
      this.logger.warn(
        `Embedding model warmup skipped: ${(err as Error).message}`,
      );
    }
  }
}
