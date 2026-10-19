"use client";

import React, { useEffect } from "react";
import { PlayText } from "./Text";

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function getLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export const DateTimeRangePicker: React.FC<{
  date: string;
  startTime: string;
  endTime: string;
  changeDate: (date: string) => void;
  changeStartTime: (startTime: string) => void;
  changeEndTime: (endTime: string) => void;
  onError: (error: boolean) => void;
}> = ({
  date,
  startTime,
  endTime,
  changeDate,
  changeStartTime,
  changeEndTime,
  onError,
}) => {
  const now = new Date();
  const today = getLocalDate();

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;

  const dateValid = isValidDate(date);
  const dateInPast = dateValid && date < today;
  const isToday = date === today;

  const startValid = isValidTime(startTime);
  const endValid = isValidTime(endTime);

  const startIsPast = isToday && startValid && startTime < currentTime;
  const endIsPast = isToday && endValid && endTime <= currentTime;

  const timeOrderValid = startValid && endValid && startTime < endTime;

  const showTimeFields = dateValid && !dateInPast;

  const isDateError = () => {
    if (date.length === 0) return "";
    else if (!dateValid) return "invalid-date";
    else if (dateInPast) return "past-date";
    else return "";
  };

  const dateError = isDateError();

  const isStartError = () => {
    if (startTime.length === 0) return "";
    else if (!startValid) return "invalid-start-time";
    else if (startIsPast) return "past-start-time";
    else if (!timeOrderValid) return "invalid-time";
    else return "";
  };

  const startError = isStartError();

  const isEndError = () => {
    if (endTime.length === 0) return "";
    else if (!endValid) return "invalid-end-time";
    else if (endIsPast) return "past-end-time";
    else if (!timeOrderValid) return "invalid-time";
    else return "";
  };

  const endError = isEndError();

  const inputClass = (invalid: boolean) =>
    `w-full rounded-2xl border px-4 py-3 text-sm text-white backdrop-blur-md outline-none transition-all [color-scheme:dark] ${
      invalid
        ? "border-rose-500/50 bg-rose-500/10 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
        : "border-white/10 bg-white/5 focus:border-white/30 focus:bg-white/10 focus:ring-2 focus:ring-white/20"
    }`;

  useEffect(() => {
    onError(!!dateError || !!startError || !!endError);
  }, [dateError, startError, endError, onError]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <PlayText.Primary
          id="choose-date"
          className="text-xs font-semibold uppercase tracking-wider text-slate-300"
        />

        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => changeDate(e.target.value)}
          aria-invalid={!!dateError}
          className={inputClass(!!dateError)}
        />

        {dateError && (
          <PlayText.Primary
            id={dateError}
            className="text-xs font-medium text-rose-400"
          />
        )}
      </label>

      {showTimeFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <PlayText.Primary
              id="start-time"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300"
            />

            <input
              type="time"
              value={startTime}
              onChange={(e) => changeStartTime(e.target.value)}
              aria-invalid={!!startError}
              className={inputClass(!!startError)}
            />

            {startError && (
              <PlayText.Primary
                id={startError}
                className="text-xs font-medium text-rose-400"
              />
            )}
          </label>

          <label className="flex flex-col gap-2">
            <PlayText.Primary
              id="end-time"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300"
            />

            <input
              type="time"
              value={endTime}
              min={startValid ? startTime : undefined}
              onChange={(e) => changeEndTime(e.target.value)}
              aria-invalid={!!endError}
              className={inputClass(!!endError)}
            />

            {endError && (
              <PlayText.Primary
                id={endError}
                className="text-xs font-medium text-rose-400"
              />
            )}
          </label>
        </div>
      )}
    </div>
  );
};
