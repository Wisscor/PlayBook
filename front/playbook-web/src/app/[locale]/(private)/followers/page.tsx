"use client";

import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
import React from "react";

export const FollowersPage = () => {
  const t = useTranslations();
  const [userId, setUserId] = React.useState<string | null>(null);

  const [followers, setFollowers] = React.useState([
    {
      id: 1,
      name: "Wissam Azadou",
      username: "wazadou",
      avatar: "WA",
      isFollowing: true,
    },
    {
      id: 2,
      name: "Sarah Connor",
      username: "sconnor",
      avatar: "SC",
      isFollowing: false,
    },
    {
      id: 3,
      name: "Michael Smith",
      username: "msmith",
      avatar: "MS",
      isFollowing: true,
    },
  ]);

  const toggleFollow = (id: number) => {
    setFollowers((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, isFollowing: !f.isFollowing } : f,
      ),
    );
  };

  React.useEffect(() => {
    const savedData = localStorage.getItem(
      "userid_of_requested_user_for_followers",
    );

    console.log("saved is >>>>", savedData);

    if (savedData) {
      setUserId(savedData);
    }
    console.log("User is >>>>", userId);
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 text-white px-4 py-8 md:px-12 lg:px-20 gap-8">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-4">
          <PlayText.Primary
            id={`followers`}
            className="text-2xl font-extrabold tracking-tight text-white"
          />

          <PlayText.Primary
            content={`${followers.length} ${t("people-following-user")}`}
            className="text-xs text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-3">
          {followers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
              <PlayText.Primary
                id="no-followers"
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
                      content={follower.name}
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
                  onClick={() => toggleFollow(follower.id)}
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
