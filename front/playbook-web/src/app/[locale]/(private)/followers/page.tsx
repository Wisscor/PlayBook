"use client";

import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { useFollowerController } from "@/services/follower";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import React from "react";
import { FollowCard } from "./components/followCard";

export const FollowersPage = () => {
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

  let followersContent: React.ReactNode;
  if (isLoading && totalFollowers === 0) {
    followersContent = (
      <PlayText.Primary
        id="loading"
        className="text-sm text-slate-400 text-center py-8"
      />
    );
  } else if ((error || totalFollowers === 0) && !isLoading) {
    followersContent = (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
        <PlayText.Primary
          id={error || "no-followers"}
          className="text-sm font-medium text-slate-400"
        />
      </div>
    );
  } else {
    followersContent = (
      <div>
        <div className="flex items-center justify-center my-6 space-x-4">
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
              followPages > 0
                ? `${followPageNumber}/${followPages}`
                : followPageNumber.toString()
            }
            className="text-sm text-slate-400 font-bold transition-color"
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
              className="cursor-pointer"
            >
              <PlayText.Primary
                id="next"
                className="text-sm text-slate-400 hover:text-slate-200 transition-color"
              />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {followers.map((follower) => (
            <FollowCard key={follower.id} follower={follower} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 text-white px-4 py-8 md:px-12 lg:px-20 gap-8">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-4">
          <PlayText.Primary
            id={isFollowingView ? "following" : "followers"}
            className="text-2xl font-extrabold tracking-tight text-white"
          />

          <PlayText.Primary
            content={`${totalFollowers} ${
              isFollowingView ? t("following") : t("people-following-user")
            }`}
            className="text-xs text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-3">{followersContent}</div>
      </div>
    </div>
  );
};

export default FollowersPage;
