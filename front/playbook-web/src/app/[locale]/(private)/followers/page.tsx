"use client";

import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { useFollowerController } from "@/services/follower";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React from "react";
import { FollowCard } from "./components/followCard";

const FollowersPage = () => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { connectedUser, isLoading } = useAuth();
  const {
    loadUsers,
    followPageNumber,
    followers,
    totalFollowers,
    followPages,
  } = useFollowerController();
  const [savedUserId] = React.useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : localStorage.getItem("userid_of_requested_user_for_followers"),
  );
  const userId = savedUserId ?? connectedUser?.id;
  const [error, setError] = React.useState("");
  const isFollowingView = searchParams.get("view") === "following";

  React.useEffect(() => {
    if (!userId) {
      return;
    }

    void loadUsers(isFollowingView, userId, followPageNumber, (err) => {
      setError(err);
    });
  }, [isFollowingView, userId]);

  const refreshCurrentPage = () => {
    if (!userId) return;
    const page =
      followers.length === 1 && followPageNumber > 1
        ? followPageNumber - 1
        : followPageNumber;
    void loadUsers(isFollowingView, userId, page, (err) => setError(err));
  };

  let followersContent: React.ReactNode;
  if (isLoading && totalFollowers === 0) {
    followersContent = (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 150}ms` }}
            className="flex animate-pulse items-center gap-4 rounded-2xl border border-white/10 bg-secondary/20 p-4"
          >
            <div className="h-12 w-12 shrink-0 rounded-full bg-secondary/50" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-1/3 rounded-full bg-secondary/50" />
              <div className="h-3 w-1/2 rounded-full bg-secondary/30" />
            </div>
          </div>
        ))}
        <PlayText.Primary
          id="loading"
          className="py-2 text-center text-sm text-stone-400"
        />
      </div>
    );
  } else if ((error || totalFollowers === 0) && !isLoading) {
    followersContent = (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-secondary/20 p-12 text-center backdrop-blur-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-primary/40 to-extra/40">
          <Image
            alt="followers"
            src={"/icons/add-friend.png"}
            width={32}
            height={32}
            className="opacity-70"
          />
        </div>
        <PlayText.Primary
          id={error || "no-followers"}
          className="text-sm font-medium text-stone-400"
        />
      </div>
    );
  } else {
    followersContent = (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3">
          {followers.map((follower, index) => (
            <div
              key={follower.id}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              className="fp-anim animate-[fp-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <FollowCard follower={follower} onChanged={refreshCurrentPage} />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-secondary/30 p-1.5 backdrop-blur-md">
          {followPageNumber > 1 && (
            <button
              onClick={() => {
                if (!userId) {
                  return;
                }
                void loadUsers(
                  isFollowingView,
                  userId,
                  followPageNumber - 1,
                  (err) => {
                    setError(err);
                  },
                );
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
              followPages > 0
                ? `${followPageNumber}/${followPages}`
                : followPageNumber.toString()
            }
            className="rounded-full bg-linear-to-r from-primary to-extra px-4 py-1.5 text-sm font-bold tabular-nums text-white shadow-md shadow-primary/30"
          />
          {followPageNumber < followPages && (
            <button
              onClick={() => {
                if (!userId) {
                  return;
                }
                void loadUsers(
                  isFollowingView,
                  userId,
                  followPageNumber + 1,
                  (err) => {
                    setError(err);
                  },
                );
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
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col gap-8 px-4 py-8 text-stone-100 md:px-12 lg:px-20">
      <style>{`
        @keyframes fp-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-anim { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="fp-anim relative flex items-center gap-4 overflow-hidden rounded-3xl border border-primary/25 bg-secondary/20 p-5 shadow-xl shadow-black/30 backdrop-blur-xl animate-[fp-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards] sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-e-12 -top-12 h-36 w-36 rounded-full bg-primary/25 blur-3xl"
          />

          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/30">
            <Image
              alt="followers"
              src={"/icons/add-friend.png"}
              width={28}
              height={28}
            />
          </div>

          <div className="relative flex min-w-0 flex-1 flex-col gap-1">
            <PlayText.Primary
              id={isFollowingView ? "following" : "followers"}
              className="bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent"
            />

            <PlayText.Primary
              content={`${totalFollowers} ${
                isFollowingView ? t("following") : t("people-following-user")
              }`}
              className="text-xs text-stone-400"
            />
          </div>

          <PlayText.Primary
            content={totalFollowers.toString()}
            className="relative hidden rounded-2xl border border-primary/40 bg-primary/15 px-4 py-2 text-2xl font-extrabold tabular-nums text-amber-200 sm:block"
          />
        </div>

        <div className="flex flex-col gap-3">{followersContent}</div>
      </div>
    </div>
  );
};

export default FollowersPage;
