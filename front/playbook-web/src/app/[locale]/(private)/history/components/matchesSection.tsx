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

  // Edit action
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

  // Delete action
  const handleDelete = (id: number) => {
    setMatches((prev) => prev.filter((match) => match.id !== id));
  };

  return (
    <div className="flex flex-col gap-8 p-8 bg-white shadow-2xs w-full rounded-lg">
      <PlayText.Primary
        id="my-matches"
        content="My Matches"
        className="text-lg text-black font-bold"
      />

      <div>
        {matches.length === 0 ? (
          <PlayText.Primary
            id="no-matches"
            content="No matches found."
            className="text-md text-center text-warning"
          />
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
