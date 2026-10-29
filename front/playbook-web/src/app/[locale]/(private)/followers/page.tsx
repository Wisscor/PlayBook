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
  const { loadUsers, followPageNumber, followers } = useFollowerController();
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
  if (isLoading) {
    followersContent = (
      <PlayText.Primary
        content="Loading..."
        className="text-sm text-slate-400 text-center py-8"
      />
    );
  } else if (error || followers.length === 0) {
    followersContent = (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
        <PlayText.Primary
          content={error || "no-followers"}
          className="text-sm font-medium text-slate-400"
        />
      </div>
    );
  } else {
    followersContent = followers.map((follower) => (
      <FollowCard key={follower.id} follower={follower} />
    ));
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
            content={`${followers.length} ${
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
