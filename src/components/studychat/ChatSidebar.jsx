// components/studychat/ChatSidebar.jsx
// Left sidebar — conversations, groups, friends, pending requests

import { useState } from "react";
import { useStudyChat } from "../../contexts/StudyChatContext";
import { useUserContext } from "../../contexts/UserContext";
import CreateGroupModal from "./CreateGroupModal";

function ChatSidebar({ activeTab, setActiveTab, onSearchOpen, unreadCounts, pendingRequests }) {
  const { currentUser } = useUserContext();
  const {
    conversations, groups, friends,
    openChat, activeChat, onlineUsers,
    respondToRequest
  } = useStudyChat();

  const [showCreateGroup, setShowCreateGroup] = useState(false);

  function getStatus(userId) {
    return onlineUsers[userId] || "offline";
  }

  function getTotalUnread() {
    return Object.values(unreadCounts).reduce((sum, v) => sum + v, 0);
  }

  return (
    <div
      style={{
        width: "280px",
        flexShrink: 0,
        background: "#1a1a2e",
        color: "white",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div className="p-3 border-bottom border-secondary">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="fw-bold fs-5">📚 Study Chat</span>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={onSearchOpen}
            title="Find study partners"
            style={{ borderRadius: "20px" }}
          >
            🔍
          </button>
        </div>

        {/* Tabs */}
        <div className="d-flex gap-1">
          {[
            { id: "dms", label: "DMs" },
            { id: "groups", label: "Groups" },
            { id: "friends", label: "Friends" }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn btn-sm flex-fill ${activeTab === tab.id ? "btn-light" : "btn-outline-secondary"}`}
              style={{
                fontSize: "0.75rem",
                padding: "4px",
                color: activeTab === tab.id ? "#212529" : "rgba(255,255,255,0.7)",
                borderRadius: "8px"
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === "dms" && getTotalUnread() > 0 && (
                <span className="badge bg-danger ms-1" style={{ fontSize: "0.6rem" }}>
                  {getTotalUnread()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Pending Requests Banner */}
        {pendingRequests.length > 0 && (
          <div className="p-2 border-bottom border-secondary">
            <div
              className="p-2 rounded"
              style={{ background: "rgba(255,193,7,0.15)", border: "1px solid rgba(255,193,7,0.3)" }}
            >
              <small className="text-warning fw-bold">
                🤝 {pendingRequests.length} friend request{pendingRequests.length > 1 ? "s" : ""}
              </small>
              {pendingRequests.map(req => (
                <div key={req.requestId} className="d-flex align-items-center gap-2 mt-2">
                  <span className="small text-white flex-grow-1" style={{ fontSize: "0.75rem" }}>
                    {req.fromUserId.substring(0, 12)}...
                  </span>
                  <button
                    className="btn btn-success btn-sm py-0 px-2"
                    style={{ fontSize: "0.7rem" }}
                    onClick={() => respondToRequest(req.requestId, true)}
                  >
                    ✓
                  </button>
                  <button
                    className="btn btn-danger btn-sm py-0 px-2"
                    style={{ fontSize: "0.7rem" }}
                    onClick={() => respondToRequest(req.requestId, false)}
                  >
                    ✗
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DMs Tab */}
        {activeTab === "dms" && (
          <div>
            {conversations.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-secondary small">No conversations yet.</p>
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={onSearchOpen}
                >
                  Find someone to chat
                </button>
              </div>
            ) : (
              conversations.map(c => {
                const otherId = c.participants?.find(p => p !== currentUser?.userId);
                const other = c.otherUser || {};
                const unread = unreadCounts[otherId] || 0;
                const isActive = activeChat?.type === "dm" && activeChat?.id === otherId;

                return (
                  <div
                    key={c.conversationId}
                    className="d-flex align-items-center gap-3 p-3"
                    style={{
                      cursor: "pointer",
                      background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                      borderLeft: isActive ? "3px solid #0d6efd" : "3px solid transparent",
                      transition: "background 0.15s"
                    }}
                    onClick={() => openChat("dm", otherId, other.displayName || "User", other.avatar)}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* avatar + status */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                        style={{
                          width: "38px", height: "38px",
                          background: "#0d6efd",
                          fontSize: "1rem"
                        }}
                      >
                        {other.displayName?.[0] || "?"}
                      </div>
                      <div
                        style={{
                          position: "absolute", bottom: 0, right: 0,
                          width: "10px", height: "10px",
                          borderRadius: "50%",
                          background: getStatus(otherId) === "online" ? "#28a745" : "#6c757d",
                          border: "2px solid #1a1a2e"
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div className="d-flex justify-content-between">
                        <span className="fw-semibold small">{other.displayName || "User"}</span>
                        {unread > 0 && (
                          <span className="badge bg-primary" style={{ fontSize: "0.65rem" }}>
                            {unread}
                          </span>
                        )}
                      </div>
                      <div
                        className="text-secondary"
                        style={{
                          fontSize: "0.75rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {c.lastMessage || "Say hello!"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <div>
            <div className="p-2">
              <button
                className="btn btn-sm btn-outline-light w-100"
                style={{ borderRadius: "8px", fontSize: "0.8rem" }}
                onClick={() => setShowCreateGroup(true)}
              >
                ＋ Create Study Group
              </button>
            </div>

            {groups.map(g => {
              const isActive = activeChat?.type === "group" && activeChat?.id === g.groupId;
              const unread = unreadCounts[g.groupId] || 0;
              return (
                <div
                  key={g.groupId}
                  className="d-flex align-items-center gap-3 p-3"
                  style={{
                    cursor: "pointer",
                    background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                    borderLeft: isActive ? "3px solid #28a745" : "3px solid transparent"
                  }}
                  onClick={() => openChat("group", g.groupId, g.name)}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "38px", height: "38px", background: "#28a745", fontSize: "1.2rem", flexShrink: 0 }}
                  >
                    📚
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold small">{g.name}</span>
                      {unread > 0 && (
                        <span className="badge bg-success" style={{ fontSize: "0.65rem" }}>{unread}</span>
                      )}
                    </div>
                    <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      {g.members?.length || 0} members · {g.subject || "Study Group"}
                    </small>
                  </div>
                </div>
              );
            })}

            {groups.length === 0 && (
              <div className="text-center p-4">
                <p className="text-secondary small">No groups yet. Create one!</p>
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div>
            {friends.map(friend => (
              <div
                key={friend.userId}
                className="d-flex align-items-center gap-3 p-3"
                style={{ cursor: "pointer" }}
                onClick={() => openChat("dm", friend.userId, friend.displayName)}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: "38px", height: "38px", background: "#6f42c1" }}
                  >
                    {friend.displayName?.[0] || "?"}
                  </div>
                  <div style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: getStatus(friend.userId) === "online" ? "#28a745" : "#6c757d",
                    border: "2px solid #1a1a2e"
                  }} />
                </div>
                <div>
                  <div className="fw-semibold small">{friend.displayName}</div>
                  <small style={{
                    fontSize: "0.7rem",
                    color: getStatus(friend.userId) === "online" ? "#28a745" : "#6c757d"
                  }}>
                    {getStatus(friend.userId)}
                  </small>
                </div>
              </div>
            ))}

            {friends.length === 0 && (
              <div className="text-center p-4">
                <p className="text-secondary small">No friends yet.</p>
                <button className="btn btn-sm btn-outline-light" onClick={onSearchOpen}>
                  Find study partners
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User info at bottom */}
      <div
        className="p-3 border-top border-secondary d-flex align-items-center gap-2"
        style={{ flexShrink: 0 }}
      >
        <div
          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
          style={{ width: "32px", height: "32px", background: "#212529", flexShrink: 0 }}
        >
          {currentUser?.firstName?.[0] || "?"}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div className="fw-semibold small">{currentUser?.firstName}</div>
          <div style={{ fontSize: "0.7rem" }}>
            <span style={{ color: "#28a745" }}>● Online</span>
          </div>
        </div>
      </div>

      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
    </div>
  );
}

export default ChatSidebar;