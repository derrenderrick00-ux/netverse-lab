export function parseIpv4(ip: string): number | null {
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) return null;
  const n = ip.split('.').map(Number);
  if (n.some(x => x < 0 || x > 255 || !Number.isInteger(x))) return null;
  return (((n[0] << 24) | (n[1] << 16) | (n[2] << 8) | n[3]) >>> 0);
}
export function formatIpv4(value: number): string {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
}
export function prefixMask(prefix: number): number {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw Error('Prefix must be between 0 and 32.');
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}
export function isSameSubnet(a: string, b: string, prefix: number): boolean {
  const x = parseIpv4(a), y = parseIpv4(b);
  if (x === null || y === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  return (x & prefixMask(prefix)) === (y & prefixMask(prefix));
}
export function cidrNetwork(ip: string, prefix: number): string {
  const x = parseIpv4(ip); if (x === null) return 'invalid';
  return formatIpv4(x & prefixMask(prefix));
}
export function validateAddress(ip: string, prefix: number): string | null {
  if (parseIpv4(ip) === null) return 'Enter a valid IPv4 address (four octets, each 0–255).';
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return 'Prefix must be an integer from 0 to 32.';
  return null;
}
