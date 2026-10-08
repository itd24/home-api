# Home API

NestJS API that powers my home server. It is the backend of the dashboard, of the
automation workflows and of the scanner. This repository is one of six parts that belong
together. The other ones are `home-setup`, `home-dashboard`, `scanner-service`,
`reverse-proxy` and `home-backup`.

The API is written in TypeScript and runs on Node 22. Data lives in PostgreSQL and is
reached through Prisma. The dashboard logs in with a JWT, automation jobs use static API
keys.

## What is inside

| Module | Purpose |
|---|---|
| `auth` | JWT login plus API key authentication, used by n8n and the dashboard |
| `users` | User and API key management |
| `documents` | Triggers the physical scanner and tracks every scanned document |
| `cars` | Stores and returns the parking location of my car |
| `banking` | Talks to Firefly III and stores transaction metadata |
| `matching` | Matches imported bank transactions to Firefly III entities with local embeddings and pgvector |
| `latex` | Renders LaTeX documents (AltaCV), for example a CV, to PDF |

## Layout

```
.
├── Dockerfile          # Node 22 + TeX Live + AltaCV, used by home-setup's docker-compose
├── app/                # the NestJS application
│   ├── src/            # application code
│   ├── prisma/         # schema, migrations and seed script
│   ├── test/           # e2e tests
│   └── .env.example    # copy to .env and fill in your own values
└── storage/            # LaTeX assets mounted into the container as /storage
```

## Getting started

```bash
cd app
cp .env.example .env    # fill in your own values
yarn install
yarn prisma migrate deploy
yarn seed
yarn start:dev
```

Swagger UI is served under `/api`. In dev mode that is `http://localhost:3000/api`.
When the stack from the `home-setup` repository is used, the API is published on host
port `3001`.

## Configuration

All configuration lives in `app/.env`, see `app/.env.example` for the full list.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection of this API, used by Prisma |
| `FIREFLY_DATABASE_URL` | PostgreSQL connection of the Firefly III database and the `matching` schema, needs pgvector |
| `FIREFLY_API_URL` | Base URL of the Firefly III instance |
| `FIREFLY_API_TOKEN` | Personal access token for Firefly III |
| `JWT_SECRET` | Secret that signs the JWT access tokens |

## AI usage

AI is part of the running application, not only a helper during development.

- The `matching` module turns a transaction description into a 384 dimensional vector
  with the local sentence transformer model `Xenova/all-MiniLM-L6-v2`. The vector is
  stored with pgvector and compared with cosine distance. This runs inside the API, no
  external API call is made.
- Fuzzy string comparison (`fast-fuzzy`) is mixed into the score to rerank the closest
  candidates.
- When the best score stays below 0.75, the transaction is handed over to an AI
  classifier. That step runs outside this repository in n8n, where an LLM provider is
  called. The answer is posted back to `/matching/examples` and becomes training data for
  the next import.
- Thresholds, scoring and the decision table are documented in
  `app/src/matching/README.md`.

## Notes

- The scanner integration expects a service on the Docker host that listens on port
  `4356`. That service lives in the `scanner-service` repository. The URLs are defined in
  `app/src/documents/scanning.service.ts`.
- `storage/signature.png` is not part of this repository. Add your own file with that
  name if the LaTeX module should render a signature.
- `app/samples` contains a small hello world LaTeX document that is used as a smoke test.

## License

Private project, no license granted. Third party assets keep their own licenses. AltaCV
is LPPL and the Simple Icons font is CC0.
