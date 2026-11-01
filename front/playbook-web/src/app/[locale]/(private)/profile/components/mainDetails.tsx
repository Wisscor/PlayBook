import { PlayButton } from "@/components/ui/Button";
import { PlayModal } from "@/components/ui/Modal";
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
import { createPortal } from "react-dom";
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
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

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
    <div className="group relative order-3 flex h-full flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-white/10 bg-secondary/20 p-6 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/15 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-e-16 -top-16 h-40 w-40 rounded-full bg-extra/25 blur-3xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-60"
      />

      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-6 w-1 rounded-full bg-linear-to-b from-primary to-extra"
          />
          <PlayText.Primary
            id="details"
            className="text-lg font-bold tracking-wide text-stone-100"
          />
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="min-w-0 rounded-xl border border-white/5 bg-neutral-950/30 px-4 py-3 transition-colors duration-300 hover:border-primary/30">
            <PlayText.Span
              texts={[
                {
                  text: "name-label",
                  className:
                    "block text-xs font-semibold uppercase tracking-wider text-amber-200/70",
                },
                {
                  content: `${user.firstname} ${user.lastname}`,
                  className: "font-medium text-stone-100",
                },
              ]}
            />
          </div>
          <div className="min-w-0 rounded-xl border border-white/5 bg-neutral-950/30 px-4 py-3 transition-colors duration-300 hover:border-primary/30">
            <PlayText.Span
              texts={[
                {
                  text: "username-label",
                  className:
                    "block text-xs font-semibold uppercase tracking-wider text-amber-200/70",
                },
                {
                  content: `@${user.username}`,
                  className: "font-medium text-stone-100",
                },
              ]}
            />
          </div>
          <div className="min-w-0 rounded-xl border border-white/5 bg-neutral-950/30 px-4 py-3 transition-colors duration-300 hover:border-primary/30">
            <PlayText.Span
              texts={[
                {
                  text: "email-label",
                  className:
                    "block text-xs font-semibold uppercase tracking-wider text-amber-200/70",
                },
                {
                  content: `${user.email || t("not-set")}`,
                  className:
                    "block max-w-full truncate font-medium text-stone-100",
                },
              ]}
              className="min-w-0"
            />
          </div>
        </div>
      </div>

      <div className="relative pt-2">
        {comingFrom == COMING_FROM.ME ? (
          <div className="flex items-stretch gap-3">
            <Link href={ROUTES.EDIT_PROFILE} className="w-full">
              <PlayButton.Primary
                textClassName="text-sm font-semibold text-white"
                title="edit-profile"
                type="button"
                className="w-full py-2.5 text-center"
              />
            </Link>
            <button
              onClick={() => setIsDeleteOpen(true)}
              aria-label="Delete account"
              className="cursor-pointer rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-center shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-500/60 hover:bg-rose-500/25 active:translate-y-0 active:scale-95"
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
          <div className="flex items-stretch gap-3">
            <PlayButton.Primary
              onClick={() => toggleFollow()}
              disabled={isFollowPending}
              textClassName="text-sm font-semibold text-white"
              title={isFollowing ? "unfollow" : "follow"}
              type="button"
              className={`w-full py-2.5 text-center ${
                isFollowing
                  ? "from-secondary to-secondary/80 shadow-none hover:shadow-none"
                  : ""
              }`}
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
              className="rounded-xl px-3 py-2 text-center shadow-md hover:-translate-y-0.5"
            >
              <Image
                alt="messaging"
                src={"/icons/chat.png"}
                width={40}
                height={40}
                className="transition-transform duration-300 group-hover:scale-110"
              />
            </PlayButton.Complexe>
          </div>
        )}
        {conversationError && (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <PlayText.Primary
              content={conversationError}
              className="text-xs text-rose-300"
            />
          </div>
        )}
      </div>

      {isDeleteOpen &&
        createPortal(
          <PlayModal.Primary
            isOpen={isDeleteOpen}
            close={() => setIsDeleteOpen(false)}
            title="delete-account"
          >
            <div className="flex flex-col gap-6 pt-1">
              <div className="flex items-start gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <Image
                  alt="warning"
                  src={"/icons/trash-can.png"}
                  width={28}
                  height={28}
                  className="shrink-0"
                />
                <PlayText.Primary
                  id="delete-account-warning"
                  className="text-sm leading-relaxed text-rose-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <PlayButton.Secondary
                  title="cancel"
                  onClick={() => setIsDeleteOpen(false)}
                  className="w-full py-3"
                />
                <PlayButton.Primary
                  title="confirm-delete-account"
                  onClick={() => {
                    setIsDeleteOpen(false);
                    void deleteUser();
                  }}
                  className="w-full from-rose-600 to-rose-700 py-3 shadow-rose-600/30 hover:shadow-rose-600/40"
                />
              </div>
            </div>
          </PlayModal.Primary>,
          document.body,
        )}
    </div>
  );
};
