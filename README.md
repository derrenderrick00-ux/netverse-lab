# NETVERSE LAB — Networking learning, simulation and investigation

**Release:** Phases 1–8 engineering prototype (not a production networking emulator).

NETVERSE is a local-first React + TypeScript learning laboratory. Learners study networking with the nine-step method, create network topologies, configure IPv4 interfaces, run an allow-listed **virtual** terminal, investigate three faults and step through packet events.

## What is implemented

- Dashboard and responsive navigation (Phase 1).
- Three complete Module 01 lessons using the nine-step method; additional 13 modules are curriculum placeholders (Phase 2).
- Accessible 2D topology canvas, four basic device models, per-port cable setup, save/import/export (Phase 3).
- Headless state-based IPv4, ARP, ICMP, virtual links, simplified Ethernet switch transit and deterministic event clock (Phase 4).
- Per-interface addressing, subnet masks, interface on/off, default gateway and two-network router (Phase 5).
- Strict allow-listed virtual terminal: `help`, `clear`, `ip addr`, `ip link`, `ip route`, `ip neigh`, `arp -a`, `ping`, simplified `traceroute` (Phase 6 and early Phase 8).
- Incident tickets for broken cable, wrong subnet and missing gateway; evidence notes, independent test order, criteria-based grading (Phase 7).
- Packet event timeline, inspector and deterministic replay of stored events; simplified switch traversal (Phase 8).

## Quickstart on the user's existing Phase-0 Vite project

This release is an **overlay**, not a new npm project. Extract the contents at the existing `~/Documents/netverse-lab` root. It intentionally preserves the installed `package.json`, `package-lock.json`, `.oxlintrc.json` and `node_modules`.

```bash
cd ~/Documents/netverse-lab
npm run lint
npm run build
npm test
npm run dev -- --host 127.0.0.1
```

Then open `http://127.0.0.1:5173/`. See `docs/UBUNTU_INSTALL_AND_VERIFY.md` for safe step-by-step installation, Phase 0 completion, expected outputs, and manual tests.

## First lab: Two Computers, Make Them Talk

1. Open **Build**. The starter network has PC-A = `192.168.1.10/24` and PC-B = `192.168.1.20/24` but no cable.
2. In the **Patch panel**, connect `PC-A · eth0` to `PC-B · eth0`.
3. Select PC-A as the terminal device; run `ping -c 2 192.168.1.20`. Expect `2 packets transmitted, 2 received`.
4. Select **Packet inspector** to see ARP and ICMP events and step/replay.
5. Return to Build and choose **Disable** on the cable. Run ping again: `0 received`.
6. Re-enable the cable; test again.

## Technical limitations (explicit, not hidden)

- This is an **educational simulation**, not Cisco Packet Tracer, GNS3, a real shell, or a real network stack. Commands never access the computer's OS, network devices or Internet.
- IPv4 supports connected routes and **one default gateway** per endpoint. It does not yet support user-defined static routing tables, full dynamic routing, VLANs or IPv6.
- Ethernet switch behavior is simplified: the virtual link path and switch transit are simulated, while complete unknown-unicast flooding, MAC aging, full ARP broadcast propagation and loop prevention are deferred. Do not use it as protocol conformance evidence.
- `traceroute` is a simplified description of a simulated ping path; it is not a TTL-probe implementation.
- Timestamps are deterministic educational simulation units. The implementation does not measure physical line-rate throughput, radio contention or realistic queueing; these belong to Phase 9.
- Incident scoring checks network repair and written evidence, but does not semantically validate the learner's diagnosis text (future improvement).
- Local browser storage is not an encrypted vault. Do not enter real passwords or sensitive data.
- The additional 13 course modules and three-dimensional physical infrastructure are **not** implemented yet.

## Architecture

`src/engine/` is headless and contains validated topology actions, IP utilities, a state-based simulator and virtual terminal. UI components dispatch actions and display real event output from the engine. `src/labs/scenarios.ts` owns fixed incident fixtures and simple scoring. `src/learning/content.ts` owns lesson content. `src/utils/storage.ts` owns versioned local persistence.

See `docs/ENGINE_FIDELITY.md` and `docs/PHASES_1-8_IMPLEMENTATION.md`.
