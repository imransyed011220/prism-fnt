// components/studychat/ChatInput.jsx
// Message input with file upload, voice recording, emoji

import { useState, useRef, useCallback } from "react";
import { useStudyChat } from "../../contexts/StudyChatContext";

function ChatInput({ onSend, chatType }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const fileInputRef = useRef(null);
  const typingRef = useRef(false);
  const typingTimer = useRef(null);
  const { sendTyping } = useStudyChat();

  // typing indicator
  function handleTextChange(e) {
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
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }

  function handleSendText() {
    if (!text.trim()) return;
    onSend(text.trim(), "text");
    setText("");
    sendTyping(false);
    typingRef.current = false;
    clearTimeout(typingTimer.current);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("File too large. Max 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const type = file.type.startsWith("image/") ? "image" : "file";
      onSend("", type, ev.target.result, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];

      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = ev => {
          onSend("", "voice", ev.target.result, "voice_note.webm");
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied.");
    }
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setRecording(false);
    setMediaRecorder(null);
  }

  return (
    <div
      className="d-flex align-items-end gap-2 p-3 bg-white border-top"
      style={{ flexShrink: 0 }}
    >
      {/* File upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        className="btn btn-light"
        style={{ borderRadius: "50%", width: "40px", height: "40px", flexShrink: 0 }}
        onClick={() => fileInputRef.current?.click()}
        title="Attach file or image"
      >
        📎
      </button>

      {/* Text input */}
      <textarea
        className="form-control"
        rows={1}
        placeholder={`Message ${chatType === "group" ? "group" : ""}...`}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        style={{
          resize: "none",
          borderRadius: "20px",
          maxHeight: "120px",
          overflowY: "auto",
          fontSize: "0.95rem"
        }}
      />

      {/* Voice recording */}
      {recording ? (
        <button
          className="btn btn-danger"
          style={{ borderRadius: "50%", width: "40px", height: "40px", flexShrink: 0 }}
          onClick={stopRecording}
          title="Stop recording"
        >
          ⏹
        </button>
      ) : (
        <button
          className="btn btn-light"
          style={{ borderRadius: "50%", width: "40px", height: "40px", flexShrink: 0 }}
          onClick={startRecording}
          title="Record voice note"
        >
          🎙
        </button>
      )}

      {/* Send */}
      <button
        className="btn btn-dark"
        style={{ borderRadius: "50%", width: "40px", height: "40px", flexShrink: 0 }}
        onClick={handleSendText}
        disabled={!text.trim() && !recording}
        title="Send"
      >
        ➤
      </button>
    </div>
  );
}

export default ChatInput;