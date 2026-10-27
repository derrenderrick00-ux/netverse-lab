/** Phase 12: focused conceptual experiments; not integrated with the IPv4 packet engine. */
export interface VlanInterface {device:string;vlan:number;up:boolean}
export function sameBroadcastDomain(a:VlanInterface,b:VlanInterface):boolean {
  return a.up && b.up && Number.isInteger(a.vlan) && a.vlan>=1 && a.vlan<=4094 && a.vlan===b.vlan;
}
export function tcpHandshake(allowSyn:boolean, allowSynAck:boolean, allowAck:boolean) {
  const events=['Client: SYN'];
  if(!allowSyn)return {established:false,events:[...events,'SYN dropped: timeout']};
  events.push('Server: SYN-ACK');
  if(!allowSynAck)return {established:false,events:[...events,'SYN-ACK dropped: timeout']};
  events.push('Client: ACK');
  if(!allowAck)return {established:false,events:[...events,'ACK dropped: server not established']};
  return {established:true,events:[...events,'Handshake complete (simplified)']};
}
/** IPv6 syntax validation deliberately deferred to full-stack integration. */
export const advancedLimitations=[
  'VLAN demonstration checks membership and link state only; no 802.1Q frames or trunks.',
  'TCP demonstration shows three-way handshake steps only; no retransmissions, windows or real sockets.',
  'IPv6 requires a dedicated NDP/routing implementation; it is not simulated by the Phase 1–8 IPv4 engine.',
];
