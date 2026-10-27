export type StudyStep = {heading: string; body: string; example?: string; task?: string};
export type Lesson = {id: string; module: number; title: string; duration: string; steps: [StudyStep,StudyStep,StudyStep,StudyStep,StudyStep,StudyStep,StudyStep,StudyStep,StudyStep]; quiz: {question: string; options: string[]; correct: number; rationale: string}};
export const moduleTitles = [
  'Networking fundamentals', 'Hardware & connections', 'OSI and TCP/IP', 'Ethernet & Wi-Fi', 'IPv4, IPv6 & subnetting',
  'Switching & routing', 'DHCP, DNS, ARP & NAT', 'TCP, UDP & sockets', 'The Internet journey', 'Linux network administration',
  'Security fundamentals', 'VLANs & advanced networks', 'Speed & congestion', 'Physical Internet infrastructure',
];
export const steps = ['Objectives', 'Definitions', 'Step-by-step', 'Illustrations', 'Commands & examples', 'Real-life applications', 'Exercises', 'Mini-project', 'Integrated project'];
export const lessons: Lesson[] = [
  {id:'m1-l1', module: 1, title:'What is a network?', duration:'~30 min',
    steps:[
      {heading:'What you will learn', body:'Explain nodes, links, networks and protocols. Distinguish a functioning Wi-Fi link from Internet access. Predict when two computers can communicate.'},
      {heading:'Vocabulary', body:'Node: a network participant. Link: a wired or wireless connection. Protocol: agreed communication rules. Packet: a formatted unit sent over a network. LAN: a local-area network. ISP: Internet service provider.'},
      {heading:'From a message to a transmission', body:'1. An application creates data. 2. The operating system encapsulates it using protocols. 3. The network interface sends a frame. 4. A receiving interface and operating system process it.', example:'A greeting travels as bits encoded into electrical, optical or radio signals.'},
      {heading:'Picture the network', body:'Think of two houses (computers) with a road between them (link). An address identifies the destination; delivery rules describe how a parcel moves. The analogy is imperfect: networks use frames, protocols and precise routing rules.', task:'Open Build and inspect a computer, its Ethernet port and the connection panel.'},
      {heading:'See it with a command', body:'Use the simulated terminal after placing and selecting a PC. `ip addr` shows interface addressing. `ping -c 2 192.168.1.20` tests ICMP Echo communication.', example:'An ICMP failure does not always prove that web traffic is unavailable.'},
      {heading:'Where it matters', body:'Homes, university labs, data centers, games, smart devices and industrial control systems all rely on network communication. A cable can be connected while Internet routing is broken.'},
      {heading:'Check your understanding', body:'Explain the difference between Wi-Fi and the Internet. What can a successful ping to your local router prove? What can it not prove?', task:'Answer the question below, then intentionally disconnect a lab cable.'},
      {heading:'Mini-project', body:'Construct a direct Ethernet link between two PCs. Configure IPv4 addresses in the same /24 subnet. Run a successful ping, disconnect the cable, and repeat the test.', task:'Use Build. Inspect the event timeline for the difference between delivery and a drop.'},
      {heading:'NETVERSE integrated project', body:'Save the network as your first NETVERSE project. In later modules, expand it with switches, routers, multiple IP networks, services, performance tests and security policies.'},
    ], quiz:{question:'A laptop can open 192.168.0.1 but not a website. What is established?',options:['The Internet must be working','The local router is reachable; upstream or DNS may still fail','Wi-Fi has necessarily failed','All TCP ports are blocked'],correct:1,rationale:'Local connectivity and Internet connectivity are separate tests.'}},
  {id:'m1-l2', module:1,title:'Switches, routers and paths',duration:'~30 min', steps:[
    {heading:'Objectives',body:'Differentiate a switch from a router, identify an IPv4 default gateway and explain why routers need return routes.'},
    {heading:'Vocabulary',body:'Switch: forwards link-layer frames inside a broadcast domain. Router: forwards IP packets between networks. Interface: network attachment point. Gateway: next hop used for destinations outside directly attached networks.'},
    {heading:'Packet movement',body:'A host first asks whether the destination is on-link. If it is, it resolves the destination MAC. If not, it needs a route to a next-hop router. Routers then select interfaces using routes.'},
    {heading:'Road junction analogy',body:'A switch resembles a reception desk directing deliveries within one building. A router resembles a junction connecting streets in different neighborhoods. Real devices use forwarding tables rather than human judgment.'},
    {heading:'Terminal practice',body:'Use `ip addr`, `ip route`, and `ping -c 2 <IPv4>`. Compare the routes on PC-A and the router in Case 03.',example:'default via 192.168.10.1 dev eth0'},
    {heading:'Real-world application',body:'Apartment routers often separate private home LANs from an upstream apartment network. Receiving an upstream DHCP address does not prove public Internet routing works.'},
    {heading:'Exercises',body:'What happens when a remote server has no return route? Why must the default gateway be reachable on the source network?',task:'Try the Missing Gateway incident and compare routes before/after.'},
    {heading:'Mini-project',body:'Build two /24 subnets connected through a router. Configure both router interfaces and one default gateway per host. Verify bidirectional ping.'},
    {heading:'Integrated project',body:'Add a router and a remote server to your saved LAN. Record the topology and a sample route table.'},
  ],quiz:{question:'A host sends to a destination outside its connected /24. What does it need?',options:['A working default/static route to a next hop','Only an Ethernet cable','A DNS entry in all cases','A switch with five ports'],correct:0,rationale:'Remote destinations require a matching route; DNS is unrelated to routing by IP.'}},
  {id:'m1-l3', module:1,title:'Evidence-based troubleshooting',duration:'~30 min', steps:[
    {heading:'Objectives',body:'Investigate network failures in layers, document evidence and verify a repair.'},
    {heading:'Definitions',body:'Fault: a condition causing incorrect behavior. Symptom: observed behavior. Hypothesis: testable explanation. Evidence: observation supporting or challenging that explanation.'},
    {heading:'The diagnostic cycle',body:'Observe → identify scope → generate hypotheses → test one → implement the smallest justified correction → re-test → document. Avoid repeated factory resets without evidence.'},
    {heading:'A mechanic analogy',body:'A mechanic checks whether a vehicle has fuel, ignition and movement instead of changing every component. Similarly, confirm local address, gateway, public IP path and DNS separately.'},
    {heading:'Commands',body:'`ip addr`: addressing. `ip route`: route selection. `ping`: ICMP response. `traceroute`: simulated hop path. `ip neigh`: observed ARP replies.', example:'No ICMP Echo response can also mean filtering; it is not proof that all TCP traffic fails.'},
    {heading:'Case study',body:'A Tenda-like router obtains a WAN DHCP lease while clients cannot use the Internet. Investigate local path, router uplink, restrictions and DNS separately.'},
    {heading:'Exercises',body:'Write a hypothesis before testing. If two hosts have 192.168.1.10/24 and 192.168.2.20/24 on a direct link, predict failure and explain the absent route.'},
    {heading:'Mini-project',body:'Open one of the three incidents. Record a failing test, change only what is needed, and verify success.'},
    {heading:'Integrated project',body:'Save an incident investigation note including symptom, hypothesis, evidence, repair and verification.'},
  ],quiz:{question:'What is the strongest evidence that a repair worked?',options:['The cable LED is blinking','The technician rebooted the router','The previously failing relevant test now succeeds','The router was reset three times'],correct:2,rationale:'Measure the behavior associated with the fault after applying the repair.'}},
];
