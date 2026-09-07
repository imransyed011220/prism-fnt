// src/contexts/ChatContext.jsx
// manages all chat state globally
// sessions list, active session, messages, loading state

import { createContext, useContext, useState, useCallback, useEffect,useRef } from "react";
import {
  createSession,
  getUserSessions,
  getSession,
  deleteSession,
  sendMessage,
} from "../services/api";
import { useAgentTrace } from "../hooks/useAgentTrace";

const ChatContext = createContext();

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const [sessions, setSessions] = useState([]);         // sidebar list
  const [activeSession, setActiveSessionState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const { nodes: traceNodes, isActive: isTraceActive, startTrace, stopTrace, getSnapshot } = useAgentTrace();

  // ← ref always holds latest messages — fixes stale closure
  const messagesRef = useRef([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // persist active session ID to localStorage
  function setActiveSession(session) {
    setActiveSessionState(session);
    if (session) {
      localStorage.setItem("prism_active_session", session.sessionId);
    } else {
      localStorage.removeItem("prism_active_session");
    }
  }

  

  // load all sessions for sidebar
  const loadSessions = useCallback(async (userId) => {
    try {
      const res = await getUserSessions(userId);
      const sessionList = res.data.payload || [];
      setSessions(sessionList);

      // restore last active session from localStorage
      const savedSessionId = localStorage.getItem("prism_active_session");
      if (savedSessionId && sessionList.length > 0) {
        const saved = sessionList.find(s => s.sessionId === savedSessionId);
        if (saved) {
          const res2 = await getSession(userId, savedSessionId);
          const full = res2.data.payload;
          if (full) {
            setActiveSessionState(full);
            setMessages(full.messages || []);
          }
        }
      }
    } catch (err) {
      console.error("[ChatContext] Failed to load sessions:", err);
    }
  }, []);

  // load a specific session and its messages
  const loadSession = useCallback(async (userId, sessionId) => {
    try {
      const res = await getSession(userId, sessionId);
      const session = res.data.payload;
      if (session) {
        setActiveSession(session);
        setMessages(session.messages || []);
      }
    } catch (err) {
      console.error("[ChatContext] Failed to load session:", err);
    }
  }, []);

  // start a new session
  const startNewSession = useCallback(async (userId, examTarget, firstMessage) => {
    try {
      const res = await createSession({ userId, examTarget, firstMessage });
      const session = res.data.payload;
      setActiveSession(session);
      setMessages([]);
      setSessions((prev) => [session, ...prev]);
      return session;
    } catch (err) {
      console.error("[ChatContext] Failed to create session:", err);
      return null;
    }
  }, []);

  // new chat — clear everything
  const startNewChat = useCallback(() => {
    setActiveSession(null);
    setMessages([]);
    localStorage.removeItem("prism_active_session");
  }, []);

  // send a message
  const sendChat = useCallback(async (query, userId, examTarget, forcedSessionId = null) => {
    if (!query.trim()) return;

    // add user message to UI immediately
    const userMsg = {
      role: "user",
      content: query,
      sources: [],
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // create abort controller for stop button
    const controller = new AbortController();
    setAbortController(controller);
    const traceId = crypto.randomUUID();

    try {
      await startTrace(traceId, userId);
      // priority: forcedSessionId > activeSession > create new
      let currentSessionId = forcedSessionId
        || activeSession?.sessionId
        || localStorage.getItem("prism_active_session");

      if (!currentSessionId) {
        const newSession = await startNewSession(userId, examTarget, query);
        currentSessionId = newSession?.sessionId;
      }

      // ← use ref for latest messages (not stale closure)
      const recentMessages = messagesRef.current.slice(-8).map(m => ({
        role: m.role,
        content: m.content.substring(0, 500)   // cap each message
      }));

      console.log(`[ChatContext] Sending with ${recentMessages.length} history messages`);

      const res = await sendMessage(
        { query, userId, examTarget, sessionId: currentSessionId, recentMessages, traceId },
        controller.signal
      );

      if (res.data.message === "cancelled") return;

      const assistantMsg = {
        role: "assistant",
        content: res.data.payload.answer,
        sources: res.data.payload.sources || [],
        timestamp: new Date().toISOString(),
        trace: res.data.payload.trace || getSnapshot(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // refresh sessions list (updated title/timestamp)
      await loadSessions(userId);

    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        // user stopped the response — add stopped message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⏹ Response stopped.",
            sources: [],
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        console.error("[ChatContext] sendChat error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Something went wrong. Please try again.",
            sources: [],
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
      stopTrace();
    }
  }, [activeSession, startNewSession, loadSessions, startTrace, stopTrace, getSnapshot]);


  // stop current response
  const stopResponse = useCallback(() => {
    if (abortController) {
      abortController.abort();
      console.log("[ChatContext] Response aborted by user.");
    }
  }, [abortController]);

  // delete a session
  const removeSession = useCallback(async (userId, sessionId) => {
    await deleteSession(userId, sessionId);
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    if (activeSession?.sessionId === sessionId) {
      startNewChat();
    }
  }, [activeSession, startNewChat]);

  return (
    <ChatContext.Provider value={{
      sessions,
      activeSession,
      messages,
      isLoading,
      traceNodes,
      isTraceActive,
      setMessages,
      loadSessions,
      loadSession,
      startNewSession,
      startNewChat,
      sendChat,
      stopResponse,
      removeSession,
      setActiveSession,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
