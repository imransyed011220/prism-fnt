// components/chat/ChatPage.jsx
// main chat interface
// features: persistent history, stop response,
// edit messages, new chat, sidebar integration

import { useState, useRef, useEffect } from "react";
import { useUserContext } from "../../contexts/UserContext";
import { useChatContext } from "../../contexts/ChatContext";
import MessageBubble from "./MessageBubble";
import ChatBox from "./ChatBox";
import Sidebar from "./Sidebar";

function ChatPage() {
  const { currentUser } = useUserContext();
  const {
    messages,
    isLoading,
    activeSession,
    sendChat,
    stopResponse,
    loadSessions,
  } = useChatContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);

  // load sessions when component mounts
  useEffect(() => {
    if (currentUser?.userId) {
      loadSessions(currentUser.userId);
    }
  }, [currentUser?.userId]);

  // auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(query) {
    await sendChat(query, currentUser.userId, currentUser.examTarget);
  }

  // edit = resend edited message
  async function handleEdit(editedText) {
    await sendChat(editedText, currentUser.userId, currentUser.examTarget,activeSession?.sessionId);
  }

  return (
    <div className="d-flex" style={{ height: "88vh", overflow: "hidden" }}>

      {/* sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* main chat area */}
      <div className="d-flex flex-column flex-grow-1">

        {/* chat header */}
        <div
          className="d-flex align-items-center gap-3 p-3 border-bottom bg-white"
          style={{ flexShrink: 0 }}
        >
          {/* hamburger menu — opens sidebar */}
          <button
            className="btn btn-sm btn-outline-dark"
            onClick={() => setSidebarOpen(true)}
            title="Chat history"
          >
            ☰
          </button>

          <span className="fw-bold">
            {activeSession ? activeSession.title : "New Chat"}
          </span>

          <span className="badge bg-dark ms-auto">
            {currentUser?.examTarget}
          </span>
        </div>

        {/* messages area */}
        <div
          className="flex-grow-1 overflow-auto p-4"
          style={{ background: "#f8f9fa" }}
        >
          {/* welcome message when no messages */}
          {messages.length === 0 && (
            <div className="text-center mt-5">
              <h4>Hey {currentUser?.firstName}! 👋</h4>
              <p className="text-secondary">
                Ask me anything about {currentUser?.examTarget} — formulas,
                PYQs, concepts, or study plans.
              </p>
            </div>
          )}

          {/* message list */}
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              onEdit={handleEdit}
            />
          ))}

          {/* typing indicator */}
          {isLoading && (
            <div className="d-flex align-items-center gap-2 text-secondary small ms-2 mb-3">
              <div
                className="spinner-grow spinner-grow-sm"
                role="status"
              />
              Prism is thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* chat input */}
        <ChatBox
          onSend={handleSend}
          onStop={stopResponse}
          isLoading={isLoading}
        />
        {/* quiz panel removed: handled by separate Quiz feature */}
      </div>
    </div>
  );
}

export default ChatPage;
