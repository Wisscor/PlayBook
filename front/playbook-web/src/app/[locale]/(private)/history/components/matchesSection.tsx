"use client";

import { PlayText } from "@/components/ui/Text";
import React, { useState } from "react";
import { Match } from "./match";

export const MatchesSection: React.FC = () => {
  const [matches, setMatches] = useState([
    {
      id: 0,
      matchname: "Friendly Football Match",
      matchType: "Friendly",
      playerNbr: "10",
      date: "2026-06-01",
      startTime: "09:00",
      endTime: "10:00",
      status: "Upcoming",
    },
    {
      id: 1,
      matchname: "Summer Championship",
      matchType: "Tournament",
      playerNbr: "22",
      date: "2026-06-05",
      startTime: "14:00",
      endTime: "16:00",
      status: "Live",
    },
  ]);

  const [matchInfos, setMatchInfos] = useState({
    matchname: "",
    matchType: "",
    playerNbr: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    status: "Upcoming",
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    const targetMatch = matches.find((m) => m.id === id);
    if (targetMatch) {
      setMatchInfos({
        matchname: targetMatch.matchname,
        matchType: targetMatch.matchType,
        playerNbr: targetMatch.playerNbr.toString(),
        date: targetMatch.date,
        startTime: targetMatch.startTime,
        endTime: targetMatch.endTime,
        status: targetMatch.status,
      });
      setEditingId(id);
    }
  };

  const handleDelete = (id: number) => {
    setMatches((prev) => prev.filter((match) => match.id !== id));
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <PlayText.Primary
          id="my-matches"
          content="My Matches"
          className="text-xl font-bold tracking-tight text-white"
        />
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
          {matches.length} {matches.length === 1 ? "Match" : "Matches"}
        </span>
      </div>

      <div>
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <PlayText.Primary
              id="no-matches"
              content="No matches found."
              className="text-base font-medium text-amber-400"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((match) => (
              <Match
                key={match.id}
                match={match}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesSection;
