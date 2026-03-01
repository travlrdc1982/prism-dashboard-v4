import { useState, useMemo } from "react";
import DATA from "../data/studyData";

// ─── SEGMENTS & SoP from data file ───
const SEGMENTS = DATA.segments;

// ─── Theme colors ───
const THEME_COLORS = {
  Financial:"#34d399", Coverage:"#60a5fa", Innovation:"#a78bfa",
  Freedom:"#fbbf24", "Social Contract":"#f87171", Trust:"#5eead4", Other:"#94a3b8"
};

// ─── Party colors (matching AudienceROI) ───
const PARTY_COLOR = { GOP: "#e57373", DEM: "#64b5f6" };

function getSopC(v){
  if(v>=13)return{bg:"#065f46",t:"#6ee7b7"};
  if(v>=10)return{bg:"#064e3b",t:"#6ee7b7"};
  if(v>=7)return{bg:"#1a3a2a",t:"#a7f3d0"};
  if(v>=6)return{bg:"#1e293b",t:"#cbd5e1"};
  if(v>=5)return{bg:"#1a1f2e",t:"#94a3b8"};
  if(v>=4)return{bg:"#1a1520",t:"#94a3b8"};
  if(v>=3)return{bg:"#1f1318",t:"#f9a8a8"};
  return{bg:"#2d1215",t:"#fca5a5"};
}

function Tooltip({msg,x,y}){
  return(
    <div style={{position:"fixed",left:Math.min(x+12,window.innerWidth-420),top:Math.max(y-80,8),width:400,background:"#111827",border:"1px solid #334155",borderRadius:6,padding:12,zIndex:9999,pointerEvents:"none",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontFamily:"'Poppins',sans-serif",fontSize:13,fontWeight:700,color:"#e2e8f0",textTransform:"uppercase"}}>{msg.shortName}</span>
      </div>
      <div style={{fontSize:11,color:"#cbd5e1",lineHeight:1.6,fontStyle:"italic"}}>"{msg.text}"</div>
    </div>
  );
}

export default function MessageMap(){
  const [sortCol,setSortCol]=useState(null);
  const [tooltip,setTooltip]=useState(null);
  const [study,setStudy]=useState("ESI");
  const [hoverRow,setHoverRow]=useState(null);
  const [hoverCol,setHoverCol]=useState(null);

  const MESSAGES = DATA[study].messages;

  const sorted=useMemo(()=>{
    const ix=MESSAGES.map((m,i)=>({...m,idx:i}));
    if(sortCol===null)return ix;
    return[...ix].sort((a,b)=>MESSAGES[b.idx].sop[sortCol]-MESSAGES[a.idx].sop[sortCol]);
  },[sortCol,study,MESSAGES]);

  // SoP column indices: 0=Total, 1-16=segments, 17=PE
  const totalIdx = 0;
  const segStartIdx = 1;
  const peIdx = 17;

  // ─── Highlight helpers ───
  const isColActive = (colIdx) => hoverCol === colIdx;
  const isRowActive = (rowKey) => hoverRow === rowKey;
  const colHighlight = (colIdx) => isColActive(colIdx) ? "rgba(96,165,250,0.08)" : "transparent";

  return(
    <div style={{maxWidth:1650,margin:"0 auto",color:"#e2e8f0"}}>
      {/* Description */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:"#94a3b8",maxWidth:1100,lineHeight:1.5}}>
          <strong style={{color:"#cbd5e1"}}>Share of Preference</strong> heatmap <span style={{color:"#64748b"}}>(a measure from a discrete choice model depicting how likely a message is chosen as the most compelling relative to other messages)</span> · 15-item MaxDiff · 16 PRISM segments + Policy Elites.
        </div>
      </div>
      {/* Study toggle */}
      <div style={{display:"flex",gap:4,marginBottom:10,alignItems:"center"}}>
        {[{k:"ESI",l:"ESI STUDY"},{k:"MA",l:"MA STUDY"}].map(s=>(
          <button key={s.k} onClick={()=>{setStudy(s.k);setSortCol(null);}} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:0.5,padding:"5px 14px",border:"1px solid",borderRadius:4,cursor:"pointer",borderColor:study===s.k?"#60a5fa":"#1e293b",background:study===s.k?"#1e3a5f":"#111827",color:study===s.k?"#93c5fd":"#64748b",transition:"all 0.15s"}}>{s.l}</button>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"#475569",letterSpacing:1}}>SoP:</span>
        {[{l:"≤6",bg:"#2d1215"},{l:"7-8",bg:"#1a1520"},{l:"9-10",bg:"#1e293b"},{l:"11-12",bg:"#064e3b"},{l:"≥13",bg:"#065f46"}].map((h,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:2}}><div style={{width:10,height:10,borderRadius:2,background:h.bg,border:"1px solid #1e293b"}}/><span style={{fontSize:7,color:"#94a3b8"}}>{h.l}</span></div>))}
        <span style={{marginLeft:10,fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"#475569",letterSpacing:1}}>THEME:</span>
        {Object.entries(THEME_COLORS).filter(([t])=>t!=="Other").map(([t,c])=>(<div key={t} style={{display:"flex",alignItems:"center",gap:2}}><div style={{width:6,height:6,borderRadius:"50%",background:c}}/><span style={{fontSize:7,color:"#94a3b8"}}>{t}</span></div>))}
      </div>

      {/* Heatmap table */}
      <div style={{overflowX:"auto",marginBottom:2}}>
        <table style={{width:"100%",borderCollapse:"separate",borderSpacing:1,fontSize:11}}>
          <thead>
            {/* ─── ROW 1: Party group headers ─── */}
            <tr>
              <th colSpan={3} style={{background:"#111827",padding:2}}/>
              <th style={{background:"#0a1a0a",color:"#34d399",fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:2,padding:"3px 0",textAlign:"center",borderBottom:"2px solid #34d399"}}>TOTAL</th>
              <th colSpan={10} style={{background:"#1a0a0a",color:"#f87171",fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:2,padding:"3px 0",textAlign:"center",borderBottom:"2px solid #f87171"}}>REPUBLICAN</th>
              <th colSpan={6} style={{background:"#0a0a1a",color:"#60a5fa",fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:2,padding:"3px 0",textAlign:"center",borderBottom:"2px solid #60a5fa"}}>DEMOCRAT</th>
              <th style={{background:"#1a0a2a",color:"#a78bfa",fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:2,padding:"3px 0",textAlign:"center",borderBottom:"2px solid #a78bfa"}}>ELITE</th>
            </tr>

            {/* ─── ROW 2: Segment headers (AudienceROI style) ─── */}
            <tr>
              <th style={{background:"#111827",width:24,padding:2}}/>
              <th style={{background:"#111827",textAlign:"left",width:140,fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"#64748b",padding:"2px 4px",verticalAlign:"bottom"}}>MESSAGE</th>
              <th style={{background:"#111827",width:40,fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"#64748b",padding:2,verticalAlign:"bottom"}}>THEME</th>

              {/* ── TOTAL column header ── */}
              <th
                onClick={()=>setSortCol(sortCol===totalIdx?null:totalIdx)}
                onMouseEnter={()=>setHoverCol(totalIdx)}
                onMouseLeave={()=>setHoverCol(null)}
                style={{
                  background: sortCol===totalIdx ? "#1a2332" : "#0a1208",
                  minWidth:62, padding:"8px 2px 6px", cursor:"pointer",
                  verticalAlign:"bottom", textAlign:"center",
                  borderBottom: sortCol===totalIdx ? "2px solid #60a5fa" : "2px solid transparent",
                  transition:"all 0.15s",
                }}
              >
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  {/* Circle badge */}
                  <div style={{
                    width:30,height:30,borderRadius:"50%",border:"2px solid #34d399",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:7,fontWeight:800,color:"#34d399",
                    fontFamily:"'JetBrains Mono',monospace",
                    background: sortCol===totalIdx ? "rgba(52,211,153,0.12)" : "transparent"
                  }}>ALL</div>
                  {/* Name */}
                  <div style={{
                    fontSize:6,fontWeight:700,color:"#34d399",
                    fontFamily:"'JetBrains Mono',monospace",textAlign:"center",
                    lineHeight:1.2
                  }}>TOTAL</div>
                  {/* Sort indicator */}
                  {sortCol===totalIdx && <div style={{fontSize:7,color:"#60a5fa"}}>▼</div>}
                </div>
              </th>

              {/* ── SEGMENT column headers ── */}
              {SEGMENTS.map((seg,si)=>{
                const colIdx = si+segStartIdx;
                const isSorted = sortCol===colIdx;
                const pc = PARTY_COLOR[seg.party] || "#cbd5e1";
                return(
                  <th
                    key={seg.id}
                    onClick={()=>setSortCol(isSorted?null:colIdx)}
                    onMouseEnter={()=>setHoverCol(colIdx)}
                    onMouseLeave={()=>setHoverCol(null)}
                    style={{
                      background: isSorted ? "#1a2332" : "#000",
                      minWidth:68, padding:"8px 2px 6px", cursor:"pointer",
                      verticalAlign:"bottom", textAlign:"center",
                      borderBottom: isSorted ? "2px solid #60a5fa" : "2px solid transparent",
                      transition:"all 0.15s",
                    }}
                  >
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      {/* Circle badge — matches AudienceROI */}
                      <div style={{
                        width:30,height:30,borderRadius:"50%",border:`2px solid ${pc}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:7,fontWeight:800,color:pc,
                        fontFamily:"'JetBrains Mono',monospace",
                        background: isSorted ? `${pc}18` : "transparent"
                      }}>{seg.code || seg.id}</div>
                      {/* Full segment name */}
                      <div style={{
                        fontSize:6,fontWeight:700,color:pc,
                        fontFamily:"'JetBrains Mono',monospace",textAlign:"center",
                        lineHeight:1.2,minHeight:22,display:"flex",alignItems:"center",
                        justifyContent:"center",padding:"0 1px"
                      }}>{seg.name.toUpperCase()}</div>
                      {/* Population */}
                      <div style={{
                        fontSize:7,color:"#64748b",
                        fontFamily:"'JetBrains Mono',monospace"
                      }}>{seg.pop}%</div>
                      {/* Sort indicator */}
                      {isSorted && <div style={{fontSize:7,color:"#60a5fa"}}>▼</div>}
                    </div>
                  </th>
                );
              })}

              {/* ── PE column header ── */}
              <th
                onClick={()=>setSortCol(sortCol===peIdx?null:peIdx)}
                onMouseEnter={()=>setHoverCol(peIdx)}
                onMouseLeave={()=>setHoverCol(null)}
                style={{
                  background: sortCol===peIdx ? "#1a2332" : "#0d0520",
                  minWidth:62, padding:"8px 2px 6px", cursor:"pointer",
                  verticalAlign:"bottom", textAlign:"center",
                  borderBottom: sortCol===peIdx ? "2px solid #60a5fa" : "2px solid transparent",
                  transition:"all 0.15s",
                }}
              >
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{
                    width:30,height:30,borderRadius:"50%",border:"2px solid #a78bfa",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:7,fontWeight:800,color:"#a78bfa",
                    fontFamily:"'JetBrains Mono',monospace",
                    background: sortCol===peIdx ? "rgba(167,139,250,0.12)" : "transparent"
                  }}>PE</div>
                  <div style={{
                    fontSize:6,fontWeight:700,color:"#a78bfa",
                    fontFamily:"'JetBrains Mono',monospace",textAlign:"center",
                    lineHeight:1.2
                  }}>POLICY<br/>ELITES</div>
                  {sortCol===peIdx && <div style={{fontSize:7,color:"#60a5fa"}}>▼</div>}
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((msg,ri)=>{
              const sop = MESSAGES[msg.idx].sop;
              const rowActive = isRowActive(msg.id);
              const rowBrightness = rowActive ? "brightness(1.18)" : "brightness(1)";

              return(
              <tr
                key={msg.id}
                onMouseEnter={()=>setHoverRow(msg.id)}
                onMouseLeave={()=>setHoverRow(null)}
                style={{filter:rowBrightness,transition:"filter 0.1s"}}
              >
                {/* Row # */}
                <td style={{background:"#111827",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"#64748b",fontWeight:700,padding:2}}>{msg.id}</td>

                {/* Message name — TOOLTIP ONLY HERE */}
                <td
                  onMouseEnter={e=>setTooltip({msg,x:e.clientX,y:e.clientY})}
                  onMouseMove={e=>setTooltip(t2=>t2?{...t2,x:e.clientX,y:e.clientY}:null)}
                  onMouseLeave={()=>setTooltip(null)}
                  style={{
                    background: rowActive ? "#1a2030" : "#111827",
                    fontFamily:"'Poppins',sans-serif",fontSize:11,color:"#cbd5e1",
                    fontWeight:600,padding:"3px 4px",whiteSpace:"nowrap",cursor:"help",
                    borderLeft: rowActive ? "2px solid #60a5fa" : "2px solid transparent",
                    transition:"all 0.1s"
                  }}
                >{msg.shortName}</td>

                {/* Theme badge */}
                <td style={{background: rowActive ? "#1a2030" : "#111827",textAlign:"center",padding:2}}>
                  <span style={{fontSize:6,fontFamily:"'JetBrains Mono',monospace",padding:"1px 4px",borderRadius:3,background:"rgba(0,0,0,0.3)",color:THEME_COLORS[msg.theme]||"#94a3b8",fontWeight:600}}>{(msg.theme||"").toUpperCase()}</span>
                </td>

                {/* ── Total cell ── */}
                {(()=>{const val=sop[totalIdx],{bg,t:tx}=getSopC(val),isSel=sortCol===totalIdx,isHovC=isColActive(totalIdx);return(
                  <td
                    onMouseEnter={()=>setHoverCol(totalIdx)}
                    onMouseLeave={()=>setHoverCol(null)}
                    style={{
                      textAlign:"center",borderRadius:2,
                      background: isHovC||isSel ? `${bg}` : bg,
                      fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:12,color:tx,
                      padding:"6px 2px",minWidth:62,
                      opacity: (isSel||isHovC||rowActive) ? 1 : 0.85,
                      transition:"all 0.1s",
                      borderLeft:"2px solid #34d399",borderRight:"2px solid #1e293b",
                      boxShadow: (isHovC&&rowActive) ? "inset 0 0 0 1px rgba(96,165,250,0.5)" : "none"
                    }}>{val.toFixed(1)}</td>
                )})()}

                {/* ── Segment cells ── */}
                {SEGMENTS.map((seg,si)=>{const colIdx=si+segStartIdx;const val=sop[colIdx],{bg,t:tx}=getSopC(val),isSel=sortCol===colIdx,isHovC=isColActive(colIdx);return(
                  <td key={seg.id}
                    onMouseEnter={()=>setHoverCol(colIdx)}
                    onMouseLeave={()=>setHoverCol(null)}
                    style={{
                      textAlign:"center",borderRadius:2,
                      background: isHovC||isSel ? `${bg}` : bg,
                      fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:12,color:tx,
                      padding:"6px 2px",minWidth:68,
                      opacity: (isSel||isHovC||rowActive) ? 1 : 0.85,
                      transition:"all 0.1s",
                      boxShadow: (isHovC&&rowActive) ? "inset 0 0 0 1px rgba(96,165,250,0.5)" : "none"
                    }}>{val.toFixed(1)}</td>
                )})}

                {/* ── PE cell ── */}
                {(()=>{const val=sop[peIdx],{bg,t:tx}=getSopC(val),isSel=sortCol===peIdx,isHovC=isColActive(peIdx);return(
                  <td
                    onMouseEnter={()=>setHoverCol(peIdx)}
                    onMouseLeave={()=>setHoverCol(null)}
                    style={{
                      textAlign:"center",borderRadius:2,
                      background: isHovC||isSel ? `${bg}` : bg,
                      fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:12,color:tx,
                      padding:"6px 2px",minWidth:62,
                      opacity: (isSel||isHovC||rowActive) ? 1 : 0.85,
                      transition:"all 0.1s",
                      borderLeft:"2px solid #a78bfa",
                      boxShadow: (isHovC&&rowActive) ? "inset 0 0 0 1px rgba(96,165,250,0.5)" : "none"
                    }}>{val.toFixed(1)}</td>
                )})()}
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      {tooltip&&<Tooltip msg={tooltip.msg} x={tooltip.x} y={tooltip.y}/>}
    </div>
  );
}
