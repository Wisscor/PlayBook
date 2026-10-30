"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { useMatchController } from "@/services/match";
import {
  MatchAnnouncement,
  MatchAnnouncementRequestData,
  UpdatedMatchRequest,
} from "@/types/api";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { MatchModal } from "../../home/components/matchModal";
import { Match } from "./match";
import { useProfileController } from "@/services/profile";
import { pageSize } from "@/lib/constants";

export const MatchesSection: React.FC = () => {
  const t = useTranslations();
  const {
    loadMatches,
    pageNumber,
    matches,
    deleteMatch,
    addMatch,
    updateMatch,
    pages,
    total,
  } = useMatchController();
  const { isLoading, connectedUser } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState<
    MatchAnnouncement | undefined
  >(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fetchUser } = useProfileController();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUser(() => {
        if (connectedUser?.id) {
          void loadMatches(connectedUser.id, pageNumber, pageSize);
        }
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [connectedUser?.id]);

  const handleSave = (form: MatchAnnouncementRequestData) => {
    const payload: UpdatedMatchRequest = {
      title: form.title.trim(),
      sport_id: form.sport_id,
      remaining_player_slots: form.remaining_player_slots,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      match_status: selectedMatch?.match_status ?? "upcoming",
    };

    if (selectedMatch?.id) {
      void updateMatch(selectedMatch.id, payload, () => {
        window.location.reload();
      });
    } else {
      void addMatch(payload, () => {
        setSelectedMatch(undefined);
        window.location.reload();
      });
    }
  };

  let matchContent: React.ReactNode;
  if (isLoading && total === 0) {
    matchContent = (
      <PlayText.Primary
        id="loading"
        className="py-12 text-center text-slate-300"
      />
    );
  } else if (total === 0 && !isLoading) {
    matchContent = (
      <PlayText.Primary
        id="no-matches"
        className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-amber-400"
      />
    );
  } else {
    matchContent = (
      <div>
        <div className="flex items-center justify-center my-6 space-x-4">
          {pageNumber > 1 && (
            <button
              onClick={() => {
                void loadMatches(
                  connectedUser?.id,
                  pageNumber - 1,
                  pageSize,
                  () => {},
                );
              }}
              className="cursor-pointer"
            >
              <PlayText.Primary
                id="previous"
                className="text-sm text-slate-400 hover:text-slate-200 transition-color"
              />
            </button>
          )}
          <PlayText.Primary
            content={
              pages > 0 ? `${pageNumber}/${pages}` : pageNumber.toString()
            }
            className="text-sm text-slate-400 font-bold transition-color"
          />
          {pageNumber < pages && (
            <button
              onClick={() => {
                void loadMatches(
                  connectedUser?.id,
                  pageNumber + 1,
                  pageSize,
                  () => {},
                );
              }}
              className="cursor-pointer"
            >
              <PlayText.Primary
                id="next"
                className="text-sm text-slate-400 hover:text-slate-200 transition-color"
              />
            </button>
          )}
        </div>
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
                sport_id: match.sport.id,
              }}
              onEdit={() => {
                setSelectedMatch(match);
                setIsModalOpen(true);
              }}
              onDelete={() => {
                void deleteMatch(match.id, () => {
                  window.location.reload();
                });
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex lg:flex-row flex-col  items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <PlayText.Primary
            id="my-matches"
            className="text-xl font-bold text-white"
          />
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
            {total} {total === 1 ? t("match") : t("matches")}
          </span>
        </div>
        <PlayButton.Primary
          title="create-match"
          onClick={() => {
            setSelectedMatch(undefined);
            setIsModalOpen(true);
          }}
          className="rounded-xl px-4 py-2"
        />
      </div>
      {matchContent}

      <MatchModal
        isOpen={isModalOpen}
        close={() => {
          setIsModalOpen(false);
          setSelectedMatch(undefined);
        }}
        initialData={{
          match: selectedMatch,
          id: selectedMatch?.id ?? undefined,
        }}
        onSave={handleSave}
      />
    </div>
  );
};
