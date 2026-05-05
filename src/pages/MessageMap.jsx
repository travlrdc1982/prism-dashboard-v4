import React, { useState, useMemo } from "react";
import DATA from "../data/studyData";
import { MESSAGES as AL_MESSAGES, CONTROL_SOP, VARIANT_SOP, TOTAL_SOP, TOTAL_TOTALS, CONTROL_TOTALS, VARIANT_TOTALS } from "../data/study";

// ─── SEGMENTS from shared data ───
const SEGMENTS = DATA.segments;

// ─── Build AL message objects from study.js ───
const SEG_POPS = SEGMENTS.map(s => s.pop);
const POP_TOTAL = SEG_POPS.reduce((a, b) => a + b, 0);

function buildAlMessages(sopMatrix, totalsArray, useVariants) {
  return AL_MESSAGES.map((m, i) => {
    const segSops = sopMatrix[i];
    const text = useVariants
      ? (Object.values(m.variants || {})[0] || m.control)
      : m.control;
    return {
      id: m.id,
      shortName: m.shortName,
      text,
      theme: m.theme,
      sop: [totalsArray[i], ...segSops],
      variants: m.variants,
      control: m.control,
    };
  });
}

// ─── Theme colors ───
const THEME_COLORS = {
  Leadership:"#a78bfa", Security:"#f87171", Economy:"#34d399",
  Innovation:"#60a5fa", Patient:"#fbbf24", Other:"#94a3b8"
};

// ─── Party colors ───
const PARTY_COLOR = { GOP: "#e57373", DEM: "#64b5f6" };

const SOP_COLORS = [
  { bg:"#2d1215", t:"#fca5a5" },  // p0-10  — deep red
  { bg:"#1f1318", t:"#f9a8a8" },  // p10-25 — red
  { bg:"#1a1520", t:"#94a3b8" },  // p25-40 — muted dark
  { bg:"#1e293b", t:"#cbd5e1" },  // p40-60 — neutral (median band)
  { bg:"#1a3a2a", t:"#a7f3d0" },  // p60-75 — light green
  { bg:"#064e3b", t:"#6ee7b7" },  // p75-90 — green
  { bg:"#065f46", t:"#6ee7b7" },  // p90+   — deep green
];
const PERCENTILE_BREAKS = [0.10, 0.25, 0.40, 0.60, 0.75, 0.90];

function buildColorScale(sopMatrix) {
  const all = sopMatrix.flat().filter(v => v != null).sort((a, b) => a - b);
  if (!all.length) return () => SOP_COLORS[3];
  const breakpoints = PERCENTILE_BREAKS.map(p => all[Math.floor(p * (all.length - 1))]);
  return (v) => {
    for (let i = 0; i < breakpoints.length; i++) {
      if (v < breakpoints[i]) return SOP_COLORS[i];
    }
    return SOP_COLORS[SOP_COLORS.length - 1];
  };
}

// Variant keys in study.js use spreadsheet column numbers, not segment IDs.
// This maps segment ID → variant key for the mismatched segments.
const SEG_TO_VARIANT = { 1:10, 2:1, 4:7, 7:4, 8:2, 10:8 };

function Tooltip({ msg, x, y, segIdx, isVariant }) {
  let displayText = msg.text;
  let variantLabel = null;
  if (isVariant && segIdx != null && msg.variants) {
    const segId = SEGMENTS[segIdx]?.id;
    const variantKey = SEG_TO_VARIANT[segId] || segId;
    if (variantKey && msg.variants[variantKey]) {
      displayText = msg.variants[variantKey];
      variantLabel = `Segment ${SEGMENTS[segIdx].code} variant`;
    } else {
      displayText = msg.control || msg.text;
      variantLabel = "Control (no segment variant)";
    }
  }
  return (
    <div style={{ position:"fixed", left:Math.min(x + 12, window.innerWidth - 420), top:Math.max(y - 80, 8), width:400, background:"#111827", border:"1px solid #334155", borderRadius:6, padding:12, zIndex:9999, pointerEvents:"none", boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700, color:"#e2e8f0", textTransform:"uppercase" }}>{msg.shortName}</span>
        {variantLabel && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#a78bfa", background:"#2d1b69", padding:"2px 6px", borderRadius:3 }}>{variantLabel}</span>}
      </div>
      <div style={{ fontSize:11, color:"#cbd5e1", lineHeight:1.6, fontStyle:"italic" }}>"{displayText}"</div>
    </div>
  );
}

export default function MessageMap() {
  const [sortCol, setSortCol] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [variantMode, setVariantMode] = useState("total");
  const [hoverRow, setHoverRow] = useState(null);
  const [hoverCol, setHoverCol] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const isVariant = variantMode === "persona";
  const isTotal = variantMode === "total";
  const sopMatrix = isTotal ? TOTAL_SOP : isVariant ? VARIANT_SOP : CONTROL_SOP;
  const totalsArray = isTotal ? TOTAL_TOTALS : isVariant ? VARIANT_TOTALS : CONTROL_TOTALS;
  const MESSAGES = buildAlMessages(sopMatrix, totalsArray, isVariant);
  const getSopC = useMemo(() => buildColorScale(sopMatrix), [sopMatrix]);

  const sorted = useMemo(() => {
    const ix = MESSAGES.map((m, i) => ({ ...m, idx: i }));
    if (sortCol === null) return ix;
    return [...ix].sort((a, b) => MESSAGES[b.idx].sop[sortCol] - MESSAGES[a.idx].sop[sortCol]);
  }, [sortCol, variantMode, MESSAGES]);

  const totalIdx = 0;
  const segStartIdx = 1;

  const isColActive = (colIdx) => hoverCol === colIdx;
  const isRowActive = (rowKey) => hoverRow === rowKey;

  return (
    <div style={{ maxWidth:1650, margin:"0 auto", color:"#e2e8f0" }}>
      {/* Description */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, color:"#94a3b8", maxWidth:1100, lineHeight:1.5 }}>
          <strong style={{ color:"#cbd5e1" }}>Share of Preference</strong> heatmap <span style={{ color:"#64748b" }}>(a measure from a discrete choice model depicting how likely a message is chosen as the most compelling relative to other messages)</span> · 11-item MaxDiff · 16 PRISM segments.
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display:"flex", gap:4, marginBottom:10, alignItems:"center" }}>
        {[{ k:"total", l:"TOTAL" }, { k:"control", l:"CONTROL" }, { k:"persona", l:"PERSONA VARIANTS" }].map(v => {
          const active = variantMode === v.k;
          const accent = v.k === "total" ? { border:"#34d399", bg:"#064e3b", text:"#6ee7b7" }
            : { border:"#a78bfa", bg:"#2d1b69", text:"#c4b5fd" };
          return (
            <button key={v.k} onClick={() => { setVariantMode(v.k); setSortCol(null); setExpandedRows({}); }} style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:0.5,
              padding:"5px 14px", border:"1px solid", borderRadius:4, cursor:"pointer",
              borderColor: active ? accent.border : "#1e293b",
              background: active ? accent.bg : "#111827",
              color: active ? accent.text : "#64748b",
              transition:"all 0.15s"
            }}>{v.l}</button>
          );
        })}
        {isVariant && (
          <span style={{ fontSize:8, color:"#a78bfa", fontFamily:"'JetBrains Mono',monospace", marginLeft:8 }}>
            Hover a segment column to see its tailored variant text
          </span>
        )}
        {isTotal && (
          <span style={{ fontSize:8, color:"#34d399", fontFamily:"'JetBrains Mono',monospace", marginLeft:8 }}>
            Click a row to expand the full message text
          </span>
        )}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"#475569", letterSpacing:1 }}>SoP PERCENTILE:</span>
        {[{ l:"Bottom 10%", bg:"#2d1215" }, { l:"10-25%", bg:"#1f1318" }, { l:"25-40%", bg:"#1a1520" }, { l:"40-60%", bg:"#1e293b" }, { l:"60-75%", bg:"#1a3a2a" }, { l:"75-90%", bg:"#064e3b" }, { l:"Top 10%", bg:"#065f46" }].map((h, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:2 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:h.bg, border:"1px solid #1e293b" }} />
            <span style={{ fontSize:7, color:"#94a3b8" }}>{h.l}</span>
          </div>
        ))}
        <span style={{ marginLeft:10, fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"#475569", letterSpacing:1 }}>THEME:</span>
        {Object.entries(THEME_COLORS).filter(([t]) => t !== "Other").map(([t, c]) => (
          <div key={t} style={{ display:"flex", alignItems:"center", gap:2 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:c }} />
            <span style={{ fontSize:7, color:"#94a3b8" }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Heatmap table */}
      <div style={{ overflowX:"auto", marginBottom:2 }}>
        <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:1, fontSize:11 }}>
          <thead>
            {/* ─── ROW 1: Party group headers ─── */}
            <tr>
              <th colSpan={3} style={{ background:"#111827", padding:2 }} />
              <th style={{ background:"#0a1a0a", color:"#34d399", fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:2, padding:"3px 0", textAlign:"center", borderBottom:"2px solid #34d399" }}>TOTAL</th>
              <th colSpan={10} style={{ background:"#1a0a0a", color:"#f87171", fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:2, padding:"3px 0", textAlign:"center", borderBottom:"2px solid #f87171" }}>REPUBLICAN</th>
              <th colSpan={6} style={{ background:"#0a0a1a", color:"#60a5fa", fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:2, padding:"3px 0", textAlign:"center", borderBottom:"2px solid #60a5fa" }}>DEMOCRAT</th>
            </tr>

            {/* ─── ROW 2: Segment headers ─── */}
            <tr>
              <th style={{ background:"#111827", width:24, padding:2 }} />
              <th style={{ background:"#111827", textAlign:"left", width:140, fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"#64748b", padding:"2px 4px", verticalAlign:"bottom" }}>MESSAGE</th>
              <th style={{ background:"#111827", width:40, fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"#64748b", padding:2, verticalAlign:"bottom" }}>THEME</th>

              {/* ── TOTAL column header ── */}
              <th
                onClick={() => setSortCol(sortCol === totalIdx ? null : totalIdx)}
                onMouseEnter={() => setHoverCol(totalIdx)}
                onMouseLeave={() => setHoverCol(null)}
                style={{
                  background: sortCol === totalIdx ? "#1a2332" : "#0a1208",
                  minWidth:62, padding:"8px 2px 6px", cursor:"pointer",
                  verticalAlign:"bottom", textAlign:"center",
                  borderBottom: sortCol === totalIdx ? "2px solid #60a5fa" : "2px solid transparent",
                  transition:"all 0.15s",
                }}
              >
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                  <div style={{
                    width:30, height:30, borderRadius:"50%", border:"2px solid #34d399",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:7, fontWeight:800, color:"#34d399",
                    fontFamily:"'JetBrains Mono',monospace",
                    background: sortCol === totalIdx ? "rgba(52,211,153,0.12)" : "transparent"
                  }}>ALL</div>
                  <div style={{
                    fontSize:6, fontWeight:700, color:"#34d399",
                    fontFamily:"'JetBrains Mono',monospace", textAlign:"center",
                    lineHeight:1.2
                  }}>TOTAL</div>
                  {sortCol === totalIdx && <div style={{ fontSize:7, color:"#60a5fa" }}>▼</div>}
                </div>
              </th>

              {/* ── SEGMENT column headers ── */}
              {SEGMENTS.map((seg, si) => {
                const colIdx = si + segStartIdx;
                const isSorted = sortCol === colIdx;
                const pc = PARTY_COLOR[seg.party] || "#cbd5e1";
                return (
                  <th
                    key={seg.id}
                    onClick={() => setSortCol(isSorted ? null : colIdx)}
                    onMouseEnter={() => setHoverCol(colIdx)}
                    onMouseLeave={() => setHoverCol(null)}
                    style={{
                      background: isSorted ? "#1a2332" : "#000",
                      minWidth:68, padding:"8px 2px 6px", cursor:"pointer",
                      verticalAlign:"bottom", textAlign:"center",
                      borderBottom: isSorted ? "2px solid #60a5fa" : "2px solid transparent",
                      transition:"all 0.15s",
                    }}
                  >
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                      <div style={{
                        width:30, height:30, borderRadius:"50%", border:`2px solid ${pc}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:7, fontWeight:800, color:pc,
                        fontFamily:"'JetBrains Mono',monospace",
                        background: isSorted ? `${pc}18` : "transparent"
                      }}>{seg.code || seg.id}</div>
                      <div style={{
                        fontSize:6, fontWeight:700, color:pc,
                        fontFamily:"'JetBrains Mono',monospace", textAlign:"center",
                        lineHeight:1.2, minHeight:22, display:"flex", alignItems:"center",
                        justifyContent:"center", padding:"0 1px"
                      }}>{seg.name.toUpperCase()}</div>
                      <div style={{
                        fontSize:7, color:"#64748b",
                        fontFamily:"'JetBrains Mono',monospace"
                      }}>{seg.pop}%</div>
                      {isSorted && <div style={{ fontSize:7, color:"#60a5fa" }}>▼</div>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {sorted.map((msg) => {
              const sop = MESSAGES[msg.idx].sop;
              const rowActive = isRowActive(msg.id);
              const rowBrightness = rowActive ? "brightness(1.18)" : "brightness(1)";
              const isExpanded = !!expandedRows[msg.id];

              const toggleExpand = () => setExpandedRows(prev => ({ ...prev, [msg.id]: !prev[msg.id] }));

              return (
              <React.Fragment key={msg.id}>
              <tr
                onMouseEnter={() => setHoverRow(msg.id)}
                onMouseLeave={() => setHoverRow(null)}
                style={{ filter:rowBrightness, transition:"filter 0.1s" }}
              >
                {/* Row # */}
                <td style={{ background:"#111827", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"#64748b", fontWeight:700, padding:2 }}>
                  {isTotal ? (
                    <span onClick={toggleExpand} style={{ cursor:"pointer", display:"inline-block", transition:"transform 0.2s", transform:isExpanded?"rotate(90deg)":"rotate(0deg)", fontSize:9, color:"#34d399" }}>▸</span>
                  ) : msg.id}
                </td>

                {/* Message name */}
                <td
                  onClick={isTotal ? toggleExpand : undefined}
                  onMouseEnter={!isTotal ? (e => setTooltip({ msg, x:e.clientX, y:e.clientY, segIdx:null })) : undefined}
                  onMouseMove={!isTotal ? (e => setTooltip(t2 => t2 ? { ...t2, x:e.clientX, y:e.clientY } : null)) : undefined}
                  onMouseLeave={!isTotal ? (() => setTooltip(null)) : undefined}
                  style={{
                    background: rowActive ? "#1a2030" : "#111827",
                    fontFamily:"'Poppins',sans-serif", fontSize:11, color:"#cbd5e1",
                    fontWeight:600, padding:"3px 4px", whiteSpace:"nowrap",
                    cursor: isTotal ? "pointer" : "help",
                    borderLeft: rowActive ? "2px solid #60a5fa" : "2px solid transparent",
                    transition:"all 0.1s"
                  }}
                >{msg.shortName}</td>

                {/* Theme badge */}
                <td style={{ background: rowActive ? "#1a2030" : "#111827", textAlign:"center", padding:2 }}>
                  <span style={{ fontSize:6, fontFamily:"'JetBrains Mono',monospace", padding:"1px 4px", borderRadius:3, background:"rgba(0,0,0,0.3)", color:THEME_COLORS[msg.theme] || "#94a3b8", fontWeight:600 }}>{(msg.theme || "").toUpperCase()}</span>
                </td>

                {/* ── Total cell ── */}
                {(() => { const val = sop[totalIdx], { bg, t: tx } = getSopC(val), isSel = sortCol === totalIdx, isHovC = isColActive(totalIdx); return (
                  <td
                    onMouseEnter={() => setHoverCol(totalIdx)}
                    onMouseLeave={() => setHoverCol(null)}
                    style={{
                      textAlign:"center", borderRadius:2,
                      background: isHovC || isSel ? `${bg}` : bg,
                      fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:12, color:tx,
                      padding:"6px 2px", minWidth:62,
                      opacity: (isSel || isHovC || rowActive) ? 1 : 0.85,
                      transition:"all 0.1s",
                      borderLeft:"2px solid #34d399", borderRight:"2px solid #1e293b",
                      boxShadow: (isHovC && rowActive) ? "inset 0 0 0 1px rgba(96,165,250,0.5)" : "none"
                    }}>{val.toFixed(1)}</td>
                ); })()}

                {/* ── Segment cells ── */}
                {SEGMENTS.map((seg, si) => { const colIdx = si + segStartIdx; const val = sop[colIdx], { bg, t: tx } = getSopC(val), isSel = sortCol === colIdx, isHovC = isColActive(colIdx); return (
                  <td key={seg.id}
                    onMouseEnter={!isTotal ? (e => { setHoverCol(colIdx); setTooltip({ msg, x:e.clientX, y:e.clientY, segIdx:si }); }) : (() => setHoverCol(colIdx))}
                    onMouseMove={!isTotal ? (e => setTooltip(t2 => t2 ? { ...t2, x:e.clientX, y:e.clientY } : null)) : undefined}
                    onMouseLeave={() => { setHoverCol(null); if (!isTotal) setTooltip(null); }}
                    style={{
                      textAlign:"center", borderRadius:2,
                      background: isHovC || isSel ? `${bg}` : bg,
                      fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:12, color:tx,
                      padding:"6px 2px", minWidth:68,
                      opacity: (isSel || isHovC || rowActive) ? 1 : 0.85,
                      transition:"all 0.1s",
                      boxShadow: (isHovC && rowActive) ? "inset 0 0 0 1px rgba(96,165,250,0.5)" : "none",
                      cursor: isVariant ? "help" : "default"
                    }}>{val.toFixed(1)}</td>
                ); })}
              </tr>
              {/* ── Expanded message text row (TOTAL mode only) ── */}
              {isTotal && isExpanded && (
                <tr>
                  <td colSpan={3 + 1 + SEGMENTS.length} style={{
                    background:"#0d1118", padding:"10px 16px", borderLeft:"2px solid #34d399",
                    borderBottom:"1px solid #1e293b"
                  }}>
                    <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.7, fontFamily:"'Poppins',sans-serif", maxWidth:1200 }}>
                      <span style={{ fontSize:8, fontWeight:700, color:"#34d399", fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, display:"block", marginBottom:4 }}>CORE MESSAGE</span>
                      "{msg.control || msg.text}"
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {!isTotal && tooltip && <Tooltip msg={tooltip.msg} x={tooltip.x} y={tooltip.y} segIdx={tooltip.segIdx} isVariant={isVariant} />}
    </div>
  );
}
