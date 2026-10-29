"use client";

import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
import React from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/contexts/authContext";
import { UserSummary } from "@/types/user";

export const FollowersPage = () => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { connectedUser } = useAuth();
  const [savedUserId] = React.useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : localStorage.getItem("userid_of_requested_user_for_followers"),
  );
  const userId = savedUserId ?? connectedUser?.id;
  const [followers, setFollowers] = React.useState<
    (UserSummary & { isFollowing: boolean })[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(Boolean(userId));
  const [error, setError] = React.useState("");
  const isFollowingView = searchParams.get("view") === "following";

  React.useEffect(() => {
    if (!userId) {
      return;
    }

    const loadUsers = async () => {
      try {
        const path = isFollowingView ? "following" : "followers";
        const response = await api.get<{
          items: UserSummary[];
        }>(`/users/${userId}/${path}?page=1&size=100`);
        const users = await Promise.all(
          response.data.items.map(async (user) => {
            const profile = await api.get<{ is_following?: boolean }>(
              `/users/${user.id}`,
            );
            return {
              ...user,
              isFollowing: profile.data.is_following ?? false,
            };
          }),
        );
        setFollowers(users);
      } catch (requestError) {
        console.error("Unable to load follow relationships:", requestError);
        setError("Unable to load follow relationships");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUsers();
  }, [isFollowingView, userId]);

  const toggleFollow = async (id: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await api.delete(`/users/${id}/follow`);
      } else {
        await api.post(`/users/${id}/follow`);
      }
      setFollowers((current) =>
        current.map((follower) =>
          follower.id === id
            ? { ...follower, isFollowing: !isFollowing }
            : follower,
        ),
      );
    } catch (requestError) {
      console.error("Unable to update follow relationship:", requestError);
    }
  };

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

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <PlayText.Primary
              content="Loading..."
              className="text-sm text-slate-400 text-center py-8"
            />
          ) : error || followers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
              <PlayText.Primary
                content={error || "no-followers"}
                className="text-sm font-medium text-slate-400"
              />
            </div>
          ) : (
            followers.map((follower) => (
              <div
                key={follower.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl flex items-center justify-between shadow-lg hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 font-bold text-sm text-white shadow-md">
                    {follower.avatar}
                  </div>
                  <div>
                    <PlayText.Primary
                      content={`${follower.firstname} ${follower.lastname}`}
                      className="font-bold text-sm text-white"
                    />
                    <PlayText.Primary
                      content={follower.username}
                      className="text-xs text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void toggleFollow(follower.id, follower.isFollowing)
                  }
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    follower.isFollowing
                      ? "border border-white/15 bg-white/10 text-slate-300 hover:bg-white/20"
                      : "bg-white text-slate-950 hover:bg-slate-100 shadow-md"
                  }`}
                >
                  <PlayText.Primary
                    content={follower.isFollowing ? "following" : "follow-back"}
                    className={`text-xs font-semibold  ${
                      follower.isFollowing ? "text-slate-300" : "text-slate-950"
                    }`}
                  />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersPage;
