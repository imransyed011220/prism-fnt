// components/battle/BattleRoom.jsx
// Active battle room — waiting lobby, quiz, live leaderboard

import { useState, useEffect, useRef } from "react";
import MathRenderer from "../common/MathRenderer";

function Timer({ duration, onExpire, questionStartTime }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      if (questionStartTime) {
        const elapsed = (Date.now() - new Date(questionStartTime).getTime()) / 1000;
        const left = Math.max(0, duration - elapsed);
        setRemaining(Math.ceil(left));
        if (left <= 0) {
          clearInterval(interval);
          onExpire?.();
        }
      } else {
        setRemaining(prev => {
          if (prev <= 1) { clearInterval(interval); onExpire?.(); return 0; }
          return prev - 1;
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [duration, questionStartTime, onExpire]);

  const pct = (remaining / duration) * 100;
  const color = pct > 50 ? "#28a745" : pct > 25 ? "#ffc107" : "#dc3545";

  return (
    <div className="text-center">
      <div
        style={{
          width: "80px", height: "80px",
          borderRadius: "50%",
          background: `conic-gradient(${color} ${pct}%, #e9ecef ${pct}%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto",
          boxShadow: `0 0 20px ${color}44`
        }}
      >
        <div
          style={{
            width: "60px", height: "60px",
            borderRadius: "50%",
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", fontWeight: 800,
            color
          }}
        >
          {remaining}
        </div>
      </div>
    </div>
  );
}

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
  const [timePerQ, setTimePerQ] = useState(30);
  const [useTimer, setUseTimer] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState("");

  const isHost = room?.hostId === userId;
  const questionStartRef = useRef(0);

  useEffect(() => {
    if (!socket) return;

    socket.on("room_updated", ({ room: r }) => setRoom(r));
    socket.on("player_joined", ({ userId: uid }) => {
      setRoom(prev => ({
        ...prev,
        members: [...(prev?.members || []), { userId: uid, score: 0 }]
      }));
    });
    socket.on("generating_questions", ({ message }) => setGeneratingMsg(message));
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
      setTimePerQ(data.timePerQuestion);
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
    socket.on("answer_result", (data) => {
      setAnswerResult(data);
    });
    socket.on("leaderboard_update", ({ leaderboard: lb }) => {
      setLeaderboard(lb);
    });
    socket.on("battle_ended", (data) => {
      setStatus("finished");
      setFinalResults(data);
    });
    socket.on("room_deleted", () => {
      onLeave();
    });

    return () => {
      ["room_updated","player_joined","generating_questions","battle_countdown",
       "battle_started","next_question","answer_result","leaderboard_update","battle_ended","room_deleted"]
        .forEach(e => socket.off(e));
    };
  }, [socket, onLeave]);

  // Restore state if player reloaded mid-game
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`battle_state_${room?.roomId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.status === "active" && parsed.currentQuestion) {
          setStatus(parsed.status);
          setCurrentQuestion(parsed.currentQuestion);
          setQuestionIndex(parsed.questionIndex || 0);
          setTotalQuestions(parsed.totalQuestions || 0);
          setTimePerQ(parsed.timePerQ || 30);
          setLeaderboard(parsed.leaderboard || []);
        }
      }
    } catch {}
  }, []);

  // Save current question & status so refresh doesn't lose progress
  useEffect(() => {
    if (status === "active" && currentQuestion && room?.roomId) {
      sessionStorage.setItem(`battle_state_${room.roomId}`, JSON.stringify({
        status, currentQuestion, questionIndex, totalQuestions, timePerQ, leaderboard
      }));
    } else if (status === "finished" && room?.roomId) {
      sessionStorage.removeItem(`battle_state_${room.roomId}`);
    }
  }, [status, currentQuestion, questionIndex, totalQuestions, timePerQ, leaderboard, room?.roomId]);

  function handleSubmitAnswer(answer) {
    if (answered || !socket) return;
    const timeTaken = (Date.now() - questionStartRef.current) / 1000;
    setSelectedAnswer(answer);
    setAnswered(true);
    socket.emit("submit_battle_answer", {
      roomId: room.roomId,
      questionIndex,
      selectedAnswer: answer,
      timeTaken
    });
  }

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentQuestion]);

  function handleStart() {
    socket?.emit("start_battle", { roomId: room.roomId });
  }

  function handleLeave() {
    if (room?.roomId) sessionStorage.removeItem(`battle_state_${room.roomId}`);
    socket?.emit("leave_battle_room", { roomId: room.roomId });
    onLeave();
  }

  function handleDeleteRoom() {
    if (room?.roomId) sessionStorage.removeItem(`battle_state_${room.roomId}`);
    if (!socket || !room?.roomId) return;
    socket.emit("delete_battle_room", { roomId: room.roomId });
  }

  function handleNextQuestion() {
    if (!socket || !room?.roomId) return;
    socket.emit("request_next_question", { roomId: room.roomId });
  }

  // ── WAITING LOBBY ──────────────────────────────────────────────────────
  if (status === "waiting") {
    return (
      <div className="container py-5" style={{ maxWidth: "700px" }}>
        <div
          className="card p-4 shadow text-center"
          style={{ borderRadius: "20px" }}
        >
          <h3 className="fw-bold">{room.roomName}</h3>
          <div className="d-flex gap-3 justify-content-center mb-4 flex-wrap">
            <span className="badge bg-dark">{room.topic}</span>
            <span className="badge bg-secondary">{room.difficulty}</span>
            {room.isPYQMode && <span className="badge bg-warning text-dark">{room.pyqExamType || "PYQ"}</span>}
            <span className="badge bg-secondary">{room.questionCount} questions</span>
          </div>

          {/* Invite code */}
          <div className="p-3 rounded mb-4" style={{ background: "#f8f9fa" }}>
            <small className="text-secondary d-block mb-1">Share this code to invite friends:</small>
            <div
              className="fw-bold fs-2 letter-spacing-2"
              style={{ letterSpacing: "8px", color: "#0d6efd", cursor: "pointer" }}
              onClick={() => navigator.clipboard.writeText(room.inviteCode)}
              title="Click to copy"
            >
              {room.inviteCode}
            </div>
            <small className="text-secondary">Click to copy</small>
          </div>

          {/* Members waiting */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              Players ({room.members?.length || 0})
            </h6>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              {room.members?.map(m => (
                <div
                  key={m.userId}
                  className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                  style={{ background: m.userId === room.hostId ? "#1a1a2e" : "#f0f0f0",
                           color: m.userId === room.hostId ? "white" : "#212529" }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: "28px", height: "28px",
                             background: m.userId === userId ? "#0d6efd" : "#6c757d",
                             color: "white", fontSize: "0.8rem" }}
                  >
                    {m.userId?.substring(0, 1).toUpperCase()}
                  </div>
                  <span style={{ fontSize: "0.85rem" }}>
                    {m.userId === userId ? "You" : `Player ${m.userId?.substring(0, 6)}`}
                    {m.userId === room.hostId && " 👑"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {generatingMsg && (
            <div className="alert alert-info py-2">
              <div className="spinner-border spinner-border-sm me-2" />
              {generatingMsg}
            </div>
          )}

          <div className="d-flex gap-3 justify-content-center">
            <button
              className="btn btn-outline-danger"
              style={{ borderRadius: "20px" }}
              onClick={handleLeave}
            >
              Leave
            </button>
            {isHost && (
              <button
                className="btn btn-outline-secondary"
                style={{ borderRadius: "20px" }}
                onClick={handleDeleteRoom}
              >
                Delete Room
              </button>
            )}
            {isHost && (
              <button
                className="btn btn-dark btn-lg px-5"
                style={{ borderRadius: "30px" }}
                onClick={handleStart}
                disabled={!!generatingMsg}
              >
                ⚔️ Start Battle!
              </button>
            )}
          </div>

          {!isHost && (
            <p className="text-secondary small mt-3">Waiting for host to start...</p>
          )}
        </div>
      </div>
    );
  }

  // ── COUNTDOWN ──────────────────────────────────────────────────────────
  if (status === "countdown") {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ height: "calc(100vh - 60px)", background: "#1a1a2e" }}
      >
        <div style={{ color: "white", textAlign: "center" }}>
          <h2 className="fw-bold opacity-75 mb-4">Get Ready!</h2>
          <div
            style={{
              fontSize: "10rem",
              fontWeight: 900,
              color: "#FFD700",
              textShadow: "0 0 40px rgba(255,215,0,0.5)",
              animation: "pulse 1s ease infinite",
              lineHeight: 1
            }}
          >
            {countdown}
          </div>
          <h4 className="mt-4 opacity-75">{room.topic}</h4>
        </div>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }`}</style>
      </div>
    );
  }

  // ── ACTIVE QUIZ ────────────────────────────────────────────────────────
  if (status === "active" && currentQuestion) {
    return (
      <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>

        {/* Main quiz area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "2rem", background: "#fafafa" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <span className="badge bg-dark me-2">
                  Q{questionIndex + 1} / {totalQuestions}
                </span>
                <span className="badge bg-secondary">{room.topic}</span>
                {room.isPYQMode && <span className="badge bg-warning text-dark ms-2">{room.pyqExamType || "PYQ"}</span>}
              </div>
              {useTimer ? (
                <Timer
                  key={`${questionIndex}-${questionStart || "no-start"}`}
                  duration={timePerQ}
                  questionStartTime={questionStart}
                  onExpire={() => { if (!answered) handleSubmitAnswer(null); }}
                />
              ) : (
                <div className="text-secondary small fw-semibold">Timer OFF</div>
              )}
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: "6px",
                background: "#e9ecef",
                borderRadius: "10px",
                marginBottom: "2rem"
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                  background: "#0d6efd",
                  borderRadius: "10px",
                  transition: "width 0.3s"
                }}
              />
            </div>

            {/* Question */}
            <div className="card p-4 mb-4 shadow" style={{ borderRadius: "16px" }}>
              <MathRenderer content={currentQuestion.question} />
            </div>

            {/* Options */}
            {Object.entries(currentQuestion.options || {}).map(([key, value]) => {
              let btnStyle = {
                borderRadius: "12px",
                padding: "14px 20px",
                marginBottom: "12px",
                width: "100%",
                textAlign: "left",
                border: "2px solid #e9ecef",
                background: "white",
                cursor: answered ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                fontSize: "0.95rem"
              };

              if (selectedAnswer === key) {
                btnStyle.background = "#1a1a2e";
                btnStyle.color = "white";
                btnStyle.border = "2px solid #1a1a2e";
              }

              if (answerResult) {
                if (key === answerResult.correctAnswer) {
                  btnStyle.background = "#e8f5e9";
                  btnStyle.border = "2px solid #4caf50";
                  btnStyle.color = "#2e7d32";
                } else if (key === selectedAnswer && !answerResult.isCorrect) {
                  btnStyle.background = "#fff5f5";
                  btnStyle.border = "2px solid #dc3545";
                  btnStyle.color = "#b71c1c";
                }
              }

              return (
                <button
                  key={key}
                  style={btnStyle}
                  onClick={() => !answered && handleSubmitAnswer(key)}
                  disabled={answered}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "28px", height: "28px",
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.08)",
                      textAlign: "center",
                      lineHeight: "28px",
                      fontWeight: 700,
                      marginRight: "12px",
                      fontSize: "0.85rem"
                    }}
                  >
                    {key}
                  </span>
                  <MathRenderer content={value} />
                </button>
              );
            })}

            {/* Answer result */}
            {answerResult && (
              <div
                className="p-3 rounded mt-3"
                style={{
                  background: answerResult.isCorrect ? "#e8f5e9" : "#fff5f5",
                  border: `1px solid ${answerResult.isCorrect ? "#4caf50" : "#dc3545"}44`
                }}
              >
                <div className="fw-bold mb-1" style={{ color: answerResult.isCorrect ? "#2e7d32" : "#b71c1c" }}>
                  {answerResult.isCorrect ? `✅ Correct! +${answerResult.pointsEarned} points` : "❌ Wrong"}
                </div>
                {answerResult.explanation && (
                  <MathRenderer content={answerResult.explanation} />
                )}
              </div>
            )}

            {answered && !answerResult && (
              <div className="text-center mt-4 text-secondary">
                <div className="spinner-border spinner-border-sm me-2" />
                Waiting for next question...
              </div>
            )}

            {answered && answerResult && isHost && (
              <div className="d-flex justify-content-center mt-3">
                <button
                  className="btn btn-dark"
                  style={{ borderRadius: "20px" }}
                  onClick={handleNextQuestion}
                >
                  {questionIndex < totalQuestions - 1 ? "Next Question →" : "Show Results →"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Leaderboard Sidebar */}
        <div
          style={{
            width: "260px",
            flexShrink: 0,
            background: "#1a1a2e",
            color: "white",
            overflowY: "auto",
            padding: "1rem"
          }}
        >
          <h6 className="fw-bold mb-3 opacity-75">⚡ Live Rankings</h6>
          {leaderboard.map((entry, i) => (
            <div
              key={entry.userId}
              className="d-flex align-items-center gap-2 p-2 rounded mb-2"
              style={{
                background: entry.userId === userId
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.05)",
                borderLeft: entry.userId === userId ? "3px solid #FFD700" : "3px solid transparent"
              }}
            >
              <div style={{ width: "24px", fontWeight: 800, textAlign: "center" }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
              </div>
              <div className="flex-grow-1">
                <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  {entry.userId === userId ? "You" : `Player ${entry.userId?.substring(0,6)}`}
                </div>
                <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>
                  {entry.correctAnswers}/{entry.totalAnswered} correct
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                {entry.score}
              </div>
            </div>
          ))}

          <div className="mt-4">
            <button
              className="btn btn-sm btn-outline-danger w-100"
              style={{ borderRadius: "20px" }}
              onClick={handleLeave}
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FINAL RESULTS ──────────────────────────────────────────────────────
  if (status === "finished" && finalResults) {
    const myResult = finalResults.leaderboard?.find(l => l.userId === userId);

    return (
      <div className="container py-5" style={{ maxWidth: "700px" }}>
        <div className="card p-4 shadow text-center" style={{ borderRadius: "20px" }}>
          <div style={{ fontSize: "4rem" }}>
            {myResult?.rank === 1 ? "🏆" : myResult?.rank === 2 ? "🥈" : myResult?.rank === 3 ? "🥉" : "⚔️"}
          </div>
          <h3 className="fw-bold mt-2">Battle Complete!</h3>
          <p className="text-secondary">Topic: {finalResults.topic}</p>

          {myResult && (
            <div
              className="p-3 rounded-3 mb-4"
              style={{ background: "#f8f9fa" }}
            >
              <div className="row g-3">
                <div className="col-4">
                  <div className="fw-bold fs-3" style={{ color: "#0d6efd" }}>#{myResult.rank}</div>
                  <small className="text-secondary">Your Rank</small>
                </div>
                <div className="col-4">
                  <div className="fw-bold fs-3">{myResult.score}</div>
                  <small className="text-secondary">Points</small>
                </div>
                <div className="col-4">
                  <div className="fw-bold fs-3">
                    {myResult.correctAnswers}/{finalResults.totalQuestions}
                  </div>
                  <small className="text-secondary">Correct</small>
                </div>
              </div>
            </div>
          )}

          {/* Full leaderboard */}
          <h6 className="fw-bold mb-3 text-start">Final Standings</h6>
          {finalResults.leaderboard?.map((entry, i) => (
            <div
              key={entry.userId}
              className="d-flex align-items-center gap-3 p-3 rounded mb-2"
              style={{
                background: entry.userId === userId ? "#e8f0fe" : "#f8f9fa",
                border: entry.userId === userId ? "1px solid #0d6efd44" : "none"
              }}
            >
              <div style={{ width: "32px", fontWeight: 800, textAlign: "center", fontSize: "1.2rem" }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
              </div>
              <div className="flex-grow-1 text-start">
                <div className="fw-semibold small">
                  {entry.userId === userId ? "You" : `Player ${entry.userId?.substring(0,6)}`}
                </div>
                <small className="text-secondary">{entry.correctAnswers} correct</small>
              </div>
              <div className="fw-bold">{entry.score} pts</div>
            </div>
          ))}

          <div className="d-flex gap-3 mt-4 justify-content-center">
            <button
              className="btn btn-outline-secondary"
              style={{ borderRadius: "20px" }}
              onClick={onLeave}
            >
              Back to Lobby
            </button>
            <button
              className="btn btn-dark"
              style={{ borderRadius: "20px" }}
              onClick={() => {
                socket?.emit("create_battle_room", {
                  ...room,
                  roomName: `${room?.roomName} Rematch`
                });
              }}
            >
              ⚔️ Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default BattleRoom;
