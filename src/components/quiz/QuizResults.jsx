// components/quiz/QuizResults.jsx
// shows score, per-question analysis, tips
// uses recharts for performance visualization

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useRef } from "react";
import { saveQuizResult } from "../../services/api";
import MathRenderer from "../common/MathRenderer";

const COLORS = ["#28a745", "#dc3545", "#ffc107"];

function QuizResults({ questions, userAnswers, onRetry, examTarget, userId, topic, difficulty }) {

  const analysis = useMemo(() => {
    let correct = 0, wrong = 0, skipped = 0;
    const breakdown = questions.map((q, i) => {
      const userAns = userAnswers[i];
      const isCorrect = userAns === q.answer;
      const isSkipped = !userAns;
      if (isSkipped) skipped++;
      else if (isCorrect) correct++;
      else wrong++;
      return { ...q, userAnswer: userAns, isCorrect, isSkipped, index: i };
    });

    const score = Math.round((correct / questions.length) * 100);
    const jeeMarks = correct * 4 - wrong * 1;  // JEE marking scheme

    return { correct, wrong, skipped, score, jeeMarks, breakdown };
  }, [questions, userAnswers]);

  const savedRef = useRef(false);

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    async function save() {
      if (!userId || !questions?.length) return;
      
      const weakAreas = analysis.breakdown
        .filter(q => !q.isCorrect && !q.isSkipped)
        .slice(0, 3)
        .map(q => q.question.split(" ").slice(0, 5).join(" "));

      try {
        await saveQuizResult({
          userId,
          examTarget,
          topic: topic || "Mixed",
          difficulty: difficulty || "medium",
          totalQuestions: questions.length,
          correct: analysis.correct,
          wrong: analysis.wrong,
          skipped: analysis.skipped,
          scorePercent: analysis.score,
          weakAreas,
          questions: questions,
          userAnswers: userAnswers
        });
        console.log("[QuizResults] Result saved.");
      } catch (err) {
        console.error("Failed to save quiz result:", err);
      }
    }
    save();
  }, []);

  const pieData = [
    { name: "Correct", value: analysis.correct },
    { name: "Wrong", value: analysis.wrong },
    { name: "Skipped", value: analysis.skipped },
  ];

  function getGrade() {
    if (analysis.score >= 90) return { text: "Excellent! 🏆", color: "#28a745" };
    if (analysis.score >= 75) return { text: "Good! 👍", color: "#17a2b8" };
    if (analysis.score >= 50) return { text: "Average 📚", color: "#ffc107" };
    return { text: "Needs Work 💪", color: "#dc3545" };
  }

  const grade = getGrade();

  function getTips() {
    if (analysis.score === 100) return "Perfect score! Try harder difficulty next time.";
    if (analysis.wrong > analysis.correct) return "Focus on understanding concepts before attempting questions. Review NCERT basics first.";
    if (analysis.skipped > 2) return "Practice time management — don't skip questions in the actual exam.";
    return "Review the wrong answers carefully. Focus on the explanation provided.";
  }

  return (
    <div>
      <h3 className="fw-bold mb-4">📊 Quiz Analysis</h3>

      {/* score card */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-center p-3 shadow">
            <div style={{ fontSize: "3rem", fontWeight: 800, color: grade.color }}>
              {analysis.score}%
            </div>
            <div className="fw-semibold" style={{ color: grade.color }}>{grade.text}</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center p-3 shadow bg-success text-white">
            <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>{analysis.correct}</div>
            <div>Correct ✓</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center p-3 shadow bg-danger text-white">
            <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>{analysis.wrong}</div>
            <div>Wrong ✗</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center p-3 shadow bg-warning">
            <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>{analysis.jeeMarks}</div>
            <div>{examTarget} Score (+4/-1)</div>
          </div>
        </div>
      </div>

      {/* pie chart */}
      <div className="card shadow mb-4 p-3">
        <h6 className="fw-bold mb-3">Performance Breakdown</h6>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* AI tip */}
      <div className="card shadow mb-4 p-3 border-start border-4 border-dark">
        <h6 className="fw-bold">💡 Prism's Analysis</h6>
        <p className="mb-0 text-secondary">{getTips()}</p>
      </div>

      {/* question breakdown */}
      <div className="card shadow mb-4">
        <div className="card-body p-0">
          <h6 className="fw-bold p-3 border-bottom mb-0">Question Review</h6>
          {analysis.breakdown.map((q, i) => (
            <div
              key={i}
              className={`p-3 border-bottom ${
                q.isSkipped ? "bg-light" :
                q.isCorrect ? "bg-success bg-opacity-10" : "bg-danger bg-opacity-10"
              }`}
            >
              <div className="d-flex align-items-start gap-2">
                <span className="badge mt-1" style={{
                  background: q.isSkipped ? "#6c757d" : q.isCorrect ? "#28a745" : "#dc3545"
                }}>
                  {q.isSkipped ? "SKIP" : q.isCorrect ? "✓" : "✗"}
                </span>
                <div className="flex-grow-1">
                  <MathRenderer content={q.question} className="fw-semibold mb-1 small" />
                  <div className="small">
                    {!q.isSkipped && (
                      <span className={q.isCorrect ? "text-success" : "text-danger"}>
                        Your answer: <strong>{q.userAnswer}</strong>
                        {!q.isCorrect && ` | Correct: `}
                        {!q.isCorrect && <strong className="text-success">{q.answer}</strong>}
                      </span>
                    )}
                  </div>
                  {q.explanation && (
                    <div className="text-secondary small mb-0 mt-1">
                      💬 <MathRenderer content={q.explanation} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* actions */}
      <div className="d-flex gap-3 justify-content-center">
        <button className="btn btn-dark px-4" onClick={onRetry}>
          🔄 New Quiz
        </button>
      </div>
    </div>
  );
}

export default QuizResults;
