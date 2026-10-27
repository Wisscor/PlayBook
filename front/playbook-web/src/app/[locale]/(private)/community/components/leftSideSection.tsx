import { PlayText } from "@/components/ui/Text";
import { ROUTES } from "@/lib/constants";
import React from "react";
import { Link } from "../../../../../../i18n/navigation";
import { User } from "@/types/user";

export const LeftSideSection: React.FC<{
  user?: User;
}> = ({ user }) => {
  return (
    <div className="hidden lg:flex flex-col gap-4 col-span-1">
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-xl flex flex-col gap-5 sticky top-20">
        <div className="flex flex-col items-center text-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-linear-to-tr from-indigo-950 to-indigo-600 font-extrabold text-lg text-white shadow-lg">
            {user?.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${user.avatar}`}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <>
                {user?.firstname.charAt(0).toUpperCase()}{" "}
                {user?.lastname.charAt(0).toUpperCase()}
              </>
            )}
          </div>
          <div className="space-y-0.5">
            <PlayText.Primary
              content={user?.firstname + " " + user?.lastname}
              className="font-bold text-base text-white"
            />
            <PlayText.Primary
              content={`@${user?.username}`}
              className="text-xs text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Link
            href={ROUTES.PROFILE}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/10 transition-colors "
          >
            <PlayText.Primary
              id="view-profile"
              className="text-sm font-semibold text-slate-200"
            />
          </Link>
          <Link
            href={ROUTES.MATCHES}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/10 transition-colors text-sm font-semibold text-slate-300"
          >
            <PlayText.Primary
              id="my-matches"
              className="text-sm font-semibold text-slate-200"
            />
          </Link>
          <Link
            href={ROUTES.POSTS}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/10 transition-colors text-sm font-semibold text-slate-300"
          >
            <PlayText.Primary
              id="my-posts"
              className="text-sm font-semibold text-slate-200"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};
