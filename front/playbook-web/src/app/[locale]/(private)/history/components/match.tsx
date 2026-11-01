"use client";

import { PlayText } from "@/components/ui/Text";
import { useMatchController } from "@/services/match";
import { MatchOverview, UpdatedMatchRequest } from "@/types/api";
import Image from "next/image";
import React from "react";
import { PlayerRequest } from "./playerRequest";
import { usePlayRequestsController } from "@/services/playRequest";

export interface MatchProps {
  match: MatchOverview & { sport_id: string };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const Match: React.FC<MatchProps> = ({ match, onEdit, onDelete }) => {
  const { updateMatch } = useMatchController();
  const { loadAnnouncementRequests, requests } = usePlayRequestsController();

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "live":
        return "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse";
      case "upcoming":
        return "bg-primary/20 text-amber-200 border border-primary/50";
      case "finished":
        return "bg-stone-500/20 text-stone-300 border border-stone-500/30";
      default:
        return "bg-secondary/50 text-stone-300 border border-white/10";
    }
  };

  const getMatchStatus = (match: MatchOverview) => {
    const matchDateParts = match.date.split("/");
    const newDateString = `${matchDateParts[2]}-${matchDateParts[1]}-${matchDateParts[0]}`;

    const matchStartDateString = new Date(
      `${newDateString}T${match.startTime}`,
    ).toISOString();
    const matchEndDateString = new Date(
      `${newDateString}T${match.endTime}`,
    ).toISOString();
    const today = new Date();
    const matchStartDate = new Date(matchStartDateString);
    const matchEndDate = new Date(matchEndDateString);

    if (today < matchStartDate) {
      return "upcoming";
    } else if (today >= matchStartDate && today <= matchEndDate) {
      return "live";
    } else {
      return "finished";
    }
  };

  React.useEffect(() => {
    void loadAnnouncementRequests(match.id);
  }, [match.id]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const matchStatus = getMatchStatus(match);
      if (matchStatus !== match.status) {
        const formattedDate = `${match.date.split("/")[2]}-${match.date.split("/")[1]}-${match.date.split("/")[0]}`;

        const updatedMatch: UpdatedMatchRequest = {
          title: match.matchname,
          sport_id: match.sport_id,
          end_time: `${formattedDate}T${match.endTime}`,
          start_time: `${formattedDate}T${match.startTime}`,
          match_status: matchStatus,
          remaining_player_slots: match.playerNbr as number,
        };

        void updateMatch(match.id, updatedMatch, () => {
          window.location.reload();
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [match.id]);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-secondary/20 text-stone-100 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:shadow-2xl hover:shadow-primary/15">
      <span
        aria-hidden
        className="absolute inset-y-0 inset-s-0 w-1 bg-linear-to-b from-primary to-extra opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-neutral-950/30 px-4 py-3 ps-5 sm:px-5 sm:ps-6">
        <PlayText.Span
          texts={[
            {
              content: match.status,
              className: `text-[10px] sm:text-[11px] uppercase font-bold tracking-wider px-2.5 sm:px-3 py-1 rounded-full ${getStatusBadgeColor(
                match.status,
              )}`,
            },
          ]}
        />

        <PlayText.Primary
          content={match.date}
          className="text-xs font-medium tabular-nums text-stone-400"
        />

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onEdit && match.status != "live" && (
            <button
              type="button"
              onClick={() => onEdit(match.id)}
              className="group/edit flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-secondary/30 text-stone-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:translate-y-0 active:scale-90"
              aria-label="Edit match"
            >
              <Image
                alt="edit"
                src="/icons/edit.png"
                width={14}
                height={14}
                className="opacity-80 invert transition-transform duration-300 group-hover/edit:scale-110 group-hover/edit:opacity-100"
              />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(match.id)}
              className="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-500/60 hover:bg-rose-500/25 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 active:translate-y-0 active:scale-95"
              aria-label="Delete match"
            >
              <PlayText.Primary
                id="delete"
                className="text-xs font-semibold text-rose-300"
              />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 ps-5 sm:p-5 sm:ps-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start sm:gap-4">
          <PlayText.Primary
            content={match.matchname}
            className="text-base font-bold tracking-tight text-stone-100 transition-colors duration-300 wrap-break-word group-hover:text-amber-100 sm:text-lg"
          />
          <PlayText.Span
            texts={[
              {
                content: match.matchType,
                className:
                  "self-start whitespace-nowrap rounded-lg border border-primary/40 bg-primary/15 px-2.5 py-1 text-xs font-medium text-amber-200 sm:self-auto",
              },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-white/5 bg-neutral-950/30 px-3.5 py-2.5 transition-colors duration-300 hover:border-primary/30">
            <PlayText.Span
              texts={[
                {
                  text: "time-label",
                  className:
                    "block text-[10px] font-semibold uppercase tracking-wider text-amber-200/70",
                },
                {
                  content: `${match.startTime} - ${match.endTime}`,
                  className:
                    "text-sm font-semibold tabular-nums text-stone-100",
                },
              ]}
            />
          </div>
          <div className="min-w-0 rounded-xl border border-white/5 bg-neutral-950/30 px-3.5 py-2.5 transition-colors duration-300 hover:border-primary/30">
            <PlayText.Span
              texts={[
                {
                  text: "players-label",
                  className:
                    "block text-[10px] font-semibold uppercase tracking-wider text-amber-200/70",
                },
                {
                  content: `${match.playerNbr}`,
                  className:
                    "text-sm font-semibold tabular-nums text-stone-100",
                },
              ]}
            />
          </div>
        </div>
      </div>

      {(onEdit || onDelete) && requests.length > 0 && (
        <div className="flex flex-col justify-between gap-4 border-t border-white/10 bg-neutral-950/30 px-4 py-3 ps-5 sm:flex-row sm:items-center sm:px-5 sm:ps-6">
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-4 w-1 rounded-full bg-linear-to-b from-primary to-extra"
              />
              <PlayText.Primary
                id="all-requests"
                className="text-[11px] font-bold uppercase tracking-wider text-amber-200"
              />
              <PlayText.Primary
                content={requests.length.toString()}
                className="rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-amber-200"
              />
            </div>
            <div className="space-y-2">
              {requests.map((request) => {
                return <PlayerRequest key={request.id} request={request} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
