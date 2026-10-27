#!/usr/bin/env bash
# Optional Phase 13 lab. Changes only temporary Linux network namespaces and veth pair.
# It never changes host routing, iptables, NAT, DNS or system-wide IP forwarding.
set -Eeuo pipefail
if [[ "${1:-}" != "--run" ]]; then
  cat <<'MSG'
NETVERSE Phase 13 optional real Linux namespace lab.
Requires Linux, iproute2, CAP_NET_ADMIN and permission to create network namespaces.
Inspect this script before running; it creates two temporary namespaces and a veth pair.
Usage: sudo bash scripts/real_linux_namespace_lab.sh --run
No Internet connection is required. This lab does not alter host firewall or routing.
MSG
  exit 0
fi
if [[ $EUID -ne 0 ]]; then echo 'Requires sudo for temporary namespaces.' >&2; exit 1; fi
command -v ip >/dev/null || { echo 'iproute2 missing.' >&2; exit 1; }
A="netverse-a-$$"; B="netverse-b-$$"; VA="nva$$"; VB="nvb$$"
created_a=0;created_b=0
cleanup(){
  if [[ $created_a -eq 1 ]]; then ip netns del "$A" 2>/dev/null || true; fi
  if [[ $created_b -eq 1 ]]; then ip netns del "$B" 2>/dev/null || true; fi
  ip link del "$VA" 2>/dev/null || true
  ip link del "$VB" 2>/dev/null || true
}
trap cleanup EXIT
ip netns add "$A"; created_a=1
ip netns add "$B"; created_b=1
ip link add "$VA" type veth peer name "$VB"
ip link set "$VA" netns "$A"; ip link set "$VB" netns "$B"
ip -n "$A" address add 192.0.2.10/24 dev "$VA"
ip -n "$B" address add 192.0.2.20/24 dev "$VB"
ip -n "$A" link set lo up; ip -n "$B" link set lo up
ip -n "$A" link set "$VA" up; ip -n "$B" link set "$VB" up
echo 'TEST 1: connected /24 link should respond'
ip netns exec "$A" ping -c 2 -W 2 192.0.2.20
echo 'TEST 2: disable B interface; ping should fail'
ip -n "$B" link set "$VB" down
if ip netns exec "$A" ping -c 2 -W 2 192.0.2.20; then
  echo 'Unexpected reply while peer interface is down.' >&2; exit 1
else echo 'Expected failure observed.'; fi
ip -n "$B" link set "$VB" up
echo 'TEST 3: link restored; ping should succeed again'
ip netns exec "$A" ping -c 2 -W 2 192.0.2.20
echo 'Lab passed. Namespaces will now be removed by EXIT trap.'
