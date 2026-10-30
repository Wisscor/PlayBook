"use client";

import { PlayButton } from "@/components/ui/Button";
import { useAuth } from "@/hooks/contexts/authContext";
import { useChat } from "@/hooks/contexts/chatContext";
import { Contact, Message } from "@/types/api";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { ContactsList } from "./components/contactsList";
import { Conversation } from "./components/conversation";

export const MessagesPage = () => {
  const { connectedUser } = useAuth();
  const {
    conversations,
    messages,
    onlineUserIds,
    loadMessages,
    sendMessage,
    markRead,
    connected,
  } = useChat();
  const searchParams = useSearchParams();
  const [selectedContactId, setSelectedContactId] = useState(
    searchParams.get("conversation") ?? "",
  );
  const [messageInput, setMessageInput] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const contacts = useMemo<Contact[]>(
    () =>
      conversations.map((conversation) => ({
        id: conversation.id,
        profileId: conversation.peer_id,
        conversationId: conversation.id,
        name: conversation.peer_username,
        username: conversation.peer_username,
        avatar: conversation.peer_username.slice(0, 2).toUpperCase(),
        lastMessage:
          messages[conversation.id]?.at(-1)?.body ?? "",
        online: onlineUserIds.includes(conversation.peer_id),
        messages: (() => {
          const conversationMessages = messages[conversation.id] ?? [];
          const lastReadIndex = conversationMessages.findIndex(
            (message) =>
              message.id === conversation.peer_last_read_message_id,
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
              message.sender_id === connectedUser?.id &&
              lastReadIndex >= index,
          }));
        })(),
      })),
    [connectedUser?.id, conversations, messages, onlineUserIds],
  );

  const requestedConversationId = searchParams.get("conversation");
  const selectedConversationId =
    requestedConversationId &&
    conversations.some((item) => item.id === requestedConversationId)
      ? requestedConversationId
      : selectedContactId;
  const firstConversationId = contacts[0]?.id;

  useEffect(() => {
    const conversationId = selectedConversationId || firstConversationId;
    if (!conversationId || messages[conversationId]) return;
    void loadMessages(conversationId).catch((error) => {
      console.error("Unable to load conversation messages:", error);
    });
  }, [firstConversationId, loadMessages, messages, selectedConversationId]);

  useEffect(() => {
    const conversationId = selectedConversationId || firstConversationId;
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
    firstConversationId,
    markRead,
    messages,
    selectedConversationId,
  ]);

  const activeContact =
    contacts.find((contact) => contact.id === selectedConversationId) ??
    contacts[0];

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
        <div className={`col-span-1 h-full min-h-0 ${mobileView === "chat" ? "hidden md:flex" : "flex"} flex-col`}>
          <ContactsList
            contacts={contacts}
            selectedContactId={selectedConversationId}
            setSelectedContactId={handleSelectContact}
          />
        </div>
        <div className={`col-span-1 md:col-span-2 h-full min-h-0 ${mobileView === "list" ? "hidden md:flex" : "flex"} flex-col relative`}>
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
