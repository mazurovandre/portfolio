#!/usr/bin/env bash
#
# Runs ON THE SERVER, reached through the /usr/local/bin/portfolio-deploy
# symlink. Both entry points end up here:
#   - GitHub Actions (.github/workflows/deploy.yml) over SSH
#   - `pnpm run deploy` from a laptop (scripts/deploy.sh)
#
# Fetches the branch, renders and applies the nginx config, rebuilds the images
# and waits for the stack to report healthy.
#
# APP_DIR is derived from this script's own location, so no path to the
# deployment is hardcoded anywhere in the repository. `.env` (app secrets) and
# `deploy.env` (topology) both live in APP_DIR, outside git, and are never
# written to by a deploy.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
source "$APP_DIR/scripts/lib/config.sh"
load_deploy_env "$APP_DIR"

BRANCH="${BRANCH:-main}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
REDIRECT_DOMAINS="${REDIRECT_DOMAINS:-}"
# SITE_DOMAIN has no default on purpose: it describes *this* server, and a
# guess would render a config for the wrong host. The settings above are
# internal conventions, not environment identity. Certificate paths are no
# longer among them — nginx terminates no TLS, Xray does.
require_var SITE_DOMAIN

NGINX_AVAILABLE=/etc/nginx/sites-available/portfolio.conf

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "error: $APP_DIR/.env is missing — create it before deploying." >&2
  exit 1
fi

echo "==> Fetching origin/$BRANCH"
git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"
echo "    now at $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

# --- nginx ------------------------------------------------------------------
# sed, not envsubst: the templates rely on nginx's own $host, $request_uri and
# friends, which envsubst would happily blank out.
render() {
  sed -e "s|@@SITE_DOMAIN@@|$SITE_DOMAIN|g" \
      -e "s|@@REDIRECT_DOMAIN@@|${1:-}|g" \
      "$2"
}

echo "==> Rendering the nginx config for $SITE_DOMAIN"
rendered="$(mktemp)"
trap 'rm -f "$rendered"' EXIT
render "" deploy/nginx/site.conf.template > "$rendered"
for domain in $REDIRECT_DOMAINS; do
  echo "    + 301 vhost for $domain"
  printf '\n' >> "$rendered"
  render "$domain" deploy/nginx/redirect.conf.template >> "$rendered"
done

if cmp -s "$rendered" "$NGINX_AVAILABLE" 2>/dev/null; then
  echo "    unchanged, not reloading nginx"
else
  backup=""
  if [[ -f "$NGINX_AVAILABLE" ]]; then
    backup="$(mktemp)"
    cp "$NGINX_AVAILABLE" "$backup"
  fi

  cp "$rendered" "$NGINX_AVAILABLE"
  ln -sfn "$NGINX_AVAILABLE" /etc/nginx/sites-enabled/portfolio.conf

  if ! nginx -t; then
    echo "error: the rendered nginx config is invalid — restoring the previous one." >&2
    if [[ -n "$backup" ]]; then
      cp "$backup" "$NGINX_AVAILABLE"
      rm -f "$backup"
    else
      rm -f "$NGINX_AVAILABLE" /etc/nginx/sites-enabled/portfolio.conf
    fi
    exit 1
  fi

  rm -f "$backup"
  systemctl reload nginx
  echo "    applied and reloaded"
fi

# --- application ------------------------------------------------------------
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
