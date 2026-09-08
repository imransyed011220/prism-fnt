// components/studychat/MessageThread.jsx
// WhatsApp/iMessage-level message bubbles with grouping, reactions, smooth animations

import React, { useState } from 'react';
import MathRenderer from "../common/MathRenderer";
import { useStudyChat } from "../../contexts/StudyChatContext";

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}`;

const css = `
  .msg-thread { display: flex; flex-direction: column; gap: 2px; padding-bottom: 8px; }

  /* Message group */
  .msg-group { display: flex; flex-direction: column; margin-bottom: 12px; }

  /* Message row */
  .msg-row {
    display: flex; gap: 10px; align-items: flex-end;
    animation: msgIn 0.2s ease;
  }
  .msg-row.me { flex-direction: row-reverse; }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Avatar in thread */
  .msg-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 700; color: white; overflow: hidden;
  }
  .msg-avatar.hidden { visibility: hidden; }

  /* Sender name above first bubble in group */
  .msg-sender-name {
    font-size: 0.72rem; font-weight: 600; margin-bottom: 3px; margin-left: 2px; color: #a78bfa;
  }

  /* Bubble */
  .msg-bubble {
    max-width: min(75%, 520px);
    padding: 10px 14px;
    font-size: 0.92rem;
    line-height: 1.5;
    position: relative;
    word-break: break-word;
    transition: all 0.15s;
  }
  /* My bubble */
  .msg-bubble.me {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white;
    border-radius: 18px 18px 4px 18px;
  }
  /* Other bubble */
  .msg-bubble.other {
    background: rgba(255,255,255,0.07);
    color: #e5e7eb;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px 18px 18px 4px;
  }
  /* Consecutive bubbles tighten radius */
  .msg-bubble.me.chain-top { border-radius: 18px 4px 4px 18px; }
  .msg-bubble.other.chain-top { border-radius: 4px 18px 18px 4px; }
  .msg-bubble.me.chain-mid { border-radius: 18px 4px 4px 18px; }
  .msg-bubble.other.chain-mid { border-radius: 4px 18px 18px 4px; }

  /* Deleted */
  .msg-bubble.deleted {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    font-style: italic; color: #6b7280 !important;
  }

  /* Meta row (time + reactions) */
  .msg-meta {
    display: flex; align-items: center; gap: 6px;
    margin-top: 3px; padding: 0 4px;
    flex-wrap: wrap;
  }
  .msg-time { font-size: 0.67rem; color: #4b5563; }
  .msg-edited { font-size: 0.67rem; color: #6b7280; }

  /* Reactions */
  .reaction-pill {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 8px; border-radius: 50px;
    font-size: 0.75rem; cursor: pointer; transition: all 0.15s;
    border: 1px solid transparent;
    animation: reactionPop 0.2s ease;
  }
  .reaction-pill.mine { background: rgba(124,58,237,0.25); border-color: rgba(124,58,237,0.4); }
  .reaction-pill.other { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); }
  .reaction-pill:hover { transform: scale(1.1); }
  @keyframes reactionPop {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  /* Context menu */
  .ctx-trigger {
    opacity: 0; transition: opacity 0.15s;
    cursor: pointer; padding: 2px 6px; border-radius: 6px;
    font-size: 0.8rem; color: #6b7280; user-select: none;
    flex-shrink: 0;
  }
  .msg-row:hover .ctx-trigger { opacity: 1; }

  .ctx-menu {
    position: absolute; z-index: 100; min-width: 200px;
    background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    overflow: hidden; animation: menuIn 0.15s ease;
  }
  @keyframes menuIn { from { opacity: 0; transform: scale(0.95) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }

  .emoji-row { display: flex; gap: 4px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .emoji-pick { font-size: 1.2rem; cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.1s; }
  .emoji-pick:hover { background: rgba(255,255,255,0.1); transform: scale(1.2); }

  .ctx-item { padding: 10px 14px; font-size: 0.85rem; color: #d1d5db; cursor: pointer; transition: background 0.15s; }
  .ctx-item:hover { background: rgba(255,255,255,0.05); }
  .ctx-item.danger { color: #ef4444; }
  .ctx-item.danger:hover { background: rgba(239,68,68,0.1); }

  /* Image message */
  .msg-img { max-width: 280px; max-height: 280px; border-radius: 12px; object-fit: cover; display: block; }
  /* File */
  .msg-file {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    background: rgba(255,255,255,0.07); border-radius: 10px; text-decoration: none;
    transition: background 0.15s;
  }
  .msg-file:hover { background: rgba(255,255,255,0.12); }

  /* Date separator */
  .date-sep {
    text-align: center; margin: 16px 0 8px;
    position: relative;
  }
  .date-sep::before {
    content: ''; position: absolute; top: 50%; left: 0; right: 0;
    height: 1px; background: rgba(255,255,255,0.05);
  }
  .date-sep span {
    background: #0f0f1a; position: relative; z-index: 1;
    padding: 0 12px; font-size: 0.72rem; color: #4b5563; font-weight: 600;
  }
`;

function avatarColor(userId) {
  const colors = ["#7c3aed","#059669","#dc2626","#d97706","#0284c7","#db2777"];
  if (!userId) return colors[0];
  const n = userId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function MessageThread({ messages, currentUserId, currentUser, activeChat, friends }) {
  const { reactToMessage, deleteMessage } = useStudyChat();
  const [openMenu, setOpenMenu] = useState(null);

  // Group consecutive messages from the same sender
  const grouped = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const sameAuthor = prev && prev.fromUserId === msg.fromUserId;
    const sameDay = prev && formatDate(prev.timestamp) === formatDate(msg.timestamp);
    grouped.push({ msg, isFirst: !sameAuthor || !sameDay, isLast: !messages[i + 1] || messages[i + 1].fromUserId !== msg.fromUserId, dayBreak: !sameDay });
  });

  function getSenderInfo(msg) {
    const isMe = msg.fromUserId === currentUserId;
    if (isMe) return { name: currentUser?.firstName || "You", img: currentUser?.profileImageUrl, color: avatarColor(currentUserId) };
    if (activeChat?.type === "dm") return { name: activeChat.name, img: activeChat.avatar, color: avatarColor(msg.fromUserId) };
    const friend = friends?.find(f => f.userId === msg.fromUserId);
    if (friend) return { name: friend.displayName, img: friend.avatar, color: avatarColor(msg.fromUserId) };
    if (msg.senderInfo?.displayName) return { name: msg.senderInfo.displayName, img: msg.senderInfo.avatar, color: avatarColor(msg.fromUserId) };
    return { name: `User ${msg.fromUserId?.substring(0, 5)}`, img: null, color: avatarColor(msg.fromUserId) };
  }

  return (
    <div className="msg-thread">
      <style>{css}</style>
      {grouped.map(({ msg, isFirst, isLast, dayBreak }, idx) => {
        const isMe = msg.fromUserId === currentUserId;
        const sender = getSenderInfo(msg);

        return (
          <React.Fragment key={msg.messageId || idx}>
            {dayBreak && (
              <div className="date-sep"><span>{formatDate(msg.timestamp)}</span></div>
            )}
            <div className={`msg-row ${isMe ? "me" : ""}`}>
              {/* Avatar — only show for last in group */}
              {!isMe && (
                <div className={`msg-avatar ${!isLast ? "hidden" : ""}`}
                  style={{ background: sender.color }}>
                  {isLast && (sender.img
                    ? <img src={sender.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (sender.name?.[0] || "?").toUpperCase()
                  )}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                {/* Sender name for first in group (group chats only) */}
                {!isMe && isFirst && activeChat?.type === "group" && (
                  <div className="msg-sender-name" style={{ color: sender.color }}>{sender.name}</div>
                )}

                {/* Bubble */}
                <div style={{ position: "relative" }}>
                  <div className={`msg-bubble ${isMe ? "me" : "other"} ${msg.isDeleted ? "deleted" : ""}`}
                    style={msg.isDeleted ? {} : {}}>
                    {msg.isDeleted ? (
                      <em>🚫 This message was deleted</em>
                    ) : (
                      <>
                        {msg.fileUrl && (
                          <div style={{ marginBottom: msg.content ? 8 : 0 }}>
                            {msg.type === "image" ? (
                              <img className="msg-img" src={`${BASE_URL}${msg.fileUrl}`} alt="attachment" />
                            ) : msg.type === "voice" ? (
                              <audio controls src={`${BASE_URL}${msg.fileUrl}`}
                                style={{ height: 36, maxWidth: 220, outline: "none", accentColor: "#a78bfa" }} />
                            ) : (
                              <a className="msg-file" href={`${BASE_URL}${msg.fileUrl}`} target="_blank" rel="noreferrer"
                                style={{ color: isMe ? "rgba(255,255,255,0.9)" : "#e5e7eb" }}>
                                <span style={{ fontSize: "1.4rem" }}>📎</span>
                                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{msg.fileName || "Download"}</span>
                              </a>
                            )}
                          </div>
                        )}
                        {msg.content && (
                          <div style={{ wordBreak: "break-word" }}>
                            <MathRenderer content={msg.content} />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Context menu trigger */}
                  {!msg.isDeleted && (
                    <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", [isMe ? "left" : "right"]: -28 }}>
                      <span className="ctx-trigger"
                        onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === msg.messageId ? null : msg.messageId); }}>
                        ···
                      </span>
                      {openMenu === msg.messageId && (
                        <>
                          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpenMenu(null)} />
                          <div className="ctx-menu"
                            style={{ [isMe ? "right" : "left"]: 0, bottom: "100%", marginBottom: 4 }}>
                            <div className="emoji-row">
                              {["👍", "❤️", "😂", "🔥", "🚀", "💡"].map(emoji => (
                                <span key={emoji} className="emoji-pick"
                                  onClick={() => { reactToMessage(msg.messageId, emoji); setOpenMenu(null); }}>
                                  {emoji}
                                </span>
                              ))}
                            </div>
                            {isMe && (
                              <div className="ctx-item danger"
                                onClick={() => { deleteMessage(msg.messageId, true); setOpenMenu(null); }}>
                                🗑 Delete for everyone
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Meta: time + reactions */}
                <div className="msg-meta" style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <span className="msg-time">{formatTime(msg.timestamp)}</span>
                  {msg.edited && <span className="msg-edited">(edited)</span>}
                  {msg.reactions && Object.entries(msg.reactions).map(([emoji, users]) => (
                    <span key={emoji} className={`reaction-pill ${users.includes(currentUserId) ? "mine" : "other"}`}
                      onClick={() => reactToMessage(msg.messageId, emoji)}>
                      {emoji} <span style={{ fontWeight: 700, fontSize: "0.68rem", color: "#9ca3af" }}>{users.length}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* My avatar on right */}
              {isMe && (
                <div className={`msg-avatar ${!isLast ? "hidden" : ""}`}
                  style={{ background: avatarColor(currentUserId) }}>
                  {isLast && (currentUser?.profileImageUrl
                    ? <img src={currentUser.profileImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (currentUser?.firstName?.[0] || "Y").toUpperCase()
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default MessageThread;
