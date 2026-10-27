#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
printf '\n=== NETVERSE: NODE + NPM ===\n'
node --version
npm --version
printf '\n=== NETVERSE: OXLINT ===\n'
npm run lint
printf '\n=== NETVERSE: BUILD ===\n'
npm run build
printf '\n=== NETVERSE: VITEST ===\n'
npm test
printf '\n=== NETVERSE: WORKTREE ===\n'
git status --short || true
printf '\nPASS: command-level verification complete. Interactive browser verification is still required.\n'
