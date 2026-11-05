import { PlayButton } from "@/components/ui/Button";
import { PlayModal } from "@/components/ui/Modal";
import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { useMatchController } from "@/services/match";
import { PlayRequest } from "@/types/api";
import Image from "next/image";
import React from "react";
import { createPortal } from "react-dom";

export const PlayerRequest: React.FC<{
  request: PlayRequest;
}> = ({ request }) => {
  const { goUserProfile } = useNavigation();
  const { decide } = useMatchController();
  const [isDeclineOpen, setIsDeclineOpen] = React.useState(false);

  const getColor = () => {
    switch (request.status) {
      case "pending":
        return "bg-amber-500/10 text-amber-300 border border-amber-500/30";
      case "accepted":
        return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
      case "declined":
        return "bg-rose-500/10 text-rose-300 border border-rose-500/30";
      default:
        return "bg-secondary/50 text-stone-300 border border-white/10";
    }
  };

  const getBarColor = () => {
    switch (request.status) {
      case "pending":
        return "bg-amber-400";
      case "accepted":
        return "bg-emerald-400";
      case "declined":
        return "bg-rose-400";
      default:
        return "bg-stone-500";
    }
  };

  return (
    <div className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/40 p-3.5 ps-5 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:bg-primary/10 sm:flex-row sm:items-center sm:gap-4 sm:p-4 sm:ps-5">
      <span
        aria-hidden
        className={`absolute inset-y-0 inset-s-0 w-1 ${getBarColor()}`}
      />

      <button
        type="button"
        onClick={() => {
          goUserProfile(request.sender.id);
        }}
        className="group/sender flex min-w-0 cursor-pointer items-center gap-3 rounded-xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <div className="shrink-0 rounded-full bg-linear-to-tr from-primary via-amber-200/60 to-extra p-0.5 transition-transform duration-300 group-hover/sender:scale-105">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-extra to-primary text-sm font-bold text-white shadow-md sm:h-11 sm:w-11">
            {request.sender.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/${request.sender.avatar}`}
                alt={`${request.sender.firstname} avatar`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {request.sender.firstname.charAt(0)}
                {request.sender.lastname.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <PlayText.Primary
            content={`${request.sender.firstname} ${request.sender.lastname}`}
            className="truncate text-sm font-bold text-stone-100 transition-colors group-hover/sender:text-amber-100 sm:text-base"
          />
          <PlayText.Primary
            content={`@${request.sender.username}`}
            className="truncate text-xs text-stone-400"
          />
        </div>
      </button>

      {request.status === "pending" ? (
        <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-2 sm:border-t-0 sm:pt-0">
          <button
            type="button"
            onClick={() => setIsDeclineOpen(true)}
            className="group/reject flex cursor-pointer items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/15 px-3.5 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-500 hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 active:translate-y-0 active:scale-90"
            aria-label="Reject request"
          >
            <Image
              alt="reject"
              src={"/icons/close.png"}
              width={14}
              height={14}
              className="opacity-90 invert transition-transform duration-300 group-hover/reject:rotate-90"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              void decide(request.id, "accepted");
            }}
            className="group/accept flex cursor-pointer items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 active:translate-y-0 active:scale-90"
            aria-label="Accept request"
          >
            <Image
              alt="accept"
              src={"/icons/check.png"}
              width={14}
              height={14}
              className="opacity-90 invert transition-transform duration-300 group-hover/accept:scale-125"
            />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end border-t border-white/10 pt-2 sm:border-t-0 sm:pt-0">
          <PlayText.Span
            texts={[
              {
                text: `${request.status}`,
                className: `rounded-full px-3 py-1 text-xs font-semibold capitalize ${getColor()}`,
              },
            ]}
          />
        </div>
      )}

      {isDeclineOpen &&
        createPortal(
          <PlayModal.Primary
            isOpen={isDeclineOpen}
            close={() => setIsDeclineOpen(false)}
            title="decline-request"
          >
            <div className="flex flex-col gap-6 pt-1">
              <div className="flex flex-col gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <PlayText.Primary
                  id="decline-request-warning"
                  className="text-sm leading-relaxed text-rose-100"
                />
                <PlayText.Primary
                  content={`${request.sender.firstname} ${request.sender.lastname} (@${request.sender.username})`}
                  className="truncate rounded-xl border border-white/10 bg-neutral-950/40 px-3 py-2 text-xs font-semibold text-amber-200"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <PlayButton.Secondary
                  title="cancel"
                  onClick={() => setIsDeclineOpen(false)}
                  className="w-full py-3"
                />
                <PlayButton.Primary
                  title="confirm-decline-request"
                  onClick={() => {
                    setIsDeclineOpen(false);
                    void decide(request.id, "declined");
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
