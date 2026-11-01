"use client";

import { PlayButton } from "@/components/ui/Button";
import { useAuth } from "@/hooks/contexts/authContext";
import { useChat } from "@/hooks/contexts/chatContext";
import { useRealtimeController } from "@/services/realtime";
import { useUserController } from "@/services/user";
import { Contact, Message } from "@/types/api";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { ContactsList } from "./components/contactsList";
import { Conversation } from "./components/conversation";

const MessagesPage = () => {
  const { connectedUser } = useAuth();
  const { loadPeerAvatars, peerAvatars } = useUserController();
  const {
    conversations,
    messages,
    onlineUserIds,
    sendMessage,
    markRead,
    connected,
  } = useChat();
  const { loadMessages } = useRealtimeController();
  const [selectedContactId, setSelectedContactId] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  useEffect(() => {
    let isMounted = true;

    if (conversations.length > 0) {
      void loadPeerAvatars(conversations, isMounted);
    }

    return () => {
      isMounted = false;
    };
  }, [conversations]);

  const contacts = useMemo<Contact[]>(
    () =>
      conversations.map((conversation) => ({
        id: conversation.id,
        profileId: conversation.peer_id,
        conversationId: conversation.id,
        name: conversation.peer_username,
        username: conversation.peer_username,
        avatar: conversation.peer_username.slice(0, 2).toUpperCase(),
        avatarUrl: peerAvatars[conversation.peer_id],
        lastMessage: messages[conversation.id]?.at(-1)?.body ?? "",
        online: onlineUserIds.includes(conversation.peer_id),
        messages: (() => {
          const conversationMessages = messages[conversation.id] ?? [];
          const lastReadIndex = conversationMessages.findIndex(
            (message) => message.id === conversation.peer_last_read_message_id,
          );
          return conversationMessages.map<Message>((message, index) => ({
            id: message.id,
            sender: message.sender_id === connectedUser?.id ? "me" : "them",
            text: message.body,
            time: new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            seen:
              message.sender_id === connectedUser?.id && lastReadIndex >= index,
          }));
        })(),
      })),
    [connectedUser?.id, conversations, messages, onlineUserIds, peerAvatars],
  );

  const selectedConversationId = selectedContactId;

  useEffect(() => {
    const conversationId = selectedConversationId;
    if (!conversationId || messages[conversationId]) return;
    void loadMessages(conversationId);
  }, [loadMessages, messages, selectedConversationId]);

  useEffect(() => {
    const conversationId = selectedConversationId;
    const conversationMessages = conversationId
      ? messages[conversationId]
      : undefined;
    const lastMessage = conversationMessages?.at(-1);
    if (
      !conversationId ||
      !lastMessage ||
      !connected ||
      lastMessage.sender_id === connectedUser?.id
    ) {
      return;
    }
    markRead(conversationId, lastMessage.id);
  }, [
    connectedUser?.id,
    connected,
    markRead,
    messages,
    selectedConversationId,
  ]);

  const activeContact = contacts.find(
    (contact) => contact.id === selectedConversationId,
  );

  useEffect(() => {
    if (activeContact) {
      setSelectedContactId(activeContact.id);
    }
  }, [activeContact]);

  const searchParams = useSearchParams();

  const params = searchParams.get("conversation");

  useEffect(() => {
    if (params) {
      setSelectedContactId(params);
    }
  }, [params]);

  const handleSendMessage = (event: React.SubmitEvent) => {
    event.preventDefault();
    if (!selectedConversationId || !messageInput.trim()) return;
    if (sendMessage(selectedConversationId, messageInput)) setMessageInput("");
  };

  const handleSelectContact = (id: string) => {
    setSelectedContactId(id);
    setMobileView("chat");
    const lastMessage = messages[id]?.at(-1);
    if (lastMessage) markRead(id, lastMessage.id);
  };

  return (
    <div className="relative flex min-h-[calc(100vh-140px)] flex-col px-1 py-2 text-stone-100 sm:px-4 sm:py-4 md:px-8 lg:px-12">
      <style>{`
        @keyframes mp-in {
          from { opacity: 0; transform: translateY(12px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes mp-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mp-anim { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto grid h-[calc(100dvh-16rem)] min-h-0 w-full max-w-7xl grid-cols-1 gap-4 md:h-[calc(100vh-200px)] md:grid-cols-[20rem_1fr] md:gap-6 lg:grid-cols-[22rem_1fr]">
        <div
          className={`mp-anim h-full min-h-0 overflow-hidden rounded-3xl border border-primary/25 bg-secondary/20 shadow-2xl shadow-black/40 backdrop-blur-xl animate-[mp-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards] ${
            mobileView === "chat" ? "hidden md:flex" : "flex"
          } flex-col`}
        >
          <ContactsList
            contacts={contacts}
            selectedContactId={selectedConversationId}
            setSelectedContactId={handleSelectContact}
          />
        </div>

        <div
          className={`mp-anim relative h-full min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-secondary/10 shadow-2xl shadow-black/40 backdrop-blur-xl animate-[mp-in_0.6s_cubic-bezier(0.22,1,0.36,1)_0.1s_backwards] ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          } flex-col`}
        >
          <div className="flex items-center border-b border-white/10 bg-neutral-950/30 px-3 py-2.5 md:hidden">
            <PlayButton.Secondary
              textClassName="text-xs font-semibold text-stone-200"
              title="back-contacts"
              type="button"
              onClick={() => setMobileView("list")}
              className="rounded-xl px-3 py-1.5 text-xs"
            />
          </div>

          {activeContact ? (
            <div
              key={activeContact.id}
              className="mp-anim flex min-h-0 flex-1 flex-col animate-[mp-in_0.4s_cubic-bezier(0.22,1,0.36,1)_backwards]"
            >
              <Conversation
                setMessageInput={setMessageInput}
                activeContact={activeContact}
                handleSendMessage={handleSendMessage}
                messageInput={messageInput}
              />
            </div>
          ) : (
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute h-64 w-64 rounded-full bg-linear-to-br from-primary/30 to-extra/20 blur-3xl"
              />
              <div className="mp-anim relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-2xl shadow-primary/30 animate-[mp-float_5s_ease-in-out_infinite]">
                <Image
                  alt="messages"
                  src={"/icons/chat.png"}
                  width={44}
                  height={44}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
