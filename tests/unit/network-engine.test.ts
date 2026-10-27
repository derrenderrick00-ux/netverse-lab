import {describe, it, expect} from 'vitest';
import {createTwoPcLab, connect, makeDevice, validateProject, emptyProject, addDevice} from '../../src/engine/model';
import type {NetworkProject} from '../../src/engine/model';
import {parseIpv4, isSameSubnet, cidrNetwork} from '../../src/engine/ip';
import {setAddress, setGateway, toggleInterface, toggleLink, removeLink} from '../../src/engine/actions';
import {pingNetwork} from '../../src/engine/simulator';
import {executeCommand} from '../../src/engine/terminal';
import {loadIncident, gradeIncident} from '../../src/labs/scenarios';

function connected() {
  const p=createTwoPcLab();return connect(p,p.devices[0].ports[0].id,p.devices[1].ports[0].id).state;
}
function routed() {
  const p=loadIncident('gateway');
  return setGateway(p,'pc-a','192.168.10.1').state;
}

describe('IPv4 and subnet correctness',()=>{
  it('accepts canonical IPv4 boundaries',()=>{expect(parseIpv4('0.0.0.0')).toBe(0);expect(parseIpv4('255.255.255.255')).toBe(4294967295);});
  it('rejects malformed IPv4',()=>{expect(parseIpv4('192.168.1.256')).toBeNull();expect(parseIpv4('192.168.1')).toBeNull();expect(parseIpv4('hello')).toBeNull();});
  it('compares prefix using bit masks',()=>{expect(isSameSubnet('192.168.1.10','192.168.1.20',24)).toBe(true);expect(isSameSubnet('192.168.1.10','192.168.2.20',24)).toBe(false);});
  it('handles /25 split',()=>{expect(isSameSubnet('10.0.0.127','10.0.0.128',25)).toBe(false);});
  it('formats network address',()=>{expect(cidrNetwork('192.168.21.64',24)).toBe('192.168.21.0');});
});
describe('Topology integrity and atomic actions',()=>{
  it('rejects connecting a port to itself',()=>{const p=createTwoPcLab();expect(connect(p,'pc-a:p0','pc-a:p0').ok).toBe(false);});
  it('rejects reusing Ethernet interface',()=>{const p=connected();expect(connect(p,'pc-a:p0','pc-b:p0').ok).toBe(false);expect(p.links.length).toBe(1);});
  it('rejects bad address without mutating previous state',()=>{const p=connected();const res=setAddress(p,'pc-a:p0','999.168.1.10',24);expect(res.ok).toBe(false);expect(p.devices[0].ports[0].ipv4).toBe('192.168.1.10');});
  it('rejects invalid gateway',()=>{expect(setGateway(connected(),'pc-a','255.55.555.1').ok).toBe(false);});
  it('can disable a link and reenable it',()=>{const p=connected();const q=toggleLink(p,p.links[0].id).state;expect(q.links[0].enabled).toBe(false);expect(toggleLink(q,p.links[0].id).state.links[0].enabled).toBe(true);});
  it('rejects invalid project import with duplicate IDs',()=>{const p=connected();const copy=structuredClone(p);copy.devices[1].id=copy.devices[0].id;expect(validateProject(copy)).toBe(false);});
  it('can remove cables',()=>{const p=connected();expect(removeLink(p,p.links[0].id).state.links.length).toBe(0);});
  it('limits the project to 12 nodes',()=>{let p=emptyProject();for(let i=0;i<12;i++)p=addDevice(p,'host').state;expect(addDevice(p,'host').ok).toBe(false);});
});
describe('Real state-based ping behavior',()=>{
  it('succeeds over a live two-PC cable',()=>{const r=pingNetwork(connected(),'pc-a','192.168.1.20',2);expect(r.received).toBe(2);expect(r.success).toBe(true);expect(r.events.some(e=>e.type==='arp-request')).toBe(true);expect(r.events.some(e=>e.type==='icmp-reply')).toBe(true);});
  it('returns deterministic event sequences',()=>{const p=connected();const a=pingNetwork(p,'pc-a','192.168.1.20',2);const b=pingNetwork(p,'pc-a','192.168.1.20',2);expect(a.events).toEqual(b.events);});
  it('records observed ARP neighbors per device',()=>{const r=pingNetwork(connected(),'pc-a','192.168.1.20',1);expect(r.neighbors['pc-a'].some(s=>s.includes('192.168.1.20'))).toBe(true);});
  it('cannot fabricate replies without a physical link',()=>{const r=pingNetwork(createTwoPcLab(),'pc-a','192.168.1.20',2);expect(r.received).toBe(0);expect(r.events.some(e=>e.reason==='LINK_DOWN')).toBe(true);});
  it('drops traffic when interface disabled',()=>{const p=toggleInterface(connected(),'pc-a:p0').state;expect(pingNetwork(p,'pc-a','192.168.1.20',1).received).toBe(0);});
  it('drops on unrelated directly addressed subnet',()=>{const p=setAddress(connected(),'pc-b:p0','192.168.2.20',24).state;expect(pingNetwork(p,'pc-a','192.168.2.20',1).received).toBe(0);});
  it('does not fabricate replies from absent hosts',()=>{expect(pingNetwork(connected(),'pc-a','192.168.1.99',1).received).toBe(0);});
  it('does not report success if remote host has no return route',()=>{const p=routed();p.devices.find(d=>d.id==='server-1')!.gateway='';const r=pingNetwork(p,'pc-a','192.168.20.20',1);expect(r.received).toBe(0);expect(r.reason).toBe('No route to host');});
  it('routes through the two-interface router when both gateways configured',()=>{const r=pingNetwork(routed(),'pc-a','192.168.20.20',1);expect(r.received).toBe(1);expect(r.hops).toEqual(['PC-A','R1','Server-B']);});
  it('works with a switch in the physical path',()=>{
    const pc1=makeDevice('a','host',0,0,'PC-A');const pc2=makeDevice('b','host',350,0,'PC-B');const sw=makeDevice('sw','switch',150,0,'SW');
    pc1.ports[0].ipv4='10.1.1.1';pc2.ports[0].ipv4='10.1.1.2';
    let p:NetworkProject={schemaVersion:1,name:'switch',devices:[pc1,sw,pc2],links:[]};
    p=connect(p,'a:p0','sw:p0').state;p=connect(p,'sw:p1','b:p0').state;
    const r=pingNetwork(p,'a','10.1.1.2',1);expect(r.received).toBe(1);expect(r.events.some(e=>e.type==='forward'&&e.at==='sw')).toBe(true);
  });
  it('loses connectivity if a switch port is disabled',()=>{
    const p=connected();const q=toggleLink(p,p.links[0].id).state;expect(pingNetwork(q,'pc-a','192.168.1.20',1).received).toBe(0);
  });
});
describe('Virtual terminal and incident system',()=>{
  it('reads true interface config',()=>{expect(executeCommand(connected(),'pc-a','ip addr',null).text).toContain('192.168.1.10/24');});
  it('reads actual route model',()=>{expect(executeCommand(routed(),'pc-a','ip route',null).text).toContain('default via 192.168.10.1');});
  it('ip neigh reads the device-scoped ARP table from the latest ping',()=>{const p=connected();const r=pingNetwork(p,'pc-a','192.168.1.20',1);expect(executeCommand(p,'pc-a','ip neigh',r).text).toContain('192.168.1.20');});
  it('invokes engine for ping',()=>{expect(executeCommand(connected(),'pc-a','ping -c 1 192.168.1.20',null).ping?.received).toBe(1);});
  it('rejects unsupported shell commands',()=>{expect(executeCommand(connected(),'pc-a','sudo apt install nmap',null).text).toContain('not supported');});
  it('rejects unreasonable ping counts',()=>{expect(executeCommand(connected(),'pc-a','ping -c 999 192.168.1.20',null).text).toContain('Invalid');});
  it('incident cable is physically disabled',()=>{expect(loadIncident('cable').links[0].enabled).toBe(false);});
  it('incident wrong subnet can be fixed',()=>{const p=loadIncident('subnet');expect(pingNetwork(p,'pc-a','192.168.1.20',1).received).toBe(0);const q=setAddress(p,'pc-b:p0','192.168.1.20',24).state;expect(pingNetwork(q,'pc-a','192.168.1.20',1).received).toBe(1);});
  it('incident missing gateway can be fixed',()=>{const p=loadIncident('gateway');expect(pingNetwork(p,'pc-a','192.168.20.20',1).received).toBe(0);expect(pingNetwork(setGateway(p,'pc-a','192.168.10.1').state,'pc-a','192.168.20.20',1).received).toBe(1);});
  it('grading requires evidence, failure, and real verified repair',()=>{expect(gradeIncident(true,true,'Found unreachable gateway','Fixed gateway and verified ping').passed).toBe(true);expect(gradeIncident(false,true,'Found unreachable gateway','Fixed gateway and verified ping').passed).toBe(false);});
});
