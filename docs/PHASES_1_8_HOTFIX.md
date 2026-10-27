# NETVERSE Phase 1–8 hotfix

Applied to the original Phase 1–8 upgrade from the user session. This hotfix **only** changes `src/engine/simulator.ts` and `src/App.tsx`.

- Replaces unsupported TypeScript constructor parameter property with explicit `private project` and assignment so `erasableSyntaxOnly` stays enabled.
- Removes four effect-driven synchronous state updates in editors / packet inspector, using component identity (`key`) and derived playback boundaries.
- Keeps input drafts while users type and remounts the editor when selected configuration changes.
- Keeps the virtual IPv4 engine and exercises unchanged; regression suite is required.

## Apply from `/home/derrick/Documents/netverse-lab`

```bash
cd ~/Documents/netverse-lab
git status --short
git switch -c fix/netverse-phase1-8
unzip -o ~/Downloads/NETVERSE_Phases_1-8_Hotfix.zip -d .
npm run lint
npm run build
npm test
```

Expect 0 lint warnings/errors, successful Vite build and all original tests passing. After verifying in Firefox, commit with `git add src/App.tsx src/engine/simulator.ts && git commit -m "fix: correct Phase 1-8 TypeScript and React state"`.

Only after accepting the hotfix should you install the extended release on a NEW branch.
