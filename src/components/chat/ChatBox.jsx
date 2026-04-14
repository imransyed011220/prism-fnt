// components/chat/ChatBox.jsx
// chat input area
// features: send on Enter, stop response button,
// disabled while loading

import { useRef, useState } from "react";
import { normalizePastedText, hasRenderingIssues } from "../../utils/textNormalizer";

function ChatBox({ onSend, onStop, isLoading }) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [pasteNotice, setPasteNotice] = useState("");
  const textareaRef = useRef(null);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
    setPasteNotice("");
  }

  function handleKeyDown(e) {
    // send on Enter, new line on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // intercept paste to normalize problematic copied symbols
  function handlePaste(e) {
    e.preventDefault();

    const rawText = e.clipboardData?.getData("text/plain") || "";
    if (!rawText) return;

    const normalized = normalizePastedText(rawText);

    // show a brief confirmation only when problematic chars were detected
    if (hasRenderingIssues(rawText)) {
      setPasteNotice("Text normalized - special symbols converted to readable format");
      setTimeout(() => setPasteNotice(""), 3000);
    }

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = input.substring(0, start) + normalized + input.substring(end);
      setInput(newValue);

      // restore cursor position after inserted normalized text
      setTimeout(() => {
        textarea.selectionStart = start + normalized.length;
        textarea.selectionEnd = start + normalized.length;
        textarea.focus();
      }, 0);
      return;
    }

    setInput((prev) => prev + normalized);
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
    <div className="border-top bg-white" style={{ flexShrink: 0 }}>
      {/* Paste notice */}
      {pasteNotice && (
        <div
          className="px-3 py-1"
          style={{
            background: "#e8f5e9",
            fontSize: "0.75rem",
            color: "#2e7d32"
          }}
        >
          {pasteNotice}
        </div>
      )}

      <div className="d-flex gap-2 p-3 align-items-end">
        <div className="position-relative flex-grow-1">
          <textarea
            ref={textareaRef}
            className="form-control"
            rows={2}
            placeholder={isListening ? "Listening..." : "Ask anything — formulas, PYQs, concepts..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isLoading}
            style={{
              resize: "none",
              borderRadius: "12px",
              fontSize: "0.95rem",
              paddingRight: "50px",
              fontFamily: "'Noto Sans', monospace, sans-serif"
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
    </div>
  );
}

export default ChatBox;