// components/concept/ConceptOfDayPage.jsx
// The "Cutie" — daily concept everyone will love to read
// Beautiful card-based layout with formulas, mnemonics, PYQs

import { useState, useEffect } from "react";
import { useUserContext } from "../../contexts/UserContext";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const BASE = "http://localhost:8000/api";

const DIFFICULTY_STYLE = {
  easy: { bg: "#d4edda", color: "#155724", label: "Easy" },
  medium: { bg: "#fff3cd", color: "#856404", label: "Medium" },
  hard: { bg: "#f8d7da", color: "#721c24", label: "Hard" }
};

function ConceptOfDayPage({ examTarget: propExamTarget }) {
  const { currentUser } = useUserContext();
  const examTarget = propExamTarget || currentUser?.examTarget || "JEE";
  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("concept");

  useEffect(() => {
    loadConcept();
  }, [examTarget]);

  async function loadConcept() {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/concept-of-day/${examTarget}`);
      if (res.data.payload) {
        setConcept(res.data.payload);
      }
    } catch (err) {
      console.error("Failed to load concept:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="mb-3" style={{ fontSize: "3rem" }}>🧠</div>
        <div className="spinner-border text-dark mb-3" />
        <p className="text-secondary">Prism is preparing today's concept...</p>
        <small className="text-secondary">This may take 30-60 seconds on first load</small>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="text-center py-5">
        <p className="text-secondary">Could not load today's concept. Please try again.</p>
        <button className="btn btn-dark" onClick={loadConcept}>Retry</button>
      </div>
    );
  }

  const diff = DIFFICULTY_STYLE[concept.difficulty] || DIFFICULTY_STYLE.medium;

  return (
    <div className="container py-4" style={{ maxWidth: "860px" }}>

      {/* hero card */}
      <div
        className="card shadow-lg mb-4 overflow-hidden"
        style={{ borderRadius: "20px", border: "none" }}
      >
        {/* gradient header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            padding: "2rem",
            color: "white"
          }}
        >
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
            <div>
              <div className="d-flex gap-2 mb-2 flex-wrap">
                <span className="badge" style={{ background: "rgba(255,255,255,0.2)" }}>
                  📅 Today's Concept
                </span>
                <span className="badge" style={{ background: diff.bg, color: diff.color }}>
                  {diff.label}
                </span>
                <span className="badge" style={{ background: "rgba(255,255,255,0.15)" }}>
                  🎯 {concept.estimatedMarks}
                </span>
              </div>
              <h2 className="fw-bold mb-2" style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)" }}>
                {concept.topic}
              </h2>
              <p className="mb-0 opacity-75">{concept.tagline}</p>
            </div>
            <div style={{ fontSize: "4rem" }}>⚡</div>
          </div>
        </div>

        {/* why important */}
        <div className="p-4 border-bottom" style={{ background: "#fffbf0" }}>
          <h6 className="fw-bold text-warning mb-2">📌 Why This Matters in {examTarget}</h6>
          <p className="mb-0 text-secondary">{concept.whyImportant}</p>
        </div>
      </div>

      {/* navigation tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {[
          { id: "concept", label: "📖 Concept" },
          { id: "formulas", label: "🔢 Formulas" },
          { id: "tricks", label: "💡 Tricks" },
          { id: "pyqs", label: "📝 PYQs" }
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn ${activeSection === tab.id ? "btn-dark" : "btn-outline-secondary"} fw-semibold`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONCEPT TAB */}
      {activeSection === "concept" && (
        <div className="row g-4">
          {/* core idea */}
          <div className="col-12">
            <div className="card shadow p-4" style={{ borderRadius: "16px" }}>
              <h6 className="fw-bold mb-3">💡 The Core Idea</h6>
              <p className="fs-6 text-secondary" style={{ lineHeight: 1.8 }}>
                {concept.coreIdea}
              </p>
            </div>
          </div>

          {/* key points */}
          <div className="col-12">
            <div className="card shadow p-4" style={{ borderRadius: "16px" }}>
              <h6 className="fw-bold mb-3">🔑 Key Points to Remember</h6>
              {concept.keyPoints?.map((point, i) => (
                <div key={i} className="d-flex gap-3 mb-3">
                  <div
                    className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                    style={{ width: "28px", height: "28px", fontSize: "0.8rem" }}
                  >
                    {i + 1}
                  </div>
                  <p className="mb-0 text-secondary">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* common mistakes */}
          {concept.commonMistakes?.length > 0 && (
            <div className="col-12">
              <div
                className="card shadow p-4"
                style={{ borderRadius: "16px", background: "#fff5f5" }}
              >
                <h6 className="fw-bold mb-3 text-danger">⚠️ Common Mistakes Students Make</h6>
                {concept.commonMistakes.map((mistake, i) => (
                  <div key={i} className="d-flex gap-2 mb-2">
                    <span className="text-danger">✗</span>
                    <p className="mb-0 text-secondary small">{mistake}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FORMULAS TAB */}
      {activeSection === "formulas" && (
        <div className="row g-3">
          {concept.formulas?.length > 0 ? (
            concept.formulas.map((f, i) => (
              <div key={i} className="col-12">
                <div
                  className="card shadow p-4"
                  style={{ borderRadius: "16px", borderLeft: "4px solid #212529" }}
                >
                  <h6 className="fw-bold mb-3">{f.name}</h6>
                  <div
                    className="p-3 mb-3 text-center rounded"
                    style={{ background: "#f8f9fa", fontSize: "1.2rem" }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {`$$${f.formula}$$`}
                    </ReactMarkdown>
                  </div>
                  <small className="text-secondary">
                    <strong>Where:</strong> {f.meaning}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <p className="text-secondary text-center py-4">No formulas for this topic.</p>
            </div>
          )}
        </div>
      )}

      {/* TRICKS TAB */}
      {activeSection === "tricks" && (
        <div className="row g-4">
          {/* mnemonic */}
          {concept.mnemonic && (
            <div className="col-12">
              <div
                className="card shadow p-4"
                style={{
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white"
                }}
              >
                <h6 className="fw-bold mb-3 opacity-75">🎯 Memory Trick (Mnemonic)</h6>
                <p className="fs-5 fw-bold mb-0">{concept.mnemonic}</p>
              </div>
            </div>
          )}

          {/* exam tips */}
          <div className="col-12">
            <div className="card shadow p-4" style={{ borderRadius: "16px" }}>
              <h6 className="fw-bold mb-3">⚡ Exam Strategy</h6>
              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded" style={{ background: "#e8f5e9" }}>
                  <strong className="text-success">✅ Do This:</strong>
                  <p className="mb-0 text-secondary small mt-1">
                    Practice formula derivation first — JEE/NEET often asks conceptual variations, not just plug-and-chug.
                  </p>
                </div>
                <div className="p-3 rounded" style={{ background: "#fff3e0" }}>
                  <strong className="text-warning">⚡ Quick Tip:</strong>
                  <p className="mb-0 text-secondary small mt-1">
                    This topic carries approximately {concept.estimatedMarks} in {examTarget}.
                    Spending 20 mins on this today = high ROI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PYQs TAB */}
      {activeSection === "pyqs" && (
        <div className="row g-3">
          {concept.pyqs?.length > 0 ? (
            concept.pyqs.map((pyq, i) => (
              <div key={i} className="col-12">
                <div className="card shadow" style={{ borderRadius: "16px" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="badge bg-dark">Q{i + 1}</span>
                      <span className="badge bg-secondary">{pyq.year}</span>
                    </div>
                    <p className="fw-semibold">{pyq.question}</p>
                    <div
                      className="p-3 rounded mt-3"
                      style={{ background: "#e8f5e9", borderLeft: "3px solid #28a745" }}
                    >
                      <small className="text-success fw-bold">✅ Answer & Explanation</small>
                      <p className="mb-0 text-secondary small mt-1">{pyq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <p className="text-secondary text-center py-4">
                No PYQs available for today's concept. Ask Prism about {concept.topic}!
              </p>
            </div>
          )}
        </div>
      )}

      {/* footer */}
      <div className="text-center mt-4 text-secondary small">
        🔄 Concept refreshes automatically every 24 hours · {concept.date}
      </div>
    </div>
  );
}

export default ConceptOfDayPage;
