import { useEffect, useMemo, useState } from "react";
import { emptyTraceNodes } from "../../hooks/useAgentTrace";
import "./AgentTraceVisualizer.css";

const META = {
  router: { label: "Router", icon: "✦", x: 145, y: 165, tone: "cyan" }, retrieve: { label: "Retrieve", icon: "⌕", x: 355, y: 305, tone: "cyan" }, grade: { label: "Grade", icon: "✓", x: 555, y: 135, tone: "amber" }, rewrite: { label: "Rewrite", icon: "↻", x: 450, y: 390, tone: "amber" }, generate: { label: "Generate", icon: "✧", x: 755, y: 245, tone: "blue" },
};
const ORDER = ["router", "retrieve", "grade", "rewrite", "generate"];
const curves = { input: "M -15 70 C 34 74 50 118 118 151", retrieve: "M 172 180 C 226 203 257 300 328 303", grade: "M 383 284 C 430 236 479 141 529 144", rewrite: "M 548 163 C 534 237 496 322 467 362", retry: "M 422 370 C 324 430 250 398 323 326", generate: "M 581 148 C 648 134 679 221 728 235", output: "M 782 232 C 849 196 885 131 962 143" };

function details(key, state, labels) { const data = state?.data || {};
  if (data.summary) return { title: labels[key] || META[key].label, rows: [data.summary], foot: "Completed feature stage" };
  if (key === "retrieve") return { title: data.chunkCount ? `${data.chunkCount} matched study sections` : "Retrieval activity", rows: data.previews?.length ? data.previews.map((x, i) => `Chunk ${i + 1}: ${x}`) : [state?.detail], foot: data.sources?.length ? `Sources: ${data.sources.join(" · ")}` : "" };
  if (key === "grade") return { title: data.passed ? "Evidence accepted" : "Evidence check", rows: [state?.detail], foot: typeof data.attempt === "number" ? `Review pass ${data.attempt + 1}` : "" };
  if (key === "rewrite") return { title: "Search refinement", rows: [data.rewrittenQuery || state?.detail], foot: "Used for the retry retrieval" };
  if (key === "generate") return { title: "Answer composition", rows: [data.preview || state?.detail], foot: data.length ? `${data.length.toLocaleString()} characters generated` : "" };
  return { title: "Routing decision", rows: [state?.detail], foot: data.retrieval_needed ? "Path: study-material retrieval" : "Path: direct response" };
}
function Packet({ route, visible, warm = false }) { return visible ? <circle r="4" className={`trace-packet ${warm ? "trace-packet--warm" : ""}`}><animateMotion dur="1.7s" repeatCount="indefinite" path={curves[route]} /></circle> : null; }

export default function AgentTraceVisualizer({ nodes: suppliedNodes, isActive = false, heading = "How Prism built this answer", nodeLabels = {} }) {
  const nodes = suppliedNodes || emptyTraceNodes(); const activeNode = ORDER.find((key) => nodes[key]?.status === "active"); const [focused, setFocused] = useState(null);
  useEffect(() => {
    if (!activeNode) return undefined;
    const frame = requestAnimationFrame(() => setFocused(activeNode));
    return () => cancelAnimationFrame(frame);
  }, [activeNode]);
  const retrying = nodes.rewrite?.status !== "pending"; const retrievalUsed = nodes.retrieve?.status !== "pending"; const complete = nodes.generate?.status === "done";
  const info = useMemo(() => focused ? details(focused, nodes[focused], nodeLabels) : null, [focused, nodes, nodeLabels]);
  return <section className={`trace-canvas ${isActive ? "trace-canvas--live" : ""}`} aria-label="Prism answer path">
    <div className="trace-canvas__grid" /><div className="trace-canvas__glow" />
    <header className="trace-canvas__header"><div><span className="trace-canvas__kicker"><i /> PRISM INTELLIGENCE FLOW</span><strong>{isActive ? "Working through your answer" : heading}</strong></div><span className="trace-canvas__legend">{isActive ? "LIVE" : "REPLAY"} <b /></span></header>
    <div className="trace-canvas__scene"><svg viewBox="0 0 1080 480" role="img" aria-label="Animated retrieval and answer-generation path"><defs><filter id="neon"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path d={curves.input} className="trace-link trace-link--input is-lit" />
      {retrievalUsed && <><path d={curves.retrieve} className="trace-link is-lit" /><path d={curves.grade} className="trace-link is-lit" /></>}{retrying && <><path d={curves.rewrite} className="trace-link trace-link--retry is-lit" /><path d={curves.retry} className="trace-link trace-link--retry is-lit" /></>}
      <path d={curves.generate} className={`trace-link ${nodes.generate?.status !== "pending" ? "is-lit" : ""}`} />{complete && <path d={curves.output} className="trace-link trace-link--output is-lit" />}
      <Packet route="input" visible /><Packet route="retrieve" visible={retrievalUsed} /><Packet route="grade" visible={retrievalUsed} /><Packet route="rewrite" visible={retrying} warm /><Packet route="retry" visible={retrying} warm /><Packet route="generate" visible={nodes.generate?.status !== "pending"} /><Packet route="output" visible={complete} />
      <g className="trace-query"><rect x="15" y="34" width="170" height="42" rx="13"/><text x="31" y="59">Your question</text><path d="M 167 73 l 12 12"/></g>
      {ORDER.map((key) => { const meta = META[key]; const state = nodes[key] || {}; if (key === "rewrite" && !retrying) return null; return <g key={key} onClick={() => setFocused(key)} className={`trace-node trace-node--${meta.tone} ${state.status || "pending"} ${focused === key ? "is-focused" : ""}`} transform={`translate(${meta.x},${meta.y})`} role="button" tabIndex="0">{state.status === "active" && <circle className="trace-node__ring" r="45"/>}<circle className="trace-node__halo" r="34"/><circle className="trace-node__core" r="23"/><text className="trace-node__icon" y="6">{state.status === "done" ? "✓" : meta.icon}</text><text className="trace-node__label" y="54">{nodeLabels[key] || meta.label}</text></g>; })}
      {complete && <g className="trace-answer"><rect x="958" y="105" width="112" height="70" rx="16"/><text x="974" y="132">ANSWER</text><path d="M 974 147 h 69 M 974 157 h 48"/></g>}
    </svg></div>
    <div className={`trace-panel ${info ? "trace-panel--open" : ""}`}>{info ? <><div className="trace-panel__top"><span>{nodeLabels[focused] || META[focused].label}</span><button onClick={() => setFocused(null)} aria-label="Close node details">×</button></div><strong>{info.title}</strong>{info.rows.filter(Boolean).map((row, index) => <p key={index}>{row}</p>)}{info.foot && <small>{info.foot}</small>}</> : <p className="trace-panel__empty">Select any lit node to inspect the real evidence and decisions used for this answer.</p>}</div>
    <footer className="trace-canvas__footer"><span>Click a node to inspect its data</span><span>{complete ? "Answer assembled" : "Processing"}</span></footer>
  </section>;
}
