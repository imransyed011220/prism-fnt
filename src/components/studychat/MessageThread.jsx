// components/studychat/MessageThread.jsx
import React, { useState } from 'react';
import MathRenderer from "../common/MathRenderer";
import { useStudyChat } from "../../contexts/StudyChatContext";

const BASE_URL = "http://localhost:8000";

function MessageThread({ messages, currentUserId, currentUser, activeChat, friends }) {
  const { reactToMessage, deleteMessage } = useStudyChat();
  const [openDropdown, setOpenDropdown] = useState(null);

  return (
    <div className="d-flex flex-column gap-3 mb-4">
      {messages.map((msg, index) => {
        const isMe = msg.fromUserId === currentUserId;
        
        let senderName = "User";
        let senderAvatarString = "?";
        let senderAvatarImg = null;
        
        if (isMe) {
          senderName = currentUser?.firstName || "You";
          senderAvatarImg = currentUser?.profileImageUrl;
          senderAvatarString = senderName[0];
        } else {
          if (activeChat?.type === "dm") {
            senderName = activeChat.name || "User";
            senderAvatarImg = activeChat.avatar;
            senderAvatarString = senderName[0];
          } else {
            const friend = friends?.find(f => f.userId === msg.fromUserId);
            if (friend) {
              senderName = friend.displayName;
              senderAvatarImg = friend.avatar;
              senderAvatarString = senderName[0];
            } else if (msg.senderInfo?.displayName) {
              senderName = msg.senderInfo.displayName;
              senderAvatarImg = msg.senderInfo.avatar;
              senderAvatarString = senderName[0];
            }
          }
        }
        
        return (
          <div key={msg.messageId || index} className={`d-flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0 ${!senderAvatarImg && 'text-white'}`}
              style={{
                width: "36px", height: "36px",
                background: senderAvatarImg ? "transparent" : (isMe ? "#212529" : "#0d6efd"),
                fontSize: "0.9rem",
                overflow: "hidden"
              }}
            >
              {senderAvatarImg ? (
                <img src={senderAvatarImg} alt="avatar" style={{width: "100%", height: "100%", objectFit: "cover"}} />
              ) : (
                senderAvatarString.toUpperCase()
              )}
            </div>
            
            <div className={`d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`} style={{ maxWidth: "75%" }}>
              {!isMe && (
                <div className="small fw-semibold text-secondary mb-1">
                  {senderName}
                </div>
              )}
              
              <div
                className={`p-3 rounded-4 ${isMe ? "bg-primary text-white" : "bg-white text-dark shadow-sm"}`}
                style={{
                  borderTopRightRadius: isMe ? "4px" : "16px",
                  borderTopLeftRadius: !isMe ? "4px" : "16px",
                  border: isMe ? "none" : "1px solid #e9ecef"
                }}
              >
                {msg.isDeleted ? (
                  <em className="opacity-75">{msg.content}</em>
                ) : (
                  <>
                    {msg.fileUrl && (
                      <div className="mb-2">
                        {msg.type === "image" ? (
                          <img 
                            src={`${BASE_URL}${msg.fileUrl}`} 
                            alt="attachment" 
                            className="img-fluid rounded" 
                            style={{ maxHeight: "300px" }} 
                          />
                        ) : msg.type === "voice" ? (
                          <audio 
                            controls 
                            src={`${BASE_URL}${msg.fileUrl}`} 
                            style={{ height: "40px", maxWidth: "250px", outline: "none" }} 
                          />
                        ) : (
                          <div className="p-2 border rounded bg-light text-dark">
                            <a 
                              href={`${BASE_URL}${msg.fileUrl}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-decoration-none fw-semibold"
                            >
                              📎 {msg.fileName || "Download Attachment"}
                            </a>
                          </div>
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
              
              <div className="d-flex align-items-center gap-2 mt-1 px-1">
                <small className="text-secondary" style={{ fontSize: "0.7rem" }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.edited && " (edited)"}
                </small>
                
                {/* Reactions display */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="d-flex gap-1">
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <button 
                        key={emoji}
                        className={`badge rounded-pill border-0 px-2 py-1 ${users.includes(currentUserId) ? 'bg-primary' : 'bg-light text-dark border'}`}
                        style={{ cursor: "pointer", fontSize: "0.75rem" }}
                        onClick={() => reactToMessage(msg.messageId, emoji)}
                      >
                        {emoji} {users.length}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Quick react placeholder logic */}
                {!msg.isDeleted && (
                  <div className="dropdown" style={{ position: "relative" }}>
                    <span 
                      className="text-secondary ms-1" 
                      style={{ cursor: "pointer", fontSize: "0.8rem", opacity: 0.6, userSelect: "none" }}
                      onClick={() => setOpenDropdown(openDropdown === msg.messageId ? null : msg.messageId)}
                    >
                      •••
                    </span>
                    {openDropdown === msg.messageId && (
                      <>
                        <div 
                          className="position-fixed top-0 start-0 w-100 h-100" 
                          style={{ zIndex: 999 }} 
                          onClick={() => setOpenDropdown(null)} 
                        />
                        <ul className="dropdown-menu shadow fs-6 show" style={{ position: "absolute", bottom: "20px", right: isMe ? 0 : "auto", left: isMe ? "auto" : 0, zIndex: 1000, minWidth: "200px" }}>
                          <li>
                            <div className="d-flex gap-2 px-3 py-1">
                              {["👍", "❤️", "😂", "🚀", "💡"].map(emoji => (
                                 <span 
                                   key={emoji} 
                                   style={{ cursor: "pointer", transition: "transform 0.1s" }} 
                                   onMouseEnter={e => e.target.style.transform = "scale(1.2)"}
                                   onMouseLeave={e => e.target.style.transform = "scale(1)"}
                                   onClick={() => { reactToMessage(msg.messageId, emoji); setOpenDropdown(null); }}
                                 >
                                   {emoji}
                                 </span>
                              ))}
                            </div>
                          </li>
                          {isMe && (
                            <>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button 
                                  className="dropdown-item text-danger small" 
                                  onClick={() => { deleteMessage(msg.messageId, true); setOpenDropdown(null); }}
                                >
                                  Delete for everyone
                                </button>
                              </li>
                            </>
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
              
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MessageThread;
