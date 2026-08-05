# The build context is the monorepo root (see docker-compose.yml).
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.3.1 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
# --ignore-scripts: the postinstall hook (nuxt prepare) cannot run before the
# sources are copied; preparation happens during the build step below.
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @portfolio/web...

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @portfolio/shared build && pnpm --filter @portfolio/web build

# ─── Final image ─────────────────────────────────────────────────────────────
# Nitro produces a self-contained .output with every dependency inside, so
# node_modules is not carried into the runtime image.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=build --chown=node:node /app/apps/web/.output ./.output

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
