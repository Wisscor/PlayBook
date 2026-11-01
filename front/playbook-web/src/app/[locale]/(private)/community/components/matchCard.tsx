import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { usePlayRequestsController } from "@/services/playRequest";
import { MatchAnnouncement, PlayRequest } from "@/types/api";
import { useTranslations } from "next-intl";
import React from "react";

export const MatchCard: React.FC<{
  match: MatchAnnouncement;
  isOwner: boolean;
  requests: PlayRequest[];
}> = ({ match, isOwner, requests }) => {
  const t = useTranslations();
  const { joinMatch, isJoining } = usePlayRequestsController();
  const alreadyJoined = requests.some(
    (r) => r.announcement_id === match.id && r.status === "accepted",
  );
  const pending = requests.some(
    (r) => r.announcement_id === match.id && r.status === "pending",
  );

  const ownerName = `${match.owner.firstname} ${match.owner.lastname}`;
  const isLive = match.match_status === "live";

  return (
    <article className="group relative flex h-full w-full flex-col justify-between gap-5 overflow-hidden rounded-3xl border border-white/10 bg-secondary/20 p-5 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:bg-primary/10 hover:shadow-2xl hover:shadow-primary/20">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-primary to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-e-12 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-60"
      />

      <div className="relative flex items-start justify-between gap-3">
        <PlayText.Span
          texts={[
            {
              content: match.sport.name,
              className:
                "rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] font-semibold text-amber-200",
            },
          ]}
        />
        <PlayText.Span
          texts={[
            {
              content: match.match_status,
              className: `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                isLive
                  ? "animate-pulse border-rose-500/40 bg-rose-500/15 text-rose-300"
                  : "border-white/10 bg-white/5 text-stone-400"
              }`,
            },
          ]}
        />
      </div>

      <div className="relative space-y-3">
        <PlayText.Primary
          content={match.title}
          className="line-clamp-2 text-lg font-extrabold leading-snug tracking-tight text-stone-100 wrap-break-word transition-colors duration-300 group-hover:text-amber-100"
        />

        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-extra to-primary text-[10px] font-bold text-white ring-2 ring-white/10">
            {match.owner.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${match.owner.avatar}`}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <>
                {match.owner.firstname.charAt(0)}
                {match.owner.lastname.charAt(0)}
              </>
            )}
          </div>
          <PlayText.Primary
            content={isOwner ? t("you") : ownerName}
            className={`truncate text-xs font-semibold ${
              isOwner ? "text-amber-200" : "text-stone-300"
            }`}
          />
        </div>
      </div>

      <div className="relative flex items-center gap-3 rounded-2xl border border-white/5 bg-neutral-950/40 px-4 py-3">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 shrink-0 text-amber-200/80"
        >
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <div className="min-w-0">
          <PlayText.Primary
            content={new Date(match.start_time).toISOString().split("T")[0]}
            className="text-sm font-semibold tabular-nums text-stone-100"
          />
          <PlayText.Primary
            content={`${new Date(match.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(match.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            className="text-[11px] tabular-nums text-stone-400"
          />
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <PlayText.Span
          texts={[
            {
              text: `slots`,
              values: { slots: match.remaining_player_slots },
              className: "text-xs font-semibold text-stone-300",
            },
          ]}
        />

        {!isOwner && alreadyJoined === false && pending === false && (
          <PlayButton.Primary
            disabled={isJoining}
            onClick={() => {
              void joinMatch(match.id, () => {
                window.location.reload();
              });
            }}
            textClassName="text-xs font-semibold text-white"
            title="join-match"
            className="shrink-0 rounded-xl px-4 py-2"
          />
        )}

        {alreadyJoined && (
          <PlayText.Span
            texts={[
              {
                text: "already-joined",
                className:
                  "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300",
              },
            ]}
          />
        )}

        {pending && (
          <PlayText.Span
            texts={[
              {
                text: "pending",
                className:
                  "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300",
              },
            ]}
          />
        )}
      </div>
    </article>
  );
};
