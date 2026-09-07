// components/chat/MessageBubble.jsx
// renders a single chat message
// user messages: right aligned, dark background
// assistant messages: left aligned, light background
// features: copy button, edit button (user only), source badges

import { useState } from "react";
import MathRenderer from "../common/MathRenderer";
import AgentTraceVisualizer from "./AgentTraceVisualizer";

function ThinkingSummary({ trace }) {
  const material = trace.retrieve?.data?.previews || [];
  const sources = trace.retrieve?.data?.sources || [];
  const wasRefined = Boolean(trace.rewrite?.data?.rewrittenQuery);
  const responsePreview = trace.generate?.data?.preview || trace.generate?.detail;

  return (
    <section style={{ marginTop: "10px", padding: "14px 16px", border: "1px solid #dce7ee", borderRadius: "14px", background: "#f8fbfd", color: "#263744" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
        <strong style={{ fontSize: "0.82rem" }}>How Prism framed the solution</strong>
        <span style={{ color: "#628093", fontSize: "0.7rem" }}>Source-grounded summary</span>
      </div>
      <div style={{ padding: "8px 0", borderTop: "1px solid #e7eef3", fontSize: "0.78rem" }}>
        <span style={{ color: "#087ea4", fontWeight: 700 }}>Study-material signals</span>
        {material.length ? material.slice(0, 2).map((chunk, index) => <p key={index} style={{ margin: "5px 0 0", lineHeight: 1.55 }}>{chunk}</p>) : <p style={{ margin: "5px 0 0" }}>The response was framed from the available study material.</p>}
      </div>
      {wasRefined && <div style={{ padding: "8px 0", borderTop: "1px solid #e7eef3", fontSize: "0.78rem" }}><span style={{ color: "#087ea4", fontWeight: 700 }}>Framing adjustment</span><p style={{ margin: "5px 0 0", lineHeight: 1.55 }}>The first material set was not strong enough, so Prism narrowed the topic and used a more specific interpretation before forming the response.</p></div>}
      {responsePreview && <div style={{ padding: "8px 0", borderTop: "1px solid #e7eef3", fontSize: "0.78rem" }}><span style={{ color: "#087ea4", fontWeight: 700 }}>Response direction</span><p style={{ margin: "5px 0 0", lineHeight: 1.55 }}>{responsePreview}</p></div>}
      {sources.length > 0 && <div style={{ paddingTop: "8px", borderTop: "1px solid #e7eef3", color: "#628093", fontSize: "0.7rem" }}>Built from: {sources.slice(0, 3).join(" · ")}</div>}
    </section>
  );
}


function MessageBubble({ message, onEdit }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showTrace, setShowTrace] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEditSubmit() {
    if (editText.trim() && editText !== message.content) {
      onEdit(editText);         // sends edited message as new query
    }
    setIsEditing(false);
  }

  return (
    <div className={`d-flex mb-3 ${isUser ? "justify-content-end" : "justify-content-start"}`}>
      <div style={{ maxWidth: (showTrace || showThinking) && !isUser ? "100%" : "75%", width: (showTrace || showThinking) && !isUser ? "min(1040px, 100%)" : undefined }}>

        {/* message bubble */}
        {isEditing ? (
          // edit mode
          <div className="d-flex flex-column gap-2">
            <textarea
              className="form-control"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              style={{ borderRadius: "12px", resize: "none" }}
              autoFocus
            />
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-dark"
                onClick={handleEditSubmit}
              >
                Send ↵
              </button>
            </div>
          </div>
        ) : (
          // normal message
          <div
            className={isUser ? "bg-dark text-white" : "bg-white text-dark border"}
            style={{
              borderRadius: isUser
                ? "18px 18px 4px 18px"
                : "18px 18px 18px 4px",
              padding: "12px 16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <MathRenderer content={message.content} />

            {/* source badges */}
            {message.sources?.length > 0 && (
              <div className="mt-2 d-flex flex-wrap gap-1">
                {message.sources.map((src, i) => (
                  <span
                    key={i}
                    className="badge bg-secondary"
                    style={{ fontSize: "0.7rem" }}
                  >
                    📄 {src}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!isEditing && !isUser && showTrace && message.trace && (
          <AgentTraceVisualizer nodes={message.trace} />
        )}
        {!isEditing && !isUser && showThinking && message.trace && (
          <ThinkingSummary trace={message.trace} />
        )}

        {/* action buttons — shown on hover via CSS */}
        {!isEditing && (
          <div className={`d-flex gap-2 mt-1 ${isUser ? "justify-content-end" : "justify-content-start"}`}>
            {/* copy button — both user and assistant */}
            <button
              className="btn btn-sm text-secondary p-0"
              onClick={handleCopy}
              title="Copy message"
              style={{ fontSize: "0.75rem", background: "none", border: "none" }}
            >
              {copied ? "✅ Copied" : "📋 Copy"}
            </button>

            {/* edit button — user messages only */}
            {!isUser && message.trace && (
              <button
                className="btn btn-sm p-0"
                onClick={() => setShowTrace((visible) => !visible)}
                title="Open the animated node-by-node answer path"
                style={{ color: showTrace ? "#087ea4" : "#52606d", fontSize: "0.75rem", background: "none", border: "none", fontWeight: showTrace ? 700 : 500 }}
              >
                {showTrace ? "✕ Hide answer path" : "◌ View answer path"}
              </button>
            )}

            {!isUser && message.trace && (
              <button
                className="btn btn-sm p-0"
                onClick={() => setShowThinking((visible) => !visible)}
                title="See a concise summary of the decisions behind this answer"
                style={{ color: showThinking ? "#087ea4" : "#52606d", fontSize: "0.75rem", background: "none", border: "none", fontWeight: showThinking ? 700 : 500 }}
              >
                {showThinking ? "✕ Hide thinking" : "✦ Show thinking"}
              </button>
            )}

            {isUser && (
              <button
                className="btn btn-sm text-secondary p-0"
                onClick={() => setIsEditing(true)}
                title="Edit message"
                style={{ fontSize: "0.75rem", background: "none", border: "none" }}
              >
                ✏️ Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
