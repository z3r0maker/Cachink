#!/usr/bin/env bash
# One release: migrations first, then the three Vercel projects (N-07 follow-up).
#
# Git-triggered deployments are off on purpose (`cec30e12`, `git.deploymentEnabled
# = false` on all three projects), so shipping is an explicit act. This is that
# act, in the one order that is safe: `docs/ops/provisioning.md` §138 — apply
# migrations **before** deploying the code that needs them.
#
# It exists because doing this by hand has three traps, and the first release
# after the manual switch hit all three:
#
#   1. `vercel deploy --prod` from `apps/web` FAILS. Root Directory is already
#      `apps/web` in project settings, so the upload must come from the repo
#      root; from the app directory Vercel looks for `apps/web/apps/web`. The
#      commit that disabled Git deploys documents the app-dir form.
#   2. The shared checkout is often on a feature branch with uncommitted work.
#      Deploying from it ships that work in progress to production.
#   3. Deploying before migrating breaks the app against its own schema.
#
# Usage:
#   ./scripts/release.sh                      # migrate, then deploy all three
#   ./scripts/release.sh --dry-run            # show what would run, change nothing
#   ./scripts/release.sh --apps web,landing   # a subset, same order and guards
#   ./scripts/release.sh --skip-migrations    # deploy only (the schema is known current)
#
# Credentials: migrations read `packages/data-pg/.env.local` (SUPERUSER_URL and
# the four role passwords); Vercel reads the CLI's own auth. Neither is printed.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ALL_APPS="web backoffice landing"
APPS="$ALL_APPS"
DRY_RUN=0
SKIP_MIGRATIONS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --skip-migrations) SKIP_MIGRATIONS=1 ;;
    --apps) APPS="${2//,/ }"; shift ;;
    *) echo "release.sh: unknown flag $1" >&2; exit 2 ;;
  esac
  shift
done

say() { printf '\n▸ %s\n' "$*"; }
die() { printf '\n✗ %s\n' "$*" >&2; exit 1; }

# ── Guard: what is about to ship ────────────────────────────────────────────
# Production takes what is in the working tree, not what is on the branch, so
# both have to be right. `--dry-run` still checks: the point is to find out.
cd "$ROOT"
git fetch --quiet origin main

[[ -z "$(git status --porcelain)" ]] ||
  die "the working tree has uncommitted changes — they would ship. Commit, stash, or release from a clean worktree:
    git worktree add --detach /tmp/release origin/main
    cd /tmp/release && pnpm install --frozen-lockfile
    cp $ROOT/packages/data-pg/.env.local packages/data-pg/.env.local   # untracked
    ./scripts/release.sh"

HEAD_SHA="$(git rev-parse HEAD)"
MAIN_SHA="$(git rev-parse origin/main)"
[[ "$HEAD_SHA" == "$MAIN_SHA" ]] ||
  die "HEAD is $(git rev-parse --short HEAD) but origin/main is $(git rev-parse --short origin/main).
    Production ships main. To release something else, say so out loud by checking it out deliberately."

# ── Guard: this checkout can actually run ───────────────────────────────────
# A fresh worktree — which the refusal above tells you to make — has neither
# dependencies nor the untracked credentials, and without these two checks it
# fails later with `tsx: command not found`, which says nothing useful.
[[ -d "$ROOT/node_modules" ]] ||
  die "no node_modules in $ROOT — install first:
    (cd $ROOT && pnpm install --frozen-lockfile)"

if [[ $SKIP_MIGRATIONS -eq 0 && ! -f "$ROOT/packages/data-pg/.env.local" ]]; then
  die "packages/data-pg/.env.local is missing — it holds SUPERUSER_URL and the four
    role passwords, and it is untracked on purpose, so a fresh worktree never has it.
    Copy it from the checkout that has it, or see docs/ops/provisioning.md:
    cp /path/to/your/checkout/packages/data-pg/.env.local $ROOT/packages/data-pg/.env.local"
fi

say "releasing $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
[[ $DRY_RUN -eq 1 ]] && say "DRY RUN — nothing will be applied or deployed"

# ── 1. Migrations, before any code that needs them ──────────────────────────
if [[ $SKIP_MIGRATIONS -eq 1 ]]; then
  say "skipping migrations (--skip-migrations)"
else
  say "migrations → hosted"
  if [[ $DRY_RUN -eq 1 ]]; then
    pnpm --filter @xangarro/data-pg db:migrate:hosted --dry-run
  else
    # A failed apply must stop the release: deploying code whose schema did not
    # land is the failure this ordering exists to prevent.
    pnpm --filter @xangarro/data-pg db:migrate:hosted ||
      die "migrations failed — nothing was deployed. Fix the migration and re-run."
  fi
fi

# ── 2. The apps, from the repo root ─────────────────────────────────────────
# `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` pick the project without a `.vercel`
# directory, so the root needs no link and none of the three fight over one.
deploy_app() {
  local app="$1" link="$ROOT/apps/$1/.vercel/project.json"
  [[ -f "$link" ]] || die "apps/$app is not linked to a Vercel project ($link missing). Run: cd apps/$app && vercel link"

  local org project name
  org="$(node -p "require('$link').orgId")"
  project="$(node -p "require('$link').projectId")"
  name="$(node -p "require('$link').projectName || '$app'")"

  if [[ $DRY_RUN -eq 1 ]]; then
    say "would deploy $name from $ROOT"
    return 0
  fi

  say "deploying $name"
  local url
  url="$(cd "$ROOT" && VERCEL_ORG_ID="$org" VERCEL_PROJECT_ID="$project" \
    npx --yes vercel@latest deploy --prod --yes --archive=tgz 2>&1 |
    grep -oE 'https://[a-z0-9.-]+\.vercel\.app' | tail -1)"
  [[ -n "$url" ]] || die "$name: the deploy produced no URL — read the output above."

  # "Ready" is the only outcome that shipped. A build that errored still
  # answers with a URL, which is why this asks rather than assumes.
  local status
  status="$(cd "$ROOT" && VERCEL_ORG_ID="$org" VERCEL_PROJECT_ID="$project" \
    npx --yes vercel@latest inspect "$url" 2>&1 | awk '/status/ {print $NF}' | tail -1)"
  printf '  %s  %s  %s\n' "$name" "$status" "$url"
  [[ "$status" == *Ready* ]] || die "$name did not reach Ready (status: $status)."
}

for app in $APPS; do
  # shellcheck disable=SC2076
  [[ " $ALL_APPS " == *" $app "* ]] || die "unknown app '$app' (known: $ALL_APPS)"
  deploy_app "$app"
done

say "released $(git rev-parse --short HEAD)"
