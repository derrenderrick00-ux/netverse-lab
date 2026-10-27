# NETVERSE extended laboratory — phases 9–14

## Versioning and scope
This is a **candidate**, not an accepted production release. It patches phase 1–8 errors, adds guided / independent learning modes, introduces the offline Patch contextual coach and selected working experiments in phases 9–12. Phase 13 provides an **opt-in standalone Linux network namespace experiment** rather than a graphical bridge to the browser simulator. Phase 14 adds release verification, test cases and manual acceptance instructions, not a production security audit.

### Phase 1–8 fixes
- `TS1294` parameter property converted to an explicit property and constructor assignment, preserving the project's `erasableSyntaxOnly` policy.
- Four `set-state-in-effect` warnings removed by remounting draft editors when device identity / configuration changes and by deriving playback completion; new traces use a key to reset playback state.
- Earlier IPv4 ARP ICMP engine behavior remains unchanged. Re-run all 34 legacy tests.

### Guided vs Independent
- **Guided:** step-by-step guidance strip appears in Build and Troubleshoot.
- **Independent:** no guidance strip. Patch can still be opened voluntarily; initial ticket help does not directly reveal the failure. Explicitly requesting a stronger hint does.
- Mode choice persists in localStorage when available.
- Patch is a **local rules-based help tool**, not an AI agent, not online, not a real technician. It cannot alter the network or issue commands.

### Phase 9: Network performance
- Single bottleneck / max-min fair sharing of application demands, configurable capacity, RTT and queue-buffer parameter; deterministic throughput calculation.
- Queueing example is educational and models full-buffer delay only during overload; **not** measured latency, TCP, Wi-Fi scheduler, realistic dropped packet rate, or bandwidth tests against a real ISP.
- Acceptance: 20 Mbps link with 20/20 demands delivers 10/10; demand 2/20 delivers 2/18; no negative, Infinity or total throughput above capacity.

### Phase 10: Physical Internet
- Schematic interactive fibre access journey and equipment catalogue for ONT, OLT, fibre, mobile masts, IXP, submarine cables and endpoints.
- Does NOT simulate optical physics, Wi-Fi radio propagation, GPS, 3D models or actual fiber line faults. Those remain future milestones.

### Phase 11: Network security
- First-match ordered firewall rule exercise with source IPv4 CIDR, protocol, destination port and default policy.
- Does NOT integrate rules into the original ICMP engine or host OS firewall. No real network packets.

### Phase 12: Advanced
- Standalone VLAN membership demonstration and simplified TCP three-way handshake; no real VLAN trunk/802.1Q, IPv6 stack, or TCP retransmission model.
- Advanced material clearly labels these fidelity limits.

### Phase 13: Optional real Linux lab
- Run `bash scripts/real_linux_namespace_lab.sh` to review requirements.
- When explicitly approved, `sudo bash scripts/real_linux_namespace_lab.sh --run` creates two temporary network namespaces and a veth pair, pings across a `192.0.2.0/24` link, disables the far interface to demonstrate failure, then restores it.
- EXIT trap removes the namespaces. No changes to global routing, IP forwarding, DNS, NAT or firewall.
- **Do not run without authorization on shared institutional computers.** If namespace creation fails due to privileges or restricted kernels, skip it and report the output; this is optional and never required for the web app.

### Phase 14: Quality and release
- `bash scripts/verify_release.sh` runs Oxlint, TypeScript/Vite build, Vitest, shell syntax and Git status.
- There is no automated Firefox browser/Android acceptance in this environment, no published backend, and no production security assessment. Production-readiness is **not** claimed.

## Manual Ubuntu verification matrix

1. **Back up and install** on a fresh branch. Do not overwrite `package.json`, lockfile, or `.gitignore`; the archive is an overlay.
2. `npm run lint` → 0 errors **and 0 warnings** expected; `npm run build` → success; `npm test` → prior 35 plus new test cases. Stop and report any error; do not commit a broken state.
3. Start: `npm run dev -- --host 127.0.0.1`; open Firefox. Confirm Dashboard/Build/Troubleshoot/Learn/Packet inspector still render.
4. Set **Guided**, open Build: visible five-step coaching. Click **Patch**: help includes cable setup. Set **Independent**: coaching strip disappears. Reload and confirm choice persists. Click Patch: voluntary help still works.
5. Build: connect `pc-a:p0` ↔ `pc-b:p0`, then run `ping -c 2 192.168.1.20`; expect 2/2. Disable link; expect 0/2. Re-enable, expect 2/2.
6. Packet Inspector: Replay/Next/Previous/Play/Pause, step through actual generated ARP and ICMP events. Re-run ping twice and ensure playback starts at event 1 for new trace.
7. Three incidents: each should fail before repair; fix cable / PC-B IPv4 / PC-A gateway respectively; re-test success; record evidence and diagnosis to get graded.
8. Performance: 20 Mbps capacity, two 20 Mbps clients → 10 Mbps each; use 2 and 20 → 2 and 18. Set capacity 0 → 0 throughput. Add and remove a device.
9. Infrastructure: click ONT, fibre, OLT, IXP, mast; verify the explanation fields change.
10. Security: guest `192.168.20.12` TCP/22 denied; office `192.168.10.12` TCP/443 allowed. Disable office allow rule and verify default deny. Add a rule and check order.
11. Advanced: VLAN 10/20 isolated, 10/10 common L2; toggle SYN-ACK to fail handshake.
12. Project backup/export: save a network as JSON, clear the workspace, import and verify devices + links restored. Lessons must retain progress after reload.
13. Responsive: narrow Firefox to ~375px width, verify no unusable clipped inputs, accessible navigation and Patch control. Mobile/Android hardware verification remains user's responsibility.
14. Optional Linux script only when permitted. Check cleanup with `ip netns list` afterward.

## Known constraints / future expansion
Real protocol fidelity, TCP/IP packet injection, IPv6 neighbor discovery, PON optical modelling, real 3D physical exploration, integrated firewall and VLAN forwarding, browser-to-namespace orchestration, cloud sync and full production testing are not part of this candidate. Do not describe them as implemented.

### IPv6 lab addition
The Advanced page also compares real hexadecimal IPv6 literals against a configurable /0–/128 prefix. Address parsing supports compressed and full hexadecimal representations but intentionally rejects IPv4-embedded forms and scope identifiers. There is **no IPv6 packet transport, NDP, or router forwarding** in this release.
