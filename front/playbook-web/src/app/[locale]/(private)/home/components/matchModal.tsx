"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayModal } from "@/components/ui/Modal";
import { getSports } from "@/services/sports";
import { Sport } from "@/types/api";
import React, { useEffect, useState } from "react";

export interface MatchFormData {
  id?: string;
  title: string;
  sport_id: string;
  remaining_player_slots: number;
  start_time: string;
  end_time: string;
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
  remaining_player_slots: 1,
  start_time: "",
  end_time: "",
};

export const MatchModal: React.FC<MatchModalProps> = ({
  close,
  isOpen,
  initialData,
  onSave,
}) => {
  const [form, setForm] = useState<MatchFormData>(emptyForm);
  const [sports, setSports] = useState<Sport[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      setForm(initialData ?? emptyForm);
      setError("");
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

  return (
    <PlayModal.Primary
      title={initialData ? "edit-match" : "create-match"}
      isOpen={isOpen}
      close={close}
    >
      <div className="flex flex-col gap-4 p-1">
        <PlayInput.Primary
          placeholder="match-name"
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
        />
        <select
          value={form.sport_id}
          disabled={sports.length === 0}
          onChange={(event) => {
            const sport = sports.find((item) => item.id === event.target.value);
            update("sport_id", event.target.value);
            if (
              sport &&
              form.remaining_player_slots > sport.max_players
            ) {
              update("remaining_player_slots", sport.max_players);
            }
          }}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-5 py-3.5 text-white outline-none"
        >
          <option value="">
            {sports.length === 0 ? "No sports available" : "Select a sport"}
          </option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
        <PlayInput.Primary
          type="number"
          placeholder="select-player-number"
          value={String(form.remaining_player_slots)}
          onChange={(event) =>
            update(
              "remaining_player_slots",
              Math.max(
                1,
                Math.min(
                  Number(event.target.value),
                  sports.find((sport) => sport.id === form.sport_id)
                    ?.max_players ?? Number(event.target.value),
                ),
              ),
            )
          }
        />
        <label className="text-sm text-slate-300">
          Start time
          <input
            type="datetime-local"
            value={form.start_time}
            onChange={(event) => update("start_time", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-white"
          />
        </label>
        <label className="text-sm text-slate-300">
          End time
          <input
            type="datetime-local"
            value={form.end_time}
            onChange={(event) => update("end_time", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-white"
          />
        </label>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <PlayButton.Primary
          title={isSaving ? "saving" : initialData ? "save-changes" : "create-match"}
          onClick={handleSubmit}
          className="w-full"
        />
      </div>
    </PlayModal.Primary>
  );
};

export default MatchModal;
