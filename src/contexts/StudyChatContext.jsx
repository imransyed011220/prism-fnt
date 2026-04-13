// contexts/StudyChatContext.jsx
// Manages all real-time chat state
// Socket.IO connection, messages, friends, groups, presence

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { useUserContext } from "./UserContext";
import axios from "axios";

const StudyChatContext = createContext();

export function useStudyChat() {
  return useContext(StudyChatContext);
}

const SOCKET_URL = "http://localhost:8000";
const BASE = "http://localhost:8000/api";

export function StudyChatProvider({ children }) {
  const { currentUser } = useUserContext();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // chat state
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);  // {type: 'dm'|'group', id, name}
  const [messages, setMessages] = useState([]);         // messages for active chat
  const [onlineUsers, setOnlineUsers] = useState({});   // userId → status
  const [typingUsers, setTypingUsers] = useState({});   // chatId → [userIds]
  const [unreadCounts, setUnreadCounts] = useState({});

  const typingTimeout = useRef({});

  // ── Initialize Socket ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.userId) return;

    const newSocket = io(SOCKET_URL, {
      auth: { userId: currentUser.userId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("[StudyChat] Connected to Socket.IO");
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("[StudyChat] Disconnected");
      setConnected(false);
    });

    // ── Incoming DM ────────────────────────────────────────────────────
    newSocket.on("new_dm", (message) => {
      setMessages(prev => {
        // only add if it's for the active chat
        const activeConvoId = activeChat?.type === "dm"
          ? [...[currentUser.userId, activeChat.id]].sort().join("_") : null;

        if (message.conversationId === activeConvoId) {
          // ensure we don't accidentally duplicate
          if (!prev.find(m => m.messageId === message.messageId)) {
            return [...prev, message];
          }
        }
        return prev;
      });

      // update conversations list
      setConversations(prev => {
        const existing = prev.findIndex(c => c.conversationId === message.conversationId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = {
            ...updated[existing],
            lastMessage: message.content || `[${message.type}]`,
            lastMessageTime: message.timestamp
          };
          return updated.sort((a, b) =>
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
          );
        }
        return prev;
      });

      // increment unread if not active chat
      if (activeChat?.id !== message.fromUserId) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.fromUserId]: (prev[message.fromUserId] || 0) + 1
        }));
      }
    });

    // ── Incoming Group Message ─────────────────────────────────────────
    newSocket.on("new_group_message", (message) => {
      if (activeChat?.type === "group" && activeChat?.id === message.groupId) {
        setMessages(prev => [...prev, message]);
      }

      setGroups(prev => {
        const idx = prev.findIndex(g => g.groupId === message.groupId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            lastMessage: message.content || `[${message.type}]`,
            lastMessageTime: message.timestamp
          };
          return updated.sort((a, b) =>
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
          );
        }
        return prev;
      });

      if (activeChat?.id !== message.groupId) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.groupId]: (prev[message.groupId] || 0) + 1
        }));
      }
    });

    // ── Presence ───────────────────────────────────────────────────────
    newSocket.on("user_presence", ({ userId, status }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: status }));
    });

    // ── Typing ─────────────────────────────────────────────────────────
    newSocket.on("typing_dm", ({ fromUserId, isTyping }) => {
      setTypingUsers(prev => {
        const key = fromUserId;
        const current = prev[key] || [];
        if (isTyping && !current.includes(fromUserId)) {
          return { ...prev, [key]: [...current, fromUserId] };
        } else if (!isTyping) {
          return { ...prev, [key]: current.filter(u => u !== fromUserId) };
        }
        return prev;
      });
    });

    newSocket.on("group_typing", ({ groupId, userId, isTyping }) => {
      setTypingUsers(prev => {
        const current = prev[groupId] || [];
        if (isTyping && !current.includes(userId)) {
          return { ...prev, [groupId]: [...current, userId] };
        } else if (!isTyping) {
          return { ...prev, [groupId]: current.filter(u => u !== userId) };
        }
        return prev;
      });
    });

    // ── Message Updates ────────────────────────────────────────────────
    newSocket.on("message_edited", ({ messageId, content, edited }) => {
      setMessages(prev => prev.map(m =>
        m.messageId === messageId ? { ...m, content, edited } : m
      ));
    });

    newSocket.on("message_deleted", ({ messageId, isDeleted }) => {
      setMessages(prev => prev.map(m =>
        m.messageId === messageId
          ? { ...m, isDeleted: true, content: "This message was deleted" } : m
      ));
    });

    newSocket.on("reaction_updated", ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m =>
        m.messageId === messageId ? { ...m, reactions } : m
      ));
    });

    newSocket.on("message_pinned", ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m.messageId === messageId ? { ...m, isPinned: true } : m
      ));
    });

    newSocket.on("messages_read", ({ conversationId }) => {
      setMessages(prev => prev.map(m =>
        m.conversationId === conversationId
          ? { ...m, readBy: [...(m.readBy || []), "read"] } : m
      ));
    });

    setSocket(newSocket);

    // load initial data
    loadInitialData();

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser?.userId]);

  // ── Load Initial Data ─────────────────────────────────────────────────
  async function loadInitialData() {
    if (!currentUser?.userId) return;
    try {
      const [convRes, grpRes, frdRes, reqRes] = await Promise.all([
        axios.get(`${BASE}/studychat/conversations/${currentUser.userId}`),
        axios.get(`${BASE}/studychat/groups/${currentUser.userId}`),
        axios.get(`${BASE}/studychat/friends/${currentUser.userId}`),
        axios.get(`${BASE}/studychat/friend-requests/${currentUser.userId}`)
      ]);
      setConversations(convRes.data.payload || []);
      setGroups(grpRes.data.payload || []);
      setFriends(frdRes.data.payload || []);
      setPendingRequests(reqRes.data.payload || []);
    } catch (err) {
      console.error("[StudyChat] Failed to load initial data:", err);
    }
  }

  // ── Open Chat ─────────────────────────────────────────────────────────
  const openChat = useCallback(async (type, id, name, avatar = "") => {
    setActiveChat({ type, id, name, avatar });
    setMessages([]);

    // clear unread
    setUnreadCounts(prev => ({ ...prev, [id]: 0 }));

    try {
      let res;
      if (type === "dm") {
        res = await axios.get(
          `${BASE}/studychat/messages/dm/${currentUser.userId}/${id}`
        );
        // mark as read
        socket?.emit("mark_read_dm", { otherUserId: id });
      } else {
        res = await axios.get(
          `${BASE}/studychat/messages/group/${id}`,
          { params: { userId: currentUser.userId } }
        );
      }
      setMessages(res.data.payload || []);
    } catch (err) {
      console.error("[StudyChat] Failed to load messages:", err);
    }
  }, [currentUser?.userId, socket]);

  // ── Send Message ──────────────────────────────────────────────────────
  const sendMessage = useCallback((content, type = "text", fileData = null,
                                    fileName = "", replyTo = null) => {
    if (!socket || !activeChat) return;

    const payload = { content, type, replyTo };
    if (fileData) {
      payload.fileData = fileData;
      payload.fileName = fileName;
    }

    if (activeChat.type === "dm") {
      socket.emit("send_dm", { ...payload, toUserId: activeChat.id });
    } else {
      socket.emit("send_group_message", { ...payload, groupId: activeChat.id });
    }

    // optimistic update removed
    // server broadcasts `new_dm` / `new_group_message` back to sender, meaning
    // the UI will update naturally with actual fileUrls and UUIDs.
  }, [socket, activeChat, currentUser]);

  // ── Typing Indicator ──────────────────────────────────────────────────
  const sendTyping = useCallback((isTyping) => {
    if (!socket || !activeChat) return;
    if (activeChat.type === "dm") {
      socket.emit("typing_dm", { toUserId: activeChat.id, isTyping });
    } else {
      socket.emit("typing_group", { groupId: activeChat.id, isTyping });
    }
  }, [socket, activeChat]);

  // ── React to Message ──────────────────────────────────────────────────
  const reactToMessage = useCallback((messageId, emoji) => {
    if (!socket) return;
    socket.emit("react_to_message", {
      messageId,
      emoji,
      roomType: activeChat?.type === "dm" ? "dm" : "group"
    });
  }, [socket, activeChat]);

  // ── Edit Message ──────────────────────────────────────────────────────
  const editMessage = useCallback((messageId, newContent) => {
    socket?.emit("edit_message", { messageId, content: newContent });
  }, [socket]);

  // ── Delete Message ────────────────────────────────────────────────────
  const deleteMessage = useCallback((messageId, forEveryone = false) => {
    socket?.emit("delete_message", { messageId, deleteForEveryone: forEveryone });
    if (!forEveryone) {
      setMessages(prev => prev.filter(m => m.messageId !== messageId));
    }
  }, [socket]);

  // ── Send Friend Request ───────────────────────────────────────────────
  const sendFriendRequest = useCallback(async (toUserId) => {
    try {
      const res = await axios.post(`${BASE}/studychat/friend-request`, {
        fromUserId: currentUser.userId,
        toUserId
      });
      return res.data;
    } catch (err) {
      console.error(err);
    }
  }, [currentUser?.userId]);

  // ── Respond to Friend Request ─────────────────────────────────────────
  const respondToRequest = useCallback(async (requestId, accept) => {
    try {
      await axios.post(`${BASE}/studychat/friend-request/respond`, {
        requestId,
        userId: currentUser.userId,
        accept
      });
      // refresh friends and requests
      const [frdRes, reqRes] = await Promise.all([
        axios.get(`${BASE}/studychat/friends/${currentUser.userId}`),
        axios.get(`${BASE}/studychat/friend-requests/${currentUser.userId}`)
      ]);
      setFriends(frdRes.data.payload || []);
      setPendingRequests(reqRes.data.payload || []);
    } catch (err) {
      console.error(err);
    }
  }, [currentUser?.userId]);

  return (
    <StudyChatContext.Provider value={{
      socket, connected,
      conversations, groups, friends, pendingRequests,
      activeChat, messages, onlineUsers, typingUsers, unreadCounts,
      openChat, sendMessage, sendTyping,
      reactToMessage, editMessage, deleteMessage,
      sendFriendRequest, respondToRequest,
      loadInitialData,
      setGroups, setFriends, setPendingRequests
    }}>
      {children}
    </StudyChatContext.Provider>
  );
}