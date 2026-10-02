# Changelog

All notable changes to 26³ are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [Semantic Versioning](https://semver.org/). App images, migration image
and Helm chart share the same version.

## [0.1.0] – 2026-10-02

First release.

### Glossary and game

- Global progress towards all 17,576 three-letter combinations on the home
  page, with statistics for discovered acronyms, documented meanings,
  duplicate acronyms and remaining combinations.
- Glossary search: every known meaning of an acronym with author and date;
  unknown acronyms link to the submit form.
- Submissions with live validation in the browser and again on the server:
  the uppercase letters of a meaning must spell the acronym
  (*Allocation and Offer Force* → `AOF`).
- Meanings are compared normalized (case, whitespace and punctuation are
  ignored).
- Scoring decided on the server only: `NEW_ACRONYM` +5, `DUPLICATE_FOUND` +10,
  `EXISTING_ENTRY` +1, `ALREADY_SUBMITTED` 0 – one score per user and meaning.
- Scoreboard with podium and profile page with rank, statistics and score
  history.
- Admins can invalidate a meaning: it is deleted (with its acronym if it was
  the last meaning), everybody who scored it gets a negative
  `INVALIDATED_MEANING` transaction, and it can't be submitted again.
- Mascot with moods for results, empty and error states.
- English and German UI with language switcher, defaulting to the browser
  language.

### Authentication

- Sign-in via OpenID Connect (authorization code flow with PKCE) with any
  standards-compliant provider (Keycloak, Authentik, Entra ID, Okta, Auth0,
  Google, …); users are created or updated from the ID token.
- Encrypted, HTTP-only session cookie (7 days) and RP-initiated logout.
- Admin role from the `groups` claim (`OIDC_ADMIN_GROUP`, default
  `twentysix_admin`).
- Shared development user without a provider; refused in production unless
  `AUTH_DEV_USER=true`.

### Data

- Prisma 8 data contract on PostgreSQL 14+ with migrations and example seed
  data.
- UUIDv7 primary keys.
- Integrity enforced by the database: unique acronym codes with a
  `^[A-Z]{3}$` check, unique normalized meanings per acronym, one score
  transaction per user and meaning, scores incremented in SQL, and one retry
  for concurrent submissions.

### Deployment

- Dockerfile with a slim, non-root app image and a separate migration image
  (`--target migrate`).
- Helm chart with migrations as a pre-install/pre-upgrade hook, Ingress or
  Gateway API HTTPRoute, autoscaling and secrets from existing Kubernetes
  Secrets.
- GitHub Actions publish multi-arch images (`linux/amd64`, `linux/arm64`) and
  the Helm chart to the GitHub Container Registry; `vX.Y.Z` tags create
  releases.
- Optional deployment to Prisma Compute via Prisma Composer.

[0.1.0]: https://github.com/FelixGaebler/twentysix-cubed/releases/tag/v0.1.0
