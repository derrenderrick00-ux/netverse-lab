# NETVERSE extended candidate: installation and verification

**Baseline:** original user repository at commit `e77c5fd` on `feature/netverse-phases1-8`; apply the separate Phase 1–8 hotfix first, test and commit. This archive includes that hotfix plus the extension but is intended to be applied to the accepted hotfix baseline.

## Safety
- No commands in this procedure require sudo.
- No `npm create vite` is needed.
- The ZIP contains no `package.json`, `package-lock.json`, `.git`, `.gitignore`, `node_modules`, or `dist`; your existing package installation and history are preserved.
- Review the output of `git status --short` and resolve any modifications before extraction.
- Do not commit/push until the automated checks and browser acceptance pass.
- Back up private or uncommitted files independently if you have modified the project.

## Install
```bash
cd ~/Documents/netverse-lab
git status --short
git switch -c feature/netverse-extended-labs
unzip -o ~/Downloads/NETVERSE_Phases_9-14_Extended_Candidate.zip -d .
bash scripts/verify_release.sh
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173/ in Firefox. If clean, inspect `git diff --stat` then:
```bash
git add README.md src tests docs scripts
git commit -m "feat: add guided labs Patch and extended networking experiments"
git status
```

## Acceptance
Follow `docs/PHASES_9_14_ACCEPTANCE.md`. The strongest tests are Guided/Independent persistence, Patch optional hints, original ping/link failure/recovery, all three incident repairs, performance max-min sharing, physical infrastructure selections, first-match firewall policy, VLAN/IPv6/TCP concept experiments, JSON restore, and narrow-viewport usability.

## Tool limits
The developer's environment can run a strict TypeScript source check and the TypeScript networking tests through an offline test harness. It does not have the user's Vite/React npm tree or Oxlint; native Vite build/lint and a React Firefox browser test must be confirmed by the user. The standalone Linux namespace experiment is opt-in and not a browser integration.
