"use client";

import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import React, { useState } from "react";
import { UserCard } from "./components/userCard";
import { User } from "@/types/user";

export const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      firstname: "Alex",
      lastname: "Johnson",
      username: "alexj",
      bio: "Basketball player & tournament coach",
      email: "alex@example.com",
    },
    {
      id: "2",
      firstname: "Sarah",
      lastname: "Connor",
      username: "sconnor",
      bio: "Football enthusiast and community organizer",
      email: "sarah@example.com",
    },
    {
      id: "3",
      firstname: "Michael",
      lastname: "Smith",
      username: "msmith",
      bio: "Casual tennis player looking for doubles matches",
      email: "michael@example.com",
    },
    {
      id: "4",
      firstname: "Wissam",
      lastname: "Azadou",
      username: "wazadou",
      bio: "Full-stack developer and match coordinator",
      email: "wissam@example.com",
    },
  ]);

  const filteredUsers = users.filter(
    (u) =>
      u.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 text-white px-4 py-8 md:px-12 lg:px-20 gap-8">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col gap-4 items-center text-center">
          <PlayText.Primary
            id="search-title"
            className="text-3xl font-extrabold tracking-tight text-white"
          />

          <PlayText.Primary
            id="search-description"
            className="text-sm text-slate-400"
          />

          <div className="w-full max-w-xl mt-2">
            <PlayInput.Primary
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search-name-username"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white placeholder-slate-400 focus:border-white/30 focus:outline-none backdrop-blur-xl shadow-lg transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
              <PlayText.Primary
                id="no-users-found"
                className="text-sm font-medium text-amber-400"
              />
            </div>
          ) : (
            filteredUsers.map((user) => <UserCard key={user.id} user={user} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
