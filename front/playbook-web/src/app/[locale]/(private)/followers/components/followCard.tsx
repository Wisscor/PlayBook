import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { useFollowerController } from "@/services/follower";
import { UserSummary } from "@/types/user";
import React from "react";

export const FollowCard: React.FC<{
  follower: UserSummary & {
    isFollowing: boolean;
  };
}> = ({ follower }) => {
  const { unfollow, follow } = useFollowerController();
  const { goUserProfile } = useNavigation();

  const onSuccess = () => {
    window.location.reload();
  };

  const followUser = (id: string) => {
    void follow(id, onSuccess);
  };

  const unfollowUser = (id: string) => {
    void unfollow(id, onSuccess);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl flex items-center justify-between shadow-lg hover:bg-white/10 transition-all">
      <button
        onClick={() => {
          goUserProfile(follower.id);
        }}
        className="flex items-center gap-3 cursor-pointer"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 font-bold text-sm text-white shadow-md">
          {follower?.avatar ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${follower.avatar}`}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <>
              {follower?.firstname.charAt(0).toUpperCase()}{" "}
              {follower?.lastname.charAt(0).toUpperCase()}
            </>
          )}
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
      </button>

      <button
        type="button"
        onClick={() =>
          follower.isFollowing
            ? unfollowUser(follower.id)
            : followUser(follower.id)
        }
        className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
          follower.isFollowing
            ? "border border-white/15 bg-white/10 text-slate-300 hover:bg-white/20"
            : "bg-white text-slate-950 hover:bg-slate-100 shadow-md"
        }`}
      >
        <PlayText.Primary
          id={follower.isFollowing ? "following" : "follow-back"}
          className={`text-xs font-semibold  ${
            follower.isFollowing ? "text-slate-300" : "text-slate-950"
          }`}
        />
      </button>
    </div>
  );
};
