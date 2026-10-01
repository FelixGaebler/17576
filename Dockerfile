# syntax=docker/dockerfile:1

FROM oven/bun:1.3 AS bun

FROM node:24-slim AS deps
WORKDIR /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN bun run build

# One-off job: applies pending migrations. Needs the Prisma CLI, so it keeps all dependencies.
FROM deps AS migrate
COPY prisma.config.ts ./
COPY src/prisma ./src/prisma
COPY migrations ./migrations
CMD ["bun", "run", "db:migrate"]

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
