#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo '=== NETVERSE RELEASE CHECK ==='
echo '== node/npm =='; node --version; npm --version
echo '== lint =='; npm run lint
echo '== build =='; npm run build
echo '== tests =='; npm test
echo '== namespace script syntax =='; bash -n scripts/real_linux_namespace_lab.sh
echo '== project status =='; git status --short || true
echo '=== Automated checks passed; manual Firefox acceptance still required. ==='
