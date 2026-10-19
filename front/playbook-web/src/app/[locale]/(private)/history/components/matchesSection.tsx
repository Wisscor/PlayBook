"use client";

import { PlayButton } from "@/components/ui/Button";
import { api } from "@/services/api";
import { MatchAnnouncement } from "@/types/api";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import MatchModal, { MatchFormData } from "../../home/components/matchModal";
import { Match } from "./match";

export const MatchesSection: React.FC = () => {
  const t = useTranslations();
  const [matches, setMatches] = useState<MatchAnnouncement[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchFormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadMatches = async () => {
    try {
      const profile = await api.get<{ id: string }>("/users/me");
      const response = await api.get<{
        items: MatchAnnouncement[];
        next_offset: number | null;
      }>("/match-announcements", {
        params: { organizer_id: profile.data.id, limit: 100 },
      });
      setMatches(response.data.items);
    } catch (error) {
      console.error("Unable to load matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadMatches, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSave = async (form: MatchFormData) => {
    const payload = {
      title: form.title.trim(),
      sport_id: form.sport_id,
      remaining_player_slots: form.remaining_player_slots,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
    };
    if (form.id) {
      const response = await api.patch<MatchAnnouncement>(
        `/match-announcements/${form.id}`,
        payload,
      );
      setMatches((current) =>
        current.map((match) => (match.id === form.id ? response.data : match)),
      );
    } else {
      const response = await api.post<MatchAnnouncement>(
        "/match-announcements",
        payload,
      );
      setMatches((current) => [...current, response.data]);
    }
    setSelectedMatch(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/match-announcements/${id}`);
      setMatches((current) => current.filter((match) => match.id !== id));
    } catch (error) {
      console.error("Unable to delete match:", error);
    }
  };

  const toForm = (match: MatchAnnouncement): MatchFormData => ({
    id: match.id,
    title: match.title,
    sport_id: match.sport.id,
    remaining_player_slots: match.remaining_player_slots,
    start_time: match.start_time.slice(0, 16),
    end_time: match.end_time.slice(0, 16),
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{t("my-matches")}</h2>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
            {matches.length} {matches.length === 1 ? t("match") : t("matches")}
          </span>
        </div>
        <PlayButton.Primary
          title="create-match"
          onClick={() => {
            setSelectedMatch(null);
            setIsModalOpen(true);
          }}
          className="rounded-xl px-4 py-2"
        />
      </div>
      {isLoading ? (
        <p className="py-12 text-center text-slate-300">Loading...</p>
      ) : matches.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-amber-400">
          {t("no-matches")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {matches.map((match) => (
            <Match
              key={match.id}
              match={{
                id: match.id,
                matchname: match.title,
                matchType: match.sport.name,
                playerNbr: match.remaining_player_slots,
                date: new Date(match.start_time).toLocaleDateString(),
                startTime: new Date(match.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                endTime: new Date(match.end_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                status: match.match_status,
              }}
              onEdit={() => {
                setSelectedMatch(toForm(match));
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      <MatchModal
        isOpen={isModalOpen}
        close={() => {
          setIsModalOpen(false);
          setSelectedMatch(null);
        }}
        initialData={selectedMatch}
        onSave={handleSave}
      />
    </div>
  );
};

export default MatchesSection;
