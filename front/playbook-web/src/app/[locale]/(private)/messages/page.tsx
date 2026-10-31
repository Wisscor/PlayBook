"use client";

import { PlayButton } from "@/components/ui/Button";
import { useAuth } from "@/hooks/contexts/authContext";
import { useChat } from "@/hooks/contexts/chatContext";
import { useRealtimeController } from "@/services/realtime";
import { useUserController } from "@/services/user";
import { Contact, Message } from "@/types/api";
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
    if (!conversationId) return;
    void loadMessages(conversationId).catch((error) => {
      console.error("Unable to load conversation history:", error);
    });
  }, [loadMessages, selectedConversationId]);

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
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 text-white px-2 sm:px-4 py-4 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto w-full min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-170px)] md:h-[calc(100vh-200px)]">
        <div
          className={`col-span-1 h-full min-h-0 ${mobileView === "chat" ? "hidden md:flex" : "flex"} flex-col`}
        >
          <ContactsList
            contacts={contacts}
            selectedContactId={selectedConversationId}
            setSelectedContactId={handleSelectContact}
          />
        </div>
        <div
          className={`col-span-1 md:col-span-2 h-full min-h-0 ${mobileView === "list" ? "hidden md:flex" : "flex"} flex-col relative`}
        >
          <div className="md:hidden flex items-center pb-3">
            <PlayButton.Primary
              textClassName="text-xs font-semibold text-slate-300"
              title="back-contacts"
              type="button"
              onClick={() => setMobileView("list")}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition-all cursor-pointer"
            />
          </div>
          {activeContact ? (
            <Conversation
              setMessageInput={setMessageInput}
              activeContact={activeContact}
              handleSendMessage={handleSendMessage}
              messageInput={messageInput}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
