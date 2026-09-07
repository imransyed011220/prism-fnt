// components/battle/BattleRoomsPage.jsx
// Battle room lobby — create, join, browse public rooms

import { useState, useEffect, useCallback } from "react";
import { useUserContext } from "../../contexts/UserContext";
import { useStudyChat } from "../../contexts/StudyChatContext";
import axios from "axios";
import BattleRoom from "./BattleRoom";
import { API_URL } from "../../config/backend";

const BASE = API_URL;

const TOPICS_JEE = [
  "Mixed (All Topics)", "Mechanics", "Thermodynamics", "Optics",
  "Electrostatics", "Magnetism", "Organic Chemistry", "Inorganic Chemistry",
  "Chemical Equilibrium", "Calculus", "Vectors", "Coordinate Geometry"
];

const TOPICS_NEET = [
  "Mixed (All Topics)", "Cell Biology", "Genetics", "Human Physiology",
  "Plant Physiology", "Ecology", "Organic Chemistry", "Thermodynamics",
  "Human Reproduction", "Biotechnology", "Evolution"
];

function CreateRoomModal({ onClose, onCreated, examTarget }) {
  const { socket } = useStudyChat();
  const topics = examTarget === "NEET" ? TOPICS_NEET : TOPICS_JEE;

  const [form, setForm] = useState({
    roomName: "",
    topic: topics[0],
    difficulty: "medium",
    questionCount: 10,
    isPYQMode: false,
    pyqExamType: examTarget === "NEET" ? "NEET" : "JEE Mains",
    useTimer: true,
    timePerQuestion: 30,
    isPrivate: false,
    examTarget
  });

  function handleCreate() {
    if (!socket) return;
    socket.once("room_created", (data) => {
      onCreated(data);
    });
    socket.once("battle_error", ({ message }) => alert(message));
    socket.emit("create_battle_room", form);
    onClose();
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.7)", zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="card p-4 shadow-lg"
        style={{ maxWidth: "440px", width: "90%", borderRadius: "20px" }}
        onClick={e => e.stopPropagation()}
      >
        <h5 className="fw-bold mb-4">⚔️ Create Battle Room</h5>

        <div className="mb-3">
          <label className="form-label fw-semibold small">Room Name</label>
          <input
            className="form-control"
            placeholder="e.g. Physics Warriors"
            value={form.roomName}
            onChange={e => setForm(p => ({...p, roomName: e.target.value}))}
            style={{ borderRadius: "12px" }}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small">Topic</label>
          <select
            className="form-select"
            value={form.topic}
            onChange={e => setForm(p => ({...p, topic: e.target.value}))}
            style={{ borderRadius: "12px" }}
          >
            {topics.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-6">
            <label className="form-label fw-semibold small">Difficulty</label>
            <select
              className="form-select"
              value={form.difficulty}
              onChange={e => setForm(p => ({...p, difficulty: e.target.value}))}
              style={{ borderRadius: "12px" }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold small">
              Questions: {form.questionCount}
            </label>
            <input
              type="range" className="form-range"
              min={5} max={20} value={form.questionCount}
              onChange={e => setForm(p => ({...p, questionCount: Number(e.target.value)}))}
            />
          </div>
        </div>

        <div className="mb-3 p-3 rounded" style={{ background: form.isPYQMode ? "#fff3e0" : "#f8f9fa", border: form.isPYQMode ? "1px solid #ff9800" : "1px solid #e9ecef" }}>
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="battlePyqMode"
              checked={form.isPYQMode}
              onChange={e => setForm(p => ({ ...p, isPYQMode: e.target.checked }))}
            />
            <label className="form-check-label small fw-semibold" htmlFor="battlePyqMode">
              Use PYQ Engine for battle questions
            </label>
          </div>

          {form.isPYQMode && (
            <>
              <label className="form-label fw-semibold small mb-2">Exam Paper</label>
              <div className="d-flex gap-2 flex-wrap">
                {(examTarget === "NEET" ? ["NEET"] : ["JEE Mains", "JEE Advanced"]).map(exam => (
                  <button
                    key={exam}
                    type="button"
                    className={`btn btn-sm ${form.pyqExamType === exam ? "btn-warning" : "btn-outline-secondary"}`}
                    style={{ borderRadius: "20px" }}
                    onClick={() => setForm(p => ({ ...p, pyqExamType: exam }))}
                  >
                    {exam}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mb-3">
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="useTimer"
              checked={form.useTimer}
              onChange={e => setForm(p => ({ ...p, useTimer: e.target.checked }))}
            />
            <label className="form-check-label small fw-semibold" htmlFor="useTimer">
              Enable timer per question
            </label>
          </div>

          {form.useTimer && (
            <>
              <label className="form-label fw-semibold small">
                Time / Question: {form.timePerQuestion}s
              </label>
              <input
                type="range"
                className="form-range"
                min={5}
                max={120}
                step={5}
                value={form.timePerQuestion}
                onChange={e => setForm(p => ({ ...p, timePerQuestion: Number(e.target.value) }))}
              />
            </>
          )}
        </div>

        <div className="form-check mb-4">
          <input
            type="checkbox"
            className="form-check-input"
            id="isPrivate"
            checked={form.isPrivate}
            onChange={e => setForm(p => ({...p, isPrivate: e.target.checked}))}
          />
          <label className="form-check-label small" htmlFor="isPrivate">
            Private room (invite only)
          </label>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary flex-fill" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-dark flex-fill"
            onClick={handleCreate}
            disabled={!form.roomName.trim()}
          >
            ⚔️ Create Room
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicRoomCard({ room, onJoin }) {
  const diffColors = {
    easy: "#28a745", medium: "#ffc107", hard: "#dc3545"
  };

  return (
    <div
      className="card p-3 shadow-sm"
      style={{
        borderRadius: "16px",
        border: "1px solid #e9ecef",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div className="d-flex align-items-start justify-content-between mb-2">
        <h6 className="fw-bold mb-0">{room.roomName}</h6>
        <span className="badge" style={{
          background: `${diffColors[room.difficulty]}22`,
          color: diffColors[room.difficulty],
          border: `1px solid ${diffColors[room.difficulty]}44`
        }}>
          {room.difficulty}
        </span>
      </div>

      <div className="d-flex gap-3 mb-3 flex-wrap">
        <small className="text-secondary">📚 {room.topic}</small>
        {room.isPYQMode && <small className="text-warning">📝 {room.pyqExamType || "PYQ"}</small>}
        <small className="text-secondary">❓ {room.questionCount} questions</small>
        <small className="text-secondary">👥 {room.members?.length || 1} waiting</small>
      </div>

      <button
        className="btn btn-dark w-100 btn-sm"
        style={{ borderRadius: "20px" }}
        onClick={() => onJoin(room.roomId)}
      >
        Join Battle →
      </button>
    </div>
  );
}

function BattleRoomsPage() {
  const { currentUser } = useUserContext();
  const { socket } = useStudyChat();

  const [view, setView] = useState("lobby");  // lobby | room | history
  const [showCreate, setShowCreate] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const loadPublicRooms = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/battle/rooms/public`);
      setPublicRooms(res.data.payload || []);
    } catch (err) {
      console.error("Failed to load public battle rooms:", err);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (!currentUser?.userId) return;
    try {
      const res = await axios.get(`${BASE}/battle/history/${currentUser.userId}`);
      setBattleHistory(res.data.payload || []);
    } catch (err) {
      console.error("Failed to load battle history:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    const init = async () => {
      await loadPublicRooms();
      await loadHistory();
    };
    init();

    if (!socket) return;

    socket.emit("join_battle_lobby", {});
    socket.on("lobby_rooms", ({ rooms }) => setPublicRooms(rooms));
    socket.on("public_room_added", (room) => {
      setPublicRooms(prev => [room, ...prev]);
    });
    socket.on("public_room_removed", ({ roomId }) => {
      setPublicRooms(prev => prev.filter(r => r.roomId !== roomId));
    });

    return () => {
      socket.off("lobby_rooms");
      socket.off("public_room_added");
      socket.off("public_room_removed");
    };
  }, [socket, loadPublicRooms, loadHistory]);

  function handleRoomCreated(data) {
    setCurrentRoom(data.room);
    setView("room");
  }

  function handleJoinRoom(roomId) {
    if (!socket) return;
    socket.once("room_updated", ({ room }) => {
      setCurrentRoom(room);
      setView("room");
    });
    socket.once("battle_error", ({ message }) => alert(message));
    socket.emit("join_battle_room", { roomId });
  }

  function handleJoinByCode() {
    if (!joinCode.trim() || !socket) return;
    socket.once("room_updated", ({ room }) => {
      setCurrentRoom(room);
      setView("room");
    });
    socket.once("battle_error", ({ message }) => {
      alert(message);
    });
    socket.emit("join_battle_room", {
      inviteCode: joinCode.trim().toUpperCase()
    });
  }

  async function openBattleHistory(item) {
    if (!currentUser?.userId || !item?.resultId) return;
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${BASE}/battle/history/${currentUser.userId}/${item.resultId}`);
      setSelectedHistory(res.data.payload || null);
    } catch (err) {
      console.error("Failed to load battle history detail:", err);
    } finally {
      setHistoryLoading(false);
    }
  }

  const handleLeaveRoom = useCallback(() => {
    setView("lobby");
    setCurrentRoom(null);
    loadPublicRooms();
  }, [loadPublicRooms]);

  if (view === "room" && currentRoom) {
    return (
      <BattleRoom
        room={currentRoom}
        userId={currentUser?.userId}
        socket={socket}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1100px" }}>

      {/* Hero */}
      <div
        className="mb-4 p-4 rounded-3 text-white text-center"
        style={{
          background: "linear-gradient(135deg, #1a1a2e, #0f3460, #533483)",
          position: "relative", overflow: "hidden"
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⚔️</div>
        <h2 className="fw-bold">Battle Rooms</h2>
        <p className="opacity-75 mb-4">
          Challenge friends in real-time quiz battles. Questions from your actual study material.
        </p>

        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <button
            className="btn btn-light btn-lg fw-bold"
            style={{ borderRadius: "30px", padding: "12px 32px" }}
            onClick={() => setShowCreate(true)}
          >
            ⚔️ Create Room
          </button>
          <div className="d-flex gap-2">
            <input
              className="form-control"
              placeholder="Enter invite code..."
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              style={{ borderRadius: "20px", maxWidth: "200px" }}
              onKeyDown={e => e.key === "Enter" && handleJoinByCode()}
            />
            <button
              className="btn btn-outline-light"
              style={{ borderRadius: "20px" }}
              onClick={handleJoinByCode}
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        {[
          { id: "lobby", label: "🌐 Public Rooms" },
          { id: "history", label: "📋 My History" },
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn ${view === tab.id ? "btn-dark" : "btn-outline-secondary"}`}
            style={{ borderRadius: "20px" }}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Public Rooms */}
      {view === "lobby" && (
        <>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold mb-0">Active Rooms ({publicRooms.length})</h5>
            <button
              className="btn btn-sm btn-outline-secondary"
              style={{ borderRadius: "20px" }}
              onClick={loadPublicRooms}
            >
              🔄 Refresh
            </button>
          </div>

          {publicRooms.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: "3rem" }}>🎮</div>
              <h5 className="fw-bold mt-3">No rooms yet!</h5>
              <p className="text-secondary">Be the first to create a battle room.</p>
              <button
                className="btn btn-dark"
                style={{ borderRadius: "20px" }}
                onClick={() => setShowCreate(true)}
              >
                ⚔️ Create Room
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {publicRooms.map(room => (
                <div key={room.roomId} className="col-md-6 col-lg-4">
                  <PublicRoomCard room={room} onJoin={handleJoinRoom} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* History */}
      {view === "history" && (
        <div>
          <h5 className="fw-bold mb-3">Past Battles</h5>
          {battleHistory.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <div style={{ fontSize: "3rem" }}>⚔️</div>
              <p>No battles yet. Join one!</p>
            </div>
          ) : (
            battleHistory.map(h => {
              const myResult = h.leaderboard?.find(l => l.userId === currentUser?.userId);
              return (
                <div
                  key={h.resultId}
                  className="card p-3 mb-3 shadow-sm"
                  style={{ borderRadius: "16px", cursor: "pointer" }}
                  onClick={() => openBattleHistory(h)}
                  title="Click to view question analysis"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                      style={{
                        width: "48px", height: "48px",
                        background: myResult?.rank === 1 ? "#FFD700" :
                                    myResult?.rank === 2 ? "#C0C0C0" : "#CD7F32",
                        fontSize: "1.5rem"
                      }}
                    >
                      {myResult?.rank === 1 ? "🥇" : myResult?.rank === 2 ? "🥈" : `#${myResult?.rank}`}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold">{h.roomName || h.topic}</div>
                      <div className="d-flex gap-3">
                        <small className="text-secondary">📚 {h.topic}</small>
                        <small className="text-secondary">👥 {h.leaderboard?.length} players</small>
                        <small className="text-secondary">
                          ✅ {myResult?.correctAnswers}/{h.leaderboard?.reduce((m, l) => Math.max(m, l.totalAnswered), 0)} correct
                        </small>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold fs-5">{myResult?.score || 0}</div>
                      <small className="text-secondary">points</small>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedHistory && (
        <BattleHistoryReviewModal
          battle={selectedHistory}
          userId={currentUser?.userId}
          onClose={() => setSelectedHistory(null)}
        />
      )}

      {historyLoading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.25)", zIndex: 2200 }}
        >
          <div className="card p-3 d-flex flex-row align-items-center gap-2">
            <div className="spinner-border spinner-border-sm text-dark" />
            <small>Loading battle analysis...</small>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={handleRoomCreated}
          examTarget={currentUser?.examTarget || "JEE"}
        />
      )}
    </div>
  );
}

function BattleHistoryReviewModal({ battle, userId, onClose }) {
  const myAnswers = battle?.memberAnswers?.[userId] || {};
  const questions = battle?.questions || [];

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.65)", zIndex: 2100 }}
      onClick={onClose}
    >
      <div
        className="card shadow-lg"
        style={{ width: "min(980px, 95vw)", maxHeight: "90vh", overflow: "hidden", borderRadius: "16px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <div>
            <h5 className="fw-bold mb-0">Battle Analysis</h5>
            <small className="text-secondary">{battle?.roomName || battle?.topic}</small>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
        </div>

        <div className="p-3" style={{ overflowY: "auto" }}>
          {questions.length === 0 ? (
            <div className="text-center text-secondary py-4">No question review data found for this battle.</div>
          ) : (
            questions.map((q, idx) => {
              const ans = myAnswers[String(idx)] || myAnswers[idx] || null;
              const isSkipped = !ans || !ans.selected;
              const isCorrect = !!ans?.correct;
              return (
                <div
                  key={idx}
                  className={`p-3 mb-3 border rounded ${
                    isSkipped ? "bg-light" : isCorrect ? "bg-success bg-opacity-10" : "bg-danger bg-opacity-10"
                  }`}
                >
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className="badge"
                      style={{ background: isSkipped ? "#6c757d" : isCorrect ? "#28a745" : "#dc3545" }}
                    >
                      Q{idx + 1} · {isSkipped ? "SKIP" : isCorrect ? "✓" : "✗"}
                    </span>
                    {!isSkipped && (
                      <small className="text-secondary">Points: {ans?.points || 0}</small>
                    )}
                  </div>
                  <div className="fw-semibold small mb-1">{q.question}</div>
                  <div className="small">
                    {!isSkipped ? (
                      <span className={isCorrect ? "text-success" : "text-danger"}>
                        Your answer: <strong>{ans?.selected}</strong>
                        {!isCorrect && <> | Correct: <strong className="text-success">{q.answer}</strong></>}
                      </span>
                    ) : (
                      <span className="text-secondary">Not attempted</span>
                    )}
                  </div>
                  {q.explanation && (
                    <div className="text-secondary small mt-1">💬 {q.explanation}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default BattleRoomsPage;
