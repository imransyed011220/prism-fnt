// components/studychat/StudyChatPage.jsx
// Main study chat UI — Discord/WhatsApp inspired
// Left sidebar: friends/groups list
// Center: message thread
// Right: group info / user profile

import { useState, useRef, useEffect } from "react";
import { useStudyChat } from "../../contexts/StudyChatContext";
import { useUserContext } from "../../contexts/UserContext";
import ChatSidebar from "./ChatSidebar";
import MessageThread from "./MessageThread";
import ChatInput from "./ChatInput";
import UserSearchModal from "./UserSearchModal";

function StudyChatPage() {
  const { currentUser } = useUserContext();
  const {
    activeChat, messages, typingUsers,
    sendMessage, connected, unreadCounts,
    friends, groups, conversations,
    openChat, pendingRequests
  } = useStudyChat();

  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState("dms");  // dms | groups | friends
  const bottomRef = useRef(null);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isTyping = activeChat
    ? Object.keys(typingUsers).some(key =>
        key === activeChat.id && typingUsers[key]?.length > 0
      )
    : false;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>

      {/* LEFT SIDEBAR */}
      <ChatSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSearchOpen={() => setShowSearch(true)}
        unreadCounts={unreadCounts}
        pendingRequests={pendingRequests}
      />

      {/* MAIN CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div
              className="d-flex align-items-center gap-3 px-4 py-3 border-bottom bg-white"
              style={{ flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              {/* avatar */}
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                style={{
                  width: "40px", height: "40px",
                  background: activeChat.type === "group" ? "#0d6efd" : "#212529",
                  fontSize: "1.2rem", flexShrink: 0
                }}
              >
                {activeChat.type === "group" ? "👥" : activeChat.name?.[0] || "?"}
              </div>

              <div className="flex-grow-1">
                <div className="fw-bold">{activeChat.name}</div>
                <small className="text-secondary">
                  {isTyping
                    ? "typing..."
                    : activeChat.type === "dm"
                    ? "Direct Message"
                    : "Study Group"}
                </small>
              </div>

              {/* connection status */}
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle"
                  style={{
                    width: "8px", height: "8px",
                    background: connected ? "#28a745" : "#dc3545"
                  }}
                />
                <small className="text-secondary">{connected ? "Online" : "Reconnecting..."}</small>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem",
                background: "#f8f9fa"
              }}
            >
              {messages.length === 0 && (
                <div className="text-center mt-5 text-secondary">
                  <div style={{ fontSize: "3rem" }}>💬</div>
                  <p>Start the conversation with {activeChat.name}!</p>
                </div>
              )}

              <MessageThread
                messages={messages}
                currentUserId={currentUser?.userId}
                currentUser={currentUser}
                activeChat={activeChat}
                friends={friends}
              />

              {isTyping && (
                <div className="d-flex align-items-center gap-2 ms-2 mb-2">
                  <div className="d-flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="rounded-circle bg-secondary"
                        style={{
                          width: "6px", height: "6px",
                          animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
                        }}
                      />
                    ))}
                  </div>
                  <small className="text-secondary">typing...</small>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <ChatInput
              onSend={sendMessage}
              chatType={activeChat.type}
            />
          </>
        ) : (
          // No chat selected
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
            <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🎓</div>
            <h4 className="fw-bold">Study Together with Prism Chat</h4>
            <p className="text-secondary" style={{ maxWidth: "400px" }}>
              Connect with study partners, form groups, share notes and discuss doubts.
              No distractions — pure study focus!
            </p>
            <div className="d-flex gap-3 mt-3">
              <button
                className="btn btn-dark"
                onClick={() => setShowSearch(true)}
              >
                🔍 Find Study Partners
              </button>
            </div>
            {!connected && (
              <div className="alert alert-warning mt-3 py-2 small">
                ⚠️ Connecting to chat server...
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Search Modal */}
      {showSearch && (
        <UserSearchModal onClose={() => setShowSearch(false)} />
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default StudyChatPage;