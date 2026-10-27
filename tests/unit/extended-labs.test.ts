import {describe,it,expect} from 'vitest';
import {simulatePerformance} from '../../src/features/performance';
import {inspectFirewall,defaultFirewallRules,validCidr} from '../../src/features/security';
import {sameBroadcastDomain,tcpHandshake} from '../../src/features/advanced';
import {parseIpv6,ipv6SameSubnet} from '../../src/features/ipv6';
import {getPatchHelp} from '../../src/features/patch';
import {infrastructure,fibreJourney} from '../../src/features/infrastructure';
import {createTwoPcLab,connect} from '../../src/engine/model';
import {pingNetwork} from '../../src/engine/simulator';
import {toggleLink} from '../../src/engine/actions';
import {loadIncident} from '../../src/labs/scenarios';

describe('Phase 9 max-min allocation',()=>{
 it('shares a saturated 20 Mbps link equally among two equal heavy clients',()=>{const r=simulatePerformance({capacityMbps:20,baseRttMs:30,bufferKbits:100,clients:[{id:'a',demandMbps:20},{id:'b',demandMbps:20}]});expect(r.clients[0].deliveredMbps).toBe(10);expect(r.clients[1].deliveredMbps).toBe(10);});
 it('redistributes spare bandwidth after a light user is satisfied',()=>{const r=simulatePerformance({capacityMbps:20,baseRttMs:20,bufferKbits:50,clients:[{id:'light',demandMbps:2},{id:'heavy',demandMbps:20}]});expect(r.clients.map(x=>x.deliveredMbps)).toEqual([2,18]);});
 it('does not exceed available capacity',()=>{const r=simulatePerformance({capacityMbps:1,baseRttMs:10,bufferKbits:5,clients:Array.from({length:50},(_,i)=>({id:String(i),demandMbps:999}))});expect(r.throughputMbps<=1.000001).toBe(true);});
 it('handles no upstream capacity without division errors',()=>{const r=simulatePerformance({capacityMbps:0,baseRttMs:10,bufferKbits:0,clients:[{id:'x',demandMbps:10}]});expect(r.throughputMbps).toBe(0);expect(Number.isFinite(r.estimatedRttMs)).toBe(true);});
 it('handles zero demand',()=>{const r=simulatePerformance({capacityMbps:20,baseRttMs:25,bufferKbits:100,clients:[{id:'x',demandMbps:0}]});expect(r.throughputMbps).toBe(0);expect(r.bottleneck).toBe(false);});
 it('caps extreme and NaN inputs',()=>{const r=simulatePerformance({capacityMbps:NaN,baseRttMs:Infinity,bufferKbits:-5,clients:[{id:'bad',demandMbps:Infinity}]});expect(Number.isFinite(r.estimatedRttMs)).toBe(true);expect(r.throughputMbps).toBe(0);});
 it('increased demand cannot increase fair-share total beyond capacity',()=>{const r=simulatePerformance({capacityMbps:20,baseRttMs:30,bufferKbits:100,clients:[{id:'x',demandMbps:20},{id:'y',demandMbps:20},{id:'z',demandMbps:20}]});expect(r.throughputMbps).toBe(20);});
});
describe('Phase 10 equipment catalogue',()=>{
 it('covers every fibre journey component',()=>{expect(fibreJourney.every(id=>infrastructure.some(a=>a.id===id))).toBe(true);});
 it('documents the mast and submarine cable failure',()=>{expect(infrastructure.some(a=>a.id==='mast'&&a.failure.length>10)).toBe(true);expect(infrastructure.some(a=>a.id==='subsea'&&a.medium.includes('fibre'))).toBe(true);});
});
describe('Phase 11 firewall policy',()=>{
 it('allows office HTTPS',()=>{expect(inspectFirewall({sourceIp:'192.168.10.12',protocol:'tcp',destinationPort:443},defaultFirewallRules).action).toBe('allow');});
 it('denies guest SSH',()=>{expect(inspectFirewall({sourceIp:'192.168.20.12',protocol:'tcp',destinationPort:22},defaultFirewallRules).action).toBe('deny');});
 it('defaults to deny',()=>{expect(inspectFirewall({sourceIp:'10.0.0.2',protocol:'udp',destinationPort:53},defaultFirewallRules).action).toBe('deny');});
 it('honors first-match priority',()=>{const r=[{...defaultFirewallRules[0],id:'first',sourceCidr:'any',destinationPort:null,action:'deny' as const},...defaultFirewallRules];expect(inspectFirewall({sourceIp:'192.168.10.12',protocol:'tcp',destinationPort:443},r).matchedRule).toBe('first');});
 it('skips disabled rules',()=>{const r=defaultFirewallRules.map(x=>({...x,enabled:false}));expect(inspectFirewall({sourceIp:'192.168.10.12',protocol:'tcp',destinationPort:443},r).action).toBe('deny');});
 it('validates CIDR and rejects malformed IP flows',()=>{expect(validCidr('192.168.1.0/24')).toBe(true);expect(validCidr('192.168.1.0/33')).toBe(false);expect(inspectFirewall({sourceIp:'999.999.1.1',protocol:'tcp',destinationPort:80},[]).action).toBe('deny');});
 it('does not mistake UDP for TCP',()=>{expect(inspectFirewall({sourceIp:'192.168.10.12',protocol:'udp',destinationPort:443},defaultFirewallRules).action).toBe('deny');});
});
describe('Phase 12 advanced experiments',()=>{
 it('matches equal enabled VLANs',()=>{expect(sameBroadcastDomain({device:'a',vlan:10,up:true},{device:'b',vlan:10,up:true})).toBe(true);});
 it('separates different VLANs',()=>{expect(sameBroadcastDomain({device:'a',vlan:10,up:true},{device:'b',vlan:20,up:true})).toBe(false);});
 it('requires interfaces up',()=>{expect(sameBroadcastDomain({device:'a',vlan:10,up:false},{device:'b',vlan:10,up:true})).toBe(false);});
 it('validates VLAN range',()=>{expect(sameBroadcastDomain({device:'a',vlan:4095,up:true},{device:'b',vlan:4095,up:true})).toBe(false);});
 it('parses compressed IPv6 and rejects malformed notation',()=>{expect(parseIpv6('::1')).toBe(1n);expect(parseIpv6('2001:db8::1')!==null).toBe(true);expect(parseIpv6('2001:::1')).toBeNull();expect(parseIpv6('1:2:3:4:5:6:7:8:9')).toBeNull();});
 it('compares IPv6 /64 and /128 correctly',()=>{expect(ipv6SameSubnet('2001:db8:1::10','2001:db8:1::20',64)).toBe(true);expect(ipv6SameSubnet('2001:db8:1::10','2001:db8:2::20',64)).toBe(false);expect(ipv6SameSubnet('::1','::2',128)).toBe(false);});
 it('handshake succeeds only if all required steps arrive',()=>{expect(tcpHandshake(true,true,true).established).toBe(true);expect(tcpHandshake(true,false,true).established).toBe(false);expect(tcpHandshake(true,true,false).established).toBe(false);});
});
describe('Patch and baseline integration',()=>{
 it('Patch gives cable guidance without changing network state',()=>{const p=createTwoPcLab();const before=JSON.stringify(p);const h=getPatchHelp({mode:'guided',section:'Build',project:p,incident:null,lastPing:null,hintLevel:0});expect(h.action.includes('Connect')).toBe(true);expect(JSON.stringify(p)).toBe(before);});
 it('independent mode does not reveal the case cause at hint level zero',()=>{const h=getPatchHelp({mode:'independent',section:'Troubleshoot',project:loadIncident('cable'),incident:'cable',lastPing:null,hintLevel:0});expect(h.explanation.includes('will not reveal')).toBe(true);});
 it('Patch offers context after a failed ping',()=>{const p=connect(createTwoPcLab(),'pc-a:p0','pc-b:p0').state;const broken=toggleLink(p,p.links[0].id).state;const ping=pingNetwork(broken,'pc-a','192.168.1.20',1);const h=getPatchHelp({mode:'guided',section:'Build',project:broken,incident:null,lastPing:ping,hintLevel:0});expect(h.title).toContain('status');});
 it('original ping still succeeds after patch integration',()=>{const p=connect(createTwoPcLab(),'pc-a:p0','pc-b:p0').state;expect(pingNetwork(p,'pc-a','192.168.1.20',1).received).toBe(1);});
});
