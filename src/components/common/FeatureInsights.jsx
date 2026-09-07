import { useState } from "react";
import AgentTraceVisualizer from "../chat/AgentTraceVisualizer";

/** Reusable, feature-neutral explanation controls for completed AI work. */
export default function FeatureInsights({ title = "Prism process", stages = [], thinking = [] }) {
  const [showPath, setShowPath] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const validStages = stages.filter((stage) => stage?.label);
  const validThinking = thinking.filter(Boolean);
  const traceKeys = ["router", "retrieve", "grade", "rewrite", "generate"];
  const traceNodes = Object.fromEntries(traceKeys.map((key, index) => {
    const stage = validStages[index];
    return [key, {
      status: stage ? "done" : "pending",
      detail: stage?.detail || "",
      data: stage ? { summary: stage.detail } : {},
      updatedAt: null,
    }];
  }));
  const nodeLabels = Object.fromEntries(traceKeys.map((key, index) => [key, validStages[index]?.label || key]));

  return (
    <div className="my-3">
      <div className="d-flex gap-3 flex-wrap">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowPath((open) => !open)}>
          {showPath ? "Hide path" : "View path"}
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowThinking((open) => !open)}>
          {showThinking ? "Hide thinking" : "Show thinking"}
        </button>
      </div>
      {showPath && <AgentTraceVisualizer nodes={traceNodes} heading={title} nodeLabels={nodeLabels} />}
      {showThinking && <div className="mt-3 p-3 rounded-3 border" style={{ background: "#f8fbfd" }}>
        <div className="small fw-bold mb-2">How Prism framed this result</div>
        <ul className="mb-0 small text-secondary ps-3">{validThinking.map((item, index) => <li key={index} className="mb-1">{item}</li>)}</ul>
      </div>}
    </div>
  );
}
