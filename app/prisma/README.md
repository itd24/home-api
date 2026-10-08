# Prisma

This folder holds the Prisma schema, the migration history and the seed script of the
Home API. It is not a NestJS module, even though it sits inside `app/`.

- `schema.prisma` defines the models and the datasource.
- `migrations/` contains the SQL that `prisma migrate deploy` applies.
- `seed.ts` inserts the demo user and the system user that automation jobs use. It runs
  with `yarn seed`.
