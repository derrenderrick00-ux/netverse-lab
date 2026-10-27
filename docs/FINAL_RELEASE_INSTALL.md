# NETVERSE Final Documentation Overlay — Safe Ubuntu Installation

This ZIP **only adds/updates documentation and a root README**; it does not modify source code, tests, dependencies or Git history.

## Prerequisites

- Existing project: `~/Documents/netverse-lab`
- Branch: `feature/netverse-extended-labs`
- Current extended release candidate has passed local lint/build/test and Firefox verification.

## Apply the docs

```bash
cd ~/Documents/netverse-lab

git branch --show-current
git status --short

# Download NETVERSE_Final_Docs_Patch.zip to ~/Downloads before continuing.
unzip -l ~/Downloads/NETVERSE_Final_Docs_Patch.zip
unzip -o ~/Downloads/NETVERSE_Final_Docs_Patch.zip -d ~/Documents/netverse-lab

# Review changes and rerun the final gates.
git status --short
git diff --check
bash scripts/verify_release.sh
```

The ZIP includes the full updated `README.md`, `docs/USER_MANUAL.md`, `docs/DEVELOPER_MANUAL.md`, and seven user-supplied screenshots under `docs/assets/screenshots/`.

## Final feature commit

```bash
cd ~/Documents/netverse-lab
git add README.md docs src tests scripts
git diff --cached --check
git diff --cached --stat
git commit -m "feat: finalize Netverse extended labs and manuals"
git status
```

**If any check fails, don't commit.** Copy the error output and resolve it first.

## Merge and push (after successful acceptance)

```bash
git switch main
git merge --no-ff feature/netverse-extended-labs -m "merge: Netverse extended educational release"
bash scripts/verify_release.sh

git remote -v
```

If no GitHub remote exists, first create an **empty** repository on GitHub, then copy its actual HTTPS clone URL and run `git remote add origin <ACTUAL_GITHUB_CLONE_URL>` **with the placeholder replaced**. Do not overwrite an unexpected `origin`.

```bash
git push -u origin main
```

Optional release-candidate tag:

```bash
git tag -a v0.1.0-rc.1 -m "Netverse educational extended release candidate"
git push origin v0.1.0-rc.1
```

You can also push the feature branch separately if desired:

```bash
git push -u origin feature/netverse-extended-labs
```

## Clean clone acceptance

Once the repo is published, verify the GitHub installation instructions independently:

```bash
mkdir -p ~/Documents/netverse-install-check
cd ~/Documents/netverse-install-check
git clone <ACTUAL_GITHUB_CLONE_URL> netverse-lab
cd netverse-lab
npm ci
npm run lint && npm run build && npm test
npm run dev -- --host 127.0.0.1
```

Only use the actual URL shown on GitHub (without literal angle brackets). Stop with Ctrl+C after checking Firefox. This is how you demonstrate that a new learner can install NETVERSE from GitHub without your local `node_modules` or earlier ZIP overlays.
