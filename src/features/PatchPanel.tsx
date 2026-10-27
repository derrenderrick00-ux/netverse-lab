import {useState} from 'react';
import {getPatchHelp} from './patch';
import type {PatchContext,LabMode} from './patch';
export function PatchPanel({context,onClose}: {context:PatchContext;onClose:()=>void}) {
 const [requestedDetail,setRequestedDetail]=useState(false);
 const detail=getPatchHelp({...context,hintLevel:requestedDetail?2:context.hintLevel});
 return <section className="patch-panel" role="dialog" aria-modal="false" aria-label="Patch networking helper">
  <header><div><strong>🛟 PATCH</strong><small>Practical Assistance & Troubleshooting Companion</small></div><button className="secondary tiny" onClick={onClose} aria-label="Close Patch">×</button></header>
  <div className="patch-body"><span className="badge">{context.mode==='guided'?'Guided coaching':'Independent · opt-in help'}</span>
  <h3>{detail.title}</h3><p>{detail.explanation}</p><p className="learning-prompt"><strong>Next action:</strong> {detail.action}</p><p className="small-muted"><strong>Concept:</strong> {detail.concept}</p>
  {context.section==='Troubleshoot'&&!requestedDetail&&<button className="secondary small" onClick={()=>setRequestedDetail(true)}>Reveal a stronger hint (optional)</button>}
  <p className="small-muted">Patch does not alter settings, automatically repair problems, access the Internet, or execute commands.</p></div>
 </section>;
}
export function ModeSwitch({mode,onMode}: {mode:LabMode;onMode:(mode:LabMode)=>void}){
 return <div className="mode-switch" role="group" aria-label="Learning assistance mode"><button className={mode==='guided'?'active':''} onClick={()=>onMode('guided')} aria-pressed={mode==='guided'}>🧭 Guided</button><button className={mode==='independent'?'active':''} onClick={()=>onMode('independent')} aria-pressed={mode==='independent'}>🛠 Independent</button></div>;
}
