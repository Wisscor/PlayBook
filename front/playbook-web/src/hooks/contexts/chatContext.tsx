"use client";

import { api } from "@/services/api";
import { RealtimeMessage } from "@/types/api";
import { useAuth } from "./authContext";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface ChatConversation {
  id: string;
  peer_id: string;
  peer_username: string;
  unread_count: number;
  peer_last_read_message_id: string | null;
}

type ChatContextValue = {
  conversations: ChatConversation[];
  unreadMessages: number;
  messages: Record<string, RealtimeMessage[]>;
  onlineUserIds: string[];
  connected: boolean;
  createConversation: (peerId: string) => Promise<string>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, body: string) => boolean;
  markRead: (conversationId: string, messageId: string) => boolean;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

function getWebSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return `${apiUrl.replace(/^http/, "ws")}/ws`;
}

function sortMessages(messages: RealtimeMessage[]) {
  return [...messages].sort((a, b) => {
    const timeDifference =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return timeDifference || a.id.localeCompare(b.id);
  });
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
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const receivedMessageIdsRef = useRef(new Set<string>());

  const loadConversations = useCallback(async () => {
    const response = await api.get<ChatConversation[]>("/realtime/conversations");
    setConversations(response.data);
  }, []);

  const createConversation = useCallback(
    async (peerId: string) => {
      const response = await api.post<{ id: string }>(
        "/realtime/conversations",
        { peer_id: peerId },
      );
      await loadConversations();
      return response.data.id;
    },
    [loadConversations],
  );

  const loadMessages = useCallback(async (conversationId: string) => {
    const response = await api.get<{
      items: RealtimeMessage[];
      next_cursor: string | null;
    }>(`/realtime/conversations/${conversationId}/messages`);
    setMessages((current) => ({
      ...current,
      [conversationId]: sortMessages([
        ...(current[conversationId] ?? []),
        ...response.data.items,
      ].filter(
        (message, index, all) =>
          all.findIndex((item) => item.id === message.id) === index,
      )),
    }));
  }, []);

  useEffect(() => {
    if (isLoading || !connectedUser?.id) return;

    let disposed = false;
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
        };
        try {
          frame = JSON.parse(event.data) as typeof frame;
        } catch {
          console.error("Received invalid chat WebSocket frame");
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
        if (!disposed) {
          const delay = Math.min(1000 * 2 ** attemptRef.current, 10000);
          attemptRef.current += 1;
          reconnectRef.current = setTimeout(connect, delay);
        }
      };
      socket.onerror = () => socket.close();
    };

    const loadTimer = setTimeout(() => {
      void loadConversations().catch((error) => {
        console.error("Unable to load conversations:", error);
      });
    }, 0);
    connect();
    const heartbeatTimer = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30_000);

    return () => {
      disposed = true;
      clearTimeout(loadTimer);
      clearInterval(heartbeatTimer);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [connectedUser?.id, isLoading, loadConversations]);

  const sendMessage = useCallback((conversationId: string, body: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
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
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
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
      createConversation,
      loadMessages,
      sendMessage,
      markRead,
    }),
    [
      conversations,
      unreadMessages,
      messages,
      onlineUserIds,
      connected,
      createConversation,
      loadMessages,
      sendMessage,
      markRead,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
}
