import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { useFollowerController } from "@/services/follower";
import { UserSummary } from "@/types/user";
import React from "react";

export const FollowCard: React.FC<{
  follower: UserSummary & {
    isFollowing: boolean;
  };
  onChanged: () => void;
}> = ({ follower, onChanged }) => {
  const { unfollow, follow } = useFollowerController();
  const { goUserProfile } = useNavigation();

  const onSuccess = () => {
    onChanged();
  };

  const followUser = (id: string) => {
    void follow(id, onSuccess);
  };

  const unfollowUser = (id: string) => {
    void unfollow(id, onSuccess);
  };

  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-secondary/20 p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:shadow-xl hover:shadow-primary/10">
      <button
        onClick={() => {
          goUserProfile(follower.id);
        }}
        className="group/profile flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <div className="shrink-0 rounded-full bg-linear-to-tr from-primary via-amber-200/60 to-extra p-0.5 transition-transform duration-300 group-hover/profile:scale-105">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-extra to-primary text-sm font-bold text-white">
            {follower?.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:8443"}/${follower.avatar}`}
                alt="Avatar"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <>
                {follower?.firstname.charAt(0).toUpperCase()}{" "}
                {follower?.lastname.charAt(0).toUpperCase()}
              </>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <PlayText.Primary
            content={`${follower.firstname} ${follower.lastname}`}
            className="truncate text-sm font-bold text-stone-100 transition-colors group-hover/profile:text-amber-100"
          />
          <PlayText.Primary
            content={follower.username}
            className="truncate text-xs text-stone-400"
          />
        </div>
      </button>

      <button
        type="button"
        onClick={() =>
          follower.isFollowing
            ? unfollowUser(follower.id)
            : followUser(follower.id)
        }
        className={`shrink-0 cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 ${
          follower.isFollowing
            ? "border border-white/15 bg-secondary/40 text-stone-300 hover:border-rose-500/50 hover:bg-rose-500/15"
            : "bg-linear-to-r from-primary to-extra text-white shadow-md shadow-primary/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
        }`}
      >
        <PlayText.Primary
          id={follower.isFollowing ? "following" : "follow-back"}
          className={`text-xs font-semibold ${
            follower.isFollowing ? "text-stone-300" : "text-white"
          }`}
        />
      </button>
    </div>
  );
};
