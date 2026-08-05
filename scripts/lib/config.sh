#!/usr/bin/env bash
# Shared by deploy.sh, server-deploy.sh and seed-prod.sh.
#
# Loads deploy.env — the one file holding environment identity — and fails
# loudly on anything missing. Deploy scripts must never fall back to a baked-in
# default host or domain: a silent default is how you deploy to the wrong box.
#
# Source it, do not execute it.

# load_deploy_env <repo-root>
load_deploy_env() {
  local root="$1" file="$1/deploy.env"

  if [[ -f "$file" ]]; then
    # shellcheck disable=SC1090  # path is only known at runtime
    set -a && source "$file" && set +a
  fi
}

# require_var NAME [NAME...] — every name must be set and non-empty
require_var() {
  local missing=()
  local name
  for name in "$@"; do
    [[ -n "${!name:-}" ]] || missing+=("$name")
  done

  if ((${#missing[@]} > 0)); then
    echo "error: missing required setting(s): ${missing[*]}" >&2
    echo "       set them in deploy.env (see deploy.env.example) or pass them as" >&2
    echo "       environment variables, e.g. ${missing[0]}=... $(basename "$0")" >&2
    exit 1
  fi
}
