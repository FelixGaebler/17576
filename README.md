# 26³

**26³ = 17,576** possible three-letter acronyms. How many of them does our
company have a meaning for?

26³ is a gamified internal glossary. Users submit acronyms they run into,
collect points, discover ambiguous acronyms and compete on a scoreboard.

| Outcome             | When                                               | Points |
| ------------------- | -------------------------------------------------- | -----: |
| `NEW_ACRONYM`       | The acronym is not in the glossary yet             |     +5 |
| `EXISTING_ENTRY`    | Acronym and (normalized) meaning are already known |     +1 |
| `DUPLICATE_FOUND`   | The acronym is known, the meaning is new           |    +10 |
| `ALREADY_SUBMITTED` | The user already submitted this acronym            |      0 |

Each user can score an acronym once. A `ScoreTransaction` row is both the
score history and the record that the user submitted the acronym.

## Where things live

| Path                         | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `src/app/`                   | Pages (Home, Scoreboard, Search, Submit, Profile)        |
| `src/app/submit/actions.ts`  | Server action for submissions                            |
| `components/`                | App components; `components/ui/` holds shadcn/ui         |
| `lib/validation.ts`          | Acronym/meaning validation and normalization (Zod)       |
| `lib/scoring.ts`             | `submitAcronym()` – classification, points, transaction  |
| `lib/glossary.ts`            | Glossary progress and acronym lookup                     |
| `lib/auth.ts`                | `getCurrentUser()` – development user until Keycloak     |
| `src/prisma/contract.prisma` | Data model (Prisma 8); `db.ts` creates the client        |
| `src/prisma/seed.ts`         | Development seed data                                    |

`getCurrentUser()` currently returns a fixed development user. Replace its
implementation with a Keycloak-backed one (`User.externalId` holds the
identity provider's id); nothing else needs to change.

## Run locally

```bash
bun install
cp .env.example .env

# Authenticate once, then create a Prisma Postgres database.
bun run compute:login
bun run compute:database:create

# Copy the printed DATABASE_URL into .env.

bun run contract:emit
bun run db:migrate
bun run db:seed   # resets users and glossary data
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

The scoring tests run against a real PostgreSQL database and wipe it before
each test, so they only run when `TEST_DATABASE_URL` is set. For example:

```bash
docker run -d --rm --name acronyms-test-db -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:17-alpine
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/postgres
bun run db:migrate --db $TEST_DATABASE_URL
bun run test
```

## Deploy to Prisma Compute

Connect this repository to Prisma Cloud, then push the branch. The included
GitHub Actions workflow runs Composer, which provisions Prisma Postgres,
applies the Prisma 8 contract, and deploys the Next.js service.

```bash
bun run compute:connect
```

When you change `src/prisma/contract.prisma`, emit the updated contract and
author a migration before pushing:

```bash
bun run contract:emit
bun run migration:plan --name describe-the-change
bun run db:update
```

After connecting, open the running service with:

```bash
bun run compute:open
```

Each push creates a build. To stream the full build log, copy the build ID
from the GitHub check run and run:

```bash
bunx prisma build logs <build-id>
```
