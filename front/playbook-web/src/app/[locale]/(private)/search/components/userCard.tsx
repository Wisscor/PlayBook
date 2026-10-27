import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { UserSummary } from "@/types/user";
import React from "react";

export const UserCard: React.FC<{ user: UserSummary }> = ({ user }) => {
  const { goUserProfile } = useNavigation();
  return (
    <div
      key={user.id}
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between gap-4 hover:bg-white/10 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 font-bold text-base text-white shadow-md">
          {user.firstname.charAt(0)}
          {user.lastname.charAt(0)}
        </div>
        <div>
          <PlayText.Primary
            content={`${user.firstname} ${user.lastname}`}
            className="font-bold text-base text-white"
          />
          <PlayText.Primary
            content={`@${user.username}`}
            className="text-xs text-slate-400"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <PlayButton.Primary
          onClick={() => {
            goUserProfile(user.id);
          }}
          textClassName="text-xs font-semibold text-white"
          title="view-profile"
          type="button"
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2  transition-all hover:bg-white/20 active:scale-95 cursor-pointer shadow-md"
        />
      </div>
    </div>
  );
};
