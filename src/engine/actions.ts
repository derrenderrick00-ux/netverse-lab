import type {ActionResult, NetworkProject} from './model';
import {findPort, portOwner} from './model';
import {parseIpv4, validateAddress} from './ip';

export function setAddress(p: NetworkProject, portId: string, address: string, prefix: number): ActionResult<NetworkProject> {
  if (!findPort(p, portId)) return {ok: false, state: p, error: 'Interface not found.'};
  const msg = address === '' ? (Number.isInteger(prefix) && prefix >= 0 && prefix <= 32 ? null : 'Invalid prefix.') : validateAddress(address, prefix);
  if (msg) return {ok: false, state: p, error: msg};
  return {ok: true, state: {...p, devices: p.devices.map(d => ({...d, ports: d.ports.map(port => port.id === portId ? {...port, ipv4: address, prefix} : port)}))}};
}
export function setGateway(p: NetworkProject, deviceId: string, gateway: string): ActionResult<NetworkProject> {
  const device = p.devices.find(d => d.id === deviceId);
  if (!device) return {ok: false, state: p, error: 'Device not found.'};
  if (gateway && parseIpv4(gateway) === null) return {ok: false, state: p, error: 'Gateway must be a valid IPv4 address.'};
  return {ok: true, state: {...p, devices: p.devices.map(d => d.id === deviceId ? {...d, gateway} : d)}};
}
export function toggleInterface(p: NetworkProject, portId: string): ActionResult<NetworkProject> {
  const dev = portOwner(p, portId);
  if (!dev) return {ok: false, state: p, error: 'Interface not found.'};
  return {ok: true, state: {...p, devices: p.devices.map(d => d.id === dev.id ? {...d, ports: d.ports.map(port => port.id === portId ? {...port, enabled: !port.enabled} : port)} : d)}};
}
export function toggleLink(p: NetworkProject, id: string): ActionResult<NetworkProject> {
  if (!p.links.some(l => l.id === id)) return {ok: false, state: p, error: 'Cable not found.'};
  return {ok: true, state: {...p, links: p.links.map(l => l.id === id ? {...l, enabled: !l.enabled} : l)}};
}
export function removeLink(p: NetworkProject, id: string): ActionResult<NetworkProject> {
  if (!p.links.some(l => l.id === id)) return {ok: false, state: p, error: 'Cable not found.'};
  return {ok: true, state: {...p, links: p.links.filter(l => l.id !== id)}};
}
export function removeDevice(p: NetworkProject, id: string): ActionResult<NetworkProject> {
  const dev = p.devices.find(d => d.id === id);
  if (!dev) return {ok: false, state: p, error: 'Device not found.'};
  const portIds = new Set(dev.ports.map(port => port.id));
  return {ok: true, state: {...p, devices: p.devices.filter(d => d.id !== id), links: p.links.filter(l => !portIds.has(l.a) && !portIds.has(l.b))}};
}
