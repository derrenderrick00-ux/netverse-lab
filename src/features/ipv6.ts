/** IPv6 address/prefix demonstration. IPv4-embedded forms and scope IDs are intentionally unsupported. */
export function parseIpv6(input:string):bigint|null {
  if(typeof input!=='string'||!input||input.includes('%')||input.includes('.')||input.includes(':::'))return null;
  const parts=input.split('::');if(parts.length>2)return null;
  const groups=(text:string)=>text?text.split(':'):[];
  const left=groups(parts[0]);const right=groups(parts.length===2?parts[1]:'');
  if([...left,...right].some(x=>!x||!/^[a-f\d]{1,4}$/i.test(x)))return null;
  if(parts.length===1 && left.length!==8)return null;
  if(parts.length===2 && left.length+right.length>=8)return null;
  const full=parts.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left;
  if(full.length!==8)return null;
  let address=0n;
  for(const group of full)address=(address<<16n)|BigInt(parseInt(group,16));
  return address;
}
export function ipv6SameSubnet(a:string,b:string,prefix:number):boolean {
  const aa=parseIpv6(a),bb=parseIpv6(b);
  if(aa===null||bb===null||!Number.isInteger(prefix)||prefix<0||prefix>128)return false;
  if(prefix===0)return true;
  const shift=BigInt(128-prefix);
  return (aa>>shift)===(bb>>shift);
}
