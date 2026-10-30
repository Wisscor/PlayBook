import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { Contact } from "@/types/api";
import React, { useState } from "react";
import { useNavigation } from "@/hooks/useNavigation";

export const ContactsList: React.FC<{
  contacts: Contact[];
  selectedContactId: string;
  setSelectedContactId: (id: string) => void;
}> = ({ contacts, selectedContactId, setSelectedContactId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { goUserProfile } = useNavigation();

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full min-h-0 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
        <PlayText.Primary
          id="messages"
          className="text-lg font-bold text-white tracking-tight"
        />

        <PlayInput.Primary
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search-contacts"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-white/30 focus:outline-none backdrop-blur-md"
        />
      </div>
      <div className="min-h-0 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {filteredContacts.length === 0 ? (
          <PlayText.Primary
            id="no-contacts"
            className="text-xs text-slate-400 text-center py-8"
          />
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = contact.id === selectedContactId;
            return (
              <div
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedContactId(contact.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left w-full ${
                  isSelected
                    ? "border-white/20 bg-white/10 shadow-lg"
                    : "border-white/5 bg-white/5 hover:bg-white/10 text-slate-300"
                }`}
              >
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      goUserProfile(contact.profileId);
                    }}
                    aria-label={`View ${contact.name}'s profile`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 font-bold text-sm text-white shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    {contact.avatarUrl ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${contact.avatarUrl}`}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      contact.avatar
                    )}
                  </button>
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goUserProfile(contact.profileId);
                      }}
                      className="text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
                    >
                      <PlayText.Primary
                        content={contact.name}
                        className="font-bold text-sm text-white truncate"
                      />
                    </button>
                  </div>
                  <PlayText.Primary
                    content={contact.lastMessage}
                    className="text-xs text-slate-400 truncate mt-0.5"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ContactsList;
