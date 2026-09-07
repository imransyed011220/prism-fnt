import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const TRACE_NODES = ["router", "retrieve", "grade", "rewrite", "generate"];

export function emptyTraceNodes() {
  return Object.fromEntries(TRACE_NODES.map((node) => [node, {
    status: "pending", detail: "", data: {}, updatedAt: null,
  }]));
}

export function useAgentTrace() {
  const [nodes, setNodes] = useState(emptyTraceNodes);
  const [isActive, setIsActive] = useState(false);
  const socketRef = useRef(null);
  const handlerRef = useRef(null);
  const traceIdRef = useRef(null);
  const nodesRef = useRef(emptyTraceNodes());

  const startTrace = useCallback(async (traceId, userId) => {
    const fresh = emptyTraceNodes();
    traceIdRef.current = traceId;
    nodesRef.current = fresh;
    setNodes(fresh);
    setIsActive(true);

    if (!socketRef.current) {
      socketRef.current = io("http://localhost:8000", {
        auth: { userId }, transports: ["websocket", "polling"], autoConnect: false,
      });
    }
    const socket = socketRef.current;
    socket.auth = { userId };

    if (handlerRef.current) socket.off("agent_trace", handlerRef.current);
    const handler = (event) => {
      if (event.traceId !== traceId) return;
      const next = {
        ...nodesRef.current,
        [event.node]: { status: event.status, detail: event.detail || "", data: event.data || {}, updatedAt: Date.now() },
      };
      nodesRef.current = next;
      setNodes(next);
    };
    handlerRef.current = handler;
    socket.on("agent_trace", handler);

    await new Promise((resolve) => {
      const join = () => socket.timeout(3000).emit("join_trace", { traceId }, () => resolve());
      if (socket.connected) join();
      else {
        socket.once("connect", join);
        socket.connect();
        // The chat still works if realtime is unavailable; this only skips live motion.
        setTimeout(resolve, 3200);
      }
    });
  }, []);

  const stopTrace = useCallback(() => {
    const socket = socketRef.current;
    if (socket && traceIdRef.current) socket.emit("leave_trace", { traceId: traceIdRef.current });
    setIsActive(false);
  }, []);

  useEffect(() => () => socketRef.current?.disconnect(), []);

  return { nodes, isActive, startTrace, stopTrace, getSnapshot: () => nodesRef.current };
}
