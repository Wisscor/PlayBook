import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { Contact } from "@/types/api";
import Image from "next/image";
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
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-6 w-1 rounded-full bg-linear-to-b from-primary to-extra"
          />
          <PlayText.Primary
            id="messages"
            className="text-lg font-bold tracking-tight text-stone-100"
          />
          {contacts.length > 0 && (
            <PlayText.Primary
              content={contacts.length.toString()}
              className="rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-amber-200"
            />
          )}
        </div>

        <div className="group relative">
          <Image
            alt=""
            aria-hidden
            src={"/icons/search.png"}
            width={16}
            height={16}
            className="pointer-events-none absolute inset-s-4 top-1/2 z-10 -translate-y-1/2 opacity-50 transition-opacity duration-300 group-focus-within:opacity-100"
          />
          <PlayInput.Primary
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search-contacts"
            className="w-full rounded-2xl py-2.5 ps-10 pe-4 text-sm"
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pe-1 [scrollbar-color:var(--color-primary)_transparent] scrollbar-thin">
        {filteredContacts.length === 0 ? (
          <PlayText.Primary
            id="no-contacts"
            className="py-8 text-center text-xs text-stone-400"
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
                className={`group/row relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border p-3 text-start transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98] ${
                  isSelected
                    ? "border-primary/60 bg-linear-to-r from-primary/25 to-extra/10 shadow-lg shadow-primary/15"
                    : "border-white/5 bg-white/5 text-stone-300 hover:border-primary/30 hover:bg-primary/10"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-y-2 inset-s-0 w-1 rounded-full bg-linear-to-b from-primary to-extra transition-transform duration-300 ${
                    isSelected ? "scale-y-100" : "scale-y-0"
                  }`}
                />

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      goUserProfile(contact.profileId);
                    }}
                    aria-label={`View ${contact.name}'s profile`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-extra to-primary text-sm font-bold text-white shadow-md ring-2 ring-white/10 transition-all duration-300 hover:ring-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
                  >
                    {contact.avatarUrl ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/${contact.avatarUrl}`}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      contact.avatar
                    )}
                  </button>
                  <span
                    aria-label={contact.online ? "Online" : "Offline"}
                    className={`absolute bottom-0 inset-e-0 h-3 w-3 rounded-full border-2 border-neutral-950 ${
                      contact.online ? "bg-emerald-400" : "bg-stone-500"
                    }`}
                  >
                    {contact.online && (
                      <span
                        aria-hidden
                        className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60"
                      />
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goUserProfile(contact.profileId);
                      }}
                      className="min-w-0 cursor-pointer rounded text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <PlayText.Primary
                        content={contact.name}
                        className={`truncate text-sm font-bold transition-colors duration-300 ${
                          isSelected
                            ? "text-white"
                            : "text-stone-100 group-hover/row:text-amber-100"
                        }`}
                      />
                    </button>
                  </div>
                  <PlayText.Primary
                    content={contact.lastMessage}
                    className="mt-0.5 truncate text-xs text-stone-400"
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
