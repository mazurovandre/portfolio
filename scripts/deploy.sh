#!/usr/bin/env bash
#
# Manual deploy from a developer machine: `pnpm run deploy`.
#
# It uploads nothing — it pushes to the git remote and then asks the server to
# pull, exactly like the GitHub Actions workflow does. One code path, one source
# of truth. Where "the server" is comes from deploy.env, never from this file.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/scripts/lib/config.sh"
load_deploy_env "$ROOT"

DEPLOY_USER="${DEPLOY_USER:-root}"
BRANCH="${BRANCH:-main}"
require_var DEPLOY_HOST

cd "$ROOT"

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

# portfolio-deploy is a symlink created during server bootstrap. Going through
# it keeps the server's directory layout out of this repository.
echo "==> Deploying on $DEPLOY_USER@$DEPLOY_HOST"
ssh "$DEPLOY_USER@$DEPLOY_HOST" "BRANCH=$BRANCH portfolio-deploy"
