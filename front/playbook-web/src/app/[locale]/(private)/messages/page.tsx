"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/contexts/authContext";
import { useChat } from "@/hooks/contexts/chatContext";
import { useNavigation } from "@/hooks/useNavigation";
import { api } from "@/services/api";
import { User } from "@/types/user";
import { Icon } from "../community/community-ui";
import { ContactsList } from "./components/contactsList";
import { Conversation } from "./components/conversation";
import { ChatContact } from "./chat-types";
import { useChatCopy } from "./chat-copy";
import styles from "./chat.module.css";

type PeerProfile = { avatar?: string; firstname?: string; lastname?: string };

export default function MessagesPage() {
  const { connectedUser, setConnectedUser } = useAuth();
  const {
    conversations,
    messages,
    onlineUserIds,
    loadMessages,
    sendMessage,
    markRead,
    connected,
  } = useChat();
  const { goSearch } = useNavigation();
  const { copy } = useChatCopy();
  const params = useSearchParams();
  const urlConversation = params.get("conversation") || "";
  const [selection, setSelection] = useState<{
    id: string;
    url: string;
  } | null>(null);
  const selectedId =
    selection?.url === urlConversation ? selection.id : urlConversation;
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Record<string, PeerProfile>>({});
  const [profileError, setProfileError] = useState(false);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [historyResult, setHistoryResult] = useState<{
    id: string;
    revision: number;
    error: boolean;
  } | null>(null);
  const [sendErrorId, setSendErrorId] = useState("");
  const peerKey = [
    ...new Set(conversations.map((conversation) => conversation.peer_id)),
  ]
    .sort()
    .join(",");

  useEffect(() => {
    if (connectedUser?.id) return;
    let active = true;
    void api
      .get<User>("/users/me")
      .then(({ data }) => {
        if (active) setConnectedUser(data);
      })
      .catch(() => {
        if (active) setProfileError(true);
      });
    return () => {
      active = false;
    };
  }, [connectedUser?.id, setConnectedUser]);

  useEffect(() => {
    if (!peerKey) return;
    let active = true;
    void Promise.all(
      peerKey.split(",").map(async (id) => {
        try {
          const { data } = await api.get<PeerProfile>(`/users/${id}`);
          return [id, data] as const;
        } catch {
          return [id, {}] as const;
        }
      }),
    ).then((entries) => {
      if (active) setProfiles(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, [peerKey]);

  // Queued WebSocket messages are only part of the history, so always fetch on selection.
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void loadMessages(selectedId)
      .then(() => {
        if (active)
          setHistoryResult({
            id: selectedId,
            revision: historyRevision,
            error: false,
          });
      })
      .catch(() => {
        if (active)
          setHistoryResult({
            id: selectedId,
            revision: historyRevision,
            error: true,
          });
      });
    return () => {
      active = false;
    };
  }, [selectedId, loadMessages, historyRevision]);

  const lastMarked = useRef("");
  const selectedUnread =
    conversations.find((conversation) => conversation.id === selectedId)
      ?.unread_count || 0;
  const last = messages[selectedId]?.at(-1);
  useEffect(() => {
    if (
      !selectedId ||
      !last?.id ||
      !connected ||
      last.sender_id === connectedUser?.id
    )
      return;
    if (lastMarked.current === last.id && selectedUnread === 0) return;
    if (markRead(selectedId, last.id)) lastMarked.current = last.id;
  }, [
    selectedId,
    selectedUnread,
    last?.id,
    last?.sender_id,
    connected,
    connectedUser?.id,
    markRead,
  ]);

  const contacts = useMemo<ChatContact[]>(
    () =>
      conversations.map((conversation) => {
        const profile = profiles[conversation.peer_id];
        return {
          id: conversation.id,
          peerId: conversation.peer_id,
          username: conversation.peer_username,
          name:
            [profile?.firstname, profile?.lastname].filter(Boolean).join(" ") ||
            conversation.peer_username,
          avatar: profile?.avatar,
          online: onlineUserIds.includes(conversation.peer_id),
          unread: conversation.unread_count,
          readThrough: conversation.peer_last_read_message_id,
          messages: messages[conversation.id] || [],
        };
      }),
    [conversations, profiles, onlineUserIds, messages],
  );
  const active = contacts.find((contact) => contact.id === selectedId);
  const historyLoading =
    historyResult?.id !== selectedId ||
    historyResult?.revision !== historyRevision;
  const historyError = !historyLoading && !!historyResult?.error;
  const send = () => {
    const text = (drafts[selectedId] || "").trim();
    if (!text || !selectedId) return;
    try {
      if (!connected || !sendMessage(selectedId, text)) {
        setSendErrorId(selectedId);
        return;
      }
      setDrafts((current) => ({ ...current, [selectedId]: "" }));
      setSendErrorId("");
    } catch {
      setSendErrorId(selectedId);
    }
  };

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
        <span className={styles.connectionBadge}>
          <span className={styles.connectionDot} data-connected={connected} />
          {connected ? copy.connected : copy.reconnecting}
        </span>
      </header>
      {profileError && (
        <p role="alert" className={styles.profileError}>
          {copy.profileError}
        </p>
      )}
      <div className={styles.workspace} data-open={!!active}>
        <ContactsList
          contacts={contacts}
          selectedId={selectedId}
          select={(id) => {
            setSelection({ id, url: urlConversation });
            setSendErrorId("");
          }}
          connected={connected}
          currentUserId={connectedUser?.id}
        />
        {active ? (
          <Conversation
            key={active.id}
            contact={active}
            currentUserId={connectedUser?.id}
            connected={connected}
            input={drafts[selectedId] || ""}
            setInput={(text) => {
              setDrafts((current) => ({ ...current, [selectedId]: text }));
              setSendErrorId("");
            }}
            send={send}
            back={() => setSelection({ id: "", url: urlConversation })}
            loading={historyLoading}
            historyError={historyError}
            retry={() => setHistoryRevision((value) => value + 1)}
            sendError={sendErrorId === selectedId}
          />
        ) : (
          <section className={styles.emptyWorkspace}>
            <span className={styles.emptyIcon}>
              <Icon name="chat" size={34} />
            </span>
            <h2>{copy.choose}</h2>
            <p>{copy.chooseBody}</p>
            <button
              type="button"
              className={styles.textButton}
              onClick={goSearch}
            >
              {copy.findPlayers}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
