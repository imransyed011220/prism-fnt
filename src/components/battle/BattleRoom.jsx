// components/battle/BattleRoom.jsx
// Active battle room — waiting lobby, countdown, live quiz, leaderboard
// Dark gaming UI — neon accents, glassmorphism, smooth animations

import { useState, useEffect, useRef, useCallback } from "react";
import MathRenderer from "../common/MathRenderer";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800&display=swap');

  .br-root { font-family: 'Inter', sans-serif; background: #070714; min-height: 100vh; color: #e5e7eb; }
  .br-root * { box-sizing: border-box; }

  /* ── Waiting Lobby ── */
  .waiting-bg {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.12) 0%, transparent 60%),
                linear-gradient(135deg, #070714 0%, #0d0d28 100%);
    padding: 24px;
  }
  .waiting-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(167,139,250,0.2);
    border-radius: 28px; padding: clamp(24px, 5vw, 48px); max-width: 680px; width: 100%;
    backdrop-filter: blur(20px); box-shadow: 0 40px 80px rgba(0,0,0,0.5);
    text-align: center;
  }
  .room-name-title {
    font-family: 'Orbitron', sans-serif; font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 900; background: linear-gradient(135deg, #a78bfa, #67e8f9);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    margin-bottom: 16px;
  }
  .invite-box {
    background: rgba(124,58,237,0.07); border: 1px solid rgba(124,58,237,0.25);
    border-radius: 16px; padding: 20px; margin: 20px 0; cursor: pointer;
    transition: all 0.2s;
  }
  .invite-box:hover { border-color: rgba(167,139,250,0.5); background: rgba(124,58,237,0.12); }
  .invite-code {
    font-family: 'Orbitron', sans-serif; font-size: clamp(1.8rem, 5vw, 2.8rem);
    font-weight: 900; letter-spacing: 10px; color: #a78bfa;
  }

  .player-chip {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 50px; margin: 4px;
    transition: all 0.2s;
  }
  .player-chip.host { background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); }
  .player-chip.participant { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }

  .avatar-ring {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 0.85rem;
  }

  .start-btn {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white; border: none; border-radius: 50px; padding: 16px 48px;
    font-size: 1.1rem; font-weight: 800; cursor: pointer;
    transition: all 0.25s; box-shadow: 0 0 30px rgba(124,58,237,0.5);
    font-family: 'Orbitron', sans-serif;
  }
  .start-btn:hover:not(:disabled) {
    transform: translateY(-3px); box-shadow: 0 0 50px rgba(124,58,237,0.8), 0 8px 24px rgba(0,0,0,0.3);
  }
  .start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .leave-btn {
    background: transparent; border: 1.5px solid rgba(239,68,68,0.4);
    color: #ef4444; border-radius: 50px; padding: 10px 28px;
    font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .leave-btn:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; }

  /* ── Countdown ── */
  .countdown-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: radial-gradient(ellipse at center, #1a0533 0%, #070714 70%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .countdown-num {
    font-family: 'Orbitron', sans-serif; font-size: clamp(6rem, 20vw, 12rem);
    font-weight: 900; color: #a78bfa; line-height: 1;
    text-shadow: 0 0 60px rgba(167,139,250,0.6), 0 0 120px rgba(167,139,250,0.3);
    animation: cPulse 0.9s ease-in-out infinite;
  }
  @keyframes cPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }

  /* ── Active Quiz Layout ── */
  .quiz-layout {
    display: flex; height: 100vh; overflow: hidden;
  }
  .quiz-main { flex: 1; overflow-y: auto; padding: 24px; background: #070714; }
  .quiz-sidebar {
    width: 280px; flex-shrink: 0; overflow-y: auto;
    background: rgba(255,255,255,0.02); border-left: 1px solid rgba(255,255,255,0.06);
    padding: 20px;
  }

  @media (max-width: 768px) {
    .quiz-layout { flex-direction: column; height: auto; }
    .quiz-sidebar { width: 100%; border-left: none; border-top: 1px solid rgba(255,255,255,0.06); }
  }

  .quiz-inner { max-width: 720px; margin: 0 auto; }

  /* Progress */
  .progress-bar { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; margin-bottom: 28px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #67e8f9); border-radius: 2px; transition: width 0.4s ease; }

  /* Question card */
  .question-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; padding: 28px; margin-bottom: 20px;
    backdrop-filter: blur(10px);
  }
  .question-text { color: #f3f4f6; font-size: clamp(0.95rem, 2vw, 1.1rem); font-weight: 500; line-height: 1.6; }

  /* Answer options */
  .option-btn {
    width: 100%; padding: 16px 20px; border-radius: 14px;
    border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03);
    color: #e5e7eb; text-align: left; cursor: pointer; transition: all 0.2s;
    margin-bottom: 10px; display: flex; align-items: center; gap: 14px; font-size: 0.95rem;
  }
  .option-btn:hover:not(:disabled) {
    border-color: rgba(167,139,250,0.5); background: rgba(124,58,237,0.08);
    transform: translateX(4px);
  }
  .option-btn:disabled { cursor: not-allowed; }
  .option-btn.selected { border-color: #7c3aed; background: rgba(124,58,237,0.2); color: white; }
  .option-btn.correct { border-color: #10b981; background: rgba(16,185,129,0.12); color: #10b981; }
  .option-btn.wrong { border-color: #ef4444; background: rgba(239,68,68,0.1); color: #ef4444; }
  .option-btn.show-correct { border-color: #10b981; background: rgba(16,185,129,0.08); }

  .option-key {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    background: rgba(255,255,255,0.08); display: flex; align-items: center;
    justify-content: center; font-weight: 800; font-size: 0.85rem;
  }

  /* Result banner */
  .result-banner {
    border-radius: 14px; padding: 16px 20px; margin-top: 12px;
    display: flex; align-items: center; gap: 12; animation: slideDown 0.3s ease;
  }
  .result-banner.correct { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); }
  .result-banner.wrong { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

  /* Timer */
  .timer-wrap { display: flex; flex-direction: column; align-items: center; }

  /* Leaderboard */
  .lb-title {
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1.5px; color: #6b7280; margin-bottom: 14px;
  }
  .lb-row {
    display: flex; align-items: center; gap: 10; padding: 10px 12px;
    border-radius: 10px; margin-bottom: 6px; transition: background 0.2s;
  }
  .lb-row.me { background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.25); }
  .lb-row.other { background: rgba(255,255,255,0.03); }
  .lb-rank { width: 24px; font-size: 1rem; text-align: center; flex-shrink: 0; }
  .lb-name { flex: 1; font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lb-sub { font-size: 0.68rem; color: #6b7280; }
  .lb-score { font-weight: 800; font-size: 0.9rem; color: #a78bfa; flex-shrink: 0; }

  /* Final results */
  .results-bg {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at 50% 20%, rgba(251,191,36,0.08) 0%, transparent 50%),
                linear-gradient(180deg, #070714 0%, #0d0d28 100%);
    padding: 24px;
  }
  .results-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 28px; padding: clamp(24px, 5vw, 48px); max-width: 640px; width: 100%;
    text-align: center;
  }
  .trophy-anim { font-size: 5rem; animation: trophyBounce 0.6s ease; }
  @keyframes trophyBounce {
    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
    70% { transform: scale(1.15) rotate(5deg); }
    100% { transform: scale(1) rotate(0); opacity: 1; }
  }
  .results-title {
    font-family: 'Orbitron', sans-serif; font-size: clamp(1.2rem, 3vw, 1.8rem); font-weight: 900;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    margin: 12px 0;
  }
  .stat-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 16px; }
  .stat-val { font-size: 1.8rem; font-weight: 800; color: #a78bfa; }
  .stat-label { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }

  .final-lb-row {
    display: flex; align-items: center; gap: 14px; padding: 14px 16px;
    border-radius: 14px; margin-bottom: 8px;
  }
  .final-lb-row.me { background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.2); }
  .final-lb-row.other { background: rgba(255,255,255,0.03); }

  .back-btn {
    background: transparent; border: 1.5px solid rgba(255,255,255,0.15); color: #9ca3af;
    border-radius: 50px; padding: 12px 28px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .back-btn:hover { border-color: rgba(255,255,255,0.3); color: #e5e7eb; }
  .again-btn {
    background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white;
    border: none; border-radius: 50px; padding: 12px 32px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 0 20px rgba(124,58,237,0.4);
  }
  .again-btn:hover { transform: translateY(-2px); box-shadow: 0 0 35px rgba(124,58,237,0.7); }

  /* Generating */
  .gen-overlay {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 20px;
    background: #070714;
  }
  .gen-spinner {
    width: 60px; height: 60px; border-radius: 50%;
    border: 3px solid rgba(167,139,250,0.2);
    border-top-color: #a78bfa;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Scrollbar */
  .br-root ::-webkit-scrollbar { width: 4px; }
  .br-root ::-webkit-scrollbar-track { background: transparent; }
  .br-root ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.25); border-radius: 2px; }

  /* Waiting pulse anim */
  @keyframes waitPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
    50% { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
  }
`;

// ── Circular Timer ──────────────────────────────────────────────────────────
function CircleTimer({ duration, onExpire, questionStartTime }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    setRemaining(duration);
    const interval = setInterval(() => {
      if (questionStartTime) {
        const elapsed = (Date.now() - new Date(questionStartTime).getTime()) / 1000;
        const left = Math.max(0, duration - elapsed);
        setRemaining(Math.ceil(left));
        if (left <= 0) { clearInterval(interval); onExpire?.(); }
      } else {
        setRemaining(prev => {
          if (prev <= 1) { clearInterval(interval); onExpire?.(); return 0; }
          return prev - 1;
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [duration, questionStartTime]);

  const pct = (remaining / duration) * 100;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const strokeDash = (pct / 100) * circ;
  const color = pct > 50 ? "#10b981" : pct > 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="timer-wrap">
      <svg width={92} height={92} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={46} cy={46} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle cx={46} cy={46} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${strokeDash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.1s linear, stroke 0.3s", filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div style={{
        position: "absolute", width: 92, height: 92,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Orbitron', sans-serif", fontSize: "1.3rem", fontWeight: 900, color
      }}>
        {remaining}
      </div>
    </div>
  );
}

// ── Waiting Lobby ────────────────────────────────────────────────────────────
function WaitingLobby({ room, userId, isHost, generatingMsg, onStart, onLeave, onDeleteRoom }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="waiting-bg">
      <style>{css}</style>
      <div className="waiting-card">
        {/* Header badges */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <span style={{ padding: "4px 14px", borderRadius: 50, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa", fontSize: "0.8rem", fontWeight: 700 }}>
            {room.topic}
          </span>
          <span style={{ padding: "4px 14px", borderRadius: 50, background: "rgba(255,255,255,0.06)", color: "#9ca3af", fontSize: "0.8rem" }}>
            {room.difficulty}
          </span>
          {room.isPYQMode && (
            <span style={{ padding: "4px 14px", borderRadius: 50, background: "rgba(59,130,246,0.15)", color: "#3b82f6", fontSize: "0.8rem" }}>
              📝 {room.pyqExamType || "PYQ"}
            </span>
          )}
          <span style={{ padding: "4px 14px", borderRadius: 50, background: "rgba(255,255,255,0.06)", color: "#9ca3af", fontSize: "0.8rem" }}>
            {room.questionCount} Questions
          </span>
        </div>

        <div className="room-name-title">{room.roomName}</div>

        {/* Invite Code */}
        <div className="invite-box" onClick={copyCode} title="Click to copy">
          <div style={{ color: "#6b7280", fontSize: "0.78rem", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>
            🔗 Invite Code — share with friends
          </div>
          <div className="invite-code">{room.inviteCode}</div>
          <div style={{ color: "#6b7280", fontSize: "0.78rem", marginTop: 8 }}>
            {copied ? "✅ Copied!" : "Click to copy"}
          </div>
        </div>

        {/* Players */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: "#6b7280", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
            Players Waiting ({room.members?.length || 0})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
            {room.members?.map(m => (
              <div key={m.userId} className={`player-chip ${m.userId === room.hostId ? "host" : "participant"}`}>
                <div className="avatar-ring" style={{
                  background: m.userId === room.hostId ? "rgba(251,191,36,0.2)" : "rgba(124,58,237,0.2)",
                  color: m.userId === room.hostId ? "#fbbf24" : "#a78bfa"
                }}>
                  {m.userId?.substring(0, 1).toUpperCase()}
                </div>
                <span style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 600 }}>
                  {m.userId === userId ? "You" : `Player ${m.userId?.substring(0, 6)}`}
                </span>
                {m.userId === room.hostId && <span>👑</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Generating message */}
        {generatingMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: 12, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", marginBottom: 20, fontSize: "0.9rem", color: "#a78bfa" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #a78bfa", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            {generatingMsg}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="leave-btn" onClick={onLeave}>Leave</button>
          {isHost && (
            <>
              <button className="leave-btn" style={{ borderColor: "rgba(255,255,255,0.15)", color: "#6b7280" }}
                onClick={onDeleteRoom}>Delete</button>
              <button className="start-btn" onClick={onStart} disabled={!!generatingMsg}
                style={{ animation: !generatingMsg ? "waitPulse 2s ease infinite" : "none" }}>
                ⚔️ Start Battle!
              </button>
            </>
          )}
        </div>

        {!isHost && (
          <p style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 16 }}>
            ⏳ Waiting for the host to start...
          </p>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes waitPulse { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.5)} 50%{box-shadow:0 0 0 16px rgba(124,58,237,0)} }`}</style>
    </div>
  );
}

// ── Active Quiz ─────────────────────────────────────────────────────────────
function ActiveQuiz({
  room, userId, isHost, socket,
  currentQuestion, questionIndex, totalQuestions,
  selectedAnswer, answered, answerResult,
  leaderboard, useTimer, timePerQ, questionStart,
  onSubmitAnswer, onLeave, onNextQuestion
}) {
  function getOptionClass(key) {
    if (!answered) return "";
    if (answerResult) {
      if (key === answerResult.correctAnswer) return "correct";
      if (key === selectedAnswer && !answerResult.isCorrect) return "wrong";
    }
    if (key === selectedAnswer) return "selected";
    return "";
  }

  return (
    <div className="quiz-layout">
      <style>{css}</style>

      {/* Main Quiz Area */}
      <div className="quiz-main">
        <div className="quiz-inner">
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "4px 14px", borderRadius: 50, background: "rgba(124,58,237,0.2)", color: "#a78bfa", fontSize: "0.8rem", fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
                Q{questionIndex + 1} / {totalQuestions}
              </span>
              <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>{room.topic}</span>
            </div>
            {useTimer ? (
              <div style={{ position: "relative", width: 92, height: 92 }}>
                <CircleTimer
                  key={`${questionIndex}-${questionStart || "x"}`}
                  duration={timePerQ}
                  questionStartTime={questionStart}
                  onExpire={() => { if (!answered) onSubmitAnswer(null); }}
                />
              </div>
            ) : (
              <span style={{ color: "#6b7280", fontSize: "0.8rem", fontWeight: 600 }}>Timer OFF</span>
            )}
          </div>

          {/* Progress bar */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} />
          </div>

          {/* Question */}
          <div className="question-card">
            <div className="question-text">
              <MathRenderer content={currentQuestion.question} />
            </div>
          </div>

          {/* Options */}
          {Object.entries(currentQuestion.options || {}).map(([key, value]) => (
            <button
              key={key}
              className={`option-btn ${getOptionClass(key)}`}
              onClick={() => !answered && onSubmitAnswer(key)}
              disabled={answered}
            >
              <span className="option-key">{key}</span>
              <span style={{ flex: 1 }}><MathRenderer content={value} /></span>
              {answerResult && key === answerResult.correctAnswer && <span>✓</span>}
              {answerResult && key === selectedAnswer && !answerResult.isCorrect && key === selectedAnswer && <span>✗</span>}
            </button>
          ))}

          {/* Result Banner */}
          {answerResult && (
            <div className={`result-banner ${answerResult.isCorrect ? "correct" : "wrong"}`}
              style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: "1.5rem" }}>{answerResult.isCorrect ? "✅" : "❌"}</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4, color: answerResult.isCorrect ? "#10b981" : "#ef4444" }}>
                  {answerResult.isCorrect ? `Correct! +${answerResult.pointsEarned} pts` : "Wrong answer"}
                </div>
                {answerResult.explanation && (
                  <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                    <MathRenderer content={answerResult.explanation} />
                  </div>
                )}
              </div>
            </div>
          )}

          {answered && !answerResult && (
            <div style={{ textAlign: "center", color: "#6b7280", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #6b7280", borderTopColor: "#a78bfa", animation: "spin 0.8s linear infinite" }} />
              Waiting for next question...
            </div>
          )}

          {answered && answerResult && isHost && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button className="again-btn" onClick={onNextQuestion}>
                {questionIndex < totalQuestions - 1 ? "Next Question →" : "Show Results →"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Leaderboard Sidebar */}
      <div className="quiz-sidebar">
        <div className="lb-title">⚡ Live Rankings</div>
        {leaderboard.map((entry, i) => (
          <div key={entry.userId} className={`lb-row ${entry.userId === userId ? "me" : "other"}`}
            style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="lb-rank">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div className="lb-name" style={{ color: entry.userId === userId ? "#a78bfa" : "#e5e7eb" }}>
                {entry.userId === userId ? "You" : `P-${entry.userId?.substring(0, 5)}`}
              </div>
              <div className="lb-sub">{entry.correctAnswers}/{entry.totalAnswered} correct</div>
            </div>
            <div className="lb-score">{entry.score}</div>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <div style={{ color: "#4b5563", fontSize: "0.8rem", textAlign: "center", marginTop: 20 }}>No answers yet...</div>
        )}
        <div style={{ marginTop: 24 }}>
          <button className="leave-btn" style={{ width: "100%" }} onClick={onLeave}>Leave Battle</button>
        </div>
      </div>
    </div>
  );
}

// ── Final Results ────────────────────────────────────────────────────────────
function FinalResults({ finalResults, userId, room, socket, onLeave }) {
  const myResult = finalResults.leaderboard?.find(l => l.userId === userId);
  const trophy = myResult?.rank === 1 ? "🏆" : myResult?.rank === 2 ? "🥈" : myResult?.rank === 3 ? "🥉" : "⚔️";

  return (
    <div className="results-bg">
      <style>{css}</style>
      <div className="results-card">
        <div className="trophy-anim">{trophy}</div>
        <div className="results-title">
          {myResult?.rank === 1 ? "Victory!" : "Battle Complete!"}
        </div>
        <div style={{ color: "#6b7280", marginBottom: 24, fontSize: "0.9rem" }}>{finalResults.topic}</div>

        {myResult && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
            <div className="stat-box">
              <div className="stat-val" style={{ color: "#fbbf24" }}>#{myResult.rank}</div>
              <div className="stat-label">Your Rank</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">{myResult.score}</div>
              <div className="stat-label">Points</div>
            </div>
            <div className="stat-box">
              <div className="stat-val" style={{ color: "#10b981" }}>{myResult.correctAnswers}</div>
              <div className="stat-label">Correct / {finalResults.totalQuestions}</div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Final Standings</div>
          {finalResults.leaderboard?.map((entry, i) => (
            <div key={entry.userId} className={`final-lb-row ${entry.userId === userId ? "me" : "other"}`}
              style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 32, textAlign: "center", fontSize: "1.3rem" }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: entry.userId === userId ? "#a78bfa" : "#e5e7eb" }}>
                  {entry.userId === userId ? "You" : `Player ${entry.userId?.substring(0, 6)}`}
                </div>
                <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{entry.correctAnswers} correct answers</div>
              </div>
              <div style={{ fontWeight: 800, color: "#a78bfa" }}>{entry.score} pts</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="back-btn" onClick={onLeave}>← Back to Lobby</button>
          <button className="again-btn" onClick={() => {
            socket?.emit("create_battle_room", { ...room, roomName: `${room?.roomName} Rematch` });
          }}>⚔️ Play Again</button>
        </div>
      </div>
    </div>
  );
}

// ── Main BattleRoom Component ────────────────────────────────────────────────
function BattleRoom({ room: initialRoom, userId, socket, onLeave }) {
  const [room, setRoom] = useState(initialRoom);
  const [status, setStatus] = useState(initialRoom.status);
  const [countdown, setCountdown] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [finalResults, setFinalResults] = useState(null);
  const [questionStart, setQuestionStart] = useState(null);
  const [timePerQ, setTimePerQ] = useState(initialRoom.timePerQuestion || 30);
  const [useTimer, setUseTimer] = useState(initialRoom.useTimer !== false);
  const [answered, setAnswered] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState("");

  const isHost = room?.hostId === userId;
  const questionStartRef = useRef(0);

  // ── Socket event listeners ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on("room_updated", ({ room: r }) => {
      setRoom(r);
    });
    socket.on("player_joined", ({ userId: uid }) => {
      setRoom(prev => {
        if (!prev) return prev;
        const already = prev.members?.some(m => m.userId === uid);
        if (already) return prev;
        return { ...prev, members: [...(prev.members || []), { userId: uid, score: 0 }] };
      });
    });
    socket.on("player_left", ({ userId: uid }) => {
      setRoom(prev => prev ? { ...prev, members: (prev.members || []).filter(m => m.userId !== uid) } : prev);
    });
    socket.on("generating_questions", ({ message }) => {
      setGeneratingMsg(message);
      setStatus("generating");
    });
    socket.on("battle_countdown", ({ count }) => {
      setStatus("countdown");
      setCountdown(count);
    });
    socket.on("battle_started", (data) => {
      setStatus("active");
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setUseTimer(data.useTimer !== false);
      setTimePerQ(data.timePerQuestion || 30);
      setQuestionStart(data.startTime);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setAnswered(false);
      setGeneratingMsg("");
    });
    socket.on("next_question", (data) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setUseTimer(data.useTimer !== false);
      setTimePerQ(data.timePerQuestion || 30);
      setQuestionStart(data.questionStartTime);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setAnswered(false);
    });
    socket.on("answer_result", (data) => setAnswerResult(data));
    socket.on("leaderboard_update", ({ leaderboard: lb }) => setLeaderboard(lb));
    socket.on("battle_ended", (data) => {
      setStatus("finished");
      setFinalResults(data);
    });
    socket.on("room_deleted", () => {
      sessionStorage.removeItem("battle_room_id");
      onLeave();
    });

    return () => {
      ["room_updated", "player_joined", "player_left", "generating_questions",
        "battle_countdown", "battle_started", "next_question", "answer_result",
        "leaderboard_update", "battle_ended", "room_deleted"]
        .forEach(e => socket.off(e));
    };
  }, [socket, onLeave]);

  // Track question start time for speed bonus
  useEffect(() => { questionStartRef.current = Date.now(); }, [currentQuestion]);

  const handleSubmitAnswer = useCallback((answer) => {
    if (answered || !socket) return;
    const timeTaken = (Date.now() - questionStartRef.current) / 1000;
    setSelectedAnswer(answer);
    setAnswered(true);
    socket.emit("submit_battle_answer", {
      roomId: room.roomId, questionIndex, selectedAnswer: answer, timeTaken
    });
  }, [answered, socket, room, questionIndex]);

  function handleStart() { socket?.emit("start_battle", { roomId: room.roomId }); }
  function handleNextQuestion() { socket?.emit("request_next_question", { roomId: room.roomId }); }
  function handleLeave() {
    socket?.emit("leave_battle_room", { roomId: room.roomId });
    sessionStorage.removeItem("battle_room_id");
    onLeave();
  }
  function handleDeleteRoom() {
    if (!socket || !room?.roomId) return;
    socket.emit("delete_battle_room", { roomId: room.roomId });
  }

  // ── Render states ────────────────────────────────────────────────────────
  if (status === "waiting") {
    return (
      <WaitingLobby
        room={room} userId={userId} isHost={isHost}
        generatingMsg={generatingMsg}
        onStart={handleStart} onLeave={handleLeave} onDeleteRoom={handleDeleteRoom}
      />
    );
  }

  if (status === "generating") {
    return (
      <div className="br-root">
        <style>{css}</style>
        <div className="gen-overlay">
          <div className="gen-spinner" />
          <div style={{ fontFamily: "'Orbitron', sans-serif", color: "#a78bfa", fontWeight: 700 }}>Generating Questions</div>
          <div style={{ color: "#6b7280", fontSize: "0.9rem", maxWidth: 320, textAlign: "center" }}>
            {generatingMsg || "AI is creating questions from your study materials..."}
          </div>
        </div>
      </div>
    );
  }

  if (status === "countdown") {
    return (
      <div className="br-root">
        <style>{css}</style>
        <div className="countdown-overlay">
          <div style={{ color: "rgba(167,139,250,0.6)", fontWeight: 600, marginBottom: 16, fontSize: "1.1rem", letterSpacing: "2px" }}>GET READY</div>
          <div className="countdown-num">{countdown}</div>
          <div style={{ marginTop: 24, color: "#6b7280", fontSize: "0.9rem" }}>{room.topic}</div>
        </div>
      </div>
    );
  }

  if (status === "active" && currentQuestion) {
    return (
      <div className="br-root">
        <ActiveQuiz
          room={room} userId={userId} isHost={isHost} socket={socket}
          currentQuestion={currentQuestion} questionIndex={questionIndex}
          totalQuestions={totalQuestions} selectedAnswer={selectedAnswer}
          answered={answered} answerResult={answerResult} leaderboard={leaderboard}
          useTimer={useTimer} timePerQ={timePerQ} questionStart={questionStart}
          onSubmitAnswer={handleSubmitAnswer} onLeave={handleLeave}
          onNextQuestion={handleNextQuestion}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "finished" && finalResults) {
    return (
      <div className="br-root">
        <FinalResults
          finalResults={finalResults} userId={userId}
          room={room} socket={socket} onLeave={onLeave}
        />
      </div>
    );
  }

  // Loading / transitional state
  return (
    <div className="br-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{css}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, margin: "0 auto 16px", borderRadius: "50%", border: "3px solid rgba(167,139,250,0.2)", borderTopColor: "#a78bfa", animation: "spin 0.8s linear infinite" }} />
        <div style={{ color: "#6b7280" }}>Connecting to battle room...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default BattleRoom;
