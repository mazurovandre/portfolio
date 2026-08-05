# The build context is the monorepo root (see docker-compose.yml):
# the API depends on the @portfolio/shared workspace package.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.3.1 --activate
WORKDIR /app

# ─── Build dependencies ──────────────────────────────────────────────────────
# Manifests first: this layer is reused as long as dependencies are unchanged.
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @portfolio/api...

# ─── Build ───────────────────────────────────────────────────────────────────
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @portfolio/shared build && pnpm --filter @portfolio/api build

# ─── Production dependencies ─────────────────────────────────────────────────
# A separate install without devDependencies: otherwise the image would carry,
# for instance, the 65 MB mongodb-memory-server binary used by the tests.
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod --filter @portfolio/api...

# ─── Final image ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# The `node` user ships with the base image; the process never runs as root.
USER node
EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
