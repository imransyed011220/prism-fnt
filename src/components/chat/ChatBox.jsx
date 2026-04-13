// components/chat/ChatBox.jsx
// chat input area
// features: send on Enter, stop response button,
// disabled while loading

import { useState } from "react";

function ChatBox({ onSend, onStop, isLoading }) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  }

  function handleKeyDown(e) {
    // send on Enter, new line on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev ? prev + " " + transcript : transcript);
    };
    
    recognition.onerror = (e) => {
      console.error("Speech reco error:", e);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }

  return (
    <div
      className="d-flex gap-2 p-3 border-top bg-white align-items-end"
      style={{ flexShrink: 0 }}
    >
      <div className="position-relative flex-grow-1">
        <textarea
          className="form-control"
          rows={2}
          placeholder={isListening ? "Listening..." : "Ask anything — formulas, PYQs, concepts..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          style={{
            resize: "none",
            borderRadius: "12px",
            fontSize: "0.95rem",
            paddingRight: "50px"
          }}
        />
        <button
          className="btn position-absolute"
          style={{
            right: "5px",
            bottom: "5px",
            background: "none",
            border: "none",
            fontSize: "1.2rem",
            opacity: isListening ? 1 : 0.6,
            color: isListening ? "red" : "inherit"
          }}
          onClick={startListening}
          disabled={isLoading}
          title="Voice Input"
        >
          {isListening ? "🎙️" : "🎤"}
        </button>
      </div>

      {/* stop button — shown while loading */}
      {isLoading ? (
        <button
          className="btn btn-danger px-3"
          onClick={onStop}
          title="Stop response"
          style={{ borderRadius: "12px", flexShrink: 0 }}
        >
          ⏹ Stop
        </button>
      ) : (
        <button
          className="btn btn-dark px-3"
          onClick={handleSend}
          disabled={!input.trim()}
          style={{ borderRadius: "12px", flexShrink: 0 }}
        >
          Send ↵
        </button>
      )}
    </div>
  );
}

export default ChatBox;