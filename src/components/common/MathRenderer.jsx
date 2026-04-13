// components/common/MathRenderer.jsx
// Reusable math + markdown renderer
// Used in Chat, Quiz, ConceptOfDay, Study Planner — EVERYWHERE
// Ensures consistent beautiful formula display across all features

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useEffect, useRef } from "react";
import mermaid from "mermaid";

// initialize mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "system-ui, sans-serif",
});

// Mermaid diagram component
function MermaidDiagram({ code }) {
  const ref = useRef(null);
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!ref.current || !code) return;

    async function render() {
      try {
        const { svg } = await mermaid.render(id.current, code.trim());
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (err) {
        // fallback to code display
        if (ref.current) {
          ref.current.innerHTML = `<pre style="background:#f8f9fa;padding:1rem;border-radius:8px;overflow-x:auto;font-size:0.85rem">${code}</pre>`;
        }
      }
    }

    render();
  }, [code]);

  return (
    <div
      ref={ref}
      className="mermaid-container"
      style={{
        background: "#fff",
        border: "1px solid #e9ecef",
        borderRadius: "12px",
        padding: "1.5rem",
        margin: "1rem 0",
        overflowX: "auto",
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
      }}
    />
  );
}

function MathRenderer({ content, className = "" }) {
  if (!content) return null;

  return (
    <div className={`math-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // style code blocks nicely
          code({ node, inline, className, children, ...props }) {
            const language = className?.replace("language-", "") || "";
            const codeStr = String(children).replace(/\n$/, "");

            if (language === "mermaid") {
              return <MermaidDiagram code={codeStr} />;
            }

            if (inline) {
              return (
                <code
                  style={{
                    background: "#f0f0f0",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.9em",
                    fontFamily: "monospace"
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre
                style={{
                  background: "#1e1e1e",
                  color: "#d4d4d4",
                  padding: "1rem",
                  borderRadius: "8px",
                  overflowX: "auto",
                  fontSize: "0.85rem"
                }}
              >
                <code className={className} {...props}>{children}</code>
              </pre>
            );
          },

          // Tables
          table({ children }) {
            return (
              <div style={{ overflowX: "auto", margin: "1rem 0" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.9rem" }}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th style={{ border: "1px solid #dee2e6", padding: "8px 12px", background: "#f8f9fa", fontWeight: 700 }}>
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td style={{ border: "1px solid #dee2e6", padding: "8px 12px" }}>
                {children}
              </td>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MathRenderer;