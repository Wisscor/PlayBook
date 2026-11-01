"use client";

import { PlayButton } from "@/components/ui/Button";
import { DateTimeRangePicker } from "@/components/ui/Datepicker";
import { PlayInput } from "@/components/ui/Input";
import { PlayLabel } from "@/components/ui/Label";
import { PlayList } from "@/components/ui/List";
import { PlayModal } from "@/components/ui/Modal";
import { toForm } from "@/lib/utils";
import { useMatchController } from "@/services/match";
import {
  MatchAnnouncementRequestData,
  MatchAnnouncement,
  Sport,
} from "@/types/api";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

interface MatchModalProps {
  close: () => void;
  isOpen: boolean;
  initialData?: { match?: MatchAnnouncement; id?: string };
  onSave: (data: MatchAnnouncementRequestData) => void;
}

const emptyForm: MatchAnnouncementRequestData = {
  title: "",
  sport_id: "",
  remaining_player_slots: 0,
  start_time: "09:00",
  end_time: "10:00",
};

export const MatchModal: React.FC<MatchModalProps> = ({
  close,
  isOpen,
  initialData,
  onSave,
}) => {
  const t = useTranslations();

  const { sports, getSports } = useMatchController();

  const [form, setForm] = useState<MatchAnnouncementRequestData>(emptyForm);
  const [date, setDate] = useState(new Date().toISOString());
  const [error, setError] = useState<string | undefined>(undefined);
  const [matchTypeOpen, setMatchTypeOpen] = useState(false);
  const [playerNbrOpen, setPlayerNbrOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      setForm(initialData?.match ? toForm(initialData.match) : emptyForm);
      setSelectedSport(initialData?.match?.sport ?? null);
      setDate(
        initialData?.match
          ? new Date(initialData.match.start_time).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      );
      setError(undefined);
      void getSports(
        () => {},
        (error) => {
          setError(error);
        },
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialData, isOpen]);

  const handleSubmit = () => {
    if (
      !form.title.trim() ||
      !form.sport_id ||
      !form.start_time ||
      !form.end_time ||
      form.remaining_player_slots <= 0 ||
      !date
    ) {
      setError("Please fill in every field");
      return;
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError("End time must be after start time");
      return;
    }

    setError(undefined);
    try {
      let newForm: MatchAnnouncementRequestData = {
        ...form,
        end_time: new Date(`${date}T${form.end_time}`).toISOString(),
        start_time: new Date(`${date}T${form.start_time}`).toISOString(),
      };
      onSave(newForm);
      close();
    } catch {
      setError("unable-to-create-match");
    } finally {
      setError(undefined);
    }
  };

  const isFormComplete =
    !Object.values(form).includes("") &&
    !error &&
    form.remaining_player_slots > 0;

  const isEditing = Boolean(initialData?.id !== undefined);

  return (
    <PlayModal.Primary
      title={isEditing ? "edit-match" : "create-match"}
      isOpen={isOpen}
      close={close}
    >
      <style>{`
        @keyframes mm-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mm-anim { animation: none !important; }
        }
      `}</style>

      <div className="flex flex-col gap-6 p-1">
        <div className="space-y-4">
          <PlayLabel.Primary>
            <PlayInput.Primary
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="match-name"
              value={form.title}
              className="w-full rounded-2xl border border-white/10 bg-secondary/30 px-4 py-3 text-sm text-stone-100 placeholder-stone-400 backdrop-blur-md transition-all duration-300 hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </PlayLabel.Primary>

          <PlayList.Primary
            value="name"
            toggle={() => setMatchTypeOpen(!matchTypeOpen)}
            isOpen={matchTypeOpen}
            items={sports}
            text={
              form.sport_id
                ? (selectedSport?.name ?? t("select-match-type"))
                : t("select-match-type")
            }
            choseItem={(item) => {
              setForm({
                ...form,
                sport_id: item.id,
                remaining_player_slots: 0,
              });
              setSelectedSport(item);
              setMatchTypeOpen(false);
            }}
          />

          {form.sport_id && (
            <div className="mm-anim animate-[mm-in_0.4s_cubic-bezier(0.22,1,0.36,1)_both]">
              <PlayList.Primary
                toggle={() => setPlayerNbrOpen(!playerNbrOpen)}
                isOpen={playerNbrOpen}
                items={Array.from(
                  {
                    length:
                      sports.find((type) => type.id === form.sport_id)
                        ?.max_players ?? 5,
                  },
                  (_, index) => index + 1,
                )}
                text={
                  form.remaining_player_slots > 0
                    ? form.remaining_player_slots.toString()
                    : t("select-player-number")
                }
                choseItem={(item) => {
                  setForm({
                    ...form,
                    remaining_player_slots: item,
                  });
                  setPlayerNbrOpen(false);
                }}
              />
            </div>
          )}

          {form.remaining_player_slots > 0 && (
            <div className="mm-anim rounded-2xl border border-white/10 bg-secondary/25 p-4 shadow-inner shadow-black/20 backdrop-blur-md transition-colors duration-300 animate-[mm-in_0.4s_cubic-bezier(0.22,1,0.36,1)_both] hover:border-primary/40">
              <DateTimeRangePicker
                onError={(err) => setError(err)}
                date={date.split("T")[0]}
                startTime={form.start_time}
                endTime={form.end_time}
                changeDate={(date) => {
                  setError(undefined);
                  setDate(date);
                }}
                changeStartTime={(startTime) => {
                  setError(undefined);
                  setForm({ ...form, start_time: startTime });
                }}
                changeEndTime={(endTime) => {
                  setError(undefined);
                  setForm({ ...form, end_time: endTime });
                }}
              />
            </div>
          )}
        </div>

        {isFormComplete && (
          <div className="mm-anim pt-2 animate-[mm-in_0.4s_cubic-bezier(0.22,1,0.36,1)_both]">
            <PlayButton.Primary
              onClick={handleSubmit}
              title={isEditing ? "save-changes" : "create-match"}
              className="w-full cursor-pointer rounded-2xl bg-linear-to-r from-primary to-extra py-3.5 font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 active:translate-y-0 active:scale-[0.98]"
            />
          </div>
        )}
      </div>
    </PlayModal.Primary>
  );
};
