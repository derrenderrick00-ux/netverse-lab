import {connect, createTwoPcLab, makeDevice} from '../engine/model';
import type {NetworkProject} from '../engine/model';

export type IncidentId = 'cable' | 'subnet' | 'gateway';
export interface Incident {
  id: IncidentId;
  title: string;
  ticket: string;
  targetIp: string;
  sourceId: string;
  hint: string;
  correctExplanation: string;
}
export const incidents: Incident[] = [
  {id: 'cable', title: 'Case 01 · Disconnected cable', ticket: 'A classroom PC cannot reach its neighbor. The IP settings look correct. Diagnose and restore connectivity.', sourceId: 'pc-a', targetIp: '192.168.1.20', hint: 'Inspect both interfaces and their physical cable. Test before and after the repair.', correctExplanation: 'An absent or inactive Ethernet link prevents frames from reaching the neighbor.'},
  {id: 'subnet', title: 'Case 02 · Wrong subnet', ticket: 'Two Ethernet-connected PCs cannot ping each other. Investigate IP addresses, prefixes, and routes.', sourceId: 'pc-a', targetIp: '192.168.1.20', hint: 'Check `ip addr` on both computers. They need compatible on-link addressing in this direct topology.', correctExplanation: 'The incorrect prefix on the destination puts its return path off-link without a gateway.'},
  {id: 'gateway', title: 'Case 03 · Missing default gateway', ticket: 'The office PC can access its local network, but not a server on the router’s other subnet. Investigate routing.', sourceId: 'pc-a', targetIp: '192.168.20.20', hint: 'Inspect `ip route` from PC-A. Configure a next hop on the same directly connected subnet.', correctExplanation: 'A nonlocal IPv4 destination requires an appropriate route or default gateway and a return path.'},
];
export function loadIncident(id: IncidentId): NetworkProject {
  if (id === 'cable' || id === 'subnet') {
    const p = createTwoPcLab();
    p.name = id === 'cable' ? 'Incident 01: Disconnected cable' : 'Incident 02: Wrong subnet';
    const a = p.devices[0].ports[0].id; const b = p.devices[1].ports[0].id;
    const linked = connect(p, a, b).state;
    if (id === 'cable') linked.links[0].enabled = false;
    else linked.devices[1].ports[0].prefix = 25; // 192.168.1.20/25 remains on-link: use wrong IP instead
    if (id === 'subnet') linked.devices[1].ports[0].ipv4 = '192.168.2.20';
    return linked;
  }
  const pc = makeDevice('pc-a', 'host', 80, 190, 'PC-A');
  const router = makeDevice('r1', 'router', 285, 190, 'R1');
  const server = makeDevice('server-1', 'server', 510, 190, 'Server-B');
  pc.ports[0].ipv4 = '192.168.10.10'; pc.gateway = '';
  router.ports[0].ipv4 = '192.168.10.1'; router.ports[1].ipv4 = '192.168.20.1';
  server.ports[0].ipv4 = '192.168.20.20'; server.gateway = '192.168.20.1';
  let p: NetworkProject = {schemaVersion: 1, name: 'Incident 03: Missing gateway', devices: [pc, router, server], links: []};
  p = connect(p, pc.ports[0].id, router.ports[0].id).state;
  p = connect(p, router.ports[1].id, server.ports[0].id).state;
  return p;
}
export interface Assessment {score: number; passed: boolean; breakdown: string[]}
export function gradeIncident(repaired: boolean, sawFailure: boolean, notes: string, diagnosis: string): Assessment {
  const hypothesis = diagnosis.trim().length >= 15;
  const evidence = notes.trim().length >= 15;
  const score = (repaired ? 40 : 0) + (sawFailure ? 20 : 0) + (evidence ? 20 : 0) + (hypothesis ? 20 : 0);
  return {score, passed: repaired && sawFailure && evidence && hypothesis, breakdown: [
    `${repaired ? '✓' : '○'} Restored and verified live connectivity · 40`,
    `${sawFailure ? '✓' : '○'} Observed an actual failed test · 20`,
    `${evidence ? '✓' : '○'} Recorded supporting evidence (≥15 characters) · 20`,
    `${hypothesis ? '✓' : '○'} Submitted an explanation (≥15 characters) · 20`,
  ]};
}
