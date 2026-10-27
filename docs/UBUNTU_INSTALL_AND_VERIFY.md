# NETVERSE LAB — Ubuntu Phase 0 closeout + Phases 1–8 installation

**Your baseline at the handoff:** Vite 8.3.5, Node available, Oxlint passed (0 warnings/0 errors), TypeScript/Vite build passed, Vitest `1 passed`, and commit `f565e1e` with clean working tree. This file does not ask you to recreate that project.

## A. Safely close Phase 0 before upgrading

```bash
cd ~/Documents/netverse-lab
pwd
git status --short
git log -1 --oneline
npm run lint
npm run build
npm test
```

Expected: `git status --short` initially prints nothing; commit begins `f565e1e`; lint/build pass; Vitest baseline passes. Confirm the Vite starter works at `http://127.0.0.1:5173/` if you did not already inspect it in Firefox.

Phase 0 design docs were missing from your baseline commit. You can add them from the update ZIP before installing the application files:

```bash
ZIP="$HOME/Downloads/NETVERSE_Phases_1-8_Upgrade.zip"
test -f "$ZIP" || { echo "Download the ZIP into ~/Downloads first"; exit 1; }
mkdir -p docs
unzip -p "$ZIP" docs/NETVERSE_MASTER_BLUEPRINT.md > docs/NETVERSE_MASTER_BLUEPRINT.md
unzip -p "$ZIP" docs/PHASE_0_SETUP.md > docs/PHASE_0_SETUP.md
ls -lh docs/
git add docs/NETVERSE_MASTER_BLUEPRINT.md docs/PHASE_0_SETUP.md
git commit -m "docs: finalize Netverse Phase 0 blueprint"
```

**Phase 0 is formally closed when:** lint/build/test succeed, your starter page opens, baseline Git is committed and the design docs are tracked.

## B. Install Phases 1–8 without deleting existing files

Use a feature branch so your `main` branch remains a working baseline:

```bash
cd ~/Documents/netverse-lab
git status --short
git switch -c feature/netverse-phases1-8
ZIP="$HOME/Downloads/NETVERSE_Phases_1-8_Upgrade.zip"
unzip -l "$ZIP" | head -35
unzip -o "$ZIP" -d "$PWD"
```

This is a **source overlay**, not another Vite scaffold. It must be unpacked into the repository root. It deliberately does **not** ship or overwrite `package.json`, `package-lock.json`, `.oxlintrc.json`, `tsconfig*`, `vite.config.ts`, `.gitignore`, or `node_modules`. It does replace the Vite starter UI files `src/App.tsx`, `src/App.css`, `src/index.css`, `src/main.tsx`, `index.html` and `README.md`, and adds engine, content and docs.

If you cannot or do not want to branch, make a copy of the repo first and unzip there. Do not run `npm create vite` again. No extra npm dependencies are required by the overlay.

## C. Run automated quality gates

```bash
cd ~/Documents/netverse-lab
bash scripts/verify_netverse.sh
```

Equivalent commands:

```bash
npm run lint
npm run build
npm test
```

**Expected:** Oxlint reports zero errors/warnings, TypeScript/Vite build succeeds, and the **35 total test cases** pass (your one baseline toolchain test + 34 new engine tests). If the actual count differs, inspect the reported failing names instead of assuming success.

Troubleshooting:

- `npm: command not found`: confirm Node installation and open a new Ubuntu terminal.
- `vitest: not found`: in the existing project, run `npm install` to restore dependencies from the lockfile. This may require Internet access the first time.
- `Cannot find module react`: run `npm install` in the project (do not recreate the project).
- TypeScript or Oxlint failures: copy the exact diagnostic including path and line number.
- `unzip: cannot find or open`: move the downloaded archive to `~/Downloads` or update `ZIP` to the actual path.
- `git switch` refuses due to changes: stop, run `git status`, save/stash your work before branching. Never force reset.

## D. Start the local lab and verify in Firefox

```bash
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/` in Firefox on Ubuntu. On success, you should see **NETVERSE** navigation and the Dashboard instead of the Vite starter screen. `Ctrl+C` stops the local server.

### Acceptance 1 — Full Learn cycle

1. Open Learn. Module 01 has three available lessons; modules 02–14 are visibly marked coming later.
2. Select `What is a network?`, use step buttons 1 through 9, and answer the quiz correctly (second answer).
3. Switch away, refresh, and return: the completed lesson should stay completed.

### Acceptance 2 — Ethernet link and ping

1. Open Build. Two PCs should be visible: PC-A `192.168.1.10/24`, PC-B `192.168.1.20/24`.
2. Choose `PC-A · eth0` and `PC-B · eth0` from the patch panel, then Connect.
3. In the simulated terminal choose PC-A and run:

```text
ip addr
ip route
ping -c 2 192.168.1.20
```

Expected: two Echo Replies and `2 packets transmitted, 2 received, 0% packet loss`. The displayed IPv4 address and route must match the configured virtual PC, not your actual Ubuntu Wi-Fi interface.

4. Open Packet inspector. Expect ARP request/reply and ICMP events. Previous, Next, Play/Pause and Replay must work.
5. Return to Build, disable the cable, run the same ping. Expected `0 received` (reason `LINK_DOWN` in trace).
6. Reenable cable, rerun ping. Expected `2 received`.

### Acceptance 3 — Fault lab tickets

**Ticket 01: Disconnected cable**

- Troubleshoot → Case 01 → run `ping -c 2 192.168.1.20` on PC-A; expect `0 received`.
- Build → Enable the disabled cable → return to Troubleshoot terminal → rerun; expect `2 received`.
- Enter meaningful Evidence and Diagnosis (at least 15 characters each). Score should be 100/100; submit.

**Ticket 02: Wrong subnet**

- Troubleshoot → Case 02 → ping `192.168.1.20` (0 replies).
- Build → select PC-B → `eth0` IPv4 from `192.168.2.20` to `192.168.1.20`, prefix `24` → Apply.
- Rerun the ping on PC-A; expect replies.

**Ticket 03: Missing gateway**

- Troubleshoot → Case 03 → from PC-A run `ip route` (no default route), ping `192.168.20.20` (0 replies).
- Build → select PC-A → set Default gateway to `192.168.10.1` → Set gateway.
- Run ping again. Expected response via R1 and Server-B; Packet inspector must show router forwarding.

**Important:** An incident's final score needs actual failure observation, an engine-verified successful retest, and adequate learner notes/explanation. The rubric does not yet evaluate truth of natural-language notes; see fidelity doc.

### Acceptance 4 — Import/export, responsiveness and isolation

1. Projects → Export JSON; download a backup.
2. Projects → Start empty network; then Import the JSON file. Check that devices, links and addresses reappear.
3. Resize Firefox to a narrow mobile-width window. The navigation, cards, connection form and terminal must remain usable.
4. Try the unsupported command `sudo reboot` in the simulated terminal. Expected `Command not supported in this simulation`. It must not reboot Ubuntu.
5. Restart the dev server with Wi-Fi disconnected, once all npm dependencies are already installed. The locally served lab should still work because all application assets are local.

## E. Commit only after all gates pass

```bash
cd ~/Documents/netverse-lab
git status
git add README.md index.html public/favicon.svg src tests/unit/network-engine.test.ts docs scripts
git commit -m "feat: implement Netverse learning and network labs phases 1-8"
git status
```

Your final output should indicate a clean working tree on `feature/netverse-phases1-8`. **Do not push until you have verified the browser workflows and chosen a remote.** The upstream GitHub repository is not configured by this package.

## F. What to send back for review

Share the output of:

```bash
cd ~/Documents/netverse-lab
npm run lint
npm run build
npm test
git status
```

Also provide screenshots of Dashboard, Build with the two-PC connection, a successful and failed terminal ping, the Packet inspector, and Case 03 after repairing the gateway. If any step fails, provide the exact error, command and screenshot rather than resetting the app.
