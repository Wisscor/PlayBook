"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayModal } from "@/components/ui/Modal";
import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { pageSize } from "@/lib/constants";
import { useMatchController } from "@/services/match";
import { useProfileController } from "@/services/profile";
import {
  MatchAnnouncement,
  MatchAnnouncementRequestData,
  UpdatedMatchRequest,
} from "@/types/api";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MatchModal } from "../../home/components/matchModal";
import { Match } from "./match";

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
  const [matchToDelete, setMatchToDelete] = useState<
    MatchAnnouncement | undefined
  >(undefined);
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
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 150}ms` }}
            className="flex animate-pulse flex-col gap-3 rounded-2xl border border-white/10 bg-secondary/20 p-5"
          >
            <div className="h-3 w-1/3 rounded-full bg-secondary/50" />
            <div className="h-3 w-2/3 rounded-full bg-secondary/30" />
            <div className="h-3 w-1/2 rounded-full bg-secondary/30" />
          </div>
        ))}
        <PlayText.Primary
          id="loading"
          className="py-2 text-center text-sm text-stone-400"
        />
      </div>
    );
  } else if (total === 0 && !isLoading) {
    matchContent = (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-secondary/10 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-primary/40 to-extra/40">
          <Image
            alt="no matches"
            src={"/icons/friendship.png"}
            width={32}
            height={32}
            className="opacity-70"
          />
        </div>
        <PlayText.Primary
          id="no-matches"
          className="text-base font-medium text-amber-300"
        />
      </div>
    );
  } else {
    matchContent = (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4">
          {matches.map((match, index) => (
            <div
              key={match.id}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              className="ms-anim animate-[ms-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]"
            >
              <Match
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
                  setMatchToDelete(match);
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-secondary/30 p-1.5 backdrop-blur-md">
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
              className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 active:scale-95"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:translate-x-0.5"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <PlayText.Primary
                id="previous"
                className="text-sm text-stone-300 transition-colors group-hover:text-white"
              />
            </button>
          )}
          <PlayText.Primary
            content={
              pages > 0 ? `${pageNumber}/${pages}` : pageNumber.toString()
            }
            className="rounded-full bg-linear-to-r from-primary to-extra px-4 py-1.5 text-sm font-bold tabular-nums text-white shadow-md shadow-primary/30"
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
              className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 active:scale-95"
            >
              <PlayText.Primary
                id="next"
                className="text-sm text-stone-300 transition-colors group-hover:text-white"
              />
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <style>{`
        @keyframes ms-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-anim { animation: none !important; }
        }
      `}</style>

      <div className="flex flex-col items-center justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-6 w-1 rounded-full bg-linear-to-b from-primary to-extra"
          />
          <PlayText.Primary
            id="my-matches"
            className="text-xl font-bold tracking-tight text-stone-100"
          />
          <span className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold tabular-nums text-amber-200">
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

      {isModalOpen &&
        createPortal(
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
          />,
          document.body,
        )}

      {matchToDelete &&
        createPortal(
          <PlayModal.Primary
            isOpen={Boolean(matchToDelete)}
            close={() => setMatchToDelete(undefined)}
            title="delete-match"
          >
            <div className="flex flex-col gap-6 pt-1">
              <div className="flex flex-col gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <PlayText.Primary
                  id="delete-match-warning"
                  className="text-sm leading-relaxed text-rose-100"
                />
                <PlayText.Primary
                  content={`#${matchToDelete.title}`}
                  className="truncate rounded-xl border border-white/10 bg-neutral-950/40 px-3 py-2 text-xs font-semibold text-amber-200"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <PlayButton.Secondary
                  title="cancel"
                  onClick={() => setMatchToDelete(undefined)}
                  className="w-full py-3"
                />
                <PlayButton.Primary
                  title="confirm-delete-match"
                  onClick={() => {
                    const id = matchToDelete.id;
                    setMatchToDelete(undefined);
                    void deleteMatch(id, () => {
                      window.location.reload();
                    });
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
