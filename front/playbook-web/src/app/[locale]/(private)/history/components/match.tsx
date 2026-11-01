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
        return "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse";
      case "upcoming":
        return "bg-sky-500/20 text-sky-400 border border-sky-500/30";
      case "completed":
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
      default:
        return "bg-slate-800 text-slate-300 border border-white/10";
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
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-4 sm:px-5 py-3">
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
          className="text-xs font-medium text-slate-400"
        />

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onEdit && match.status != "live" && (
            <button
              type="button"
              onClick={() => onEdit(match.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Edit match"
            >
              <Image
                alt="edit"
                src="/icons/edit.png"
                width={14}
                height={14}
                className="opacity-80 invert"
              />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(match.id)}
              className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300 cursor-pointer"
              aria-label="Delete match"
            >
              <PlayText.Primary
                id="delete"
                className="text-xs font-semibold text-rose-400"
              />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
          <PlayText.Primary
            content={match.matchname}
            className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-slate-100 wrap-break-word"
          />
          <PlayText.Span
            texts={[
              {
                content: match.matchType,
                className:
                  "text-xs px-2.5 py-1 bg-white/10 text-slate-200 border border-white/10 rounded-lg font-medium whitespace-nowrap self-start sm:self-auto",
              },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <PlayText.Span
              texts={[
                {
                  text: "time-label",
                  className: "font-semibold text-slate-400",
                },
                {
                  content: `${match.startTime} - ${match.endTime}`,
                  className: "font-medium text-white",
                },
              ]}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <PlayText.Span
              texts={[
                {
                  text: "players-label",
                  className: "font-semibold text-slate-400",
                },
                {
                  content: `${match.playerNbr}`,
                  className: "font-medium text-white",
                },
              ]}
            />
          </div>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 bg-black/20 px-4 sm:px-5 py-3">
          {requests.length > 0 && (
            <div className="space-y-3 w-full sm:w-auto">
              <PlayText.Primary
                id="all-requests"
                className={`text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-sky-400`}
              />
              <div className="space-y-2">
                {requests.map((request) => {
                  return <PlayerRequest key={request.id} request={request} />;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
