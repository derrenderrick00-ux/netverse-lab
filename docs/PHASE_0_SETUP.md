# NETVERSE LAB — Phase 0: Ubuntu Environment and Project Foundation

**Document:** NV-SETUP-000  
**Baseline:** NETVERSE_MASTER_BLUEPRINT.md v1.0.0  
**Target:** Ubuntu on ThinkPad X280, 8 GB RAM  
**Purpose:** Verify development tools, scaffold a clean React + TypeScript project, validate build/lint/tests, start local development, make the baseline Git commit. **No networking simulation logic is implemented in Phase 0.**

---

## 0. Safety rules

- **Do not reuse an existing Echo, CodeBreak, OS Lab or other project directory.** All new work belongs in `~/Documents/netverse-lab`.
- **Do not run `sudo npm install` or `sudo npm create`.** npm installations are local to the project.
- **Do not run commands that delete or reset existing Git repositories.** The instructions stop if a project path already exists.
- **Do not commit `.env`, credentials, saved Wi-Fi passwords, `node_modules`, or personal network diagnostic reports.**
- A working Internet connection is normally needed to fetch npm packages at setup time. The eventual application will be offline-first, but `npm install` is not an offline operation unless packages are cached.
- **Run commands on your Ubuntu laptop, not in ChatGPT.** The project is not yet installed on your machine.
- Use `Ctrl+C` to stop the local Vite development server. Terminal sessions running the server are not failures.

## 1. Check environment first

Open a terminal:

```bash
printf '\n=== SYSTEM ===\n'
cat /etc/os-release | grep -E '^(NAME|VERSION)='
uname -m
free -h
df -h "$HOME"

printf '\n=== DEVELOPMENT TOOLS ===\n'
node --version
npm --version
git --version
code --version | head -n 1
```

**Expected:** Ubuntu reports a recent release; architecture `x86_64`; tools print versions without `command not found`. Your earlier reported Node v24 and npm v11 are appropriate starting points; the actual laptop output is authoritative. Current Vite requires Node >=20.19 or >=22.12, and currently documented Vitest requires Node >=22.12. Don't change a working Node v24 installation solely for this project.

**Unexpected:**

| Symptom | Explanation | Action |
|---|---|---|
| `node: command not found` | Node not installed in active shell | Check `which node`, your Node manager (`nvm` etc.), then repair the installation before proceeding. |
| `npm: command not found` | npm unavailable | Repair Node/npm using your existing tool manager; do not mix sudo/global installs blindly. |
| `code: command not found` | VS Code CLI not on PATH | Open the project through VS Code GUI; add code CLI to PATH later. |
| Low free disk space | Node dependencies/builds need space | Free sufficient space before scaffolding; avoid deleting other projects. |
| Tool version too old | Incompatible with current Vite/Vitest | Update through existing Node manager, then check again. |

**Optional automated preflight:** download `netverse_phase0_preflight.sh`, then run:

```bash
bash ~/Downloads/netverse_phase0_preflight.sh
```

It prints a concise tool report and creates no project files.

## 2. Verify project location

```bash
cd ~/Documents
pwd
if [ -e netverse-lab ]; then
  echo 'STOP: ~/Documents/netverse-lab already exists. Inspect it before continuing.'
else
  echo 'READY: destination is free.'
fi
```

**Expected:** `READY: destination is free.` **If STOP appears, don't overwrite the directory.** Inspect with `ls -la ~/Documents/netverse-lab` and decide whether it is an existing Netverse project; if so, adapt the procedure rather than re-scaffold.

## 3. Scaffold React + TypeScript with Vite

Run only when the target path is free and Internet/package access is available:

```bash
cd ~/Documents
npm create vite@latest netverse-lab -- --template react-ts
cd ~/Documents/netverse-lab
npm install
```

**Expected:** create-vite reports success and `npm install` completes with `added ... packages` or `up to date`, exit code 0. It creates `src/`, `public/`, `index.html`, `package.json`, and a local `node_modules/` directory. Actual package count may differ.

**Unexpected outcomes:**

- `EAI_AGAIN`, `ENOTFOUND`, `ETIMEDOUT`: network/DNS issue; use a known working connection, then retry `npm install` in the scaffolded directory.
- `EACCES`: permissions issue; inspect with `ls -ld ~/Documents/netverse-lab ~/.npm`. Avoid blanket `sudo` changes; correct only the affected ownership when verified.
- `Unsupported engine`: review `node --version` against package requirements before proceeding.
- Existing destination: stop, inspect, do not use `--force`.

## 4. Put the design under version control

Download both design files from ChatGPT into Downloads before this step. From the project:

```bash
cd ~/Documents/netverse-lab
mkdir -p docs
cp ~/Downloads/NETVERSE_MASTER_BLUEPRINT.md docs/
cp ~/Downloads/PHASE_0_SETUP.md docs/
```

**Expected:** `ls -lh docs/` shows the two Markdown documents. If `cp: cannot stat` occurs, locate the actual browser download directory and use the correct path. Example:

```bash
find "$HOME/Downloads" -maxdepth 2 -name 'NETVERSE_MASTER_BLUEPRINT.md' -o -name 'PHASE_0_SETUP.md'
```

Do not commit any locally stored diagnostic reports with personally identifying details.

## 5. Establish a test baseline

Add Vitest:

```bash
cd ~/Documents/netverse-lab
npm install -D vitest
npm pkg set 'scripts.test=vitest run'
mkdir -p tests/unit
```

Create a minimal toolchain smoke test (this does not pretend to test the networking engine):

```bash
cat > tests/unit/toolchain.test.ts <<'TEST'
import { describe, expect, it } from 'vitest';

describe('Phase 0 toolchain', () => {
  it('runs TypeScript unit tests', () => {
    expect(2 + 2).toBe(4);
  });
});
TEST
```

Now verify:

```bash
npm run lint
npm run build
npm test
```

**Expected:** lint exits with code 0, Vite builds `dist/`, and Vitest shows `1 passed`. A build that reports errors fails the Phase 0 gate; fix the error rather than committing a broken baseline.

**Common failures:**

| Output | Likely action |
|---|---|
| `Missing script: lint` | Check `npm run`; verify you chose the `react-ts` template. |
| `Cannot find package` / missing module | Re-run `npm install` after verifying network and `package.json`. |
| TypeScript compile error | Inspect error file and line; do not hide errors by weakening strict settings. |
| Vitest not found | Check `npm ls vitest` and `npm install -D vitest`. |
| Vite Node engine error | Check `node --version`, update via your existing manager. |

## 6. Verify the local web page

Start the server:

```bash
cd ~/Documents/netverse-lab
npm run dev -- --host 127.0.0.1
```

**Expected:** terminal prints a local URL, normally `http://127.0.0.1:5173/` (another port if 5173 is in use). Open that URL in Firefox and confirm the standard Vite + React starter page loads.

Optional test in a **second terminal**:

```bash
curl -I http://127.0.0.1:5173/
```

Expected: `HTTP/1.1 200 OK` or equivalent HTTP success header. If curl cannot connect, ensure dev server is still running and check the actual local port displayed by Vite. If port is already taken, Vite may choose another; use the displayed URL. Stop server with `Ctrl+C` afterward.

## 7. Inspect the generated `.gitignore`

Run:

```bash
cd ~/Documents/netverse-lab
cat .gitignore
```

Ensure patterns such as `node_modules`, `dist`, build artifacts and log files are excluded. Add these **only if absent**:

```gitignore
.env
.env.*
!.env.example
*.local
*.log
```

Vite may already provide some of these; duplicate entries are harmless but unnecessary. Avoid committing credentials and local reports. When in doubt, check with `git status --short` before `git add`.

## 8. Initialize Git and make a baseline commit

Vite may not initialize Git. Check first:

```bash
cd ~/Documents/netverse-lab
git status
```

If it says `fatal: not a git repository`, initialize:

```bash
git init -b main
```

If Git says author identity unknown at commit time, set **repository-local** identity using your own values:

```bash
git config user.name 'YOUR_GIT_NAME'
git config user.email 'YOUR_GIT_EMAIL'
```

Review tracked changes and commit:

```bash
git status --short
git add .
git diff --cached --stat
git commit -m 'chore: initialize Netverse Lab Phase 0 foundation'
git status
```

**Expected:** a successful commit and `nothing to commit, working tree clean`.

**Do not add a remote or push yet.** GitHub publishing can be handled deliberately once the local baseline is accepted.

## 9. Record acceptance results

Create `docs/PHASE_0_RESULTS.md` with the observed facts, not guessed values. A suggested format:

```markdown
# NETVERSE Phase 0 Verification

- Date:
- Ubuntu:
- Node:
- npm:
- Git:
- VS Code:
- Project path: ~/Documents/netverse-lab
- npm install: PASS/FAIL
- npm run lint: PASS/FAIL
- npm run build: PASS/FAIL
- npm test: PASS/FAIL
- Dev page opened: YES/NO
- Git commit short hash:
- Unexpected errors:
- Decision: Phase 0 ACCEPTED / BLOCKED
```

Fill with actual outputs. If you create this file after the baseline commit, commit it separately **only if it contains no secrets or sensitive paths**.

## 10. Phase 0 acceptance checklist

- [ ] System prerequisites reported successfully.
- [ ] Destination path was initially free; scaffold generated safely.
- [ ] Dependencies installed without unresolved errors.
- [ ] Design files copied into `docs/`.
- [ ] `npm run lint` passed.
- [ ] `npm run build` passed.
- [ ] `npm test` passed.
- [ ] Vite starter page opened locally.
- [ ] `.gitignore` checked for dependencies, builds and secrets.
- [ ] Local Git commit created and working tree clean.

**Phase 0 completion condition:** All the above are verified on the actual laptop. The codebase will then be ready for **Phase 1: application shell and navigation**.

---

## Troubleshooting worksheet

| Error observed | Command that failed | What to capture |
|---|---|---|
| Tool unavailable | `node -v` / `npm -v` / etc. | Exact stderr + `which node` if relevant |
| Unable to scaffold | `npm create vite...` | Full error including error code, not credentials |
| npm download fails | `npm install` | Error code; package/version; avoid posting tokens |
| Lint/build fails | `npm run lint` / `npm run build` | Error lines, `package.json` scripts |
| Dev server fails | `npm run dev` | Local URL or port error; `ss -ltn` if needed |
| Git commit fails | `git commit` | Error text, `git status` |

### Source documentation

- Vite setup: https://vite.dev/guide/
- React Flow (deferred until Phase 3): https://reactflow.dev/learn
- Vitest setup: https://vitest.dev/guide/

**End of Phase 0 guide.**
