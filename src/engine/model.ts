import {parseIpv4} from './ip';

export type DeviceKind = 'host' | 'switch' | 'router' | 'server';
export type EventKind = 'arp-request' | 'arp-reply' | 'frame' | 'forward' | 'icmp-request' | 'icmp-reply' | 'delivered' | 'dropped' | 'notice';
export type Medium = 'ethernet';

export interface NetPort {
  id: string;
  name: string;
  mac: string;
  medium: Medium;
  enabled: boolean;
  ipv4: string;
  prefix: number;
}
export interface NetDevice {
  id: string;
  name: string;
  kind: DeviceKind;
  x: number;
  y: number;
  powered: boolean;
  ports: NetPort[];
  gateway: string;
}
export interface NetLink {
  id: string;
  a: string;
  b: string;
  medium: Medium;
  enabled: boolean;
  delayMs: number;
}
export interface NetworkProject {
  schemaVersion: 1;
  name: string;
  devices: NetDevice[];
  links: NetLink[];
}
export interface NetworkEvent {
  id: string;
  timeMs: number;
  type: EventKind;
  at: string;
  packetId: string;
  detail: string;
  reason?: string;
}
export interface PingResult {
  sourceId: string;
  destination: string;
  transmitted: number;
  received: number;
  output: string;
  events: NetworkEvent[];
  hops: string[];
  neighbors: Record<string, string[]>;
  success: boolean;
  reason: string;
}
export interface ActionResult<T> { ok: boolean; state: T; error?: string }

const formatMac = (id: string, idx: number) => {
  let h = 2166136261;
  for (const c of `${id}:${idx}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return `02:4e:${[h >>> 24, (h >>> 16) & 255, (h >>> 8) & 255, h & 255].map(n => n.toString(16).padStart(2, '0')).join(':')}`;
};
export function makeDevice(id: string, kind: DeviceKind, x = 180, y = 140, name?: string): NetDevice {
  const count = kind === 'switch' ? 4 : kind === 'router' ? 2 : 1;
  return {
    id, name: name || `${kind.toUpperCase()}-${id}`, kind, x, y, powered: true, gateway: '',
    ports: Array.from({ length: count }, (_, i) => ({
      id: `${id}:p${i}`, name: kind === 'router' ? `eth${i}` : kind === 'switch' ? `sw${i + 1}` : 'eth0',
      mac: formatMac(id, i), medium: 'ethernet' as const, enabled: true,
      ipv4: '', prefix: 24,
    })),
  };
}
export const emptyProject = (): NetworkProject => ({schemaVersion: 1, name: 'Untitled network', devices: [], links: []});
export const createTwoPcLab = (): NetworkProject => {
  const a = makeDevice('pc-a', 'host', 110, 130, 'PC-A');
  const b = makeDevice('pc-b', 'host', 430, 130, 'PC-B');
  a.ports[0].ipv4 = '192.168.1.10'; b.ports[0].ipv4 = '192.168.1.20';
  return {schemaVersion: 1, name: 'Two computers: make them talk', devices: [a, b], links: []};
};
export function portOwner(project: NetworkProject, portId: string): NetDevice | undefined {
  return project.devices.find(d => d.ports.some(p => p.id === portId));
}
export function findPort(project: NetworkProject, id: string): NetPort | undefined {
  return portOwner(project, id)?.ports.find(p => p.id === id);
}
export function addDevice(project: NetworkProject, kind: DeviceKind): ActionResult<NetworkProject> {
  if (project.devices.length >= 12) return {ok: false, state: project, error: 'Lab limit: 12 devices.'};
  const id = `node-${Array.from({length: 99}, (_, i) => i + 1).find(i => !project.devices.some(d => d.id === `node-${i}`)) ?? 99}`;
  const pos = project.devices.length;
  const device = makeDevice(id, kind, 95 + (pos % 4) * 160, 85 + Math.floor(pos / 4) * 150);
  return {ok: true, state: {...project, devices: [...project.devices, device]}};
}
export function connect(project: NetworkProject, a: string, b: string): ActionResult<NetworkProject> {
  const pa = findPort(project, a), pb = findPort(project, b);
  if (!pa || !pb) return {ok: false, state: project, error: 'Select two existing interfaces.'};
  if (a === b || portOwner(project, a)?.id === portOwner(project, b)?.id) return {ok: false, state: project, error: 'Select interfaces on different devices.'};
  if (project.links.some(l => [l.a, l.b].some(p => p === a || p === b))) return {ok: false, state: project, error: 'An Ethernet interface can have only one cable.'};
  if (project.links.length >= 24) return {ok: false, state: project, error: 'Lab limit: 24 links.'};
  return {ok: true, state: {...project, links: [...project.links, {id: `link-${a}-${b}`, a, b, medium: 'ethernet', enabled: true, delayMs: 1}]}};
}
export function updateDevice(project: NetworkProject, device: NetDevice): ActionResult<NetworkProject> {
  if (!project.devices.some(d => d.id === device.id)) return {ok: false, state: project, error: 'Device does not exist.'};
  return {ok: true, state: {...project, devices: project.devices.map(d => d.id === device.id ? device : d)}};
}
export function validateProject(data: unknown): data is NetworkProject {
  if (typeof data !== 'object' || !data) return false;
  const p = data as Partial<NetworkProject>;
  if (p.schemaVersion !== 1 || typeof p.name !== 'string' || p.name.length > 100 || !Array.isArray(p.devices) || !Array.isArray(p.links)) return false;
  if (p.devices.length > 12 || p.links.length > 24) return false;
  const ids = new Set<string>(); const ports = new Set<string>();
  for (const d of p.devices) {
    if (!d || typeof d.id !== 'string' || !d.id || ids.has(d.id) || !['host','server','switch','router'].includes(d.kind) ||
      typeof d.name !== 'string' || typeof d.powered !== 'boolean' || !Number.isFinite(d.x) || !Number.isFinite(d.y) ||
      !Array.isArray(d.ports) || typeof d.gateway !== 'string' || (d.gateway && parseIpv4(d.gateway) === null)) return false;
    ids.add(d.id);
    for (const port of d.ports) {
      if (!port || typeof port.id !== 'string' || !port.id || ports.has(port.id) || typeof port.name !== 'string' || typeof port.mac !== 'string' ||
        port.medium !== 'ethernet' || typeof port.enabled !== 'boolean' || typeof port.ipv4 !== 'string' || (port.ipv4 && parseIpv4(port.ipv4) === null) ||
        !Number.isInteger(port.prefix) || port.prefix < 0 || port.prefix > 32) return false;
      ports.add(port.id);
    }
  }
  const used = new Set<string>(); const linkIds = new Set<string>();
  for (const l of p.links) {
    if (!l || !ports.has(l.a) || !ports.has(l.b) || l.a === l.b || used.has(l.a) || used.has(l.b) ||
      !['ethernet'].includes(l.medium) || typeof l.enabled !== 'boolean' || typeof l.id !== 'string' || linkIds.has(l.id) ||
      !Number.isFinite(l.delayMs) || l.delayMs < 0 || l.delayMs > 10000) return false;
    if (p.devices.find(d => d.ports.some(port => port.id === l.a))?.id === p.devices.find(d => d.ports.some(port => port.id === l.b))?.id) return false;
    used.add(l.a); used.add(l.b); linkIds.add(l.id);
  }
  return true;
}
