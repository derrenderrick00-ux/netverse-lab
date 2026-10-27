# 🌐 NETVERSE LAB

**Local-first networking education • virtual packet simulation • practical troubleshooting**

NETVERSE LAB helps beginners turn networking theory into practical experiments. Learn concepts, connect virtual devices, configure IPv4, inspect ARP/ICMP events, investigate outages, and explore conceptual experiments for shared bandwidth, physical Internet infrastructure, firewall policy, VLANs, TCP handshakes and IPv6 prefixes.

> **Release status:** Extended **educational prototype** (Phases 1–14). The owner verified the application on Ubuntu on 27 October 2026: Oxlint **0 warnings / 0 errors**, Vite production build **passed**, and Vitest **62/62 tests passed**. This is **not** a production-grade networking emulator or complete 14-module course.

## Installation — clone from GitHub

After publication, choose **Code → HTTPS** on the GitHub repository and copy its actual clone URL. Replace the URL below if published under a different repository name:

```bash
cd ~/Documents
git clone https://github.com/derrenderrick00-ux/netverse-lab.git
cd netverse-lab
npm ci
npm run lint
npm run build
npm test
npm run dev -- --host 127.0.0.1
```

Open the local URL Vite prints (normally **http://127.0.0.1:5173/**). Press **Ctrl+C** to stop. Requires Node.js/npm compatible with the committed Vite toolchain and Git; first clone/dependency installation requires Internet access. Verified on Node.js **v24.21.0** and npm **11.19.0**. After installation the browser educational labs can run locally without external services.

**Already developing locally?** Do not run `npm create vite` again; use your existing repository.

## What can a learner do?

| Area | Capability |
|---|---|
| Learn | Three introductory lessons with nine-step study flow; 13 more modules planned |
| Build | Place host, router, server or switch; configure IPv4 and Ethernet links |
| Troubleshoot | Broken cable, wrong subnet and missing gateway scenarios |
| Terminal | Safe simulated `ip`, `ping`, `traceroute`, `arp` subset (not a Linux shell) |
| Packet inspector | Trace ARP and ICMP events from the network engine |
| Guided / Independent | Opt-in instructional guidance or self-directed learning |
| 🛟 Patch | Offline rules-based, read-only teaching assistant |
| Performance | Single-bottleneck max-min fair-sharing calculation |
| Infrastructure | Illustrated fibre/ISP/cellular equipment catalogue |
| Security | Isolated first-match firewall rule experiment |
| Advanced | Separate VLAN membership, TCP handshake and IPv6 prefix exercises |
| Projects | Browser autosave plus topology JSON import/export (schema v1) |
| Optional Linux | Separate opt-in temporary Linux network namespaces lab |

## Documentation

- 📘 [USER MANUAL](docs/USER_MANUAL.md) · [Printable PDF](docs/USER_MANUAL.pdf): Git clone and install, every tab, guided labs, Patch, troubleshooting, project backups and FAQs.
- 🛠️ [DEVELOPER MANUAL](docs/DEVELOPER_MANUAL.md) · [Printable PDF](docs/DEVELOPER_MANUAL.pdf): architecture, data model, engine trace, tests, limitations and GitHub release workflow.
- 🧭 [MASTER BLUEPRINT](docs/NETVERSE_MASTER_BLUEPRINT.md): intended educational system and development phases.
- 🔬 [ENGINE FIDELITY](docs/ENGINE_FIDELITY.md): exact rules and modeling limits.
- ✅ [PHASES 9–14 ACCEPTANCE](docs/PHASES_9_14_ACCEPTANCE.md): Ubuntu/Firefox manual regression scenarios.
- 📋 [FINAL RELEASE INSTALL](docs/FINAL_RELEASE_INSTALL.md): apply the manuals, commit, merge, publish and clean-clone acceptance.
- 📋 [INSTALL EXTENDED RELEASE](docs/INSTALL_EXTENDED_RELEASE.md): earlier upgrade overlay procedure (for maintainers of older local copies).

The Markdown manuals are the **canonical editable documentation**. PDF editions are provided for offline reading and printing.

## Development and verification

```bash
npm run lint                 # Oxlint
npm run build                # TypeScript + Vite
npm test                     # Vitest
bash scripts/verify_release.sh
```

The baseline suite has **62 tests** (1 toolchain, 34 engine, 27 extended). Test results are version-specific; run checks again after modifications. The UI is primarily in `src/App.tsx`; the headless IPv4 engine is in `src/engine`; standalone teaching models are in `src/features`.

## What NETVERSE does *not* yet simulate

The core models simplified connected IPv4 routes, one default gateway, ARP, ICMP, router transit and Ethernet switch paths. **It does not provide real DHCP/DNS/NAT, full TCP/IP packet stacks, production VLAN/IPv6 forwarding, live Wi-Fi/fibre physics or real packet capture.** Firewall/VLAN/TCP/IPv6 exercises are currently separate from the main packet engine. Patch is *not* an online LLM. The separate optional network namespace script requires Linux/sudo and authorization.

Local browser storage is not encrypted secure storage; avoid real passwords or sensitive topology data. The project is suitable for isolated, educational experimentation, not live-network penetration or production configuration.

## License and contributions

No license is implied by this README. Add an explicit `LICENSE` file if you intend others to modify, redistribute or commercialize the project. Before contributing, run all quality gates, keep engine behavior deterministic and document any simplified networking assumptions. Make all changes in feature branches and merge only after acceptance.
