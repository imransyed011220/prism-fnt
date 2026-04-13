// components/studychat/CreateGroupModal.jsx
import { useState } from "react";
import { useStudyChat } from "../../contexts/StudyChatContext";
import { useUserContext } from "../../contexts/UserContext";
import axios from "axios";

const BASE = "http://localhost:8000/api";

function CreateGroupModal({ onClose }) {
  const { currentUser } = useUserContext();
  const { friends, setGroups } = useStudyChat();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/studychat/groups`, {
        creatorId: currentUser.userId,
        name: name.trim(),
        subject,
        memberIds: selectedFriends
      });
      const newGroup = res.data.payload;
      setGroups(prev => [newGroup, ...prev]);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleFriend(userId) {
    setSelectedFriends(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="card p-4 shadow-lg"
        style={{ maxWidth: "400px", width: "90%", borderRadius: "20px" }}
        onClick={e => e.stopPropagation()}
      >
        <h6 className="fw-bold mb-3">📚 Create Study Group</h6>

        <input
          className="form-control mb-3"
          placeholder="Group name (e.g., JEE Physics Legends)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ borderRadius: "12px" }}
        />

        <select
          className="form-select mb-3"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ borderRadius: "12px" }}
        >
          <option value="">Select subject (optional)</option>
          <option>Physics</option>
          <option>Chemistry</option>
          <option>Maths</option>
          <option>Biology</option>
          <option>Mixed (All subjects)</option>
        </select>

        <p className="small text-secondary mb-2">Add friends to group:</p>
        <div style={{ maxHeight: "160px", overflowY: "auto" }}>
          {friends.map(f => (
            <div
              key={f.userId}
              className="d-flex align-items-center gap-2 p-2 rounded mb-1"
              style={{
                background: selectedFriends.includes(f.userId) ? "#e8f5e9" : "#f8f9fa",
                cursor: "pointer"
              }}
              onClick={() => toggleFriend(f.userId)}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                style={{ width: "32px", height: "32px", background: "#6f42c1", flexShrink: 0 }}
              >
                {f.displayName?.[0]}
              </div>
              <span className="small flex-grow-1">{f.displayName}</span>
              {selectedFriends.includes(f.userId) && <span className="text-success">✓</span>}
            </div>
          ))}
          {friends.length === 0 && (
            <p className="text-secondary small text-center">Add friends first to invite them to groups.</p>
          )}
        </div>

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-outline-secondary flex-fill" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-dark flex-fill"
            onClick={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;