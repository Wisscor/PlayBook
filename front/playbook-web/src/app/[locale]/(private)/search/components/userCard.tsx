import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { User, UserSummary } from "@/types/user";
import React from "react";

export const UserCard: React.FC<{
  user: UserSummary;
  connectedUser?: User;
}> = ({ user, connectedUser }) => {
  const { goUserProfile, goProfile } = useNavigation();
  const isMe = user.id == connectedUser?.id;

  return (
    <div
      key={user.id}
      className={`group relative flex h-full flex-col justify-between gap-5 overflow-hidden rounded-3xl border p-6 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/15 ${
        isMe
          ? "border-primary/60 bg-primary/10"
          : "border-white/10 bg-secondary/20 hover:border-primary/50 hover:bg-primary/10"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-e-12 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-60"
      />

      <div className="relative flex min-w-0 items-center gap-4 rounded-xl text-start">
        <div className="shrink-0 rounded-full bg-linear-to-tr from-primary via-amber-200/60 to-extra p-0.5 transition-transform duration-300 group-hover:scale-105">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-extra to-primary text-base font-bold text-white shadow-md">
            {user.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${user.avatar}`}
                alt="Avatar"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="min-w-0">
                {user.firstname.charAt(0)}
                {user.lastname.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <PlayText.Primary
            content={`${user.firstname} ${user.lastname}`}
            className="truncate text-base font-bold text-stone-100 transition-colors duration-300 group-hover:text-amber-100"
          />
          <PlayText.Primary
            content={`@${user.username}`}
            className="truncate text-xs text-amber-200/70"
          />
        </div>
      </div>

      <div className="relative flex justify-end border-t border-white/10 pt-4">
        <PlayButton.Secondary
          onClick={() => {
            if (user.id == connectedUser?.id) {
              goProfile();
              return;
            }
            goUserProfile(user.id);
          }}
          textClassName="text-xs font-semibold text-white"
          title="view-profile"
          type="button"
          className="rounded-xl px-4 py-2"
        />
      </div>
    </div>
  );
};
