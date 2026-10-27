# NETVERSE extended candidate — local verification record

## Environment
- Local execution tools: Node.js 22.16.0, TypeScript 5.8.3, Python/browser tooling.
- The environment does **not** have React, Vite or Oxlint installed in the app's node_modules, and npm registry access fails (EAI_AGAIN). Therefore Vite build, native Vitest and Oxlint run **are not verified here**.
- Real browser smoke using the available offline React 16.0 failed because React 16.0 predates hooks; that result cannot validate a modern React application. It is a test-environment limitation, **not proof that the app works in Firefox**.

## Tests run
1. Phase 1–8 hotfix source: strict TypeScript compiler check, `erasableSyntaxOnly=true` → passed.
2. Extended source: strict TypeScript compiler check with `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` → passed.
3. Real project's TypeScript engine tests transpiled offline and executed through a Vitest-like adapter: 34/34 passed.
4. New model tests in the same adapter: 27/27 passed.
5. Independent randomized/property-like checks of fair allocation, firewall verdicts and IPv6 syntax: 1,508/1,508 passed.
6. Offline-transpiled browser JavaScript syntax: `node --check` passed. This does not constitute a Vite build or a UI browser acceptance test.
7. Shell `bash -n` syntax check for release verifier and isolated namespace exercise passed.
8. ZIP archive integrity (`unzip -t`) and source SHA-256 manifest checked during packaging.

## Manual verification still required
- `npm run lint` must show zero warnings and zero errors.
- `npm run build` must succeed with native `tsc -b && vite build`.
- `npm test` must pass using actual Vitest (expected 62 tests total: original 1 + prior 34 + new 27).
- Firefox smoke: Dashboard, Learn, Build, Guided/Independent, Patch, packet inspector, ticket workflow, Performance, Infrastructure, Security, Advanced, Projects.
- Mobile viewport, import/export and localStorage persistence need user verification.
- Optional Linux namespace exercise is *not* executed in this environment (requires explicit privilege and a supporting kernel).

## Known fidelity gaps
- Phase 9 models max-min sharing, not real TCP/Wi-Fi throughput or packet drops.
- Phase 10 provides interactive schematics and component explanations, not optical physical-layer simulation or 3D models.
- Phase 11 policy exercise is separate from the Phase 1–8 packet simulator.
- Phase 12 VLAN, IPv6 and TCP labs are conceptual experiments; no full corresponding protocol stacks.
- Phase 13 is a standalone, optional Linux shell lab, not real-time browser integration.
- Phase 14 establishes QA processes and acceptance guidance; does not guarantee production readiness.
