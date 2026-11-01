"use client";

import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { useProfileController } from "@/services/profile";
import { useUserController } from "@/services/user";
import Image from "next/image";
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
      <>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 120}ms` }}
            className="flex animate-pulse items-center gap-4 rounded-2xl border border-white/10 bg-secondary/20 p-4"
          >
            <div className="h-14 w-14 shrink-0 rounded-full bg-secondary/50" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-1/2 rounded-full bg-secondary/50" />
              <div className="h-3 w-1/3 rounded-full bg-secondary/30" />
            </div>
          </div>
        ))}
        <PlayText.Primary
          id="loading"
          className="col-span-full py-2 text-center text-sm text-stone-400"
        />
      </>
    );
  } else if (error) {
    usersContent = (
      <div className="col-span-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-8 text-center">
        <PlayText.Primary
          id={error}
          className="text-center text-sm font-medium text-rose-300"
        />
      </div>
    );
  } else if (users.length === 0) {
    usersContent = (
      <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-secondary/20 p-12 text-center backdrop-blur-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-primary/40 to-extra/40">
          <Image
            alt="no users"
            src={"/icons/search.png"}
            width={32}
            height={32}
            className="opacity-70"
          />
        </div>
        <PlayText.Primary
          id="no-users-found"
          className="text-sm font-medium text-amber-300"
        />
      </div>
    );
  } else {
    usersContent = users.map((user, index) => {
      return (
        <div
          key={user.id}
          style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
          className="sp-anim animate-[sp-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]"
        >
          <UserCard user={user} connectedUser={connectedUser} />
        </div>
      );
    });
  }

  return (
    <div className="relative flex min-h-[calc(100vh-140px)] flex-col gap-10 px-4 py-8 text-stone-100 md:px-12 lg:px-20">
      <style>{`
        @keyframes sp-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp-hero-in {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp-sheen {
          from { background-position: 0% 50%; }
          to   { background-position: 200% 50%; }
        }
        @keyframes sp-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.12); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sp-anim { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-10">
        <div className="relative flex flex-col items-center gap-4 pt-4 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 left-1/2 h-48 w-full max-w-lg -translate-x-1/2 rounded-full bg-linear-to-r from-primary/30 via-extra/25 to-secondary/30 blur-3xl sp-anim animate-[sp-glow_8s_ease-in-out_infinite]"
          />

          <div className="sp-anim relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-xl shadow-primary/30 animate-[sp-hero-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]">
            <Image
              alt="search"
              src={"/icons/search.png"}
              width={30}
              height={30}
            />
          </div>

          <PlayText.Primary
            id="search-title"
            className="sp-anim relative bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-size-[200%_100%] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent animate-[sp-hero-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.08s_backwards,sp-sheen_6s_linear_infinite] sm:text-5xl"
          />

          <PlayText.Primary
            id="search-description"
            className="sp-anim relative max-w-xl text-sm leading-relaxed text-stone-400 animate-[sp-hero-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.16s_backwards] sm:text-base"
          />

          <div className="sp-anim group relative mt-3 w-full max-w-xl animate-[sp-hero-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.24s_backwards]">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-3xl bg-linear-to-r from-primary/40 via-extra/30 to-primary/40 opacity-0 blur-lg transition-opacity duration-500 group-focus-within:opacity-100"
            />
            <Image
              alt=""
              aria-hidden
              src={"/icons/search.png"}
              width={20}
              height={20}
              className="pointer-events-none absolute inset-s-5 top-1/2 z-10 -translate-y-1/2 opacity-60 transition-opacity duration-300 group-focus-within:opacity-100"
            />
            <PlayInput.Primary
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search-name-username"
              className="relative w-full rounded-2xl py-4 ps-14 text-sm shadow-lg"
            />
          </div>

          {totalUsers > 0 && !isLoading && !error && (
            <PlayText.Primary
              content={totalUsers.toString()}
              className="sp-anim relative rounded-full border border-primary/40 bg-primary/15 px-3 py-0.5 text-xs font-semibold tabular-nums text-amber-200 animate-[sp-in_0.5s_ease-out_backwards]"
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {usersContent}
        </div>

        {totalUsers > 0 && (
          <div className="flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-secondary/30 p-1.5 backdrop-blur-md">
            {userPageNumber > 1 && (
              <button
                onClick={() => {
                  void loadUsers(userPageNumber - 1, () => {
                    setError("error-loading-users");
                  });
                }}
                className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 active:scale-95"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:translate-x-0.5"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <PlayText.Primary
                  id="previous"
                  className="text-sm text-stone-300 transition-colors group-hover:text-white"
                />
              </button>
            )}
            <PlayText.Primary
              content={
                userPages > 0
                  ? `${userPageNumber}/${userPages}`
                  : userPageNumber.toString()
              }
              className="rounded-full bg-linear-to-r from-primary to-extra px-4 py-1.5 text-sm font-bold tabular-nums text-white shadow-md shadow-primary/30"
            />
            {userPageNumber < userPages && (
              <button
                onClick={() => {
                  void loadUsers(userPageNumber + 1, () => {
                    setError("error-loading-users");
                  });
                }}
                className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 active:scale-95"
              >
                <PlayText.Primary
                  id="next"
                  className="text-sm text-stone-300 transition-colors group-hover:text-white"
                />
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
