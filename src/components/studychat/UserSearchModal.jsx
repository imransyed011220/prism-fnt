// components/studychat/UserSearchModal.jsx
// Search users from leaderboard to send friend requests

import { useState } from "react";
import { useStudyChat } from "../../contexts/StudyChatContext";
import { useUserContext } from "../../contexts/UserContext";
import axios from "axios";

const BASE = "http://localhost:8000/api";

function UserSearchModal({ onClose }) {
  const { currentUser } = useUserContext();
  const { sendFriendRequest } = useStudyChat();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());

  async function search(q) {
    setQuery(q);
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/studychat/search/users`, {
        params: { q, currentUserId: currentUser.userId }
      });
      setResults(res.data.payload || []);
    } catch { } finally {
      setLoading(false);
    }
  }

  async function handleSendRequest(userId) {
    await sendFriendRequest(userId);
    setSentTo(prev => new Set([...prev, userId]));
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="card p-4 shadow-lg"
        style={{ maxWidth: "440px", width: "90%", borderRadius: "20px" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0">🔍 Find Study Partners</h6>
          <button className="btn btn-sm btn-light" onClick={onClose}>✕</button>
        </div>

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Search by name..."
          value={query}
          onChange={e => search(e.target.value)}
          autoFocus
          style={{ borderRadius: "12px" }}
        />

        {loading && (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-dark" />
          </div>
        )}

        {results.map(user => (
          <div
            key={user.userId}
            className="d-flex align-items-center gap-3 p-2 rounded mb-2"
            style={{ background: "#f8f9fa" }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
              style={{ width: "40px", height: "40px", background: "#6f42c1", flexShrink: 0 }}
            >
              {user.displayName?.[0] || "?"}
            </div>
            <div className="flex-grow-1">
              <div className="fw-semibold small">{user.displayName}</div>
              <small className="text-secondary">{user.studyGoal || user.examTarget}</small>
            </div>
            <button
              className={`btn btn-sm ${sentTo.has(user.userId) ? "btn-success" : "btn-dark"}`}
              style={{ borderRadius: "20px", fontSize: "0.75rem" }}
              onClick={() => handleSendRequest(user.userId)}
              disabled={sentTo.has(user.userId)}
            >
              {sentTo.has(user.userId) ? "✓ Sent" : "➕ Add"}
            </button>
          </div>
        ))}

        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="text-secondary text-center small">No users found for "{query}"</p>
        )}

        {query.length < 2 && (
          <p className="text-secondary text-center small">
            Type at least 2 characters to search
          </p>
        )}
      </div>
    </div>
  );
}

export default UserSearchModal;