// components/studychat/StudyChatPage.jsx
// WhatsApp/Telegram-level chat UI — premium dark theme, smooth animations

import { useState, useRef, useEffect } from "react";
import { useStudyChat } from "../../contexts/StudyChatContext";
import { useUserContext } from "../../contexts/UserContext";
import ChatSidebar from "./ChatSidebar";
import MessageThread from "./MessageThread";
import ChatInput from "./ChatInput";
import UserSearchModal from "./UserSearchModal";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  .chat-root { font-family: 'Inter', sans-serif; }
  .chat-root * { box-sizing: border-box; }

  .chat-layout {
    display: flex;
    height: calc(100vh - 60px);
    overflow: hidden;
    background: #0f0f1a;
  }

  /* ── Chat Main Area ── */
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #0f0f1a;
  }

  /* ── Header ── */
  .chat-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    backdrop-filter: blur(20px);
  }

  .chat-header-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 1rem; flex-shrink: 0;
    color: white; position: relative;
  }

  .chat-header-name { font-weight: 700; font-size: 1rem; color: #f3f4f6; }
  .chat-header-sub { font-size: 0.75rem; color: #6b7280; margin-top: 1px; }
  .chat-header-sub.typing { color: #10b981; }

  .conn-dot {
    width: 8px; height: 8px; border-radius: 50%;
    display: inline-block; margin-right: 5px;
  }

  /* ── Message Area ── */
  .messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;
    background: #0f0f1a;
    position: relative;
  }
  .messages-area::-webkit-scrollbar { width: 4px; }
  .messages-area::-webkit-scrollbar-track { background: transparent; }
  .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

  /* Scroll-to-bottom FAB */
  .scroll-fab {
    position: absolute; bottom: 16px; right: 16px; z-index: 10;
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(124,58,237,0.8); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 1rem; box-shadow: 0 4px 16px rgba(124,58,237,0.4);
    transition: all 0.2s; backdrop-filter: blur(10px);
  }
  .scroll-fab:hover { background: rgba(124,58,237,1); transform: translateY(-2px); }

  /* ── Typing indicator ── */
  .typing-wrap {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px; margin-bottom: 8px;
  }
  .typing-dots { display: flex; gap: 4px; }
  .typing-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #6b7280; animation: typeBounce 1.2s ease-in-out infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.15s; }
  .typing-dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes typeBounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
  }

  /* ── Empty state ── */
  .chat-empty {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100%; text-align: center; padding: 40px;
  }
  .chat-empty-icon { font-size: 5rem; margin-bottom: 20px; }
  .chat-empty-title { font-size: 1.4rem; font-weight: 700; color: #f3f4f6; margin-bottom: 8px; }
  .chat-empty-sub { color: #6b7280; font-size: 0.95rem; max-width: 380px; line-height: 1.6; }

  .find-btn {
    margin-top: 24px; padding: 12px 28px; border-radius: 50px;
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white; border: none; font-weight: 700; cursor: pointer;
    font-size: 0.95rem; transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(124,58,237,0.4);
  }
  .find-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(124,58,237,0.6); }

  @media (max-width: 768px) {
    .chat-layout { flex-direction: column; }
  }
`;

function StudyChatPage() {
  const { currentUser } = useUserContext();
  const {
    activeChat, messages, typingUsers,
    sendMessage, connected, unreadCounts,
    friends, groups, conversations,
    openChat, pendingRequests
  } = useStudyChat();

  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState("dms");
  const [showScrollFab, setShowScrollFab] = useState(false);
  const bottomRef = useRef(null);
  const messagesAreaRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollFab) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Detect scroll position to show/hide FAB
  function handleScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollFab(scrollHeight - scrollTop - clientHeight > 100);
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollFab(false);
  }

  const isTyping = activeChat
    ? Object.keys(typingUsers).some(key =>
        key === activeChat.id && typingUsers[key]?.length > 0
      )
    : false;

  return (
    <div className="chat-root">
      <style>{css}</style>
      <div className="chat-layout">

        {/* LEFT SIDEBAR */}
        <ChatSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSearchOpen={() => setShowSearch(true)}
          unreadCounts={unreadCounts}
          pendingRequests={pendingRequests}
        />

        {/* MAIN CHAT AREA */}
        <div className="chat-main">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="chat-header">
                <div className="chat-header-avatar"
                  style={{ background: activeChat.type === "group" ? "linear-gradient(135deg, #059669, #10b981)" : "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                  {activeChat.type === "group" ? "👥" : activeChat.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="chat-header-name">{activeChat.name}</div>
                  <div className={`chat-header-sub ${isTyping ? "typing" : ""}`}>
                    {isTyping
                      ? "typing..."
                      : activeChat.type === "dm"
                      ? "Direct Message"
                      : "Study Group"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="conn-dot" style={{ background: connected ? "#10b981" : "#ef4444" }} />
                  <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>{connected ? "Live" : "Reconnecting..."}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-area" ref={messagesAreaRef} onScroll={handleScroll}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", paddingTop: 60 }}>
                    <div style={{ fontSize: "3rem", marginBottom: 12 }}>👋</div>
                    <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                      Start the conversation with <strong style={{ color: "#a78bfa" }}>{activeChat.name}</strong>!
                    </div>
                  </div>
                )}

                <MessageThread
                  messages={messages}
                  currentUserId={currentUser?.userId}
                  currentUser={currentUser}
                  activeChat={activeChat}
                  friends={friends}
                />

                {/* Typing indicator */}
                {isTyping && (
                  <div className="typing-wrap">
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #374151, #4b5563)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "white", flexShrink: 0
                    }}>
                      {activeChat.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "18px 18px 18px 4px", padding: "10px 16px" }}>
                      <div className="typing-dots">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />

                {/* Scroll to bottom FAB */}
                {showScrollFab && (
                  <button className="scroll-fab" onClick={scrollToBottom} title="Scroll to bottom">↓</button>
                )}
              </div>

              {/* Input */}
              <ChatInput onSend={sendMessage} chatType={activeChat.type} />
            </>
          ) : (
            <div className="chat-empty">
              <div className="chat-empty-icon">🎓</div>
              <div className="chat-empty-title">Study Together with Prism Chat</div>
              <div className="chat-empty-sub">
                Connect with study partners, form groups, share notes and discuss doubts in real-time. No distractions — pure study focus!
              </div>
              <button className="find-btn" onClick={() => setShowSearch(true)}>
                🔍 Find Study Partners
              </button>
              {!connected && (
                <div style={{ marginTop: 16, padding: "10px 20px", borderRadius: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", fontSize: "0.85rem" }}>
                  ⚠️ Connecting to chat server...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showSearch && <UserSearchModal onClose={() => setShowSearch(false)} />}
    </div>
  );
}

export default StudyChatPage;