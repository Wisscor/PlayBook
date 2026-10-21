"use client";

import { Contact, Message } from "@/types/api";
import React, { useState } from "react";
import { ContactsList } from "./components/contactsList";
import { Conversation } from "./components/conversation";
import { PlayButton } from "@/components/ui/Button";

export const MessagesPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      name: "Alex Johnson",
      username: "alexj",
      avatar: "AJ",
      lastMessage: "Looking forward to the basketball match tonight!",
      online: true,
      messages: [
        {
          id: 1,
          sender: "them",
          text: "Hey Wissam, are we still playing basketball today?",
          time: "14:20",
        },
        {
          id: 2,
          sender: "me",
          text: "Hey Alex! Yes absolutely, court is booked.",
          time: "14:22",
        },
        {
          id: 3,
          sender: "them",
          text: "Looking forward to the basketball match tonight!",
          time: "14:25",
        },
      ],
    },
    {
      id: 2,
      name: "Sarah Connor",
      username: "sconnor",
      avatar: "SC",
      lastMessage: "Great match today everyone!",
      online: false,
      messages: [
        {
          id: 1,
          sender: "them",
          text: "Great match today everyone!",
          time: "11:05",
        },
      ],
    },
    {
      id: 3,
      name: "Michael Smith",
      username: "msmith",
      avatar: "MS",
      lastMessage: "Let's set up a tennis doubles session this Saturday.",
      online: true,
      messages: [
        {
          id: 1,
          sender: "them",
          text: "Let's set up a tennis doubles session this Saturday.",
          time: "Yesterday",
        },
      ],
    },
  ]);

  const [selectedContactId, setSelectedContactId] = useState<number>(
    contacts[0].id,
  );
  const [messageInput, setMessageInput] = useState("");

  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const activeContact =
    contacts.find((c) => c.id === selectedContactId) || contacts[0];

  const handleSendMessage = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: "me",
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === selectedContactId) {
          return {
            ...c,
            lastMessage: newMessage.text,
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      }),
    );

    setMessageInput("");
  };

  const handleSelectContact = (id: number) => {
    setSelectedContactId(id);
    setMobileView("chat");
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 text-white px-2 sm:px-4 py-4 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-170px)] md:h-[calc(100vh-200px)]">
        <div
          className={`col-span-1 h-full ${mobileView === "chat" ? "hidden md:flex" : "flex"} flex-col`}
        >
          <ContactsList
            contacts={contacts}
            selectedContactId={selectedContactId}
            setSelectedContactId={handleSelectContact}
          />
        </div>

        <div
          className={`col-span-1 md:col-span-2 h-full ${mobileView === "list" ? "hidden md:flex" : "flex"} flex-col relative`}
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

          <Conversation
            setMessageInput={setMessageInput}
            activeContact={activeContact}
            handleSendMessage={handleSendMessage}
            messageInput={messageInput}
          />
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
