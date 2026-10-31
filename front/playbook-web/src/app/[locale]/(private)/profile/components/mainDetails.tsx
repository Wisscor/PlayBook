import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { COMING_FROM, ROUTES } from "@/lib/constants";
import { useFollowerController } from "@/services/follower";
import { useProfileController } from "@/services/profile";
import { useRealtimeController } from "@/services/realtime";
import { ApiError } from "@/types/api";
import { User } from "@/types/user";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";
import { Link } from "../../../../../../i18n/navigation";

export const MainDetails: React.FC<{ user: User; comingFrom: COMING_FROM }> = ({
  user,
  comingFrom,
}) => {
  const t = useTranslations();
  const { goMessages } = useNavigation();
  const { createConversation } = useRealtimeController();
  const { deleteUser } = useProfileController();
  const { follow, unfollow } = useFollowerController();
  const [isFollowing, setIsFollowing] = React.useState(
    user.is_following ?? false,
  );
  const [isFollowPending, setIsFollowPending] = React.useState(false);
  const [conversationError, setConversationError] = React.useState("");

  const toggleFollow = () => {
    if (!user.id || isFollowPending) return;
    setIsFollowPending(true);
    if (isFollowing) {
      void unfollow(user.id, () => {
        setIsFollowing(false);
        setIsFollowPending(false);
      });
    } else {
      void follow(user.id, () => {
        setIsFollowing(true);
        setIsFollowPending(false);
      });
    }
  };

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
        {comingFrom == COMING_FROM.ME ? (
          <div className="flex items-stretch space-x-4">
            <Link href={ROUTES.EDIT_PROFILE} className="w-full">
              <PlayButton.Primary
                textClassName="text-sm font-semibold text-white"
                title="edit-profile"
                type="button"
                className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 cursor-pointer shadow-md text-center"
              />
            </Link>
            <button
              onClick={() => {
                void deleteUser();
              }}
              className=" rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 cursor-pointer shadow-md text-center"
            >
              <Image
                alt="delete"
                src={"/icons/trash-can.png"}
                width={20}
                height={20}
              />
            </button>
          </div>
        ) : (
          <div className="flex items-stretch space-x-4">
            <PlayButton.Primary
              onClick={() => toggleFollow()}
              disabled={isFollowPending}
              textClassName="text-sm font-semibold text-white"
              title={isFollowing ? "unfollow" : "follow"}
              type="button"
              className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 cursor-pointer shadow-md text-center"
            />
            <PlayButton.Complexe
              onClick={() => {
                if (!user.id) return;
                setConversationError("");
                void createConversation(
                  user.id,
                  (conversationId) => {
                    goMessages(conversationId);
                  },
                  (error: ApiError) => {
                    setConversationError(
                      error.status === 403
                        ? t("mutual-follow-required")
                        : t("conversation-error"),
                    );
                  },
                );
              }}
              type="button"
              className="rounded-xl border border-white/20 bg-white/10 py-2.5 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 cursor-pointer shadow-md text-center"
            >
              <Image
                alt="messaging"
                src={"/icons/chat.png"}
                width={40}
                height={40}
              />
            </PlayButton.Complexe>
          </div>
        )}
        {conversationError && (
          <PlayText.Primary
            content={conversationError}
            className="mt-3 text-xs text-rose-400"
          />
        )}
      </div>
    </div>
  );
};
