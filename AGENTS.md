# AGENTS.md

Guidance for AI coding agents working on **26³** (`twentysix-cubed`), a gamified
internal glossary for three-letter acronyms. Humans: see [README.md](README.md).

## Commands

Use **Bun** for everything (`packageManager: bun`). Never use npm/yarn/pnpm.

| Task | Command |
| --- | --- |
| Install | `bun install` |
| Dev server | `bun run dev` (port 3000; usually already running – don't start a second one) |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` (runs `next typegen` first) |
| Tests | `bun run test` |
| Build | `bun run build` (emits the Prisma contract, then `next build`) |
| Emit Prisma contract | `bun run contract:emit` |
| Plan a migration | `bun run migration:plan --name snake_case_name` |
| Apply migrations | `bun run db:migrate` |
| Seed | `bun run db:seed` – **wipes all users and glossary data**; ask before running |
| Helm | `helm lint helm --strict` |

Before finishing a change, run `bun run lint`, `bun run typecheck` and
`bun run test`. Run `bun run build` when touching config, routes or
dependencies.

### Database tests

`lib/scoring.test.ts` wipes its database and only runs with `TEST_DATABASE_URL`.
**Never point it at `DATABASE_URL`.** Use a throwaway container:

```bash
docker run -d --rm --name acronyms-test-db -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:17-alpine
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/postgres
bun run db:migrate --db $TEST_DATABASE_URL && bun run test
docker stop acronyms-test-db
```

## Project map

```text
src/app/                 Pages (App Router). Server Components by default.
src/app/submit/actions.ts  Server action for submissions
src/app/search/actions.ts  Server action to invalidate a meaning (admins)
src/app/auth/            OIDC login, callback, logout route handlers
src/proxy.ts             Next 16 "proxy" (formerly middleware): optimistic session check
components/              App components; components/ui/ = shadcn/ui (generated)
lib/validation.ts        Acronym/meaning validation + normalization (Zod, client-safe)
lib/scoring.ts           submitAcronym(), leaderboard, score history (server)
lib/glossary.ts          Progress stats, acronym lookup (server)
lib/auth.ts              getCurrentUser(), upsertOidcUser()
lib/oidc.ts, session.ts  OIDC flow (openid-client), encrypted cookie (jose)
lib/i18n.ts              All UI texts (en, de); i18n-server.ts for Server Components
lib/format.ts            Locale-aware number/date formatting
src/prisma/              contract.prisma (data model), db.ts, seed.ts
migrations/              Prisma 8 migration packages – generated, see below
helm/                    Helm chart; Dockerfile at the root
.github/workflows/       docker.yml, helm.yml, prisma-deploy.yml
docs/                    README assets and screenshots
```

Path alias `@/*` maps to the repo root (`@/lib/...`, `@/components/...`,
`@/src/prisma/db`).

## Architecture rules

- **Keep it simple.** No repositories, service layers, DI, factories or DTO
  mapping. Pages call small, well-named functions that use Prisma directly.
  Extract code only when it is important, reused or needs tests.
- **The server decides.** Clients send only `acronym` and `meaning`; outcome and
  points are computed in `submitAcronym()`. Never accept points/type from input.
- **Business outcomes are values, not exceptions** (`NEW_ACRONYM`,
  `EXISTING_ENTRY`, `DUPLICATE_FOUND`, `ALREADY_SUBMITTED`, `INVALIDATED_MEANING`).
- **Admins** are members of `OIDC_ADMIN_GROUP` (`groups` claim, read at sign-in,
  `getCurrentUser().isAdmin`). `invalidateMeaning()` deletes a meaning and adds
  negative `INVALIDATED_MEANING` transactions; those also block resubmission.
- **Scoring rules** (see README "How the game works"): +5 new acronym, +10 new
  meaning of a known acronym, +1 known acronym and meaning, 0 if the same user
  already submitted that meaning. Uniqueness is per **user + meaning**.
- **Acronym check:** only the **uppercase letters** of a meaning must spell the
  acronym (`getUppercaseLetters()`): *Allocation and Offer Force* → `AOF`,
  *Point of Sale* → `PS`. Seed and test meanings must follow this.
- **Integrity lives in the database**: unique `Acronym.code` + check
  `^[A-Z]{3}$`, unique `(acronymId, normalizedText)`, unique
  `(userId, meaningId)`. Submissions run in one transaction; the score is
  incremented in SQL. On a unique violation (`sqlState === "23505"`) the
  submission is retried once. Keep all of this when changing scoring.
- **Authentication goes through `getCurrentUser()` only.** Never hardcode user
  ids. Without `OIDC_ISSUER` a shared dev user is used; production refuses that
  unless `AUTH_DEV_USER=true`.
- Every page is dynamic (`export const dynamic = "force-dynamic"` in the root
  layout) because it shows live data.

## Prisma 8 (Prisma Next) – read before touching data code

This is **not** Prisma ORM ≤ 7: no `schema.prisma`, no `@prisma/client`, no
`prisma generate`. Load the skill in `.agents/skills/prisma-8/SKILL.md` and its
references before writing queries, contract changes or migrations.

- Models live in `src/prisma/contract.prisma`. After editing it:
  `bun run contract:emit` → `bun run migration:plan --name …` → review
  `migrations/app/<dir>/migration.ts` → `bun run db:migrate`.
- **Never hand-edit** `src/prisma/contract.json`, `contract.d.ts`,
  `migrations/**/ops.json`, `migration.json` or `migrations/snapshots/**`. If a
  `migration.ts` contains `placeholder(...)`, fill it and self-emit with
  `node migrations/app/<dir>/migration.ts`.
- Access models namespaced: `getDb().orm.public.User`, SQL builder via
  `tx.sql.public.user`. Transactions: `getDb().transaction(async (tx) => …)`.
- `DateTime` columns are `Temporal.Instant`. `src/prisma/db.ts` loads
  `temporal-polyfill` (Node 24 has no `Temporal`); convert to `Date` with
  `new Date(x.epochMilliseconds)` before passing data to Client Components.
- `.all()` results are awaited directly; consume each result only once.

### Database ids

- Every entity uses a UUIDv7 primary key: `id Uuid @id @default(uuid(7))`.
  Never use `Int @id @default(autoincrement())`; foreign keys are `Uuid` too.
- Prisma generates the id when a row is created (the column has no database
  default), so ids are unguessable but roughly time-ordered.
- In TypeScript ids are `string`. Never parse or compare them numerically; order
  by `createdAt` and use the id only as a tie-breaker.
- To match all rows (tests, seed), use `where((x) => x.id.isNotNull())`, not
  `id.gt(0)`.

## Next.js 16 specifics

- Middleware is called **proxy** (`src/proxy.ts`, `export function proxy`).
- Page props use the generated `PageProps<"/route">`; `searchParams` is a Promise.
- Functions can't be passed from Server to Client Components; dates and plain
  objects can.
- `next start` doesn't fit `output: "standalone"`; production runs
  `node .next/standalone/server.js` (see Dockerfile).

## UI conventions

- shadcn/ui (`base-luma`, Base UI primitives) + Tailwind CSS 4. Add components
  with `bunx --bun shadcn@latest add <name>`; remove ones that end up unused.
- **No box shadows anywhere.** Boxes are `Card` (border only) – keep it consistent.
- Acronym inputs always use `components/acronym-input.tsx` (InputOTP, A–Z, uppercase).
- The mascot is `components/tile-character.tsx` (moods: happy, excited,
  confused, sad). Empty/error states use `components/empty-state.tsx`.
- Accessibility: semantic HTML, labels for every input, `aria-describedby` for
  messages, visible focus, no clickable `div`s.
- Branding is **26³** – never `26^3` in the UI.

## Texts and i18n

- **Every user-facing string goes into `lib/i18n.ts`** in both `en` and `de`
  (the `Dictionary` type enforces matching keys). No hardcoded UI text.
- Server Components: `const { t, locale } = await getI18n()`.
  Client Components: `const { t, locale } = useI18n()`.
- Validation returns error **codes** (`acronymInvalid`, `initialsMismatch`, …);
  the UI translates them. Format numbers/dates with `lib/format.ts` and the locale.

## Code style

- Strict TypeScript, no `any`, avoid type assertions; prefer inferred types.
- Domain-oriented names (`submitAcronym`, `normalizeMeaning`, `hasUserSubmittedMeaning`),
  never `handler`, `data`, `process`, `helper`.
- Comments only for what code can't say (business rules, concurrency, framework
  quirks) – one short line, no restating the next line.
- Don't expose database errors to users; log and return a generic error state.

## Deployment and CI

- `Dockerfile`: default target = slim app image (`node:24-slim`, non-root);
  `--target migrate` = migration image with the Prisma CLI. No docker-compose
  in this repo (intentional).
- `helm/`: chart `twentysix-cubed`; migrations run as a pre-install/upgrade hook;
  DB and OIDC secrets come from existing Kubernetes Secrets. Templates use the
  `twentysix-cubed.*` helper prefix; keep `helm.sh/*` annotations untouched.
- Workflows publish to `ghcr.io/felixgaebler/...`; tag `vX.Y.Z` releases images
  and the chart with the same version. Images are multi-arch (amd64 + arm64) by
  decision – don't drop arm64 without discussion.
- Pin GitHub Actions to current major versions; validate with
  `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest`.

## Documentation

- The README is **public** and aimed at other companies. No internal or
  maintainer-only notes, no personal TODOs.
- When a change trades something off, add or update a row in the README section
  **"Design decisions and technical debt"** (decision, why, cost, revisit when).
- Keep README, `.env.example` and `helm/values.yaml` in sync when adding
  configuration (e.g. new environment variables).
- Don't create extra Markdown files unless asked.

## Safety

- Ask before destructive actions: `db:seed`, dropping data, force pushes,
  deleting files you didn't create, deploying.
- Never commit secrets; `.env` is git-ignored. Use `.env.example` for new keys.
- `package-lock.json` is a leftover from the original template; the lockfile
  is `bun.lock`.

## License

AGPL-3.0-only, © Felix Gaebler. Keep `LICENSE` verbatim. New dependencies must
be AGPL-compatible.
