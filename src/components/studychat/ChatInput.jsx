// components/studychat/ChatInput.jsx
// Premium Telegram/WhatsApp-inspired floating chat input
// Features: Auto-resizing textarea, voice recording with live timer & visualizer,
// file/image attachment preview, quick math formula insertion, emoji drawer, and paste normalization.

import { useState, useRef, useEffect, useCallback } from "react";
import { useStudyChat } from "../../contexts/StudyChatContext";
import { normalizePastedText } from "../../utils/textNormalizer";

const POPULAR_EMOJIS = [
  "👍", "🔥", "❤️", "💡", "❓", "🎯", "📚", "✍️", "🧠", "⚡",
  "👏", "🚀", "🎉", "💯", "🤔", "🙌", "✨", "📝", "🔬", "✅"
];

const MATH_SHORTCUTS = [
  { label: "$$ ... $$", template: "$$\n\\int_{a}^{b} f(x)\\,dx\n$$", tip: "Block Math" },
  { label: "\\( ... \\)", template: "\\( x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\)", tip: "Inline Formula" },
  { label: "\\frac{a}{b}", template: "\\frac{a}{b}", tip: "Fraction" },
  { label: "\\sqrt{x}", template: "\\sqrt{x}", tip: "Square root" },
  { label: "\\sum", template: "\\sum_{i=1}^{n} i", tip: "Summation" },
  { label: "\\lim", template: "\\lim_{x \\to \\infty}", tip: "Limit" },
];

function ChatInput({ onSend, chatType }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showEmojiDrawer, setShowEmojiDrawer] = useState(false);
  const [showMathMenu, setShowMathMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingRef = useRef(false);
  const typingTimer = useRef(null);
  const recordTimerRef = useRef(null);
  const streamRef = useRef(null);
  const { sendTyping } = useStudyChat();

  // Handle textarea height auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 140)}px`;
    }
  }, [text]);

  // Voice recording timer
  useEffect(() => {
    if (recording) {
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      setRecordSeconds(0);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [recording]);

  // Typing indicator
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!typingRef.current) {
      sendTyping(true);
      typingRef.current = true;
    }

    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      sendTyping(false);
      typingRef.current = false;
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleSendText = () => {
    if (!text.trim()) return;
    onSend(text.trim(), "text");
    setText("");
    setShowEmojiDrawer(false);
    setShowMathMenu(false);
    sendTyping(false);
    typingRef.current = false;
    clearTimeout(typingTimer.current);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleInsertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleInsertMath = (template) => {
    setText((prev) => (prev ? prev + " " + template : template));
    setShowMathMenu(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Maximum allowed size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const type = file.type.startsWith("image/") ? "image" : "file";
      onSend("", type, ev.target.result, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      const chunks = [];

      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => {
          onSend("", "voice", ev.target.result, `voice_note_${Date.now()}.webm`);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch (err) {
      alert("Microphone access was denied or not found.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setRecording(false);
    setMediaRecorder(null);
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      // Discard recorded chunks
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);
    setMediaRecorder(null);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="chat-input-wrapper">
      <style>{`
        .chat-input-wrapper {
          position: relative;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 18px;
          flex-shrink: 0;
          z-index: 10;
        }

        .chat-input-container {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
        }

        .chat-input-pill {
          display: flex;
          align-items: flex-end;
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 6px 14px;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .chat-input-pill.active {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.15);
        }

        .chat-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 1.15rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          padding: 0;
        }

        .chat-icon-btn:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
        }

        .chat-icon-btn.active-tool {
          color: #818cf8;
          background: rgba(99, 102, 241, 0.15);
        }

        .chat-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f8fafc;
          font-size: 0.94rem;
          line-height: 1.45;
          resize: none;
          padding: 6px 4px;
          font-family: inherit;
          max-height: 140px;
          min-height: 24px;
        }

        .chat-textarea::placeholder {
          color: #64748b;
        }

        .chat-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .chat-send-btn:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.55);
        }

        .chat-send-btn:disabled {
          background: rgba(255, 255, 255, 0.08);
          color: #64748b;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }

        /* Voice Recording Box */
        .voice-rec-pill {
          display: flex;
          align-items: center;
          flex: 1;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 24px;
          padding: 8px 16px;
          gap: 12px;
          animation: pulseRed 1.8s infinite;
        }

        @keyframes pulseRed {
          0%, 100% { border-color: rgba(239, 68, 68, 0.3); }
          50% { border-color: rgba(239, 68, 68, 0.7); box-shadow: 0 0 16px rgba(239, 68, 68, 0.2); }
        }

        .rec-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ef4444;
          animation: blinkRec 1s ease-in-out infinite;
        }

        @keyframes blinkRec {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.85); }
        }

        .rec-timer {
          font-family: monospace;
          font-weight: 700;
          color: #ef4444;
          font-size: 0.95rem;
        }

        .rec-waves {
          display: flex;
          align-items: center;
          gap: 3px;
          flex: 1;
          height: 20px;
        }

        .wave-bar {
          width: 3px;
          background: #ef4444;
          border-radius: 2px;
          animation: waveJump 0.8s ease-in-out infinite alternate;
        }

        .wave-bar:nth-child(2) { animation-delay: 0.15s; }
        .wave-bar:nth-child(3) { animation-delay: 0.3s; }
        .wave-bar:nth-child(4) { animation-delay: 0.45s; }
        .wave-bar:nth-child(5) { animation-delay: 0.2s; }

        @keyframes waveJump {
          from { height: 4px; }
          to { height: 18px; }
        }

        /* Quick Drawer */
        .quick-popup-drawer {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 18px;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
          z-index: 50;
          backdrop-filter: blur(12px);
          animation: drawerIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes drawerIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }

        .emoji-cell-btn {
          width: 38px;
          height: 38px;
          font-size: 1.25rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .emoji-cell-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.15);
        }

        .math-menu-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 200px;
        }

        .math-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
          font-family: monospace;
        }

        .math-menu-item:hover {
          background: rgba(99, 102, 241, 0.18);
          border-color: rgba(99, 102, 241, 0.4);
          color: #a5b4fc;
        }
      `}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Emoji Drawer Popup */}
      {showEmojiDrawer && (
        <div className="quick-popup-drawer" style={{ width: "230px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>QUICK REACTIONS</span>
            <button
              onClick={() => setShowEmojiDrawer(false)}
              style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.8rem" }}
            >
              ✕
            </button>
          </div>
          <div className="emoji-grid">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="emoji-cell-btn"
                onClick={() => handleInsertEmoji(emoji)}
                title={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Math Formula Drawer Popup */}
      {showMathMenu && (
        <div className="quick-popup-drawer" style={{ left: "60px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
            <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600 }}>MATH SNIPPETS</span>
            <button
              onClick={() => setShowMathMenu(false)}
              style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.8rem" }}
            >
              ✕
            </button>
          </div>
          <div className="math-menu-list">
            {MATH_SHORTCUTS.map((item) => (
              <div
                key={item.label}
                className="math-menu-item"
                onClick={() => handleInsertMath(item.template)}
              >
                <span>{item.label}</span>
                <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "sans-serif" }}>{item.tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input-container">
        {recording ? (
          /* Live Voice Recording UI */
          <div className="voice-rec-pill">
            <div className="rec-dot" />
            <span className="rec-timer">{formatTimer(recordSeconds)}</span>
            <div className="rec-waves">
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
            </div>
            <button
              onClick={cancelRecording}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "0.85rem",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px"
              }}
              title="Cancel recording"
            >
              Cancel
            </button>
            <button
              onClick={stopRecording}
              className="chat-send-btn"
              style={{ width: 36, height: 36, background: "#ef4444" }}
              title="Send voice note"
            >
              ✓
            </button>
          </div>
        ) : (
          /* Standard Input Bar */
          <>
            <div className={`chat-input-pill ${isFocused ? "active" : ""}`}>
              {/* Attachment Button */}
              <button
                type="button"
                className="chat-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file or photo"
              >
                📎
              </button>

              {/* Emoji Drawer Toggle */}
              <button
                type="button"
                className={`chat-icon-btn ${showEmojiDrawer ? "active-tool" : ""}`}
                onClick={() => {
                  setShowEmojiDrawer((prev) => !prev);
                  setShowMathMenu(false);
                }}
                title="Insert emoji"
              >
                😊
              </button>

              {/* Math Helper Toggle */}
              <button
                type="button"
                className={`chat-icon-btn ${showMathMenu ? "active-tool" : ""}`}
                onClick={() => {
                  setShowMathMenu((prev) => !prev);
                  setShowEmojiDrawer(false);
                }}
                title="Insert math formula"
                style={{ fontWeight: 700, fontSize: "1rem" }}
              >
                ∑
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                rows={1}
                placeholder={`Message ${chatType === "group" ? "group" : ""}... (Shift+Enter for new line)`}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onPaste={(e) => {
                  e.preventDefault();
                  const raw = e.clipboardData?.getData("text/plain") || "";
                  const normalized = normalizePastedText(raw);
                  setText((prev) => prev + normalized);
                }}
              />
            </div>

            {/* Voice or Send Button */}
            {text.trim() ? (
              <button
                type="button"
                className="chat-send-btn"
                onClick={handleSendText}
                title="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="chat-icon-btn"
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
                onClick={startRecording}
                title="Hold or click to record voice note"
              >
                🎙
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ChatInput;