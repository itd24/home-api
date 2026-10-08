# Transaction matching

This module suggests a Firefly III classification for a freshly imported bank
transaction. It does that in two steps. First it looks for similar transactions that were
classified before. Only when it is not confident enough does the caller hand the work to
an AI classifier that runs outside this API, in n8n.

Everything runs inside the API process. The embeddings come from a local model, so no
external API is called from here.

## How a match is built

1. The description is normalized (lower case, trimmed, trimmed noise).
2. `EmbeddingService` turns it into a 384 dimensional vector with the local sentence
   transformer `Xenova/all-MiniLM-L6-v2`.
3. pgvector looks for the closest stored examples with a cosine search. The query returns
   at most `CANDIDATE_LIMIT` rows, which is 20.
4. Every candidate gets a score from two parts, 70 percent vector similarity and 30
   percent fuzzy string similarity (`fast-fuzzy`).
5. The best candidate is turned into a decision.

| Confidence | Decision |
|---|---|
| `>= 0.90` | `autoAccepted`, the caller can use the result as it is |
| `0.75 <= x < 0.90` | `flagged`, the result is used but should be reviewed |
| `< 0.75` | `needsAi`, the caller should run AI classification |

The numbers are constants at the top of `matching.service.ts`. The DTO for the response
documents them as well, see `dto/match-result.dto.ts`.

## What the AI step receives

`POST /matching/candidates` solves the problem that an LLM should not invent new tags and
categories on every import. It returns the merchants, budgets, categories and tags that
were used by the closest past examples, ranked by how often they appear. The n8n workflow
picks from that list and creates a new entry only when a list comes back empty.

When the AI classifier has decided, n8n posts the result to `POST /matching/examples`.
That row becomes training data for the next import, which is how the confidence for
recurring merchants keeps improving.

## Endpoints

All endpoints need a JWT or an API key (`JwtOrApikeyAuthGuard`).

| Method | Path | Purpose |
|---|---|---|
| POST | `/matching/match` | Best historical classification for one transaction |
| POST | `/matching/candidates` | Entity suggestions for the AI step, based on the nearest examples |
| POST | `/matching/examples` | Store a classification as a new training example |
| GET | `/matching/recalculate-embeddings` | Backfill embeddings for rows where `embedding IS NULL` |

## Database

The examples, merchants, categories, budgets, tags and the AI classification log live in
the `matching` schema of the Firefly III database. `home-setup` holds the SQL that
creates the schema, see `dbhome/manual-initialisation/1-create-matching-database.sql`.
The tables need the `vector` and `pg_trgm` extensions.

The SQL creates an `ivfflat` index and an `hnsw` index on the embedding column. Only one
of them is needed. `hnsw` is the recommended one for this size of data.

## Two Prisma clients

The module needs a second Prisma client for the Firefly III database, because that is
where the `matching` schema lives. The second client is created with a separate datasource
URL and is injected with the token from `firefly-prisma.service.ts`. The generated client
of the default connection stays untouched.

## Configuration

| Variable | Purpose |
|---|---|
| `FIREFLY_DATABASE_URL` | PostgreSQL connection that points at the Firefly III database, the `matching` schema is part of it |

## Rebuilding the client

After a change to the schema of the firefly database, regenerate the client:

```bash
yarn prisma generate --schema=prisma/schema.prisma
```
