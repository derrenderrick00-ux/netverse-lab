import {useEffect, useMemo, useState} from 'react';
import type {FormEvent} from 'react';
import {addDevice, connect, createTwoPcLab, emptyProject} from './engine/model';
import type {DeviceKind, NetDevice, NetPort, NetworkProject, PingResult} from './engine/model';
import {setAddress, setGateway, toggleInterface, toggleLink, removeLink, removeDevice} from './engine/actions';
import {executeCommand} from './engine/terminal';
import {gradeIncident, incidents, loadIncident} from './labs/scenarios';
import type {IncidentId} from './labs/scenarios';
import {lessons, moduleTitles, steps} from './learning/content';
import {exportJson, importJson, loadProgress, loadProject, saveProgress, saveProject} from './utils/storage';
import type {Progress} from './utils/storage';
import './App.css';

type Section = 'Dashboard' | 'Learn' | 'Build' | 'Troubleshoot' | 'Packet inspector' | 'Projects';
const sections: {id: Section; icon: string}[] = [
  {id:'Dashboard',icon:'◈'}, {id:'Learn',icon:'▤'}, {id:'Build',icon:'⌘'},
  {id:'Troubleshoot',icon:'⚑'}, {id:'Packet inspector',icon:'◉'}, {id:'Projects',icon:'▣'},
];
const deviceIcon: Record<DeviceKind, string> = {host:'▣',server:'▥',router:'◎',switch:'▦'};
const eventColors: Record<string, string> = {'dropped':'bad','delivered':'good','arp-request':'warn','arp-reply':'good','forward':'info','notice':'muted','frame':'info','icmp-request':'info','icmp-reply':'good'};

function Topology({project, selected, onSelect}: {project: NetworkProject; selected: string; onSelect: (id: string)=>void}) {
  const center = (portId: string) => project.devices.find(d => d.ports.some(p => p.id === portId));
  return <div className="topology-wrap">
    <svg className="topology" viewBox="0 0 720 350" role="img" aria-label="Interactive network topology diagram; use the accessible device list to select a device">
      <defs><pattern id="netgrid" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#243b52"/></pattern></defs>
      <rect width="720" height="350" fill="url(#netgrid)" rx="12"/>
      {project.links.map(l => {
        const a=center(l.a),b=center(l.b); if (!a||!b) return null;
        return <g key={l.id}>
          <line x1={a.x+54} y1={a.y+30} x2={b.x+54} y2={b.y+30} stroke={l.enabled?'#42c5ae':'#f07878'} strokeWidth="4" strokeDasharray={l.enabled?'0':'9 8'}/>
          <circle cx={(a.x+b.x)/2+54} cy={(a.y+b.y)/2+30} r="5" fill={l.enabled?'#42c5ae':'#f07878'}/>
        </g>;
      })}
      {project.devices.map(d => <g key={d.id} onClick={()=>onSelect(d.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(d.id);}}}
        role="button" aria-label={`Select ${d.name}`} tabIndex={0} style={{cursor:'pointer'}}>
        <rect x={d.x} y={d.y} width="108" height="64" rx="11" fill={selected===d.id?'#203e5c':'#17263b'} stroke={selected===d.id?'#6cbaff':'#3a5772'} strokeWidth={selected===d.id?3:1.5}/>
        <text x={d.x+15} y={d.y+26} fontSize="21" fill="#85d6e8">{deviceIcon[d.kind]}</text>
        <text x={d.x+47} y={d.y+23} fontSize="13" fill="#f2f7ff" fontWeight="bold">{d.name.slice(0,9)}</text>
        <text x={d.x+14} y={d.y+46} fontSize="11" fill="#a3b9ce">{d.ports.find(p=>p.ipv4)?.ipv4 || d.kind}</text>
        <circle cx={d.x+99} cy={d.y+9} r="4" fill={d.powered?'#42c5ae':'#f07878'}/>
      </g>)}
      {!project.devices.length && <text x="360" y="160" fontSize="18" fill="#acc3d6" textAnchor="middle">Add devices to begin your network</text>}
    </svg>
    <div className="topology-caption">Solid green = enabled Ethernet link · Dashed red = disabled link · Select nodes to inspect. Schematic, not to scale.</div>
  </div>;
}

function PortEditor({port, onApply, onToggle}: {port: NetPort; onApply:(ip:string,prefix:number)=>void;onToggle:()=>void}) {
  const [ip,setIp]=useState(port.ipv4); const [prefix,setPrefix]=useState(String(port.prefix));
  function submit(e: FormEvent) {e.preventDefault();onApply(ip.trim(),Number(prefix));}
  return <form className="port-editor" onSubmit={submit}>
    <div className="port-title"><strong>{port.name}</strong><code>{port.mac}</code><button type="button" className="small secondary" onClick={onToggle}>{port.enabled?'Disable':'Enable'}</button></div>
    <div className="form-inline"><label>IPv4<input aria-label={`${port.name} IPv4`} value={ip} placeholder="192.168.1.10" onChange={e=>setIp(e.target.value)}/></label><label>Prefix<input aria-label={`${port.name} prefix`} type="number" min="0" max="32" value={prefix} onChange={e=>setPrefix(e.target.value)}/></label><button className="small" type="submit">Apply</button></div>
  </form>;
}
function DeviceInspector({device, project, apply, notify}: {device: NetDevice;project: NetworkProject;apply:(p:NetworkProject)=>void;notify:(m:string)=>void}) {
  const [gw,setGw]=useState(device.gateway);
  const commit=(res:{ok:boolean;state:NetworkProject;error?:string})=>res.ok?apply(res.state):notify(res.error||'Invalid configuration');
  return <section className="sidepanel" aria-label="Device inspector">
    <div className="panel-heading"><h3>{deviceIcon[device.kind]} {device.name}</h3><span className="badge">{device.kind}</span></div>
    <p className="small-muted">Changes alter the live simulation model.</p>
    <div className="form-inline"><label>X coordinate<input type="number" value={device.x} min="0" max="610" onChange={e=>apply({...project,devices:project.devices.map(d=>d.id===device.id?{...d,x:Math.max(0,Math.min(610,Number(e.target.value)||0))}:d)})}/></label>
      <label>Y coordinate<input type="number" value={device.y} min="0" max="280" onChange={e=>apply({...project,devices:project.devices.map(d=>d.id===device.id?{...d,y:Math.max(0,Math.min(280,Number(e.target.value)||0))}:d)})}/></label></div>
    <label className="checkbox-row"><input type="checkbox" checked={device.powered} onChange={()=>apply({...project,devices:project.devices.map(d=>d.id===device.id?{...d,powered:!d.powered}:d)})}/> Powered on</label>
    {device.kind !== 'switch' && <form className="gateway-row" onSubmit={e=>{e.preventDefault();commit(setGateway(project,device.id,gw.trim()));}}><label>Default gateway<input value={gw} onChange={e=>setGw(e.target.value)} placeholder="(none)"/></label><button className="small" type="submit">Set gateway</button></form>}
    <h4>Interfaces</h4>{device.ports.map(port=><PortEditor key={`${port.id}-${port.ipv4}-${port.prefix}`} port={port} onApply={(ip,prefix)=>commit(setAddress(project,port.id,ip,prefix))} onToggle={()=>commit(toggleInterface(project,port.id))}/>)}
    <button className="danger small" onClick={()=>commit(removeDevice(project,device.id))}>Remove device</button>
  </section>;
}

function PacketInspector({result}: {result:PingResult|null}) {
  const [step,setStep]=useState(0); const [running,setRunning]=useState(false);
  useEffect(()=>{
    if(!running||!result?.events.length||step >= result.events.length-1)return;
    const timer=window.setInterval(()=>setStep(n=>Math.min(n+1,result.events.length-1)),600);
    return ()=>window.clearInterval(timer);
  },[running,result,step]);
  if (!result) return <div className="empty-state"><div className="empty-icon">◉</div><h3>No packet trace yet</h3><p>Open Build or Troubleshoot. Select a client, run <code>ping -c 2 192.168.1.20</code>, then return here.</p><p>All displayed events are generated by the virtual network engine.</p></div>;
  const ev = result.events[step];
  return <div className="inspector-layout"><section className="card">
    <div className="panel-heading"><h3>Packet X-Ray</h3><span className={`badge ${result.success?'good':'bad'}`}>{result.received}/{result.transmitted} replies</span></div>
    <p className="small-muted">{result.sourceId} → {result.destination} · discrete simulation time in milliseconds</p>
    <div className="step-controls"><button type="button" className="secondary" onClick={()=>{setRunning(false);setStep(0);}}>↺ Replay</button><button className="secondary" onClick={()=>{setRunning(false);setStep(n=>Math.max(0,n-1));}}>← Previous</button>
      <button onClick={()=>{if(step >= result.events.length-1){setStep(0);setRunning(true);}else setRunning(v=>!v);}}>{running && step < result.events.length-1?'Pause':'▶ Play'}</button><button className="secondary" onClick={()=>{setRunning(false);setStep(n=>Math.min(result.events.length-1,n+1));}}>Next →</button></div>
    <p className="small-muted">Event {step+1} of {result.events.length}</p>
    {ev && <div className="packet-detail" aria-live="polite"><div><span className={`event-dot ${eventColors[ev.type]}`}/> <strong>{ev.type.toUpperCase()}</strong> <span className="muted">@ {ev.timeMs.toFixed(1)} ms</span></div><p>{ev.detail}</p><code>device: {ev.at}</code>{ev.reason && <p className="error">Reason: {ev.reason}</p>}</div>}
    <div className="time-track"><div style={{width:`${(step+1)/Math.max(1,result.events.length)*100}%`}}/></div>
  </section><section className="card timeline"><h3>Event timeline</h3><div className="event-list">{result.events.map((e,i)=><button type="button" key={e.id} className={`event-item ${step===i?'active':''}`} onClick={()=>{setStep(i);setRunning(false);}}><span className={`event-dot ${eventColors[e.type]}`}/><span><strong>{e.type}</strong><small>{e.timeMs.toFixed(1)} ms · {e.at}</small></span></button>)}</div></section></div>;
}

function downloadText(name: string, content: string) {
  const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
  const link=document.createElement('a'); link.href=url; link.download=name;link.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export default function App() {
  const [section,setSection]=useState<Section>('Dashboard');
  const [project,setProject]=useState<NetworkProject>(loadProject);
  const [selected,setSelected]=useState('pc-a');
  const [progress,setProgress]=useState<Progress>(loadProgress);
  const [lessonId,setLessonId]=useState('m1-l1');
  const [answer,setAnswer]=useState<number|null>(null);
  const [activeIncident,setActiveIncident]=useState<IncidentId|null>(null);
  const [sawFailure,setSawFailure]=useState(false);
  const [verified,setVerified]=useState(false);
  const [notes,setNotes]=useState(''); const [hypothesis,setHypothesis]=useState('');
  const [showHint,setShowHint]=useState(false);
  const [lastPing,setLastPing]=useState<PingResult|null>(null);
  const [traceId,setTraceId]=useState(0);
  const [terminalHistory,setTerminalHistory]=useState<string[]>(['NETVERSE virtual terminal. Type help. No real shell commands are executed.']);
  const [command,setCommand]=useState('');
  const [sourceId,setSourceId]=useState('pc-a');
  const [startPort,setStartPort]=useState(''); const [endPort,setEndPort]=useState('');
  const [notice,setNotice]=useState('');
  const lesson=lessons.find(l=>l.id===lessonId)!;
  const currentStep=Math.max(0,Math.min(8,progress[lesson.id]?.step||0));
  const incident=incidents.find(i=>i.id===activeIncident);
  const assessment=gradeIncident(verified,sawFailure,notes,hypothesis);
  const allPorts=project.devices.flatMap(d=>d.ports.map(p=>({value:p.id,label:`${d.name} · ${p.name} ${p.enabled?'':'(disabled)'}`})));
  const selectedDevice=project.devices.find(d=>d.id===selected);
  const currentSource=project.devices.some(d=>d.id===sourceId&&d.kind!=='switch')?sourceId:project.devices.find(d=>d.kind!=='switch')?.id||'';
  const finished=Object.values(progress).filter(x=>x.completed).length;
  useEffect(()=>{saveProject(project);},[project]);
  useEffect(()=>{saveProgress(progress);},[progress]);
  const connectivity=useMemo(()=>({devices:project.devices.length, links:project.links.filter(l=>l.enabled).length}),[project]);
  function updateProject(p:NetworkProject) {setProject(p);setVerified(false);setLastPing(null);}
  function applyResult(result:{ok:boolean;state:NetworkProject;error?:string}) {if(result.ok){updateProject(result.state);setNotice('Network state updated. Re-run a test to verify.');}else setNotice(result.error||'Action rejected.');}
  function loadProjectInto(p:NetworkProject) {setProject(p);setSelected(p.devices[0]?.id||'');setSourceId(p.devices.find(d=>d.kind!=='switch')?.id||'');setLastPing(null);setTerminalHistory(['New virtual network loaded. Type help.']);setVerified(false);setSawFailure(false);setNotes('');setHypothesis('');setNotice(`Loaded: ${p.name}`);}
  function launchCase(id:IncidentId){loadProjectInto(loadIncident(id));setActiveIncident(id);setShowHint(false);setCommand('');setSection('Troubleshoot');}
  function enterCommand(e:FormEvent) {
    e.preventDefault();if(!command.trim()||!currentSource)return;
    const res=executeCommand(project,currentSource,command,lastPing);
    if(res.clear) setTerminalHistory([]);
    else setTerminalHistory(old=>[...old,`${project.devices.find(d=>d.id===currentSource)?.name||'PC'}> ${command}`,res.text].slice(-65));
    if(res.ping){setLastPing(res.ping);setTraceId(n=>n+1);if(incident&&res.ping.sourceId===incident.sourceId&&res.ping.destination===incident.targetIp){
      if(res.ping.success)setVerified(true);else {setSawFailure(true);setVerified(false);}
    }}
    setCommand('');
  }
  function nextStep(next:number){setProgress(p=>({...p,[lesson.id]:{...(p[lesson.id]||{completed:false}),step:Math.max(0,Math.min(8,next))}}));setAnswer(null);}
  function quiz(choice:number){setAnswer(choice);if(choice===lesson.quiz.correct){setProgress(p=>({...p,[lesson.id]:{step:8,completed:true,quizCorrect:true}}));}}
  const renderTerminal=()=> <section className="card terminal-card">
    <div className="panel-heading"><h3>⌘ Simulated terminal</h3><span className="badge">No real OS access</span></div>
    <label className="compact-label">Device context<select value={currentSource} onChange={e=>setSourceId(e.target.value)}>{project.devices.filter(d=>d.kind!=='switch').map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <div className="terminal" role="log" aria-live="polite">{terminalHistory.map((line,i)=><pre key={`${i}-${line.slice(0,8)}`}>{line}</pre>)}</div>
    <form className="command-row" onSubmit={enterCommand}><span className="prompt">$</span><input aria-label="Simulated terminal command" value={command} onChange={e=>setCommand(e.target.value)} placeholder="ping -c 2 192.168.1.20"/><button type="submit" disabled={!currentSource}>Run</button></form>
    <div className="quickcommands">{['ip addr','ip route','help'].map(c=><button key={c} className="tiny secondary" onClick={()=>setCommand(c)}>{c}</button>)}</div>
  </section>;
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-icon">◎</span><div><strong>NETVERSE</strong><small>NETWORKING LAB</small></div></div>
      <div className="sidebar-caption">WORKSPACE</div><nav aria-label="Main navigation">{sections.map(s=><button key={s.id} className={`nav-link ${section===s.id?'selected':''}`} onClick={()=>setSection(s.id)}><span aria-hidden="true">{s.icon}</span>{s.id}</button>)}</nav>
      <div className="sidebar-bottom"><span className="badge good">● Local simulation</span><p>Phases 1–8 · prototype<br/>F0/F1 selective fidelity</p></div>
    </aside>
    <div className="main-area"><header className="topbar"><div><span className="eyebrow">NETVERSE / {section.toUpperCase()}</span><h1>{section}</h1></div><div className="topbar-right"><span className="badge">{connectivity.devices} nodes · {connectivity.links} active links</span><button className="secondary" onClick={()=>setSection('Projects')}>Save / export ↗</button></div></header>
      <main className="main-content">
      {notice && <div className="notification" role="status"><span>{notice}</span><button aria-label="Dismiss notice" onClick={()=>setNotice('')}>×</button></div>}
      {section==='Dashboard' && <>
        <div className="hero"><div><span className="eyebrow">YOUR VIRTUAL NETWORK ENGINEERING WORKSPACE</span><h2>Learn the theory.<br/><em>Make packets move.</em></h2><p>Build real configurations in an isolated model, investigate broken networks, and verify the result with virtual commands—not scripted animations.</p><div className="button-row"><button onClick={()=>setSection('Learn')}>Continue learning →</button><button className="secondary" onClick={()=>setSection('Build')}>Open lab</button></div></div><div className="hero-art" aria-hidden="true"><span>▣</span><i>──────────</i><span>◎</span><i>──────────</i><span>▥</span><small>CLIENT　　　　 ROUTER　　　　 SERVER</small></div></div>
        <div className="stats"><div className="stat"><strong>{finished}/{lessons.length}</strong><span>Lessons completed</span></div><div className="stat"><strong>{project.devices.length}</strong><span>Network devices</span></div><div className="stat"><strong>{lastPing?`${lastPing.received}/${lastPing.transmitted}`:'—'}</strong><span>Last ping replies</span></div><div className="stat"><strong>03</strong><span>Investigations ready</span></div></div>
        <h2 className="section-title">Start a practical session</h2><div className="choice-grid"><button className="action-card" onClick={()=>{setSection('Build');}}><b>01</b><strong>Two-computer LAN</strong><p>Connect, configure, ping, break, repair.</p><span>Build network →</span></button><button className="action-card" onClick={()=>launchCase('cable')}><b>02</b><strong>Broken Ethernet link</strong><p>Investigate a classroom outage with real evidence.</p><span>Open ticket →</span></button><button className="action-card" onClick={()=>setSection('Packet inspector')}><b>03</b><strong>Packet X-Ray</strong><p>Step through ARP, ICMP and forwarding events.</p><span>Inspect events →</span></button></div>
      </>}
      {section==='Learn' && <div className="learn-layout"><section className="card module-list"><h3>Curriculum · 14 modules</h3><p className="small-muted">Module 01 has three working lessons. Remaining modules are curriculum placeholders, not completed lessons.</p>{moduleTitles.map((name,i)=><div key={name} className={`module-row ${i===0?'unlocked':''}`}><span>{String(i+1).padStart(2,'0')}</span><strong>{name}</strong><small>{i===0?'OPEN':'COMING LATER'}</small></div>)}</section>
      <div className="lesson-column"><section className="card"><div className="panel-heading"><h3>Module 01 · Fundamentals</h3><span className="badge">{finished}/{lessons.length} passed</span></div><div className="lesson-tabs">{lessons.map(l=><button key={l.id} className={lessonId===l.id?'active':''} onClick={()=>{setLessonId(l.id);setAnswer(null);}}>{progress[l.id]?.completed?'✓ ':''}{l.title}</button>)}</div>
        <div className="lesson-intro"><span className="eyebrow">{lesson.duration} · STEP {currentStep+1}/9</span><h2>{lesson.title}</h2><div className="progress-bar"><div style={{width:`${((currentStep+1)/9)*100}%`}}/></div></div>
        <div className="step-tabs">{steps.map((s,i)=><button key={s} aria-label={`Study step ${i+1}: ${s}`} className={i===currentStep?'active':''} onClick={()=>nextStep(i)}>{i+1}</button>)}</div>
        <div className="lesson-body"><span className="eyebrow">STEP {currentStep+1}: {steps[currentStep].toUpperCase()}</span><h3>{lesson.steps[currentStep].heading}</h3><p>{lesson.steps[currentStep].body}</p>{lesson.steps[currentStep].example&&<pre className="example">{lesson.steps[currentStep].example}</pre>}{lesson.steps[currentStep].task&&<p className="learning-prompt"><strong>Try this:</strong> {lesson.steps[currentStep].task}</p>}</div>
        <div className="button-row spaced"><button className="secondary" disabled={currentStep===0} onClick={()=>nextStep(currentStep-1)}>← Previous</button><button onClick={()=>currentStep===8?setSection('Build'):nextStep(currentStep+1)}>{currentStep===8?'Open practice lab →':'Next step →'}</button></div>
      </section><section className="card quiz"><h3>Knowledge check</h3><p>{lesson.quiz.question}</p>{currentStep<8 && <p className="small-muted">Work through the nine study steps to unlock this assessment.</p>}{lesson.quiz.options.map((o,i)=><button key={o} disabled={answer!==null||currentStep<8} className={`option ${answer!==null&&i===lesson.quiz.correct?'correct':''} ${answer===i&&i!==lesson.quiz.correct?'incorrect':''}`} onClick={()=>quiz(i)}>{String.fromCharCode(65+i)}. {o}</button>)}{answer!==null&&<p role="status" className={answer===lesson.quiz.correct?'success':'error'}>{answer===lesson.quiz.correct?'Correct · lesson completed. ':'Not quite. '}{lesson.quiz.rationale}{answer!==lesson.quiz.correct&&<button className="tiny secondary" onClick={()=>setAnswer(null)}>Try again</button>}</p>}</section></div></div>}
      {section==='Build' && <>
        <div className="workspace-head"><div><h2>{project.name}</h2><p>Build with ports and cables. Select a node to configure IPv4 and its gateway.</p></div><div className="button-row"><button className="secondary" onClick={()=>{loadProjectInto(createTwoPcLab());setActiveIncident(null);}}>Reset to two PCs</button><button className="secondary" onClick={()=>setSection('Packet inspector')}>Inspect packets →</button></div></div>
        <div className="workbench"><div className="build-primary"><section className="card"><div className="panel-heading"><h3>Network canvas</h3><span className="badge">12-node limit</span></div><Topology project={project} selected={selected} onSelect={id=>{setSelected(id);setSourceId(id);}}/>
          <div className="device-actions"><span className="eyebrow">ADD EQUIPMENT</span>{(['host','switch','router','server'] as DeviceKind[]).map(kind=><button key={kind} className="secondary small" onClick={()=>{const res=addDevice(project,kind);applyResult(res);if(res.ok)setSelected(res.state.devices[res.state.devices.length-1].id);}}>{deviceIcon[kind]} {kind}</button>)}</div></section>
          <section className="card"><h3>Patch panel — Ethernet connections</h3><p className="small-muted">Choose two unused ports on different devices. A port supports one cable. Switches have four ports.</p><div className="form-inline connection-form"><label>Endpoint A<select value={startPort} onChange={e=>setStartPort(e.target.value)}><option value="">Select interface…</option>{allPorts.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label><label>Endpoint B<select value={endPort} onChange={e=>setEndPort(e.target.value)}><option value="">Select interface…</option>{allPorts.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label><button onClick={()=>{const res=connect(project,startPort,endPort);applyResult(res);if(res.ok){setStartPort('');setEndPort('');}}}>Connect</button></div>
          <div className="links-list">{project.links.map(l=><div key={l.id} className="link-item"><span><i className={`link-indicator ${l.enabled?'on':'off'}`}/>{l.a} ↔ {l.b}</span><div><button className="tiny secondary" onClick={()=>applyResult(toggleLink(project,l.id))}>{l.enabled?'Disable':'Enable'}</button><button className="tiny secondary" onClick={()=>applyResult(removeLink(project,l.id))}>Unplug</button></div></div>)}{project.links.length===0&&<p className="small-muted">No cables installed yet.</p>}</div></section>
          {renderTerminal()}
        </div><div className="build-side">{selectedDevice?<DeviceInspector key={`${selectedDevice.id}-${selectedDevice.gateway}`} device={selectedDevice} project={project} apply={updateProject} notify={setNotice}/>:<section className="card"><h3>Select a device</h3><p>Choose a node on the canvas or from the list below.</p></section>}
          <section className="card"><h3>Accessible device list</h3><div className="device-list">{project.devices.map(d=><button className={selected===d.id?'active':''} key={d.id} onClick={()=>{setSelected(d.id);setSourceId(d.id);}}>{deviceIcon[d.kind]} {d.name}</button>)}</div></section>
        </div></div>
      </>}
      {section==='Troubleshoot' && <>
        <h2 className="section-title">Incident tickets</h2><p className="small-muted">Starting an incident replaces the active workspace. Export your current project first if you want to preserve a separate copy.</p>
        <div className="incident-cards">{incidents.map(c=><button key={c.id} className={`incident-card ${activeIncident===c.id?'selected':''}`} onClick={()=>launchCase(c.id)}><span className="eyebrow">CASE {c.id.toUpperCase()}</span><strong>{c.title}</strong><small>{c.ticket}</small><em>Load investigation →</em></button>)}</div>
        {incident?<div className="incident-work"><div><section className="card"><div className="panel-heading"><h3>⚑ {incident.title}</h3><span className="badge">ACTIVE</span></div><p>{incident.ticket}</p><p className="learning-prompt">Test target: <code>{incident.targetIp}</code> · Source: <code>{incident.sourceId}</code></p><Topology project={project} selected={selected} onSelect={id=>{setSelected(id);setSourceId(id);}}/>
            <div className="button-row"><button className="secondary" onClick={()=>setShowHint(v=>!v)}>{showHint?'Hide hint':'Request hint'}</button><button className="secondary" onClick={()=>{setSection('Build');setNotice('Repair the actual topology or interface settings; then re-test the incident.');}}>Open configuration workbench →</button></div>{showHint&&<p className="learning-prompt">{incident.hint}</p>}</section>{renderTerminal()}</div>
          <div><section className="card"><h3>Investigation notebook</h3><p className="small-muted">Record what you observed before submitting. No prescribed command order.</p><label>Evidence<textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Which tests failed and why is that meaningful?"/></label><label>Diagnosis and repair explanation<textarea rows={4} value={hypothesis} onChange={e=>setHypothesis(e.target.value)} placeholder="What was wrong, what did you change, and how did you verify it?"/></label><div className="scorebox"><span>Assessment score</span><strong>{assessment.score}/100</strong><small>{assessment.passed?'PASS · all criteria met':'Submit evidence and verify connectivity'}</small></div><div className="rubric">{assessment.breakdown.map(s=><p key={s}>{s}</p>)}</div><div className="button-row"><button className="secondary" onClick={()=>{setCommand(`ping -c 2 ${incident.targetIp}`);setSourceId(incident.sourceId);}}>Prepare verification ping</button><button onClick={()=>{setNotice(assessment.passed?`Ticket resolved. Root-cause teaching note: ${incident.correctExplanation}`:'Ticket incomplete. Verify a failed test, repair the actual network, ping again, and write evidence.');}}>Submit diagnosis</button></div></section></div>
        </div>:<div className="empty-state"><h3>Select a ticket to begin</h3><p>Each case loads an actual misconfigured topology. Testing, repair and assessment use the same simulation state.</p></div>}
      </>}
      {section==='Packet inspector' && <PacketInspector key={traceId} result={lastPing}/>}
      {section==='Projects' && <div className="projects-grid"><section className="card"><h3>Save, export, and import</h3><p>Progress and your current topology are saved automatically in this browser's local storage. Export JSON to make a portable backup.</p><label>Project title<input value={project.name} onChange={e=>updateProject({...project,name:e.target.value.slice(0,100)})}/></label><div className="button-row"><button onClick={()=>{setNotice(saveProject(project)?'Project saved locally.':'Browser storage denied or full. Use Export JSON instead.');}}>Save now</button><button className="secondary" onClick={()=>downloadText('netverse-project.json',exportJson(project))}>Export JSON ↓</button></div><label>Import NETVERSE JSON<input type="file" accept=".json,application/json" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>250_000){setNotice('File too large (maximum 250 KB).');return;}try{loadProjectInto(importJson(await f.text()));setActiveIncident(null);}catch(err){setNotice(err instanceof Error?err.message:'Import failed.');}e.target.value='';}}/></label><p className="small-muted">Import validates schema v1, device IDs, port IDs and cable endpoints. It does not execute scripts.</p></section><section className="card"><h3>Saved workspace</h3><dl className="meta"><dt>Project</dt><dd>{project.name}</dd><dt>Devices</dt><dd>{project.devices.length}</dd><dt>Cables</dt><dd>{project.links.length}</dd><dt>Learning progress</dt><dd>{finished}/{lessons.length} lessons</dd><dt>Engine</dt><dd>Discrete-event IPv4 / ARP / ICMP (limited)</dd></dl><button className="danger" onClick={()=>{loadProjectInto(emptyProject());setActiveIncident(null);setSection('Build');}}>Start an empty network</button></section></div>}
      </main><footer className="footer">NETVERSE LAB · Educational simulation (not real Linux or real Internet traffic) · Phases 1–8 working slice</footer></div>
  </div>;
}
