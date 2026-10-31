"use client";

import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { useProfileController } from "@/services/profile";
import { useUserController } from "@/services/user";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { UserCard } from "./components/userCard";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const { loadUsers, userPages, userPageNumber, users, totalUsers } =
    useUserController();
  const { fetchUser } = useProfileController();
  const { isLoading, connectedUser } = useAuth();

  useEffect(() => {
    void fetchUser();
  }, []);

  useEffect(() => {
    void loadUsers(userPageNumber, (error) => {
      setError(error);
    });
  }, [connectedUser?.id]);

  useEffect(() => {
    void loadUsers(
      userPageNumber,
      () => {
        setError("error-loading-users");
      },
      searchQuery,
    );
  }, [searchQuery]);

  let usersContent: ReactNode;
  if (isLoading) {
    usersContent = (
      <PlayText.Primary
        id="loading"
        className="col-span-full py-12 text-center text-slate-300"
      />
    );
  } else if (error) {
    usersContent = (
      <PlayText.Primary
        id={error}
        className="col-span-full py-12 text-center text-rose-400"
      />
    );
  } else if (users.length === 0) {
    usersContent = (
      <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
        <PlayText.Primary
          id="no-users-found"
          className="text-sm font-medium text-amber-400"
        />
      </div>
    );
  } else {
    usersContent = users.map((user) => {
      return (
        <UserCard key={user.id} user={user} connectedUser={connectedUser} />
      );
    });
  }

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
          {usersContent}
        </div>

        {totalUsers > 0 && (
          <div className="flex items-center justify-center my-6 space-x-4">
            {userPageNumber > 1 && (
              <button
                onClick={() => {
                  void loadUsers(userPageNumber - 1, () => {
                    setError("error-loading-users");
                  });
                }}
                className="cursor-pointer"
              >
                <PlayText.Primary
                  id="previous"
                  className="text-sm text-slate-400 hover:text-slate-200 transition-color"
                />
              </button>
            )}
            <PlayText.Primary
              content={
                userPages > 0
                  ? `${userPageNumber}/${userPages}`
                  : userPageNumber.toString()
              }
              className="text-sm text-slate-400 font-bold transition-color"
            />
            {userPageNumber < userPages && (
              <button
                onClick={() => {
                  void loadUsers(userPageNumber + 1, () => {
                    setError("error-loading-users");
                  });
                }}
                className="cursor-pointer"
              >
                <PlayText.Primary
                  id="next"
                  className="text-sm text-slate-400 hover:text-slate-200 transition-color"
                />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
