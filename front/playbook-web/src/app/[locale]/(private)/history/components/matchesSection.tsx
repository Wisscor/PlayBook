"use client";

import { PlayText } from "@/components/ui/Text";
import React, { useState } from "react";
import MatchModal from "../../home/components/matchModal";
import { Match } from "./match";
import { useTranslations } from "next-intl";
import { PlayButton } from "@/components/ui/Button";

export const MatchesSection: React.FC = () => {
  const t = useTranslations();
  const [matches, setMatches] = useState([
    {
      id: 0,
      matchname: "Friendly Football Match",
      matchType: "Football",
      playerNbr: "11",
      date: "2026-06-01",
      startTime: "09:00",
      endTime: "10:00",
      status: "Upcoming",
    },
    {
      id: 1,
      matchname: "Summer Basketball Championship",
      matchType: "Basketball",
      playerNbr: "5",
      date: "2026-06-05",
      startTime: "14:00",
      endTime: "16:00",
      status: "Live",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<
    (typeof matches)[0] | null
  >(null);

  const handleOpenCreate = () => {
    setSelectedMatch(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: number) => {
    const targetMatch = matches.find((m) => m.id === id);
    if (targetMatch) {
      setSelectedMatch(targetMatch);
      setIsModalOpen(true);
    }
  };

  const handleSaveMatch = (matchData: any) => {
    if (matchData.id !== undefined) {
      setMatches((prev) =>
        prev.map((match) => (match.id === matchData.id ? matchData : match)),
      );
    } else {
      const newMatch = {
        ...matchData,
        id: Date.now(),
        status: "Upcoming",
      };
      setMatches((prev) => [...prev, newMatch]);
    }
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  const handleDelete = (id: number) => {
    setMatches((prev) => prev.filter((match) => match.id !== id));
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <PlayText.Primary
            id="my-matches"
            content="My Matches"
            className="text-xl font-bold tracking-tight text-white"
          />
          <PlayText.Span
            texts={[
              {
                content: `${matches.length} ${matches.length === 1 ? t("match") : t("matches")}`,
              },
            ]}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400"
          />
        </div>

        <PlayButton.Primary
          textClassName="text-sm font-semibold text-white"
          title="create-match"
          type="button"
          onClick={handleOpenCreate}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2  backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 cursor-pointer shadow-md"
        />
      </div>

      <div>
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
            <PlayText.Primary
              id="no-matches"
              content="No matches found."
              className="text-base font-medium text-amber-400"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
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

      <MatchModal
        isOpen={isModalOpen}
        close={() => {
          setIsModalOpen(false);
          setSelectedMatch(null);
        }}
        initialData={selectedMatch}
        onSave={handleSaveMatch}
      />
    </div>
  );
};

export default MatchesSection;
