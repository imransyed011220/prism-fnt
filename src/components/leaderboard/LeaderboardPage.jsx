// components/leaderboard/LeaderboardPage.jsx
// Competitive leaderboard with weekly/monthly/yearly/all-time periods
// Top 3 animated, click user to see profile
// Beautiful competitive design

import { useState, useEffect } from "react";
import { useUserContext } from "../../contexts/UserContext";
import axios from "axios";

const BASE = "http://localhost:8000/api";

const PERIOD_CONFIG = {
  "weekly": { label: "This Week", icon: "📅", color: "#0d6efd", desc: "Resets every Monday" },
  "monthly": { label: "This Month", icon: "📆", color: "#6f42c1", desc: "Resets on 1st" },
  "yearly": { label: "This Year", icon: "🗓️", color: "#28a745", desc: "Resets Jan 1st" },
  "all-time": { label: "All Time", icon: "🏆", color: "#212529", desc: "Permanent record" }
};

const MEDAL_CONFIG = [
  { emoji: "🥇", bg: "linear-gradient(135deg, #FFD700, #FFA500)", shadow: "0 8px 32px rgba(255,215,0,0.4)" },
  { emoji: "🥈", bg: "linear-gradient(135deg, #C0C0C0, #A0A0A0)", shadow: "0 8px 32px rgba(192,192,192,0.4)" },
  { emoji: "🥉", bg: "linear-gradient(135deg, #CD7F32, #8B4513)", shadow: "0 8px 32px rgba(205,127,50,0.4)" }
];

function TopThreeCard({ entry, position }) {
  const medal = MEDAL_CONFIG[position];
  const size = position === 0 ? "80px" : "64px";
  const nameSize = position === 0 ? "1.1rem" : "0.95rem";
  const scoreSize = position === 0 ? "1.6rem" : "1.3rem";

  return (
    <div
      className="text-center"
      style={{
        order: position === 0 ? 0 : position === 1 ? -1 : 1,
        flex: position === 0 ? "0 0 35%" : "0 0 30%"
      }}
    >
      <div
        className="p-3 rounded-3 text-white"
        style={{
          background: medal.bg,
          boxShadow: medal.shadow,
          animation: "fadeInUp 0.5s ease",
          marginTop: position === 0 ? "0" : "20px"
        }}
      >
        {/* medal */}
        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{medal.emoji}</div>

        {/* avatar */}
        {entry.profileImageUrl ? (
          <img
            src={entry.profileImageUrl}
            alt=""
            style={{
              width: size, height: size,
              borderRadius: "50%",
              border: "3px solid white",
              objectFit: "cover"
            }}
          />
        ) : (
          <div
            style={{
              width: size, height: size, borderRadius: "50%",
              background: "rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto",
              fontSize: position === 0 ? "2rem" : "1.5rem",
              border: "3px solid white"
            }}
          >
            {entry.firstName?.[0] || "?"}
          </div>
        )}

        <div className="fw-bold mt-2" style={{ fontSize: nameSize }}>
          {entry.firstName} {entry.lastName}
        </div>
        <div className="opacity-75 small">{entry.examTarget}</div>
        <div className="fw-bold mt-1" style={{ fontSize: scoreSize }}>
          {entry.score.toLocaleString()} pts
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, isCurrentUser, onClick }) {
  return (
    <div
      className={`d-flex align-items-center p-3 border-bottom ${isCurrentUser ? "bg-primary bg-opacity-10" : ""}`}
      style={{
        cursor: "pointer",
        transition: "background 0.15s",
        borderLeft: isCurrentUser ? "3px solid #0d6efd" : "3px solid transparent"
      }}
      onClick={onClick}
      onMouseEnter={e => { if (!isCurrentUser) e.currentTarget.style.background = "#f8f9fa"; }}
      onMouseLeave={e => { if (!isCurrentUser) e.currentTarget.style.background = ""; }}
    >
      {/* rank */}
      <div
        className="fw-bold text-center flex-shrink-0"
        style={{ width: "40px", fontSize: "1rem", color: "#6c757d" }}
      >
        {entry.rank <= 3 ? MEDAL_CONFIG[entry.rank - 1]?.emoji : `#${entry.rank}`}
      </div>

      {/* avatar */}
      <div className="flex-shrink-0 mx-3">
        {entry.profileImageUrl ? (
          <img
            src={entry.profileImageUrl}
            alt=""
            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "#212529", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold"
            }}
          >
            {entry.firstName?.[0] || "?"}
          </div>
        )}
      </div>

      {/* name + exam */}
      <div className="flex-grow-1">
        <div className="fw-semibold">
          {entry.firstName} {entry.lastName}
          {isCurrentUser && <span className="badge bg-primary ms-2 small">You</span>}
        </div>
        <small className="text-secondary">{entry.examTarget}</small>
      </div>

      {/* score */}
      <div className="text-end flex-shrink-0">
        <div className="fw-bold fs-6">{entry.score.toLocaleString()}</div>
        <small className="text-secondary">points</small>
      </div>
    </div>
  );
}

function LeaderboardPage() {
  const { currentUser } = useUserContext();
  const [period, setPeriod] = useState("weekly");
  const [entries, setEntries] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadLeaderboard();
    loadMyRank();
  }, [period]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/leaderboard/${period}`, {
        params: { examTarget: currentUser?.examTarget }
      });
      setEntries(res.data.payload || []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyRank() {
    if (!currentUser?.userId) return;
    try {
      const res = await axios.get(`${BASE}/leaderboard/user/${currentUser.userId}`);
      setMyRank(res.data.payload);
    } catch { }
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const config = PERIOD_CONFIG[period];

  // Filter entries
  const filteredEntries = entries.filter(e =>
    !searchQuery.trim() ||
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-4" style={{ maxWidth: "800px" }}>

      {/* header */}
      <div className="text-center mb-4">
        <h2 className="fw-bold">🏆 Leaderboard</h2>
        <p className="text-secondary">Compete with fellow {currentUser?.examTarget || "JEE/NEET"} aspirants</p>
      </div>

      {/* period tabs */}
      <div className="d-flex gap-2 mb-4 justify-content-center flex-wrap">
        {Object.entries(PERIOD_CONFIG).map(([key, val]) => (
          <button
            key={key}
            className={`btn fw-semibold ${period === key ? "btn-dark" : "btn-outline-secondary"}`}
            style={{ borderRadius: "20px" }}
            onClick={() => setPeriod(key)}
          >
            {val.icon} {val.label}
          </button>
        ))}
      </div>

      {/* period info */}
      <div className="text-center mb-4">
        <span
          className="badge px-3 py-2"
          style={{ background: config.color, fontSize: "0.85rem" }}
        >
          {config.icon} {config.label} · {config.desc}
        </span>
      </div>

      {/* my rank card */}
      {myRank && (
        <div
          className="card mb-4 p-3 border-0"
          style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", color: "white" }}
        >
          <div className="d-flex align-items-center gap-3">
            <div style={{ fontSize: "2rem" }}>⚡</div>
            <div className="flex-grow-1">
              <div className="fw-bold">Your Ranking</div>
              <small className="opacity-75">Keep going! Every query counts.</small>
            </div>
            <div className="text-end">
              <div className="fw-bold fs-5">
                #{period === "weekly" ? myRank.weeklyRank : myRank.allTimeRank}
              </div>
              <div className="opacity-75 small">
                {myRank[`${period.replace("-", "")}Score`]?.toLocaleString() || myRank.allTimeScore?.toLocaleString()} pts
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" />
          <p className="text-secondary mt-2">Loading rankings...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: "3rem" }}>🎯</div>
          <h5 className="fw-bold mt-3">Be the first!</h5>
          <p className="text-secondary">No rankings yet for this period. Start chatting, taking quizzes, and learning to climb the board!</p>
        </div>
      ) : (
        <>
          {/* top 3 podium */}
          {top3.length >= 1 && (
            <div className="d-flex justify-content-center gap-3 mb-4 align-items-end flex-wrap">
              {top3.map((entry, i) => (
                <TopThreeCard
                  key={entry.userId}
                  entry={entry}
                  position={i}
                />
              ))}
            </div>
          )}

          {/* rest of leaderboard */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ borderRadius: "20px" }}
            />
          </div>
          
          <div className="card shadow overflow-hidden">
            {/* top 3 in list too */}
            {filteredEntries.map((entry, i) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUser?.userId}
                onClick={() => setSelectedUser(entry)}
              />
            ))}
          </div>

          <p className="text-center text-secondary small mt-3">
            {entries.length} students on the leaderboard · Click any name to view profile
          </p>
        </>
      )}

      {/* user profile modal */}
      {selectedUser && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 2000 }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="card p-4 shadow-lg"
            style={{ maxWidth: "380px", width: "90%", borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              {selectedUser.profileImageUrl ? (
                <img
                  src={selectedUser.profileImageUrl}
                  alt=""
                  className="rounded-circle mb-3"
                  style={{ width: "80px", height: "80px", objectFit: "cover", border: "3px solid #212529" }}
                />
              ) : (
                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center fw-bold text-white"
                  style={{ width: "80px", height: "80px", background: "#212529", fontSize: "2rem" }}
                >
                  {selectedUser.firstName?.[0] || "?"}
                </div>
              )}
              <h5 className="fw-bold">{selectedUser.firstName} {selectedUser.lastName}</h5>
              <span className="badge bg-dark mb-3">{selectedUser.examTarget} Aspirant</span>

              <div className="row g-3">
                <div className="col-6">
                  <div className="p-2 rounded" style={{ background: "#f8f9fa" }}>
                    <div className="fw-bold">#{selectedUser.rank}</div>
                    <small className="text-secondary">Global Rank</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-2 rounded" style={{ background: "#f8f9fa" }}>
                    <div className="fw-bold">{selectedUser.score.toLocaleString()}</div>
                    <small className="text-secondary">Points</small>
                  </div>
                </div>
              </div>

              <button className="btn btn-dark w-100 mt-3" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default LeaderboardPage;