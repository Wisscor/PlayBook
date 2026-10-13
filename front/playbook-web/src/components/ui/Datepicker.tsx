"use client";

import React from "react";
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
    `rounded-md border p-2 outline-none focus:ring-2 ${
      invalid
        ? "border-error focus:ring-error/30"
        : "border-gray focus:ring-primary/30"
    }`;

  React.useEffect(() => {
    onError(!!dateError || !!startError || !!endError);
  }, [dateError, startError, endError]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <PlayText.Primary id="choose-date" className="text-sm text-black" />

        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => changeDate(e.target.value)}
          aria-invalid={!!dateError}
          className={inputClass(!!dateError)}
        />

        {dateError && (
          <PlayText.Primary id={dateError} className="text-sm text-error" />
        )}
      </label>

      {showTimeFields && (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <PlayText.Primary id="start-time" className="text-sm text-black" />

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
                className="text-sm text-error"
              />
            )}
          </label>

          <label className="flex flex-col gap-2">
            <PlayText.Primary id="end-time" className="text-sm text-black" />

            <input
              type="time"
              value={endTime}
              min={startValid ? startTime : undefined}
              onChange={(e) => changeEndTime(e.target.value)}
              aria-invalid={!!endError}
              className={inputClass(!!endError)}
            />

            {endError && (
              <PlayText.Primary id={endError} className="text-sm text-error" />
            )}
          </label>
        </div>
      )}
    </div>
  );
};
