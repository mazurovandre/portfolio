#!/usr/bin/env bash
#
# Seeds the production database: `pnpm run seed:prod`.
#
# Runs the compiled seed inside the already-deployed api container, so it uses
# the same MONGO_URI the app does and needs no database port exposed. The seed
# is idempotent (upserts on natural keys, `messages` untouched) and also builds
# the Mongo indexes, which the app never creates in production.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/scripts/lib/config.sh"
load_deploy_env "$ROOT"

DEPLOY_USER="${DEPLOY_USER:-root}"
require_var DEPLOY_HOST

echo "==> Seeding on $DEPLOY_USER@$DEPLOY_HOST"
ssh "$DEPLOY_USER@$DEPLOY_HOST" \
  'cd "$(dirname "$(readlink -f "$(command -v portfolio-deploy)")")/.." \
   && docker compose run --rm api node apps/api/dist/seed/seed.js'
