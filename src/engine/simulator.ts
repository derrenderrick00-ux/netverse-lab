import {cidrNetwork, isSameSubnet, parseIpv4} from './ip';
import type {NetDevice, NetPort, NetworkEvent, NetworkProject, PingResult} from './model';
import {findPort, portOwner} from './model';

type Hop = {from: string; to: string; linkId: string; delayMs: number};
type Path = {hops: Hop[]; switchIds: string[]};
type Direction = {ok: boolean; reason: string; hops: string[]};

/** Deterministic simulation clock: every event receives monotonically increasing time and sequence. */
export class Simulator {
  private clock = 0;
  private seq = 0;
  private cache = new Map<string, string>();
  private neighborTable: Record<string, string[]> = {};
  public events: NetworkEvent[] = [];
  constructor(private project: NetworkProject) {}
  private emit(type: NetworkEvent['type'], at: string, packetId: string, detail: string, reason?: string) {
    if (this.events.length >= 200) return;
    this.events.push({id: `event-${++this.seq}`, timeMs: Number(this.clock.toFixed(3)), type, at, packetId, detail, ...(reason ? {reason} : {})});
    this.clock += 0.1;
  }
  private portLive(id: string): boolean {
    const d = portOwner(this.project, id); const p = findPort(this.project, id);
    return Boolean(d?.powered && p?.enabled);
  }
  private activeLink(a: string, b: string): Hop | undefined {
    const l = this.project.links.find(link => link.enabled && ((link.a === a && link.b === b) || (link.a === b && link.b === a)));
    return l && this.portLive(a) && this.portLive(b) ? {from: a, to: b, linkId: l.id, delayMs: l.delayMs} : undefined;
  }
  /** Graph search only traverses a switch internally; hosts and routers never bridge ports. */
  private pathToPort(srcPort: string, dstPort: string): Path | null {
    if (!this.portLive(srcPort) || !this.portLive(dstPort)) return null;
    const queue: {port: string; hops: Hop[]; switches: string[]}[] = [{port: srcPort, hops: [], switches: []}];
    const visited = new Set<string>([srcPort]);
    while (queue.length) {
      const current = queue.shift()!;
      if (current.port === dstPort) return {hops: current.hops, switchIds: current.switches};
      const owner = portOwner(this.project, current.port);
      if (owner?.kind === 'switch' && owner.powered) {
        for (const p of owner.ports) {
          if (p.id !== current.port && this.portLive(p.id) && !visited.has(p.id)) {
            visited.add(p.id);
            queue.push({port: p.id, hops: current.hops, switches: [...current.switches, owner.id]});
          }
        }
      }
      for (const l of this.project.links) {
        const other = l.a === current.port ? l.b : l.b === current.port ? l.a : '';
        if (!other || visited.has(other)) continue;
        const hop = this.activeLink(current.port, other);
        if (hop) { visited.add(other); queue.push({port: other, hops: [...current.hops, hop], switches: current.switches}); }
      }
    }
    return null;
  }
  private selectExit(device: NetDevice, destination: string): {port: NetPort; nextHop: string} | null {
    const ports = device.ports.filter(p => p.enabled && p.ipv4 && parseIpv4(p.ipv4) !== null);
    const connected = ports.filter(p => isSameSubnet(p.ipv4, destination, p.prefix)).sort((a, b) => b.prefix - a.prefix);
    if (connected.length) return {port: connected[0], nextHop: destination};
    if (device.gateway && parseIpv4(device.gateway) !== null) {
      const candidates = ports.filter(p => isSameSubnet(p.ipv4, device.gateway, p.prefix)).sort((a, b) => b.prefix - a.prefix);
      if (candidates.length) return {port: candidates[0], nextHop: device.gateway};
    }
    return null;
  }
  private locateNeighbor(srcPort: NetPort, nextHop: string): {dev: NetDevice; port: NetPort; path: Path} | null {
    for (const device of this.project.devices) {
      if (device.kind === 'switch' || !device.powered) continue;
      for (const port of device.ports) {
        if (port.id === srcPort.id || !port.enabled || port.ipv4 !== nextHop) continue;
        const path = this.pathToPort(srcPort.id, port.id);
        if (path) return {dev: device, port, path};
      }
    }
    return null;
  }
  private transmitPath(path: Path, packetId: string, source: string, destination: string) {
    const seenSwitches = new Set<string>();
    for (const hop of path.hops) {
      const dst = portOwner(this.project, hop.to)!;
      this.emit('frame', portOwner(this.project, hop.from)!.id, packetId, `Ethernet frame ${source} → ${destination} on ${hop.linkId}`);
      this.clock += hop.delayMs;
      if (dst.kind === 'switch' && !seenSwitches.has(dst.id)) {
        this.emit('forward', dst.id, packetId, `Switch ${dst.name} learned source MAC and forwarded a frame (simplified switching).`);
        seenSwitches.add(dst.id);
      }
    }
  }
  private sendIp(from: NetDevice, targetIp: string, packetId: string, reply = false): Direction {
    let current = from;
    const hops: string[] = [current.name];
    let ttl = 32;
    for (let depth = 0; depth < 12; depth++) {
      const own = current.ports.find(p => p.enabled && p.ipv4 === targetIp);
      if (own) {
        this.emit('delivered', current.id, packetId, `IPv4 datagram delivered to ${current.name}.`);
        return {ok: true, reason: '', hops};
      }
      if (!current.powered) {
        this.emit('dropped', current.id, packetId, 'Device is powered off.', 'POWER_OFF');
        return {ok: false, reason: 'Device powered off', hops};
      }
      const route = this.selectExit(current, targetIp);
      if (!route) {
        this.emit('dropped', current.id, packetId, `No route to ${targetIp}.`, 'NO_ROUTE');
        return {ok: false, reason: 'No route to host', hops};
      }
      if (!this.portLive(route.port.id)) {
        this.emit('dropped', current.id, packetId, `${route.port.name} is disabled.`, 'INTERFACE_DOWN');
        return {ok: false, reason: 'Interface is down', hops};
      }
      if (!this.project.links.some(l => l.enabled && (l.a === route.port.id || l.b === route.port.id))) {
        this.emit('dropped', current.id, packetId, `${route.port.name} has no active cable.`, 'LINK_DOWN');
        return {ok: false, reason: 'Link is down', hops};
      }
      const neighbor = this.locateNeighbor(route.port, route.nextHop);
      if (!neighbor) {
        this.emit('arp-request', current.id, packetId, `Who has ${route.nextHop}? Broadcast ARP request on ${route.port.name}.`);
        this.clock += 2;
        this.emit('dropped', current.id, packetId, `No ARP reply for ${route.nextHop}.`, 'ARP_UNRESOLVED');
        return {ok: false, reason: 'ARP neighbor unresolved', hops};
      }
      const key = `${route.port.id}:${route.nextHop}`;
      if (!this.cache.has(key)) {
        this.emit('arp-request', current.id, packetId, `ARP request: who has ${route.nextHop}?`);
        this.transmitPath(neighbor.path, packetId, 'ff:ff:ff:ff:ff:ff', route.nextHop);
        this.emit('arp-reply', neighbor.dev.id, packetId, `${route.nextHop} is at ${neighbor.port.mac}.`);
        const reverse: Path = {hops: neighbor.path.hops.slice().reverse().map(h => ({...h, from: h.to, to: h.from})), switchIds: neighbor.path.switchIds};
        this.transmitPath(reverse, packetId, neighbor.port.mac, route.port.mac);
        this.cache.set(key, neighbor.port.mac);
        const items = this.neighborTable[current.id] || [];
        const line = `${route.nextHop} dev ${route.port.name} lladdr ${neighbor.port.mac} REACHABLE`;
        if (!items.includes(line)) this.neighborTable[current.id] = [...items, line];
      }
      this.emit(reply ? 'icmp-reply' : 'icmp-request', current.id, packetId,
        `${reply ? 'ICMP Echo Reply' : 'ICMP Echo Request'} routed through ${route.port.name} to ${route.nextHop}, TTL ${ttl}.`);
      this.transmitPath(neighbor.path, packetId, route.port.mac, neighbor.port.mac);
      current = neighbor.dev;
      hops.push(current.name);
      if (current.kind === 'router' && !current.ports.some(p => p.ipv4 === targetIp)) {
        ttl--;
        if (ttl <= 0) {
          this.emit('dropped', current.id, packetId, 'TTL exceeded.', 'TTL_EXCEEDED');
          return {ok: false, reason: 'TTL exceeded', hops};
        }
        this.emit('forward', current.id, packetId, `Router ${current.name} accepted the packet for forwarding; TTL now ${ttl}.`);
      } else if (!current.ports.some(p => p.ipv4 === targetIp)) {
        this.emit('dropped', current.id, packetId, 'Host received a packet addressed elsewhere.', 'WRONG_DESTINATION');
        return {ok: false, reason: 'Wrong destination', hops};
      }
    }
    this.emit('dropped', current.id, packetId, 'Hop budget exhausted.', 'HOP_LIMIT');
    return {ok: false, reason: 'Hop limit exceeded', hops};
  }
  public ping(sourceId: string, targetIp: string, count = 3): PingResult {
    const src = this.project.devices.find(d => d.id === sourceId);
    if (!src || src.kind === 'switch' || parseIpv4(targetIp) === null || !Number.isInteger(count) || count < 1 || count > 5) {
      return {sourceId, destination: targetIp, transmitted: 0, received: 0, output: 'Invalid source, destination or count (1–5).', events: [], hops: [], neighbors: {}, success: false, reason: 'INVALID_INPUT'};
    }
    let received = 0; let reason = ''; let hopNames: string[] = [];
    const lines = [`PING ${targetIp} (${targetIp}) 56(84) bytes of data.`];
    for (let i = 1; i <= count; i++) {
      const packetId = `icmp-${i}`;
      const start = this.clock;
      this.emit('notice', src.id, packetId, `Created ICMP Echo Request #${i} to ${targetIp}.`);
      const request = this.sendIp(src, targetIp, packetId);
      if (request.ok) {
        const dst = this.project.devices.find(d => d.ports.some(p => p.ipv4 === targetIp));
        const srcIp = this.selectExit(src, targetIp)?.port.ipv4;
        const response = dst && srcIp ? this.sendIp(dst, srcIp, packetId, true) : {ok: false, reason: 'No source IPv4', hops: []};
        if (response.ok) {
          received++; hopNames = request.hops;
          const rtt = (this.clock - start).toFixed(2);
          lines.push(`64 bytes from ${targetIp}: icmp_seq=${i} ttl=64 time=${rtt} ms`);
        } else {
          reason = response.reason;
          this.emit('dropped', dst?.id ?? '', packetId, `No Echo Reply reached the sender: ${reason}.`, 'REPLY_FAILED');
        }
      } else {reason = request.reason; hopNames = request.hops;}
      this.clock += 20;
    }
    lines.push('', `--- ${targetIp} ping statistics ---`, `${count} packets transmitted, ${received} received, ${Math.round((1 - received / count) * 100)}% packet loss`);
    return {sourceId, destination: targetIp, transmitted: count, received, output: lines.join('\n'), events: this.events.slice(), hops: hopNames, neighbors: {...this.neighborTable}, success: received === count, reason};
  }
}
export function pingNetwork(project: NetworkProject, sourceId: string, targetIp: string, count = 3): PingResult {
  return new Simulator(project).ping(sourceId, targetIp, count);
}
export function neighborEntries(result: PingResult | null, deviceId: string): string[] {
  if (!result) return [];
  return result.neighbors[deviceId] || [];
}
export function routeLines(device: NetDevice): string[] {
  const lines = device.ports.filter(p => p.ipv4 && p.enabled).map(p => `${cidrNetwork(p.ipv4, p.prefix)}/${p.prefix} dev ${p.name} proto kernel`);
  if (device.gateway) {
    const out = device.ports.find(p => p.ipv4 && isSameSubnet(p.ipv4, device.gateway, p.prefix));
    if (out) lines.unshift(`default via ${device.gateway} dev ${out.name}`);
  }
  return lines;
}
