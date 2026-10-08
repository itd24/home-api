# NestJS application

This folder holds the NestJS source of the Home API. The overview, the setup steps and
all environment variables are documented in the README of the repository root, see
[`../README.md`](../README.md).

Quick start from this folder:

```bash
cp .env.example .env    # fill in your own values
yarn install
yarn prisma migrate deploy
yarn seed
yarn start:dev
```

Swagger UI is served under `/api`. The dev server listens on port `3000`, the host port
is `3001` when the stack from the `home-setup` repository is used.

The transaction matching module has its own notes, see
[`src/matching/README.md`](src/matching/README.md).
