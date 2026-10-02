<p align="center">
  <img src="docs/assets/logo.svg" alt="26³" width="320">
</p>

<p align="center">
  <strong>How many three-letter combinations does your company have a meaning for?</strong>
</p>

<p align="center">
  A gamified internal glossary for the acronyms nobody explains.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-8-2D3748?logo=prisma">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white">
  <img alt="shadcn/ui" src="https://img.shields.io/badge/shadcn%2Fui-Tailwind_4-111111">
  <img alt="License: AGPL v3" src="https://img.shields.io/badge/license-AGPL_v3-9fe300">
  <img alt="Built with AI" src="https://img.shields.io/badge/built_with-AI_prompts-9fe300">
</p>

---

## The problem

Every company speaks its own language. After a few weeks in a new job you have
heard about the **CRS**, filed something in the **DMS**, missed a deadline set
by the **CAB** and wondered whether **POS** means *Point of Sale* or *Purchase
Order System*. (In our case: both.)

The running joke behind this project:

> Pick any three random letters – our company probably has a meaning for them.

There are exactly **26 × 26 × 26 = 17,576** combinations of three letters.
**26³** turns the joke into a shared goal: find out how many of them actually
mean something inside your company, and build a useful glossary along the way.

<p align="center">
  <img src="docs/screenshots/home.png" alt="26³ home page showing the global progress towards 17,576 combinations" width="820">
</p>

## What it does

- **Global progress.** One number everyone works on together: discovered
  acronyms out of 17,576.
- **Glossary search.** Type three letters, get every known meaning, who added
  it and when. Unknown acronyms come with an *Add* button.
- **Submissions with validation.** The uppercase letters of a meaning have to
  spell the acronym (`AOF` → *Allocation and Offer Force*), checked live in the
  browser and again on the server.
- **Ambiguity is a feature.** Several meanings per acronym are expected. Finding
  a second meaning is the most valuable move in the game.
- **Points, scoreboard and history.** Every submission is scored, users compete
  on a scoreboard and each profile shows how the score came together.
- **English and German.** Language switch in the header, browser language by
  default. Adding another language is one dictionary file.
- **Single sign-on via OpenID Connect.** Works with Keycloak, Microsoft Entra
  ID, Okta, Auth0, Google, Authentik, Zitadel and any other OIDC provider –
  configured with a few environment variables.

## How the game works

<p align="center">
  <img src="docs/assets/scoring.svg" alt="Scoring: +5 new acronym, +10 duplicate found, +1 existing entry, 0 already submitted" width="820">
</p>

| Outcome             | When                                                   | Points |
| ------------------- | ------------------------------------------------------ | -----: |
| `NEW_ACRONYM`       | Nobody has submitted this acronym yet                  |     +5 |
| `DUPLICATE_FOUND`   | The acronym exists, but this meaning is new            |    +10 |
| `EXISTING_ENTRY`    | Acronym and meaning are both already documented        |     +1 |
| `ALREADY_SUBMITTED` | You have already submitted this exact meaning          |      0 |

A few rules keep it fair:

- **Uppercase letters spell the acronym.** Only uppercase letters count, so
  filler words can stay lowercase: *Allocation and Offer Force* is `AOF`. A
  word that belongs to the acronym must be capitalized: *Point Of Sale* is
  `POS`, while *Point of Sale* would be `PS`.
- **One score per person and meaning.** You cannot score the same meaning of
  `ABC` twice. A *different* meaning of `ABC` still counts – as a duplicate
  find, even if you were the one who discovered `ABC`.
- **Meanings are compared normalized.** Case and extra whitespace are ignored,
  so `Point Of Sale` and `  Point  Of  Sale ` are the same meaning. There is no
  fuzzy matching.
- **Progress counts acronyms, not meanings.** `ABC` with three meanings is one
  of 17,576.
- **The server decides.** The browser only sends the acronym and the meaning;
  points and outcome are always computed on the server.

## A look around

| Search                                                   | Scoreboard                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| ![Search result for ABC with three meanings](docs/screenshots/search.png) | ![Scoreboard with podium for the top three](docs/screenshots/scoreboard.png) |
| **Profile**                                              | **Not found**                                                    |
| ![Profile card with score, rank and history](docs/screenshots/profile.png) | ![404 page with the confused mascot](docs/screenshots/not-found.png) |

## Use it in your company

26³ is built so that any organization drowning in acronyms can run its own
instance. To make it yours:

1. **Fork or clone** this repository.
2. **Provide a PostgreSQL database** (any PostgreSQL 14+ works; see
   [Getting started](#getting-started)).
3. **Connect your identity provider** via OpenID Connect – see
   [Authentication](#authentication).
4. **Adjust the texts** in [`lib/i18n.ts`](lib/i18n.ts) – the wording says
   "our company" and works as is, but you can mention your company by name or
   add a language.
5. **Replace the seed data** in [`src/prisma/seed.ts`](src/prisma/seed.ts) with
   a few real acronyms, or start empty and let people discover them.
6. **Deploy** it wherever you run Node.js – see [Deployment](#deployment).

## Getting started

### Requirements

- [Bun](https://bun.sh) 1.3+ (package manager, scripts and tests)
- Node.js 24+ (runs Next.js)
- PostgreSQL 14+

### Run locally

```bash
bun install
cp .env.example .env
```

Point `DATABASE_URL` in `.env` at a PostgreSQL database. The quickest way is a
local container:

```bash
docker run -d --name acronyms-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17-alpine
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

Then create the schema, load the example data and start the app:

```bash
bun run contract:emit   # generate Prisma types from the data contract
bun run db:migrate      # apply all migrations
bun run db:seed         # 10 users, ~60 acronyms – resets users and glossary data!
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Without OIDC settings you
are signed in as the development user *Felix Weber*.

### Environment variables

| Variable             | Required    | Description                                                         |
| -------------------- | :---------: | ------------------------------------------------------------------- |
| `DATABASE_URL`       |     yes     | PostgreSQL connection string                                        |
| `OIDC_ISSUER`        | for sign-in | Issuer URL of your provider; enables OIDC when set                  |
| `OIDC_CLIENT_ID`     | for sign-in | Client ID registered at the provider                                |
| `OIDC_CLIENT_SECRET` |     no      | Client secret; omit for a public client (PKCE only)                 |
| `OIDC_SCOPES`        |     no      | Requested scopes, default `openid profile email`                    |
| `APP_URL`            | for sign-in | Public URL of the app, e.g. `https://acronyms.example.com`          |
| `SESSION_SECRET`     | for sign-in | At least 32 random characters, encrypts the session cookie          |
| `AUTH_DEV_USER`      |     no      | `true` allows the shared development user in production (demos only) |
| `TEST_DATABASE_URL`  |     no      | Separate database for the scoring tests (it gets wiped!)            |

## How it is built

### Tech stack

| Layer       | Choice                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| Framework   | [Next.js 16](https://nextjs.org) App Router, Server Components, Server Actions  |
| Language    | TypeScript (strict)                                                             |
| Data        | [Prisma 8](https://www.prisma.io) on PostgreSQL                                 |
| Validation  | [Zod](https://zod.dev), shared by browser and server                           |
| UI          | [shadcn/ui](https://ui.shadcn.com) (Base UI), Tailwind CSS 4, lucide icons      |
| Auth        | OpenID Connect via [openid-client](https://github.com/panva/openid-client), encrypted session cookie ([jose](https://github.com/panva/jose)) |
| Tests       | `bun test`                                                                      |

There are no repositories, service layers or other ceremony: pages call small,
well-named functions that use Prisma directly.

### Project structure

```text
src/app/                    Pages: Home, Search, Submit, Scoreboard, Profile, 404
src/app/submit/actions.ts   Server action for submissions
src/app/auth/                Sign-in, callback and sign-out routes (OIDC)
src/proxy.ts                Redirects visitors without a session to the sign-in
components/                 App components (mascot, acronym input, cards, nav)
components/ui/              shadcn/ui components
lib/validation.ts           Acronym and meaning validation + normalization
lib/scoring.ts              submitAcronym(): classification, points, transaction
lib/glossary.ts             Global progress and acronym lookup
lib/auth.ts                 getCurrentUser() – the only place that knows about login
lib/oidc.ts                 OpenID Connect flow (discovery, PKCE, token exchange)
lib/session.ts              Encrypted session cookie
lib/i18n.ts                 Dictionaries (English, German)
src/prisma/contract.prisma  Data model
src/prisma/seed.ts          Example data
migrations/                 Database migrations
Dockerfile                  App image (slim) and migration image (--target migrate)
helm/                       Helm chart for Kubernetes
.github/workflows/          Docker images and Helm chart (build, publish on tags)
```

### Data model

Four tables. `ScoreTransaction` is both the score history and the record of
who already submitted which meaning – there is no separate "discovery" table.

```mermaid
erDiagram
    User ||--o{ Acronym : "discovered"
    User ||--o{ Meaning : "added"
    User ||--o{ ScoreTransaction : "earned"
    Acronym ||--|{ Meaning : "has"
    Acronym ||--o{ ScoreTransaction : ""
    Meaning ||--o{ ScoreTransaction : ""

    User {
        uuid id "UUIDv7"
        string externalId "id from your identity provider"
        string displayName
        string email
        int score "sum of the user's transactions"
    }
    Acronym {
        uuid id "UUIDv7"
        string code "unique, ^[A-Z]{3}$"
    }
    Meaning {
        uuid id "UUIDv7"
        string text "as displayed"
        string normalizedText "unique per acronym"
    }
    ScoreTransaction {
        uuid id "UUIDv7"
        int amount
        string type "NEW_ACRONYM | EXISTING_ENTRY | DUPLICATE_FOUND"
    }
```

### What happens on submit

```mermaid
flowchart TD
    A[Submit acronym + meaning] --> B{Valid?<br/>3 letters, uppercase letters match}
    B -- no --> X[Show validation error]
    B -- yes --> E{Does the acronym exist?}
    E -- no --> F[NEW_ACRONYM · +5<br/>create acronym + meaning]
    E -- yes --> G{Does the normalized<br/>meaning exist?}
    G -- no --> I[DUPLICATE_FOUND · +10<br/>create meaning]
    G -- yes --> C{Has this user already<br/>submitted this meaning?}
    C -- yes --> D[ALREADY_SUBMITTED · 0]
    C -- no --> H[EXISTING_ENTRY · +1]
```

Everything after validation runs in one database transaction: glossary records,
the score transaction and the score update either all happen or none do.

### Data integrity

The rules are enforced by the database, not only by application code:

- unique `Acronym.code` plus a check constraint for `^[A-Z]{3}$`
- unique `(acronymId, normalizedText)` for meanings
- unique `(userId, meaningId)` for score transactions
- scores are incremented in SQL (`score = score + n`), never read-modify-written

If two requests race (a double click, or two people discovering the same
acronym at the same moment), the constraint rejects the second one and the
submission is re-evaluated once against the committed data. A double click
therefore ends as `ALREADY_SUBMITTED`, never as double points.

## Authentication

26³ signs users in with **OpenID Connect** (authorization code flow with PKCE).
Any standards-compliant provider works; nothing in the code is specific to one
vendor.

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as 26³
    participant P as Identity provider
    B->>A: open any page
    A-->>B: no session → /auth/login
    B->>P: authorize (PKCE, state, nonce)
    P-->>B: sign in → /auth/callback?code=…
    B->>A: callback
    A->>P: exchange code, validate ID token
    A-->>B: encrypted session cookie → back to the page
```

On every sign-in the user is created or updated from the ID token: `sub`
becomes `User.externalId`, `name` (or `preferred_username`) the display name,
plus `email` and `picture`. The session is an encrypted, HTTP-only cookie that
lasts 7 days; *Sign out* in the header clears it and also ends the session at
the provider if it supports RP-initiated logout.

### Configure your provider

Register 26³ as a client ("web application", authorization code flow) and set:

| Setting                  | Value                                   |
| ------------------------ | --------------------------------------- |
| Redirect URI             | `https://<your-app>/auth/callback`      |
| Post-logout redirect URI | `https://<your-app>/`                   |
| Scopes                   | `openid profile email`                  |

Then set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `APP_URL` and
`SESSION_SECRET` (see [Environment variables](#environment-variables)). Typical
issuer URLs:

| Provider            | `OIDC_ISSUER`                                               |
| ------------------- | ----------------------------------------------------------- |
| Keycloak            | `https://keycloak.example.com/realms/<realm>`               |
| Microsoft Entra ID  | `https://login.microsoftonline.com/<tenant-id>/v2.0`        |
| Okta                | `https://<org>.okta.com/oauth2/default`                     |
| Auth0               | `https://<tenant>.auth0.com/`                               |
| Google              | `https://accounts.google.com`                               |
| Authentik           | `https://authentik.example.com/application/o/<slug>/`       |

The issuer must serve `/.well-known/openid-configuration`; everything else is
discovered from there. Plain `http://` issuers are accepted for local testing.

**Keycloak example:** create a client `twentysix-cubed` with *Client
authentication* on and *Standard flow* enabled, add the redirect URIs above,
and copy the secret from the *Credentials* tab:

```bash
OIDC_ISSUER=https://keycloak.example.com/realms/company
OIDC_CLIENT_ID=twentysix-cubed
OIDC_CLIENT_SECRET=<from the Credentials tab>
APP_URL=https://acronyms.example.com
SESSION_SECRET=$(openssl rand -base64 32)
```

### Without a provider

If `OIDC_ISSUER` is not set, everybody is signed in as one shared development
user – handy for local development. In production (`NODE_ENV=production`) this
is refused unless you set `AUTH_DEV_USER=true` explicitly, so a missing
configuration can't silently open the app to everyone.

All code asks a single function for the current user –
`getCurrentUser()` in [`lib/auth.ts`](lib/auth.ts) – so a different login
mechanism would only need to change that file.

## Internationalization

All texts live in [`lib/i18n.ts`](lib/i18n.ts). The English dictionary defines
the shape; every other language must provide the same keys, so a missing
translation is a type error. To add a language:

1. Add the locale code to `LOCALES`, a name to `localeNames` and a formatting
   locale to `intlLocales`.
2. Add a dictionary of type `Dictionary` and register it in `dictionaries`.

The language is taken from a cookie set by the switcher in the header, falling
back to the browser's `Accept-Language`.

## Development

| Command                           | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `bun run dev`                     | Start the dev server                             |
| `bun run lint`                    | ESLint                                           |
| `bun run typecheck`               | TypeScript                                       |
| `bun run test`                    | Unit and database tests                          |
| `bun run build`                   | Production build                                 |
| `bun run db:seed`                 | Reset and load example data                      |
| `bun run contract:emit`           | Regenerate Prisma types after a model change     |
| `bun run migration:plan --name x` | Create a migration from a model change           |
| `bun run db:migrate`              | Apply pending migrations                         |

### Tests

Validation tests always run. The scoring tests use a real PostgreSQL database
and **wipe it before each test**, so they only run when `TEST_DATABASE_URL` is
set:

```bash
docker run -d --rm --name acronyms-test-db -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:17-alpine
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/postgres
bun run db:migrate --db $TEST_DATABASE_URL
bun run test
```

They cover all four scoring outcomes, normalization, the database constraints
and concurrent double submissions.

### Changing the data model

Edit [`src/prisma/contract.prisma`](src/prisma/contract.prisma), then:

```bash
bun run contract:emit
bun run migration:plan --name describe_the_change
bun run db:migrate
```

## Deployment

The app builds to a standalone Node.js server (`output: "standalone"`):

```bash
bun run build
cp -r .next/static .next/standalone/.next/static   # standalone output does not include static assets
bun run db:migrate   # against the production DATABASE_URL
bun run start
```

Any platform that runs Node.js 24 and can reach PostgreSQL works – a VM, a
container platform or Kubernetes.

### Docker

The [`Dockerfile`](Dockerfile) builds two images from the same source:

| Image                     | Build                                  | Contents                                                        |
| ------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `twentysix-cubed`         | `docker build .`                       | `node:24-slim` with only the standalone server, non-root (~430 MB) |
| `twentysix-cubed-migrate` | `docker build --target migrate .`      | Prisma CLI + migrations, runs `db migrate` once and exits        |

```bash
docker build -t twentysix-cubed .
docker build -t twentysix-cubed-migrate --target migrate .
```

Apply migrations, then start the app with your database and OIDC settings:

```bash
docker run --rm -e DATABASE_URL=postgresql://… twentysix-cubed-migrate

docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://… \
  -e OIDC_ISSUER=https://keycloak.example.com/realms/company \
  -e OIDC_CLIENT_ID=twentysix-cubed \
  -e OIDC_CLIENT_SECRET=… \
  -e APP_URL=https://acronyms.example.com \
  -e SESSION_SECRET=… \
  twentysix-cubed
```

For a quick demo without a provider, replace the `OIDC_*`, `APP_URL` and
`SESSION_SECRET` variables with `-e AUTH_DEV_USER=true`.

Pass values without quotes; `docker run --env-file` keeps them and the
connection string becomes invalid.

### Kubernetes (Helm)

The chart in [`helm/`](helm) deploys the app and runs the migration image as a
`pre-install`/`pre-upgrade` hook. It expects an existing PostgreSQL database
and Secrets for the connection string and the OIDC credentials:

```bash
kubectl create secret generic twentysix-cubed-db \
  --from-literal=DATABASE_URL='postgresql://user:password@host:5432/db'

kubectl create secret generic twentysix-cubed-oidc \
  --from-literal=OIDC_CLIENT_SECRET='…' \
  --from-literal=SESSION_SECRET="$(openssl rand -base64 32)"

helm install twentysix-cubed ./helm \
  --set image.repository=ghcr.io/<you>/twentysix-cubed \
  --set migrations.image.repository=ghcr.io/<you>/twentysix-cubed-migrate \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=acronyms.example.com \
  --set oidc.enabled=true \
  --set oidc.issuer=https://keycloak.example.com/realms/company \
  --set oidc.clientId=twentysix-cubed \
  --set oidc.appUrl=https://acronyms.example.com
```

See [`helm/values.yaml`](helm/values.yaml) for all options.

### Releases (GitHub Actions)

Two workflows in [`.github/workflows`](.github/workflows) build and publish
everything to the GitHub Container Registry:

| Workflow                                         | Pull request              | Push to `main`                          | Tag `v1.2.3`                                  |
| ------------------------------------------------ | ------------------------- | --------------------------------------- | --------------------------------------------- |
| [`docker.yml`](.github/workflows/docker.yml)     | builds both images        | pushes `:main` and `:sha-…`             | pushes `:1.2.3` and `:1.2`                    |
| [`helm.yml`](.github/workflows/helm.yml)         | lints and renders chart   | lints and renders chart                 | publishes chart `1.2.3` (appVersion `1.2.3`)  |

Images are built for `linux/amd64` and `linux/arm64`. To release, tag a
commit and push the tag:

```bash
git tag v0.1.0 && git push origin v0.1.0
```

The chart's default image tag is its own version, so a released chart always
runs the images of the same release:

| Artifact        | Location                                            |
| --------------- | --------------------------------------------------- |
| App image       | `ghcr.io/felixgaebler/twentysix-cubed`              |
| Migration image | `ghcr.io/felixgaebler/twentysix-cubed-migrate`      |
| Helm chart      | `oci://ghcr.io/felixgaebler/charts/twentysix-cubed` |

```bash
helm install twentysix-cubed oci://ghcr.io/felixgaebler/charts/twentysix-cubed --version 0.1.0 \
  --set ingress.enabled=true --set ingress.hosts[0].host=acronyms.example.com
```

### Prisma Compute

The repository also contains a ready-made setup for
[Prisma Compute](https://www.prisma.io): the GitHub Actions workflow in
`.github/workflows` uses Prisma Composer (`module.ts`) to provision Prisma
Postgres, apply migrations and deploy on every push. Connect it once with:

```bash
bun run compute:login
bun run compute:connect
```

## Design decisions and technical debt

Decisions that trade something off, written down so they can be revisited
deliberately instead of rediscovered.

| Decision | Why | Cost / debt | Revisit when |
| --- | --- | --- | --- |
| **Multi-arch images** (`linux/amd64` + `linux/arm64`), arm64 emulated with QEMU on standard GitHub runners | Runs on ARM servers (AWS Graviton, Azure Cobalt, Hetzner CAX) and Apple Silicon without rebuilding | Image builds take several times longer than amd64 alone | Build times hurt: switch to native `ubuntu-24.04-arm` runners and merge the manifests |
| **Separate migration image** with the full Prisma CLI | The runtime image stays slim (~430 MB, standalone server only) | The migration image is ~2.9 GB, because the Prisma CLI needs all dependencies | Prisma ships a standalone migration binary |
| **Prisma 8 release candidate** | Contract-first data layer, typed queries, no code generation | Pre-release APIs may change before 8.0 | Prisma 8.0 is stable |
| **Temporal polyfill** (`temporal-polyfill`) | Prisma 8 date fields use the `Temporal` API, which Node.js 24 doesn't ship | One extra runtime dependency | Node.js ships `Temporal` |
| **UUIDv7 primary keys** (native `uuid` columns, generated by Prisma) | Ids can't be guessed or enumerated, don't reveal how many rows exist, and stay roughly time-ordered for indexes | 16 instead of 4 bytes per key; ids are less readable in logs and URLs | Never, unless storage or index size becomes a problem |
| **Cached score on `User`** | The scoreboard is a single cheap query | Denormalized; kept consistent by incrementing in SQL inside the same transaction as the score transaction | Scoring rules become retroactive |
| **Stateless sessions** (encrypted cookie, 7 days, no refresh against the provider) | No session store, no extra infrastructure | A user disabled at the identity provider keeps access until the cookie expires | Offboarding must take effect immediately: shorter lifetime or refresh tokens |
| **`email` is unique and required** | Simple user model | Users without an `email` claim get a placeholder address; an email already used by another account makes sign-in fail | Several identity providers per instance |
| **New meanings earn the most points (+10)** | Finding ambiguity is the core of the game | Easy to farm with made-up meanings whose uppercase letters spell the acronym | Moderation (see [Ideas](#ideas)) |
| **Only uppercase letters count** for the acronym check | Supports real-world acronyms that skip words (*Allocation and Offer Force* → `AOF`) | Users must capitalize every word that belongs to the acronym (*Point Of Sale*); all-lowercase input is rejected | Users find it confusing: accept first letters *or* uppercase letters |
| **Scoring tests need a real PostgreSQL** | Constraints, transactions and races can't be mocked meaningfully | They are skipped unless `TEST_DATABASE_URL` is set and don't run in CI yet | A Postgres service container is added to CI |

## Ideas

- Roles from the identity provider, e.g. moderators via a group claim
- Moderation: edit or merge meanings, report nonsense
- Import an existing glossary from CSV
- Achievements, e.g. "first to find a triple meaning"
- A weekly digest of new discoveries

Contributions and forks for your own company are welcome.

## Built with AI

This project was written entirely by prompting an AI coding agent (GitHub
Copilot in VS Code). Every line of code, the tests, the illustrations and this
README were generated from natural-language instructions; Felix Gaebler
decided what to build, reviewed the results and asked for changes.

That does not make it special code: it is reviewed, linted, type-checked and
tested like any other project. Treat it the same way – read it before you run
it in your company, and open an issue if something looks wrong.

## License

Copyright © 2026 [Felix Gaebler](mailto:felix@gaebler.dev). Licensed under the
[GNU Affero General Public License v3.0](LICENSE).

In short:

- **Use it freely** – run 26³ in your company, internally or publicly, at no cost.
- **Change it freely** – adapt it to your needs.
- **Give back** – if you make changes and let other people use the modified
  version (including over the network, e.g. as a website or hosted service),
  you must publish your source code under the same license.

This is a summary, not legal advice; the [license text](LICENSE) is binding.

<p align="center">
  <br>
  <sub>Made with too many three-letter acronyms.</sub>
</p>
