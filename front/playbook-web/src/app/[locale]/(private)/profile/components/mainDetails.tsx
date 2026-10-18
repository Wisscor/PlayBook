import { PlayText } from "@/components/ui/Text";
import React from "react";
import { Link } from "../../../../../../i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { PlayButton } from "@/components/ui/Button";
import { User } from "@/types/user";
import { useTranslations } from "next-intl";

export const MainDetails: React.FC<{ user: User }> = ({ user }) => {
  const t = useTranslations();

  return (
    <div className="order-3 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-xl flex flex-col justify-between h-full gap-6">
      <div className="space-y-4">
        <PlayText.Primary
          id="details"
          className="text-lg font-bold text-white tracking-wide"
        />

        <div className="space-y-3 text-sm">
          <div>
            <PlayText.Span
              texts={[
                {
                  text: "name-label",
                  className:
                    "block text-xs font-semibold uppercase tracking-wider text-slate-400",
                },
                {
                  content: `${user.firstname} ${user.lastname}`,
                  className: "font-medium text-slate-200",
                },
              ]}
            />
          </div>
          <div>
            <PlayText.Span
              texts={[
                {
                  text: "username-label",
                  className:
                    "block text-xs font-semibold uppercase tracking-wider text-slate-400",
                },
                {
                  content: `@${user.username}`,
                  className: "font-medium text-slate-200",
                },
              ]}
            />
          </div>
          <div>
            <PlayText.Span
              texts={[
                {
                  text: "email-label",
                  className:
                    "block text-xs font-semibold uppercase tracking-wider text-slate-400",
                },
                {
                  content: `${user.email || t("not-set")}`,
                  className: "font-medium text-slate-200 truncate block",
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Link href={ROUTES.EDIT_PROFILE}>
          <PlayButton.Primary
            title="edit-profile"
            type="button"
            className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 cursor-pointer shadow-md text-center"
          />
        </Link>
      </div>
    </div>
  );
};
