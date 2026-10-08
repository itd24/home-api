import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * A SECOND Prisma client, connected to the `firefly` database (where the
 * `matching` schema lives) instead of the app's default database.
 *
 * Why a second client at all: in PostgreSQL a single connection cannot query
 * across databases, so your existing default PrismaService can't reach the
 * `firefly` DB. We reuse the SAME generated client and only override the
 * connection URL — no second schema / `prisma generate` needed.
 *
 * IMPORTANT: only use raw SQL on this instance (`$queryRawUnsafe`,
 * `$executeRawUnsafe`, `$transaction`). Do NOT call model accessors like
 * `this.classificationExample.findMany()` — those models are generated against
 * your DEFAULT database and won't line up with `firefly`.
 *
 * Requires `FIREFLY_DATABASE_URL`, e.g.
 *   postgresql://user:pass@host:5432/firefly?schema=matching
 */
@Injectable()
export class FireflyPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(FireflyPrismaService.name);

  constructor() {
    const url = process.env.FIREFLY_DATABASE_URL;
    if (!url) {
      throw new Error('FIREFLY_DATABASE_URL is not set');
    }
    // `datasourceUrl` (Prisma >= 5.2) overrides the single datasource's URL.
    // On older Prisma use: super({ datasources: { db: { url } } })
    // (replace `db` with your datasource block name in schema.prisma).
    super({ datasourceUrl: url, log: ['query'] });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to the firefly database.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
