"use client";

import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { api } from "@/services/api";
import { UserSummary } from "@/types/user";
import React, { useEffect, useState } from "react";
import { UserCard } from "./components/userCard";

export const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const limit = 100;
        const allUsers: UserSummary[] = [];
        let offset = 0;

        while (true) {
          const response = await api.get<UserSummary[]>("/users", {
            params: { limit, offset },
          });
          allUsers.push(...response.data);

          if (response.data.length < limit) {
            break;
          }
          offset += limit;
        }

        setUsers(allUsers);
      } catch (requestError) {
        console.error("Unable to load users:", requestError);
        setError("Unable to load users");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUsers();
  }, []);

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
          {isLoading ? (
            <p className="col-span-full py-12 text-center text-slate-300">
              Loading...
            </p>
          ) : error ? (
            <p className="col-span-full py-12 text-center text-rose-400">
              {error}
            </p>
          ) : filteredUsers.length === 0 ? (
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
