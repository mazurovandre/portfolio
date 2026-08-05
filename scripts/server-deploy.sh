#!/usr/bin/env bash
#
# Runs ON THE SERVER. Both entry points end up here:
#   - GitHub Actions (.github/workflows/deploy.yml) over SSH
#   - `pnpm run deploy` from a laptop (scripts/deploy.sh)
#
# Fetches main, rebuilds the images and waits for the stack to report healthy.
# `.env` lives outside git in $APP_DIR and is never touched.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/portfolio}"
BRANCH="${BRANCH:-main}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "error: $APP_DIR/.env is missing — create it before deploying." >&2
  exit 1
fi

echo "==> Fetching origin/$BRANCH"
git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"
echo "    now at $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

echo "==> Building and starting containers"
docker compose up -d --build --remove-orphans

echo "==> Waiting for the site to answer on $HEALTH_URL"
for ((i = 1; i <= HEALTH_RETRIES; i++)); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$HEALTH_URL" || true)"
  if [[ "$code" == "200" ]]; then
    echo "    healthy after ${i}s"
    docker image prune -f >/dev/null
    docker compose ps
    exit 0
  fi
  sleep 1
done

echo "error: the site did not become healthy (last HTTP code: ${code:-none})" >&2
docker compose ps >&2
docker compose logs --tail=50 >&2
exit 1
