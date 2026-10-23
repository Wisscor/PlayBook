"use client";

import { PlayButton } from "@/components/ui/Button";
import { DateTimeRangePicker } from "@/components/ui/Datepicker";
import { PlayInput } from "@/components/ui/Input";
import { PlayLabel } from "@/components/ui/Label";
import { PlayList } from "@/components/ui/List";
import { PlayModal } from "@/components/ui/Modal";
import { getSports } from "@/services/sports";
import { Sport } from "@/types/api";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

export interface MatchFormData {
  id?: string;
  title: string;
  sport_id: string;
  remaining_player_slots: number;
  start_time: string;
  end_time: string;
  date: string;
}

interface MatchModalProps {
  close: () => void;
  isOpen: boolean;
  initialData?: MatchFormData | null;
  onSave: (data: MatchFormData) => Promise<void>;
}

const emptyForm: MatchFormData = {
  title: "",
  sport_id: "",
  remaining_player_slots: 0,
  start_time: "09:00",
  end_time: "10:00",
  date: "",
};

export const MatchModal: React.FC<MatchModalProps> = ({
  close,
  isOpen,
  initialData,
  onSave,
}) => {
  const t = useTranslations();

  const [form, setForm] = useState<MatchFormData>(emptyForm);
  const [sports, setSports] = useState<Sport[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [matchTypeOpen, setMatchTypeOpen] = useState(false);
  const [playerNbrOpen, setPlayerNbrOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      setForm(initialData ?? emptyForm);
      setError(undefined);
      getSports()
        .then(setSports)
        .catch((requestError) => {
          console.error("Unable to load sports:", requestError);
          setError("Unable to load sports");
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialData, isOpen]);

  const update = <K extends keyof MatchFormData>(
    field: K,
    value: MatchFormData[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async () => {
    if (
      !form.title.trim() ||
      !form.sport_id ||
      !form.start_time ||
      !form.end_time
    ) {
      setError("Please fill in every field");
      return;
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError("End time must be after start time");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onSave(form);
      close();
    } catch (requestError) {
      console.error("Unable to save match:", requestError);
      setError("Unable to save match");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormComplete =
    !Object.values(form).some((val) => val === "") && !error;

  const handleFormSubmit = () => {
    onSave(form);

    close();
  };

  const isEditing = Boolean(initialData?.id !== undefined);

  return (
    <PlayModal.Primary
      title={isEditing ? "edit-match" : "create-match"}
      isOpen={isOpen}
      close={close}
    >
      <div className="flex flex-col gap-5 p-1">
        <div className="space-y-4">
          <PlayLabel.Primary>
            <PlayInput.Primary
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="match-name"
              value={form.title}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 backdrop-blur-md focus:border-white/30 focus:outline-none transition-all"
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
          )}

          {form.remaining_player_slots > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <DateTimeRangePicker
                onError={(err) => setError(err)}
                date={form.date}
                startTime={form.start_time}
                endTime={form.end_time}
                changeDate={(date) => setForm({ ...form, date })}
                changeStartTime={(startTime) =>
                  setForm({ ...form, start_time: startTime })
                }
                changeEndTime={(endTime) =>
                  setForm({ ...form, end_time: endTime })
                }
              />
            </div>
          )}
        </div>

        {isFormComplete && (
          <div className="pt-2">
            <PlayButton.Primary
              onClick={handleSubmit}
              title={isEditing ? "save-changes" : "create-match"}
              className="w-full rounded-2xl bg-white py-3.5 shadow-lg shadow-white/5 hover:bg-slate-100 transition-all font-semibold text-slate-950 cursor-pointer"
            />
          </div>
        )}
      </div>
    </PlayModal.Primary>
  );
};

export default MatchModal;
