# NETVERSE ENGINE — Simulation fidelity and invariants

## Tested educational semantics (selected F0/F1)

1. Hosts with valid IPv4 addresses in the same prefix use direct on-link delivery.
2. Hosts use a configured default gateway when a destination is not on-link. The gateway must be on-link and physically reachable.
3. Routers forward between directly connected IPv4 prefixes and decrement TTL conceptually.
4. Both forward and reply IP paths must exist before an ICMP Echo Reply can count as received.
5. A point-to-point Ethernet interface cannot have multiple direct cables. Ethernet switch ports can independently link to other ports/devices.
6. Port administrative state, device power and cable enabled state govern frame delivery.
7. ARP request/reply events appear on cache miss. A missing ARP neighbor cannot yield a fictitious delivery.
8. ICMP results and event order are deterministic for a fixed saved topology and command.
9. Unsupported terminal commands return a limitation message; no shell command evaluation or real OS access occurs.
10. All project imports use the versioned schema and validate identifiers/ports/link endpoints before acceptance.

## Current simplifications

- Switches provide an internal forwarding path for connected ports, with illustrative forwarding/learning events. This is **not** a full Ethernet learning bridge: complete broadcast flood traces, aging and spanning-tree are out of scope.
- Event traversal is serialized and synchronous. Queues are capped at 200 stored events per ping simulation. Source-to-destination logical path computation is based on modeled links/ports, not real network adapters.
- Model supports a per-device default gateway and directly connected routes, not arbitrary per-interface static/dynamic routes.
- MAC/IP address conflicts are not a fully modeled scenario. Duplicate IP addresses in arbitrary projects may resolve to the first discovered neighbor.
- Simulated ICMP runs have deterministic synthetic latency; results should not be interpreted as real-network measurements.
- Routers/interfaces are synthetic educational entities and do not implement full IP fragmentation, checksum, MTU, L2 error, TTL expiration across arbitrary loops or network services.
- No real DHCP/DNS/NAT/TCP/UDP/VLAN/IPv6 traffic yet; Phase 9+ roadmap.
- `ip neigh` displays the device-scoped neighbors learned during the most recent ping trace, not a persistent kernel-style cache with aging.
- A browser load of the project cannot access local Ethernet hardware, and the case-study addresses are fictitious virtual data.

## Security boundary

Only an explicit allowlist of simulated commands is accepted. The app makes no network requests, uses no service worker, and does not request filesystem/network privileges. Export uses browser Blob downloads. Import accepts <=250 KB JSON and schema validates its structure. The lab should be used for defensive learning in simulated environments.

## Trace model

An ICMP exchange on direct Ethernet may show: command-generated notice → ARP request → synthetic link transit → ARP reply → synthetic reply transit → ICMP request → frame arrival → delivery → reverse path and ICMP reply. Each step is derived from current topology and addressing. An unplugged cable results in `LINK_DOWN`; a missing next hop results in `ARP_UNRESOLVED`; a missing route results in `NO_ROUTE`.
