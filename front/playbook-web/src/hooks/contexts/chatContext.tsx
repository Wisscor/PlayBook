"use client";

import { api } from "@/services/api";
import { ChatConversation, RealtimeMessage } from "@/types/api";
import { useAuth } from "./authContext";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { sortMessages } from "@/lib/utils";

interface ChatNotification {
  id: string;
  event_type: string;
  actor_username: string;
  read_at: string | null;
  created_at: string;
  match_time: string | null;
}

type ChatContextValue = {
  conversations: ChatConversation[];
  unreadMessages: number;
  messages: Record<string, RealtimeMessage[]>;
  onlineUserIds: string[];
  connected: boolean;
  timeoutRemaining: number;
  notifications: ChatNotification[];
  sendMessage: (conversationId: string, body: string) => boolean;
  markRead: (conversationId: string, messageId: string) => boolean;
  setNotifications: React.Dispatch<React.SetStateAction<ChatNotification[]>>;
  loadConversations: () => Promise<void>;
  setMessages: React.Dispatch<
    React.SetStateAction<Record<string, RealtimeMessage[]>>
  >;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

function getWebSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return `${apiUrl.replace(/^http/, "ws")}/ws`;
}

export function ChatProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { connectedUser, isLoading } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<Record<string, RealtimeMessage[]>>(
    {},
  );
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);

  const [connected, setConnected] = useState(false);
  const [timeoutRemaining, setTimeoutRemaining] = useState(0);
  const timeoutDeadlineRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const receivedMessageIdsRef = useRef(new Set<string>());

  const loadConversations = useCallback(async () => {
    await api.get<ChatConversation[]>("/realtime/conversations").then((res) => {
      if (res.status == 200) {
        setConversations(res.data);
      }
    });
  }, [connectedUser?.id]);

  useEffect(() => {
    if (isLoading || !connectedUser?.id) return;

    let disposed = false;
    const timeoutTimer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((timeoutDeadlineRef.current - performance.now()) / 1000),
      );
      setTimeoutRemaining(remaining);
      if (remaining === 0) timeoutDeadlineRef.current = 0;
    }, 250);
    const connect = () => {
      if (disposed) return;
      const socket = new WebSocket(getWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        setConnected(true);
      };
      socket.onmessage = (event) => {
        let frame: {
          type?: string;
          reason?: string;
          retry_after?: number;
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
          peer_id?: string;
          peer_username?: string;
          user_id?: string;
          unread_count?: number;
          peer_last_read_message_id?: string | null;
          message_id?: string;
          online?: boolean | string[];
          event_type?: string;
          actor_id?: string;
          actor_username?: string;
          read_at?: string | null;
          match_time?: string | null;
        };
        try {
          frame = JSON.parse(event.data) as typeof frame;
        } catch {
          return;
        }

        if (
          frame.type === "error" &&
          frame.reason === "timed_out" &&
          typeof frame.retry_after === "number" &&
          Number.isFinite(frame.retry_after) &&
          frame.retry_after >= 0
        ) {
          timeoutDeadlineRef.current =
            performance.now() + frame.retry_after * 1000;
          setTimeoutRemaining(Math.ceil(frame.retry_after));
          return;
        }

        if (
          frame.type === "message.new" &&
          frame.id &&
          frame.conversation_id &&
          frame.sender_id &&
          frame.body &&
          frame.created_at
        ) {
          const message = frame as RealtimeMessage;
          if (receivedMessageIdsRef.current.has(message.id)) return;
          receivedMessageIdsRef.current.add(message.id);
          setMessages((current) => {
            const existing = current[message.conversation_id] ?? [];
            if (existing.some((item) => item.id === message.id)) return current;
            return {
              ...current,
              [message.conversation_id]: sortMessages([...existing, message]),
            };
          });
          if (
            connectedUser?.id &&
            String(message.sender_id) !== String(connectedUser.id)
          ) {
            setConversations((current) =>
              current.map((conversation) =>
                conversation.id === message.conversation_id
                  ? {
                      ...conversation,
                      unread_count: conversation.unread_count + 1,
                    }
                  : conversation,
              ),
            );
          }
        } else if (
          frame.type === "read" &&
          frame.conversation_id &&
          frame.message_id
        ) {
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === frame.conversation_id
                ? {
                    ...conversation,
                    peer_last_read_message_id: frame.message_id!,
                  }
                : conversation,
            ),
          );
        } else if (
          frame.type === "conversation.new" &&
          frame.id &&
          frame.peer_id &&
          frame.peer_username
        ) {
          setConversations((current) =>
            current.some((item) => item.id === frame.id)
              ? current
              : [
                  {
                    id: frame.id!,
                    peer_id: frame.peer_id!,
                    peer_username: frame.peer_username!,
                    unread_count: 0,
                    peer_last_read_message_id: null,
                  },
                  ...current,
                ],
          );
        } else if (
          frame.type === "notification" &&
          frame.id &&
          frame.event_type &&
          frame.actor_username &&
          frame.created_at
        ) {
          setNotifications((current) =>
            current.some((notification) => notification.id === frame.id)
              ? current
              : [
                  {
                    id: frame.id!,
                    event_type: frame.event_type!,
                    actor_username: frame.actor_username!,
                    read_at: frame.read_at ?? null,
                    created_at: frame.created_at!,
                    match_time: frame.match_time ?? null,
                  },
                  ...current,
                ],
          );
        } else if (
          frame.type === "presence.snapshot" &&
          Array.isArray(frame.online)
        ) {
          setOnlineUserIds(frame.online);
        } else if (
          frame.type === "presence" &&
          frame.user_id &&
          typeof frame.online === "boolean"
        ) {
          setOnlineUserIds((current) =>
            frame.online
              ? [...new Set([...current, frame.user_id!])]
              : current.filter((id) => id !== frame.user_id),
          );
        }
      };
      socket.onclose = () => {
        socketRef.current = null;
        setConnected(false);
        timeoutDeadlineRef.current = 0;
        setTimeoutRemaining(0);
        if (!disposed) {
          const delay = Math.min(1000 * 2 ** attemptRef.current, 10000);
          attemptRef.current += 1;
          reconnectRef.current = setTimeout(connect, delay);
        }
      };
      socket.onerror = () => socket.close();
    };

    const loadTimer = setTimeout(() => {
      void loadConversations();
    }, 0);
    connect();
    const notificationsTimer = setTimeout(() => {
      void api
        .get<{ items: ChatNotification[] }>("/realtime/notifications")
        .then((response) => setNotifications(response.data.items));
    }, 0);
    const heartbeatTimer = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30_000);

    return () => {
      disposed = true;
      clearTimeout(loadTimer);
      clearTimeout(notificationsTimer);
      clearInterval(heartbeatTimer);
      clearInterval(timeoutTimer);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [connectedUser?.id, isLoading, loadConversations]);

  const sendMessage = useCallback((conversationId: string, body: string) => {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(
      JSON.stringify({
        type: "message.send",
        conversation_id: conversationId,
        body: body.trim(),
      }),
    );
    return true;
  }, []);

  const markRead = useCallback((conversationId: string, messageId: string) => {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(
      JSON.stringify({
        type: "read",
        conversation_id: conversationId,
        message_id: messageId,
      }),
    );
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread_count: 0 }
          : conversation,
      ),
    );
    return true;
  }, []);

  const unreadMessages = conversations.reduce(
    (total, conversation) => total + conversation.unread_count,
    0,
  );

  const value = useMemo(
    () => ({
      conversations,
      unreadMessages,
      messages,
      onlineUserIds,
      connected,
      timeoutRemaining,
      notifications,
      sendMessage,
      markRead,
      setNotifications,
      loadConversations,
      setMessages,
    }),
    [
      conversations,
      unreadMessages,
      messages,
      onlineUserIds,
      connected,
      timeoutRemaining,
      notifications,
      sendMessage,
      markRead,
      setNotifications,
      loadConversations,
      setMessages,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
}
