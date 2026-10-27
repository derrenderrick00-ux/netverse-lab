/** Phase 11: Rule-list firewall exercise. No packets sent; no real firewall modified. */
import {parseIpv4,isSameSubnet} from '../engine/ip';
export type Verdict = 'allow'|'deny';
export interface FirewallRule {id:string;enabled:boolean;action:Verdict;protocol:'tcp'|'udp'|'any';sourceCidr:string;destinationPort:number|null}
export interface TestFlow {sourceIp:string;protocol:'tcp'|'udp';destinationPort:number}
export interface FirewallVerdict {action:Verdict;matchedRule:string|null;explanation:string}
export function validCidr(input:string): boolean {
  const [addr,prefix,...extra]=input.split('/');
  return !extra.length && (input==='any' || (prefix!==undefined && /^\d{1,2}$/.test(prefix) && Number(prefix)<=32 && parseIpv4(addr)!==null));
}
export function inspectFirewall(flow:TestFlow,rules:FirewallRule[],defaultAction:Verdict='deny'):FirewallVerdict {
  if (parseIpv4(flow.sourceIp)===null || !Number.isInteger(flow.destinationPort) || flow.destinationPort<1 || flow.destinationPort>65535 || !['tcp','udp'].includes(flow.protocol))
    return {action:'deny',matchedRule:null,explanation:'Invalid flow; fail closed.'};
  for (const rule of rules.slice(0,100)) {
    if (!rule.enabled || !validCidr(rule.sourceCidr) || (rule.destinationPort!==null && (!Number.isInteger(rule.destinationPort)||rule.destinationPort<1||rule.destinationPort>65535)))continue;
    if(rule.protocol!=='any' && flow.protocol!==rule.protocol)continue;
    if(rule.destinationPort!==null && flow.destinationPort!==rule.destinationPort)continue;
    const matchingSource=rule.sourceCidr==='any'||(()=>{const [addr,prefix]=rule.sourceCidr.split('/');return isSameSubnet(addr,flow.sourceIp,Number(prefix));})();
    if (!matchingSource)continue;
    return {action:rule.action,matchedRule:rule.id,explanation:`First matching enabled rule: ${rule.id} (${rule.action}).`};
  }
  return {action:defaultAction,matchedRule:null,explanation:`No rule matched. Default ${defaultAction}.`};
}
export const defaultFirewallRules:FirewallRule[]=[
  {id:'allow-office-web',enabled:true,action:'allow',protocol:'tcp',sourceCidr:'192.168.10.0/24',destinationPort:443},
  {id:'deny-guest-admin',enabled:true,action:'deny',protocol:'tcp',sourceCidr:'192.168.20.0/24',destinationPort:22},
];
