import { useChat } from "@/hooks/contexts/chatContext";
import { useCallback } from "react";
import { api } from "./api";
import { ApiError, RealtimeMessage } from "@/types/api";
import { sortMessages } from "@/lib/utils";

export const useRealtimeController = () => {
  const { notifications, setNotifications, loadConversations, setMessages } =
    useChat();

  const markAllNotificationsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.read_at)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) =>
        unreadIds.includes(notification.id)
          ? { ...notification, read_at: readAt }
          : notification,
      ),
    );

    await api
      .post("/realtime/notifications/read", {
        notification_ids: unreadIds,
      })
      .catch(() => {
        setNotifications((current) =>
          current.map((notification) =>
            unreadIds.includes(notification.id)
              ? { ...notification, read_at: null }
              : notification,
          ),
        );
      });
  }, [notifications]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) => {
        if (notification.id !== notificationId || notification.read_at) {
          return notification;
        }
        return { ...notification, read_at: new Date().toISOString() };
      }),
    );

    await api
      .post("/realtime/notifications/read", {
        notification_ids: [notificationId],
      })
      .catch(() => {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read_at: null }
              : notification,
          ),
        );
      });
  }, []);

  const createConversation = useCallback(
    async (
      peerId: string,
      onSuccess: (conversationId: string) => void,
      onError: (error: ApiError) => void,
    ) => {
      await api
        .post<{ id: string }>("/realtime/conversations", {
          peer_id: peerId,
        })
        .then(async (res) => {
          if (res.status == 200) {
            await loadConversations();
            onSuccess(res.data.id);
          }
        })
        .catch((error: ApiError) => {
          onError(error);
        });
    },
    [],
  );

  const loadMessages = useCallback(async (conversationId: string) => {
    await api
      .get<{
        items: RealtimeMessage[];
        next_cursor: string | null;
      }>(`/realtime/conversations/${conversationId}/messages`)
      .then((res) => {
        if (res.status == 200) {
          setMessages((current) => ({
            ...current,
            [conversationId]: sortMessages(
              [...(current[conversationId] ?? []), ...res.data.items].filter(
                (message, index, all) =>
                  all.findIndex((item) => item.id === message.id) === index,
              ),
            ),
          }));
        }
      });
  }, []);

  return {
    markAllNotificationsRead,
    markNotificationRead,
    createConversation,
    loadMessages,
  };
};
