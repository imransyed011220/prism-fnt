// components/studychat/ChatSidebar.jsx
// Left sidebar — conversations, groups, friends, pending requests
// Telegram/Discord-level dark UI

import { useState } from "react";
import { useStudyChat } from "../../contexts/StudyChatContext";
import { useUserContext } from "../../contexts/UserContext";
import CreateGroupModal from "./CreateGroupModal";

const css = `
  .sidebar-root {
    width: 300px; flex-shrink: 0;
    background: #0a0a18;
    color: white;
    display: flex; flex-direction: column;
    overflow: hidden;
    border-right: 1px solid rgba(255,255,255,0.05);
  }
  @media (max-width: 768px) {
    .sidebar-root { width: 100%; max-width: 100%; height: 260px; flex-direction: column; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
  }

  /* Header */
  .sidebar-header {
    padding: 16px 16px 12px;
    background: linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 100%);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .sidebar-title { font-size: 1rem; font-weight: 800; color: #f3f4f6; display: flex; align-items: center; gap: 8px; }

  .search-btn {
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);
    color: #9ca3af; border-radius: 10px; padding: 8px 12px;
    cursor: pointer; width: 100%; text-align: left; font-size: 0.85rem;
    transition: all 0.2s; margin-top: 10px; display: flex; align-items: center; gap: 8px;
  }
  .search-btn:hover { background: rgba(255,255,255,0.1); color: #e5e7eb; }

  /* Tab buttons */
  .tab-row { display: flex; gap: 4px; padding: 10px 12px; flex-shrink: 0; }
  .stab {
    flex: 1; padding: 6px 0; font-size: 0.78rem; font-weight: 600;
    border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s;
    background: transparent; color: #6b7280;
  }
  .stab.active { background: rgba(124,58,237,0.2); color: #a78bfa; }
  .stab:hover:not(.active) { background: rgba(255,255,255,0.05); color: #9ca3af; }

  /* List area */
  .sidebar-list { flex: 1; overflow-y: auto; }
  .sidebar-list::-webkit-scrollbar { width: 3px; }
  .sidebar-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

  /* Conversation row */
  .convo-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; cursor: pointer; transition: background 0.15s;
    border-left: 3px solid transparent; position: relative;
  }
  .convo-row:hover { background: rgba(255,255,255,0.04); }
  .convo-row.active { background: rgba(124,58,237,0.1); border-left-color: #7c3aed; }
  .convo-row.active .convo-name { color: #a78bfa; }

  /* Avatar */
  .chat-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 1rem; flex-shrink: 0; position: relative;
    overflow: hidden; color: white;
  }
  .avatar-img { width: 100%; height: 100%; object-fit: cover; }
  .online-ring {
    position: absolute; bottom: 1px; right: 1px;
    width: 12px; height: 12px; border-radius: 50%;
    border: 2px solid #0a0a18;
  }

  .convo-name { font-size: 0.9rem; font-weight: 600; color: #e5e7eb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .convo-preview { font-size: 0.75rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
  .convo-preview.unread-text { color: #9ca3af; }

  .unread-badge {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white; border-radius: 50px; font-size: 0.65rem; font-weight: 800;
    padding: 2px 7px; flex-shrink: 0; min-width: 20px; text-align: center;
  }

  /* Section header */
  .section-header {
    padding: 8px 14px 4px;
    font-size: 0.68rem; font-weight: 700; color: #4b5563;
    text-transform: uppercase; letter-spacing: 1.2px;
  }

  /* Friend request banner */
  .req-banner {
    margin: 8px 12px; padding: 12px; border-radius: 12px;
    background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.2);
  }
  .req-label { font-size: 0.78rem; font-weight: 700; color: #f59e0b; margin-bottom: 8px; }
  .req-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
  .req-name { flex: 1; font-size: 0.75rem; color: #d1d5db; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .req-yes { background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); color: #10b981; padding: 3px 10px; border-radius: 50px; font-size: 0.72rem; cursor: pointer; font-weight: 700; transition: all 0.15s; }
  .req-yes:hover { background: rgba(16,185,129,0.35); }
  .req-no { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; padding: 3px 10px; border-radius: 50px; font-size: 0.72rem; cursor: pointer; font-weight: 700; transition: all 0.15s; }
  .req-no:hover { background: rgba(239,68,68,0.3); }

  /* Create group btn */
  .create-group-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 14px; cursor: pointer; color: #7c3aed;
    font-size: 0.85rem; font-weight: 600; transition: all 0.15s;
    border-radius: 8px; margin: 4px 8px;
  }
  .create-group-btn:hover { background: rgba(124,58,237,0.1); }

  /* Bottom user bar */
  .user-bar {
    padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.05);
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    background: rgba(0,0,0,0.2);
  }
  .user-bar-name { font-size: 0.85rem; font-weight: 600; color: #e5e7eb; }
  .user-bar-status { font-size: 0.7rem; color: #10b981; display: flex; align-items: center; gap: 4px; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; animation: statusPulse 2s ease infinite; }
  @keyframes statusPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
    50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
  }

  /* Empty placeholder */
  .empty-tab { text-align: center; padding: 32px 16px; color: #4b5563; font-size: 0.85rem; }
`;

// Avatar colour based on user ID
function avatarColor(userId) {
  const colors = [
    "linear-gradient(135deg,#7c3aed,#4f46e5)",
    "linear-gradient(135deg,#059669,#10b981)",
    "linear-gradient(135deg,#dc2626,#ef4444)",
    "linear-gradient(135deg,#d97706,#f59e0b)",
    "linear-gradient(135deg,#0284c7,#38bdf8)",
    "linear-gradient(135deg,#7c3aed,#ec4899)",
  ];
  if (!userId) return colors[0];
  const n = userId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

function ChatSidebar({ activeTab, setActiveTab, onSearchOpen, unreadCounts, pendingRequests }) {
  const { currentUser } = useUserContext();
  const { conversations, groups, friends, openChat, activeChat, onlineUsers, respondToRequest } = useStudyChat();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  function getStatus(userId) { return onlineUsers[userId] || "offline"; }
  function getTotalUnread() { return Object.values(unreadCounts).reduce((s, v) => s + v, 0); }

  return (
    <div className="sidebar-root">
      <style>{css}</style>

      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="sidebar-title">📚 Study Chat</div>
          {getTotalUnread() > 0 && (
            <span className="unread-badge">{getTotalUnread()}</span>
          )}
        </div>
        <button className="search-btn" onClick={onSearchOpen}>
          <span>🔍</span> <span>Find study partners...</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-row">
        {[
          { id: "dms", label: "DMs" },
          { id: "groups", label: "Groups" },
          { id: "friends", label: "Friends" },
        ].map(tab => (
          <button key={tab.id} className={`stab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
            {tab.id === "dms" && getTotalUnread() > 0 && (
              <span style={{ marginLeft: 4, background: "#ef4444", color: "white", borderRadius: "50%", padding: "0 5px", fontSize: "0.6rem", fontWeight: 800 }}>
                {getTotalUnread()}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="sidebar-list">

        {/* Friend Request Banner */}
        {pendingRequests.length > 0 && (
          <div className="req-banner">
            <div className="req-label">🤝 {pendingRequests.length} friend request{pendingRequests.length > 1 ? "s" : ""}</div>
            {pendingRequests.map(req => (
              <div key={req.requestId} className="req-row">
                <span className="req-name">{req.fromUserId?.substring(0, 14)}...</span>
                <button className="req-yes" onClick={() => respondToRequest(req.requestId, true)}>✓ Accept</button>
                <button className="req-no" onClick={() => respondToRequest(req.requestId, false)}>✗</button>
              </div>
            ))}
          </div>
        )}

        {/* DMs Tab */}
        {activeTab === "dms" && (
          <>
            {conversations.length === 0 ? (
              <div className="empty-tab">
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>💬</div>
                No conversations yet.<br />
                <button style={{ marginTop: 10, background: "none", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa", padding: "6px 16px", borderRadius: 50, cursor: "pointer", fontSize: "0.8rem" }}
                  onClick={onSearchOpen}>Find someone to chat</button>
              </div>
            ) : (
              conversations.map(c => {
                const otherId = c.participants?.find(p => p !== currentUser?.userId);
                const other = c.otherUser || {};
                const unread = unreadCounts[otherId] || 0;
                const isActive = activeChat?.type === "dm" && activeChat?.id === otherId;
                const isOnline = getStatus(otherId) === "online";

                return (
                  <div key={c.conversationId} className={`convo-row ${isActive ? "active" : ""}`}
                    onClick={() => openChat("dm", otherId, other.displayName || "User", other.avatar)}>
                    <div className="chat-avatar" style={{ background: avatarColor(otherId) }}>
                      {other.avatar
                        ? <img className="avatar-img" src={other.avatar} alt="" />
                        : (other.displayName?.[0] || "?").toUpperCase()}
                      <div className="online-ring" style={{ background: isOnline ? "#10b981" : "#374151" }} />
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="convo-name">{other.displayName || "User"}</span>
                        {unread > 0 && <span className="unread-badge">{unread}</span>}
                      </div>
                      <div className={`convo-preview ${unread > 0 ? "unread-text" : ""}`}>
                        {c.lastMessage || "Say hello!"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <>
            <div className="create-group-btn" onClick={() => setShowCreateGroup(true)}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>＋</span>
              Create Study Group
            </div>
            {groups.length === 0 ? (
              <div className="empty-tab">No groups yet. Create one!</div>
            ) : (
              groups.map(g => {
                const isActive = activeChat?.type === "group" && activeChat?.id === g.groupId;
                const unread = unreadCounts[g.groupId] || 0;
                return (
                  <div key={g.groupId} className={`convo-row ${isActive ? "active" : ""}`}
                    onClick={() => openChat("group", g.groupId, g.name)}>
                    <div className="chat-avatar" style={{ background: "linear-gradient(135deg,#059669,#10b981)", fontSize: "1.1rem" }}>
                      📚
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="convo-name">{g.name}</span>
                        {unread > 0 && <span className="unread-badge">{unread}</span>}
                      </div>
                      <div className="convo-preview">{g.members?.length || 0} members · {g.subject || "Study Group"}</div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <>
            {friends.length === 0 ? (
              <div className="empty-tab">
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>👥</div>
                No friends yet.
                <button style={{ marginTop: 10, background: "none", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa", padding: "6px 16px", borderRadius: 50, cursor: "pointer", fontSize: "0.8rem", display: "block", margin: "10px auto 0" }}
                  onClick={onSearchOpen}>Find study partners</button>
              </div>
            ) : (
              <>
                <div className="section-header">Online</div>
                {friends.filter(f => getStatus(f.userId) === "online").map(friend => (
                  <div key={friend.userId} className={`convo-row ${activeChat?.id === friend.userId ? "active" : ""}`}
                    onClick={() => openChat("dm", friend.userId, friend.displayName, friend.avatar)}>
                    <div className="chat-avatar" style={{ background: avatarColor(friend.userId) }}>
                      {friend.avatar
                        ? <img className="avatar-img" src={friend.avatar} alt="" />
                        : (friend.displayName?.[0] || "?").toUpperCase()}
                      <div className="online-ring" style={{ background: "#10b981" }} />
                    </div>
                    <div>
                      <div className="convo-name">{friend.displayName}</div>
                      <div style={{ fontSize: "0.72rem", color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                        Online
                      </div>
                    </div>
                  </div>
                ))}
                {friends.filter(f => getStatus(f.userId) !== "online").length > 0 && (
                  <div className="section-header">Offline</div>
                )}
                {friends.filter(f => getStatus(f.userId) !== "online").map(friend => (
                  <div key={friend.userId} className={`convo-row ${activeChat?.id === friend.userId ? "active" : ""}`}
                    onClick={() => openChat("dm", friend.userId, friend.displayName, friend.avatar)}>
                    <div className="chat-avatar" style={{ background: avatarColor(friend.userId), opacity: 0.7 }}>
                      {friend.avatar
                        ? <img className="avatar-img" src={friend.avatar} alt="" style={{ opacity: 0.7 }} />
                        : (friend.displayName?.[0] || "?").toUpperCase()}
                      <div className="online-ring" style={{ background: "#374151" }} />
                    </div>
                    <div>
                      <div className="convo-name" style={{ opacity: 0.7 }}>{friend.displayName}</div>
                      <div style={{ fontSize: "0.72rem", color: "#4b5563" }}>Offline</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom user bar */}
      <div className="user-bar">
        <div className="chat-avatar" style={{ width: 36, height: 36, background: avatarColor(currentUser?.userId), fontSize: "0.85rem" }}>
          {currentUser?.profileImageUrl
            ? <img className="avatar-img" src={currentUser.profileImageUrl} alt="" />
            : (currentUser?.firstName?.[0] || "?").toUpperCase()}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div className="user-bar-name">{currentUser?.firstName || "You"}</div>
          <div className="user-bar-status"><span className="status-dot" /> Online</div>
        </div>
      </div>

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </div>
  );
}

export default ChatSidebar;