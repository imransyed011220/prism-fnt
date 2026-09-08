// components/battle/BattleRoomsPage.jsx
// Battle room lobby — create, join, browse public rooms
// Gaming theme — dark glassmorphism, neon accents, live real-time updates

import { useState, useEffect, useCallback, useRef } from "react";
import { useUserContext } from "../../contexts/UserContext";
import { useStudyChat } from "../../contexts/StudyChatContext";
import axios from "axios";
import BattleRoom from "./BattleRoom";

const BASE = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api`;

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

// ── Styles ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800&display=swap');

  .battle-page { font-family: 'Inter', sans-serif; }
  .battle-page * { box-sizing: border-box; }

  .battle-hero {
    background: linear-gradient(135deg, #0a0a1a 0%, #1a0533 40%, #0d2040 100%);
    border-radius: 24px;
    overflow: hidden;
    position: relative;
  }
  .battle-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.15) 0%, transparent 60%),
                radial-gradient(ellipse at 70% 20%, rgba(6,182,212,0.1) 0%, transparent 50%);
    pointer-events: none;
  }
  .battle-title {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(1.6rem, 4vw, 2.8rem);
    font-weight: 900;
    background: linear-gradient(135deg, #a78bfa, #67e8f9, #f9a8d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .neon-btn {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white; border: none; border-radius: 50px;
    padding: 12px 32px; font-weight: 700; font-size: 1rem;
    cursor: pointer; transition: all 0.25s; position: relative; overflow: hidden;
    box-shadow: 0 0 20px rgba(124,58,237,0.4);
  }
  .neon-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 35px rgba(124,58,237,0.7), 0 8px 24px rgba(0,0,0,0.3);
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
  }
  .neon-btn:active { transform: translateY(0); }

  .neon-btn-outline {
    background: transparent; color: #a78bfa;
    border: 2px solid rgba(167,139,250,0.5);
    border-radius: 50px; padding: 12px 28px; font-weight: 600;
    cursor: pointer; transition: all 0.25s;
  }
  .neon-btn-outline:hover {
    background: rgba(167,139,250,0.1);
    border-color: #a78bfa;
    box-shadow: 0 0 20px rgba(167,139,250,0.3);
  }

  .join-input {
    background: rgba(255,255,255,0.07);
    border: 1.5px solid rgba(167,139,250,0.3);
    border-radius: 50px; color: white; padding: 12px 24px;
    font-size: 1rem; outline: none; transition: all 0.2s;
    letter-spacing: 2px; text-transform: uppercase;
  }
  .join-input::placeholder { color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: none; }
  .join-input:focus { border-color: #a78bfa; box-shadow: 0 0 15px rgba(167,139,250,0.25); }

  .tab-btn {
    background: transparent; border: none;
    padding: 10px 24px; font-weight: 600; font-size: 0.9rem;
    border-radius: 50px; cursor: pointer; transition: all 0.2s;
    color: #6b7280;
  }
  .tab-btn.active {
    background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2));
    color: #a78bfa; border: 1px solid rgba(167,139,250,0.3);
  }
  .tab-btn:hover:not(.active) { background: rgba(255,255,255,0.05); color: #9ca3af; }

  .room-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; padding: 20px;
    cursor: pointer; transition: all 0.25s;
    position: relative; overflow: hidden;
    backdrop-filter: blur(10px);
  }
  .room-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(124,58,237,0.05), transparent);
    opacity: 0; transition: opacity 0.25s;
  }
  .room-card:hover { transform: translateY(-4px); border-color: rgba(167,139,250,0.4); box-shadow: 0 8px 32px rgba(124,58,237,0.2); }
  .room-card:hover::before { opacity: 1; }

  .diff-badge {
    padding: 3px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .diff-easy { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
  .diff-medium { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
  .diff-hard { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
  .diff-pyq { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }

  .join-btn {
    width: 100%; padding: 10px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white; font-weight: 700; cursor: pointer; transition: all 0.2s;
    margin-top: 12px; font-size: 0.9rem;
  }
  .join-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 15px rgba(124,58,237,0.5); }

  .history-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 16px; cursor: pointer;
    transition: all 0.2s; margin-bottom: 12px;
  }
  .history-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(167,139,250,0.2); }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  .modal-card {
    background: #0f0f1f;
    border: 1px solid rgba(167,139,250,0.2);
    border-radius: 24px; padding: 32px;
    max-width: 480px; width: 90%;
    max-height: 90vh; overflow-y: auto;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
    animation: slideUp 0.3s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .modal-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.2rem; font-weight: 700;
    background: linear-gradient(135deg, #a78bfa, #67e8f9);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  .form-field { margin-bottom: 18px; }
  .form-label { display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-ctrl {
    width: 100%; padding: 10px 16px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; color: white; font-size: 0.9rem; outline: none;
    transition: border-color 0.2s;
  }
  .form-ctrl:focus { border-color: rgba(167,139,250,0.5); }
  .form-ctrl option { background: #1a1a2e; }

  .toggle-btn {
    padding: 8px 18px; border-radius: 50px; cursor: pointer; font-size: 0.85rem;
    font-weight: 600; transition: all 0.2s; border: 1.5px solid transparent;
  }
  .toggle-btn.on { background: rgba(124,58,237,0.2); color: #a78bfa; border-color: rgba(124,58,237,0.4); }
  .toggle-btn.off { background: transparent; color: #6b7280; border-color: rgba(255,255,255,0.1); }

  .live-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #10b981;
    display: inline-block; margin-right: 6px;
    animation: livePulse 1.5s ease infinite;
  }
  @keyframes livePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
    50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
  }

  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-icon { font-size: 4rem; margin-bottom: 16px; display: block; }

  /* scrollbar */
  .battle-page ::-webkit-scrollbar { width: 4px; }
  .battle-page ::-webkit-scrollbar-track { background: transparent; }
  .battle-page ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 2px; }

  @media (max-width: 768px) {
    .hero-actions { flex-direction: column; gap: 12px; }
    .hero-join-row { flex-direction: column; }
  }
`;

// ── Create Room Modal ───────────────────────────────────────────────────────
function CreateRoomModal({ onClose, onCreated, examTarget }) {
  const { socket } = useStudyChat();
  const topics = examTarget === "NEET" ? TOPICS_NEET : TOPICS_JEE;
  const [creating, setCreating] = useState(false);

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
    if (!socket || !form.roomName.trim() || creating) return;
    setCreating(true);
    socket.emit("create_battle_room", form);
    socket.once("room_created", (data) => {
      setCreating(false);
      onCreated(data);
    });
    onClose();
  }

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: 24 }}>
          <div className="modal-title">⚔️ Create Battle Room</div>
          <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}>Configure your quiz arena</div>
        </div>

        <div className="form-field">
          <label className="form-label">Room Name</label>
          <input className="form-ctrl" placeholder="e.g. Physics Warriors" value={form.roomName}
            onChange={e => f("roomName", e.target.value)} />
        </div>

        <div className="form-field">
          <label className="form-label">Topic</label>
          <select className="form-ctrl" value={form.topic} onChange={e => f("topic", e.target.value)}>
            {topics.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div>
            <label className="form-label">Difficulty</label>
            <select className="form-ctrl" value={form.difficulty} onChange={e => f("difficulty", e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="form-label">Questions: {form.questionCount}</label>
            <input type="range" min={5} max={20} value={form.questionCount}
              onChange={e => f("questionCount", Number(e.target.value))}
              style={{ width: "100%", accentColor: "#7c3aed", marginTop: 10 }} />
          </div>
        </div>

        {/* PYQ Toggle */}
        <div className="form-field" style={{ background: form.isPYQMode ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.isPYQMode ? 12 : 0 }}>
            <div>
              <div style={{ color: "#e5e7eb", fontWeight: 600, fontSize: "0.9rem" }}>📝 PYQ Engine</div>
              <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>Use real past year questions</div>
            </div>
            <button className={`toggle-btn ${form.isPYQMode ? "on" : "off"}`}
              onClick={() => f("isPYQMode", !form.isPYQMode)}>
              {form.isPYQMode ? "ON" : "OFF"}
            </button>
          </div>
          {form.isPYQMode && (
            <div style={{ display: "flex", gap: 8 }}>
              {(examTarget === "NEET" ? ["NEET"] : ["JEE Mains", "JEE Advanced"]).map(exam => (
                <button key={exam} className={`toggle-btn ${form.pyqExamType === exam ? "on" : "off"}`}
                  onClick={() => f("pyqExamType", exam)}>{exam}</button>
              ))}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="form-field" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.useTimer ? 12 : 0 }}>
            <div>
              <div style={{ color: "#e5e7eb", fontWeight: 600, fontSize: "0.9rem" }}>⏱ Timer</div>
              <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>Speed bonus for fast answers</div>
            </div>
            <button className={`toggle-btn ${form.useTimer ? "on" : "off"}`}
              onClick={() => f("useTimer", !form.useTimer)}>
              {form.useTimer ? "ON" : "OFF"}
            </button>
          </div>
          {form.useTimer && (
            <div>
              <label className="form-label" style={{ marginBottom: 6 }}>Time per Question: {form.timePerQuestion}s</label>
              <input type="range" min={5} max={120} step={5} value={form.timePerQuestion}
                onChange={e => f("timePerQuestion", Number(e.target.value))}
                style={{ width: "100%", accentColor: "#7c3aed" }} />
            </div>
          )}
        </div>

        {/* Private */}
        <div className="form-field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <div style={{ color: "#e5e7eb", fontWeight: 600, fontSize: "0.9rem" }}>🔒 Private Room</div>
            <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>Invite code only access</div>
          </div>
          <button className={`toggle-btn ${form.isPrivate ? "on" : "off"}`}
            onClick={() => f("isPrivate", !form.isPrivate)}>
            {form.isPrivate ? "ON" : "OFF"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <button className="neon-btn-outline" style={{ flex: 1, padding: "12px" }} onClick={onClose}>Cancel</button>
          <button className="neon-btn" style={{ flex: 2 }} onClick={handleCreate}
            disabled={!form.roomName.trim() || creating}>
            {creating ? "Creating..." : "⚔️ Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Public Room Card ────────────────────────────────────────────────────────
function PublicRoomCard({ room, onJoin }) {
  const memberCount = room.members?.length || room.memberCount || 1;

  return (
    <div className="room-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <h6 style={{ color: "#e5e7eb", fontWeight: 700, margin: 0, fontSize: "1rem" }}>{room.roomName}</h6>
        <span className={`diff-badge diff-${room.difficulty}`}>{room.difficulty}</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>📚 {room.topic}</span>
        {room.isPYQMode && <span className="diff-badge diff-pyq" style={{ fontSize: "0.7rem" }}>📝 {room.pyqExamType || "PYQ"}</span>}
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>❓ {room.questionCount} Qs</span>
        <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>👥 {memberCount} waiting</span>
        {room.useTimer !== false && <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>⏱ {room.timePerQuestion || 30}s</span>}
      </div>
      <button className="join-btn" onClick={() => onJoin(room.roomId)}>
        Join Battle →
      </button>
    </div>
  );
}

// ── History Review Modal ────────────────────────────────────────────────────
function BattleHistoryReviewModal({ battle, userId, onClose }) {
  const myAnswers = battle?.memberAnswers?.[userId] || {};
  const questions = battle?.questions || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 700, maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div className="modal-title">📊 Battle Analysis</div>
            <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>{battle?.roomName || battle?.topic}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#9ca3af", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>✕ Close</button>
        </div>
        <div style={{ overflowY: "auto", maxHeight: "65vh" }}>
          {questions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>No review data available.</div>
          ) : questions.map((q, idx) => {
            const ans = myAnswers[String(idx)] || myAnswers[idx] || null;
            const isSkipped = !ans || !ans.selected;
            const isCorrect = !!ans?.correct;
            return (
              <div key={idx} style={{
                padding: 16, marginBottom: 12, borderRadius: 12,
                background: isSkipped ? "rgba(255,255,255,0.03)" : isCorrect ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${isSkipped ? "rgba(255,255,255,0.06)" : isCorrect ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    padding: "2px 10px", borderRadius: 50, fontSize: "0.75rem", fontWeight: 700,
                    background: isSkipped ? "#374151" : isCorrect ? "#065f46" : "#7f1d1d",
                    color: isSkipped ? "#9ca3af" : isCorrect ? "#10b981" : "#ef4444"
                  }}>Q{idx + 1} · {isSkipped ? "SKIPPED" : isCorrect ? "✓ CORRECT" : "✗ WRONG"}</span>
                  {!isSkipped && <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>+{ans?.points || 0} pts</span>}
                </div>
                <div style={{ color: "#e5e7eb", fontSize: "0.9rem", fontWeight: 500, marginBottom: 6 }}>{q.question}</div>
                <div style={{ fontSize: "0.85rem" }}>
                  {!isSkipped ? (
                    <span style={{ color: isCorrect ? "#10b981" : "#ef4444" }}>
                      Your answer: <strong>{ans?.selected}</strong>
                      {!isCorrect && <> · Correct: <strong style={{ color: "#10b981" }}>{q.answer}</strong></>}
                    </span>
                  ) : <span style={{ color: "#6b7280" }}>Not attempted</span>}
                </div>
                {q.explanation && <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: 6 }}>💬 {q.explanation}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
function BattleRoomsPage() {
  const { currentUser } = useUserContext();
  const { socket } = useStudyChat();

  const [view, setView] = useState("lobby");
  const [showCreate, setShowCreate] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // ── Restore room from sessionStorage on refresh ─────────────────────────
  useEffect(() => {
    const savedRoomId = sessionStorage.getItem("battle_room_id");
    if (savedRoomId && socket) {
      // Try to re-join the room after reconnect
      axios.get(`${BASE}/battle/room/${savedRoomId}`).then(res => {
        const room = res.data?.payload;
        if (room && (room.status === "active" || room.status === "countdown" || room.status === "generating" || room.status === "waiting")) {
          socket.emit("join_battle_room", { roomId: savedRoomId });
          socket.once("join_result", ({ success, room: updatedRoom }) => {
            if (success && updatedRoom) {
              setCurrentRoom(updatedRoom);
              setView("room");
            }
          });
        } else {
          sessionStorage.removeItem("battle_room_id");
        }
      }).catch(() => sessionStorage.removeItem("battle_room_id"));
    }
  }, [socket]);

  // ── Load data ────────────────────────────────────────────────────────────
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

  // ── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    loadPublicRooms();
    loadHistory();
    if (!socket) return;

    socket.emit("join_battle_lobby", {});
    socket.on("lobby_rooms", ({ rooms }) => setPublicRooms(rooms));
    socket.on("public_room_added", (room) => setPublicRooms(prev => {
      if (prev.find(r => r.roomId === room.roomId)) return prev;
      return [room, ...prev];
    }));
    socket.on("public_room_removed", ({ roomId }) => setPublicRooms(prev => prev.filter(r => r.roomId !== roomId)));
    socket.on("room_updated", ({ room }) => {
      // Update public rooms list member counts live
      setPublicRooms(prev => prev.map(r =>
        r.roomId === room.roomId ? { ...r, memberCount: room.members?.length || r.memberCount, members: room.members } : r
      ));
    });

    return () => {
      socket.off("lobby_rooms");
      socket.off("public_room_added");
      socket.off("public_room_removed");
      socket.off("room_updated");
    };
  }, [socket, loadPublicRooms, loadHistory]);

  function handleRoomCreated(data) {
    sessionStorage.setItem("battle_room_id", data.roomId);
    setCurrentRoom(data.room);
    setView("room");
  }

  function handleJoinRoom(roomId) {
    if (!socket || joinLoading) return;
    setJoinLoading(true);
    setJoinError("");
    socket.emit("join_battle_room", { roomId });
    socket.once("join_result", ({ success, room }) => {
      setJoinLoading(false);
      if (success && room) {
        sessionStorage.setItem("battle_room_id", room.roomId);
        setCurrentRoom(room);
        setView("room");
      }
    });
    socket.once("battle_error", ({ message }) => {
      setJoinLoading(false);
      setJoinError(message);
    });
  }

  function handleJoinByCode() {
    if (!joinCode.trim() || !socket || joinLoading) return;
    setJoinLoading(true);
    setJoinError("");
    socket.emit("join_battle_room", { inviteCode: joinCode.trim().toUpperCase() });
    socket.once("join_result", ({ success, room }) => {
      setJoinLoading(false);
      if (success && room) {
        sessionStorage.setItem("battle_room_id", room.roomId);
        setCurrentRoom(room);
        setView("room");
      }
    });
    socket.once("battle_error", ({ message }) => {
      setJoinLoading(false);
      setJoinError(message);
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

  if (view === "room" && currentRoom) {
    return (
      <BattleRoom
        room={currentRoom}
        userId={currentUser?.userId}
        socket={socket}
        onLeave={() => {
          sessionStorage.removeItem("battle_room_id");
          setView("lobby");
          setCurrentRoom(null);
          loadPublicRooms();
          loadHistory();
        }}
      />
    );
  }

  return (
    <div className="battle-page" style={{ background: "#070714", minHeight: "100vh", padding: "24px 20px", color: "#e5e7eb" }}>
      <style>{css}</style>

      {/* Hero Banner */}
      <div className="battle-hero" style={{ padding: "clamp(24px, 5vw, 48px)", marginBottom: 28 }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: "3.5rem", marginBottom: 8 }}>⚔️</div>
            <h1 className="battle-title">Battle Rooms</h1>
            <p style={{ color: "rgba(167,139,250,0.7)", marginTop: 8, fontSize: "1rem", maxWidth: 480, margin: "8px auto 0" }}>
              Challenge friends in real-time AI quiz battles. Questions from your actual study material.
            </p>
          </div>

          <div className="hero-actions" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <button className="neon-btn" style={{ fontSize: "1.05rem", padding: "14px 36px" }}
              onClick={() => setShowCreate(true)}>
              ⚔️ Create Room
            </button>
            <div className="hero-join-row" style={{ display: "flex", gap: 10 }}>
              <input
                className="join-input"
                placeholder="Enter invite code"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value); setJoinError(""); }}
                onKeyDown={e => e.key === "Enter" && handleJoinByCode()}
                style={{ width: 180 }}
              />
              <button className="neon-btn-outline" onClick={handleJoinByCode} disabled={joinLoading || !joinCode.trim()}>
                {joinLoading ? "..." : "Join →"}
              </button>
            </div>
          </div>

          {joinError && (
            <div style={{ textAlign: "center", marginTop: 12, color: "#ef4444", fontSize: "0.85rem" }}>
              ⚠️ {joinError}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { id: "lobby", label: "🌐 Public Rooms" },
          { id: "history", label: "📋 My History" },
        ].map(tab => (
          <button key={tab.id} className={`tab-btn ${view === tab.id ? "active" : ""}`}
            onClick={() => { setView(tab.id); if (tab.id === "history") loadHistory(); }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Public Rooms Tab */}
      {view === "lobby" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="live-dot" />
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#e5e7eb" }}>
                Live Rooms <span style={{ color: "#6b7280", fontWeight: 400 }}>({publicRooms.length})</span>
              </h2>
            </div>
          </div>

          {publicRooms.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎮</span>
              <h3 style={{ color: "#e5e7eb", fontWeight: 700, marginBottom: 8 }}>No rooms yet!</h3>
              <p style={{ color: "#6b7280", marginBottom: 24 }}>Be the first to create a battle room and challenge others.</p>
              <button className="neon-btn" onClick={() => setShowCreate(true)}>⚔️ Create Room</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {publicRooms.map(room => (
                <PublicRoomCard key={room.roomId} room={room} onJoin={handleJoinRoom} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {view === "history" && (
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20, color: "#e5e7eb" }}>Past Battles</h2>
          {battleHistory.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">⚔️</span>
              <p style={{ color: "#6b7280" }}>No battles yet. Join one!</p>
            </div>
          ) : (
            battleHistory.map(h => {
              const myResult = h.leaderboard?.find(l => l.userId === currentUser?.userId);
              const rankEmoji = myResult?.rank === 1 ? "🥇" : myResult?.rank === 2 ? "🥈" : myResult?.rank === 3 ? "🥉" : `#${myResult?.rank || "?"}`;
              return (
                <div key={h.resultId} className="history-card" onClick={() => openBattleHistory(h)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                      background: myResult?.rank === 1 ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${myResult?.rank === 1 ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem"
                    }}>
                      {rankEmoji}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {h.roomName || h.topic}
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>📚 {h.topic}</span>
                        <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>👥 {h.leaderboard?.length} players</span>
                        <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>✅ {myResult?.correctAnswers || 0} correct</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#a78bfa" }}>{myResult?.score || 0}</div>
                      <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>pts</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* History Review Modal */}
      {selectedHistory && (
        <BattleHistoryReviewModal battle={selectedHistory} userId={currentUser?.userId}
          onClose={() => setSelectedHistory(null)} />
      )}

      {historyLoading && (
        <div className="modal-overlay">
          <div style={{ color: "white", display: "flex", alignItems: "center", gap: 12, fontSize: "1rem" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #a78bfa", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            Loading analysis...
          </div>
        </div>
      )}

      {showCreate && (
        <CreateRoomModal onClose={() => setShowCreate(false)} onCreated={handleRoomCreated}
          examTarget={currentUser?.examTarget || "JEE"} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default BattleRoomsPage;
