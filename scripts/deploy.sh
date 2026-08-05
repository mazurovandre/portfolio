#!/usr/bin/env bash
#
# Manual deploy from a developer machine: `pnpm run deploy`.
#
# It does not upload anything — it pushes to the git remote and then asks the
# server to pull, exactly like the GitHub Actions workflow does. One code path,
# one source of truth.
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-78.17.80.141}"
DEPLOY_USER="${DEPLOY_USER:-root}"
APP_DIR="${APP_DIR:-/opt/portfolio}"
BRANCH="${BRANCH:-main}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is dirty — commit or stash first." >&2
  git status --short >&2
  exit 1
fi

current="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current" != "$BRANCH" ]]; then
  echo "error: on branch '$current', deploys run from '$BRANCH'." >&2
  exit 1
fi

echo "==> Pushing $BRANCH to origin"
git push origin "$BRANCH"

echo "==> Deploying on $DEPLOY_USER@$DEPLOY_HOST"
ssh "$DEPLOY_USER@$DEPLOY_HOST" "APP_DIR=$APP_DIR BRANCH=$BRANCH bash $APP_DIR/scripts/server-deploy.sh"
