/** Phase 9: Deterministic educational bottleneck model, NOT TCP or Wi-Fi PHY simulation. */
export interface TrafficClient { id: string; demandMbps: number }
export interface PerformanceInput { capacityMbps: number; baseRttMs: number; bufferKbits: number; clients: TrafficClient[] }
export interface ClientAllocation { id: string; demandMbps: number; deliveredMbps: number; unmetMbps: number }
export interface PerformanceResult {
  clients: ClientAllocation[]; totalDemandMbps: number; throughputMbps: number;
  utilization: number; queueDelayMs: number; estimatedRttMs: number;
  droppedMbps: number; bottleneck: boolean; summary: string;
}
const bounded = (n: number, min: number, max: number) => Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
/** Iterative water filling: spare bandwidth from light users is allocated to heavy users. */
export function simulatePerformance(input: PerformanceInput): PerformanceResult {
  const cap = bounded(input.capacityMbps, 0, 100000);
  const rtt = bounded(input.baseRttMs, 0, 10000);
  const buffer = bounded(input.bufferKbits, 0, 1000000);
  const clients = input.clients.slice(0, 50).map(c=>({id:c.id.slice(0,48), demandMbps:bounded(c.demandMbps,0,100000), deliveredMbps:0, unmetMbps:0}));
  let remaining = cap;
  let contenders = clients.filter(c=>c.demandMbps > 0);
  for (let cycle = 0; cycle < clients.length && contenders.length; cycle++) {
    const share = remaining / contenders.length;
    const satisfied = contenders.filter(c => c.demandMbps - c.deliveredMbps <= share + 1e-9);
    if (!satisfied.length) {
      for (const c of contenders) c.deliveredMbps += share;
      remaining = 0; break;
    }
    for (const c of satisfied) {
      const amount = Math.max(0,c.demandMbps-c.deliveredMbps);
      c.deliveredMbps += amount;
      remaining = Math.max(0,remaining-amount);
    }
    contenders = contenders.filter(c=>!satisfied.includes(c));
  }
  for (const c of clients) c.unmetMbps = Math.max(0,c.demandMbps-c.deliveredMbps);
  const totalDemandMbps=clients.reduce((a,c)=>a+c.demandMbps,0);
  const throughputMbps=clients.reduce((a,c)=>a+c.deliveredMbps,0);
  const overload=Math.max(0,totalDemandMbps-cap);
  // A simplified steady-state full-buffer estimate: a saturated buffer adds B/C seconds.
  const queueDelayMs = overload > 0 && cap > 0 ? 1000 * buffer / (cap * 1000) : 0;
  return {clients,totalDemandMbps,throughputMbps,utilization:cap>0?throughputMbps/cap:0,
    queueDelayMs,estimatedRttMs:rtt+queueDelayMs,droppedMbps:overload,
    bottleneck:overload>0 || (cap===0 && totalDemandMbps>0),
    summary:cap===0?'No usable upstream capacity.':overload>0?'Demand exceeds the link. The excess is unmet, not guaranteed packet loss.':'Capacity covers all modeled demand.'};
}
