/** PATCH: offline context-based coaching, no LLM or Internet connection. */
import type {NetworkProject,PingResult} from '../engine/model';
import type {IncidentId} from '../labs/scenarios';
import {findPort} from '../engine/model';
export type LabMode = 'guided'|'independent';
export type PatchContext = {mode:LabMode;section:string;project:NetworkProject;incident:IncidentId|null;lastPing:PingResult|null;hintLevel:number};
export function getPatchHelp(ctx:PatchContext):{title:string;explanation:string;action:string;concept:string}{
  const {mode,section,project,incident,lastPing,hintLevel}=ctx;
  if(section==='Build') {
    if(!project.devices.length)return {title:'Start with equipment',explanation:'A network requires nodes and at least one usable communication path.',action:'Add two host computers from the equipment list.',concept:'Node = device participating in a network.'};
    if(!project.links.length)return {title:'Patch the physical link',explanation:'The two hosts already have IPv4 addresses, but no cable. An IP address does not create a physical connection.',action:'Select PC-A eth0 and PC-B eth0 in Patch panel, then Connect.',concept:'Layer 1: link must exist before IP frames can cross.'};
    if(project.links.some(l=>!l.enabled))return {title:'Inspect interface/link status',explanation:'The topology includes a disabled Ethernet link. A cable may be present but operationally down.',action:'Inspect Patch panel and enable the link if appropriate.',concept:'Administrative state is different from physical presence.'};
    if(lastPing && !lastPing.success)return {title:'Follow the failed probe',explanation:`The latest virtual ping failed: ${lastPing.reason || 'no successful Echo Reply'}. A failed reply can involve addressing, routes or link state.`,action:'Inspect ip addr, ip route, and the connection before changing configuration.',concept:'Troubleshooting: observe → hypothesize → test → repair → verify.'};
    return {title:'Test your network',explanation:'A connected cable does not guarantee IPv4 reachability. Run a state-driven test.',action:'Select PC-A, type `ip addr`, then `ping -c 2 192.168.1.20`.',concept:'ARP resolves a local next hop; ICMP can test reachability.'};
  }
  if(section==='Troubleshoot') {
    const specific=incident==='cable'?'Layer 1: cable/link status':incident==='subnet'?'Layer 3: IP prefix and address':incident==='gateway'?'Layer 3: default route':'No ticket selected';
    const action=hintLevel>=2 && incident ? ({cable:'Inspect the disabled link in Build and enable it.',subnet:'Compare PC-B IPv4 settings with the target 192.168.1.20/24.',gateway:'Check PC-A default gateway; its router is 192.168.10.1.'} as Record<IncidentId,string>)[incident] : 'Run `ip addr`, `ip route`, and a ping from the ticket source. Record the evidence first.';
    return {title:hintLevel>=2?'Detailed hint':'Investigate before editing',explanation:mode==='independent'&&hintLevel===0?'Independent mode: I will explain how to navigate, but I will not reveal the fault unless you request more help.':`This is a ${specific} case. Collect observations before testing a hypothesis.`,action,concept:'A valid diagnosis is supported by a failed baseline test and a successful verification test.'};
  }
  if(section==='Performance')return {title:'Find the bottleneck',explanation:'Total demand can exceed the capacity of a shared upstream link. Not all connected devices consume equal bandwidth.',action:'Set capacity to 20 Mbps, add two downloads of 15 Mbps each, then compare throughput.',concept:'Throughput and bandwidth are not the same as latency.'};
  if(section==='Security')return {title:'Test your firewall policy',explanation:'Rules are evaluated in order; the first matching enabled rule decides. Unmatched traffic uses the default action.',action:'Try an office HTTPS flow, then a guest SSH flow.',concept:'Least privilege: only permit required traffic.'};
  if(section==='Infrastructure')return {title:'Follow the cable',explanation:'The Internet involves access networks, aggregation and inter-network connectivity; paths vary between fibre and cellular systems.',action:'Select ONT, fibre, OLT and IXP in order.',concept:'An Ethernet WAN link can work while upstream Internet service fails.'};
  if(section==='Advanced')return {title:'Compare protocol layers',explanation:'VLAN, TCP and IPv6 solve different problems; the current experiments model selected concepts only.',action:'Test two access ports in separate VLANs, then step through TCP SYN/SYN-ACK/ACK.',concept:'Distinct layers use distinct addressing and state.'};
  const port=project.devices[0]?.ports[0];
  return {title:'Navigate NETVERSE',explanation:'Select Learn for theory, Build for configuration, Troubleshoot for tickets, and Packet inspector for events.',action:port && findPort(project,port.id)?'Open Build, select a device, and inspect its configuration.':'Open Learn to begin with Module 1.',concept:'Learn → Build → Test → Investigate → Fix → Explain.'};
}
