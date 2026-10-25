"use client";

import { PlayText } from "@/components/ui/Text";
import Image from "next/image";
import React from "react";

export interface MatchProps {
  match: {
    id: string;
    matchname: string;
    matchType: string;
    playerNbr: string | number;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const Match: React.FC<MatchProps> = ({ match, onEdit, onDelete }) => {
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

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-5 py-3">
        <PlayText.Span
          texts={[
            {
              content: match.status,
              className: `text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full ${getStatusBadgeColor(
                match.status,
              )}`,
            },
          ]}
        />
        <PlayText.Primary
          content={match.date}
          className="text-xs font-medium text-slate-400"
        />
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <PlayText.Primary
            content={match.matchname}
            className="text-lg font-bold tracking-tight text-white group-hover:text-slate-100"
          />
          <PlayText.Span
            texts={[
              {
                content: match.matchType,
                className:
                  "text-xs px-2.5 py-1 bg-white/10 text-slate-200 border border-white/10 rounded-lg font-medium whitespace-nowrap",
              },
            ]}
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-slate-300">
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
        <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-black/20 px-5 py-2.5">
          {onEdit && (
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
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
