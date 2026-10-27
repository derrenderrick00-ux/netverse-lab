import type {NetworkProject, PingResult} from './model';
import {parseIpv4} from './ip';
import {pingNetwork, routeLines} from './simulator';

export type CommandResult = {text: string; ping?: PingResult; clear?: boolean};
export function executeCommand(project: NetworkProject, sourceId: string, input: string, lastPing: PingResult | null): CommandResult {
  const source = project.devices.find(d => d.id === sourceId);
  if (!source || source.kind === 'switch') return {text: 'Select a PC, server, or router before using the terminal.'};
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return {text: ''};
  const cmd = tokens[0];
  if (cmd === 'clear' && tokens.length === 1) return {text: '', clear: true};
  if (cmd === 'help' && tokens.length === 1) return {text: 'NETVERSE simulated terminal (not a Linux shell)\nhelp | clear | ip addr | ip link | ip route | ip neigh | arp -a | ping -c N IPv4 | traceroute IPv4'};
  if (cmd === 'ip') {
    const sub = tokens[1];
    if (tokens.length !== 2 || !['addr', 'a', 'link', 'route', 'r', 'neigh'].includes(sub)) return {text: 'Supported: ip addr | ip link | ip route | ip neigh'};
    if (sub === 'addr' || sub === 'a') return {text: source.ports.map(p => `${p.name}: <${p.enabled && source.powered ? 'UP' : 'DOWN'}> link/ether ${p.mac}\n    inet ${p.ipv4 ? `${p.ipv4}/${p.prefix}` : '(not configured)'}`).join('\n')};
    if (sub === 'link') return {text: source.ports.map(p => `${p.name}: ${p.enabled && source.powered ? 'UP' : 'DOWN'}  link/ether ${p.mac}`).join('\n')};
    if (sub === 'route' || sub === 'r') return {text: routeLines(source).join('\n') || '(no IPv4 routes)'};
    return {text: lastPing?.neighbors[source.id]?.join('\n') || '(empty neighbor table)'};
  }
  if (cmd === 'arp' && tokens.length === 2 && tokens[1] === '-a') return {text: lastPing?.neighbors[source.id]?.join('\n') || '(empty neighbor table)'};
  if (cmd === 'ping') {
    let target = ''; let count = 3;
    if (tokens.length === 2) target = tokens[1];
    else if (tokens.length === 4 && tokens[1] === '-c') {count = Number(tokens[2]); target = tokens[3];}
    else return {text: 'Usage: ping [-c 1..5] IPv4'};
    if (parseIpv4(target) === null || !Number.isInteger(count) || count < 1 || count > 5) return {text: 'Invalid IPv4 address or count (1–5).'};
    const ping = pingNetwork(project, sourceId, target, count);
    return {text: ping.output, ping};
  }
  if (cmd === 'traceroute' && tokens.length === 2 && parseIpv4(tokens[1]) !== null) {
    const ping = pingNetwork(project, sourceId, tokens[1], 1);
    const lines = [`traceroute to ${tokens[1]} (simplified simulated hop view)`];
    ping.hops.forEach((hop, i) => lines.push(`${i + 1}  ${hop}`));
    if (!ping.success) lines.push(`*  No complete path (${ping.reason})`);
    return {text: lines.join('\n'), ping};
  }
  return {text: `Command not supported in this simulation: ${cmd}. Type help. No real OS commands are executed.`};
}
