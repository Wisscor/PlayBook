import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { Sport } from "@/types/api";
import { useTranslations } from "next-intl";
import React from "react";

export const MatchFilterSection: React.FC<{
  filterStartDate: string;
  filterEndDate: string;
  open: () => void;
  selectedSport: Sport | undefined;
  filterDate?: string;
  matchStatus?: string;
}> = ({
  filterStartDate,
  filterEndDate,
  open,
  selectedSport,
  filterDate,
  matchStatus,
}) => {
  const t = useTranslations();

  const chips = [selectedSport?.name, filterDate, matchStatus].filter(
    (chip): chip is string => Boolean(chip),
  );
  const isActive =
    Boolean(filterStartDate || filterEndDate) || chips.length > 0;

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-secondary/20 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-4">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/30">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
          </svg>
          {isActive && (
            <span className="absolute -inset-e-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-amber-300 ring-2 ring-neutral-950" />
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <PlayText.Primary
            id="match-filter-search"
            className="text-sm font-bold text-stone-100"
          />

          <PlayText.Primary
            content={
              filterStartDate || filterEndDate
                ? ` ${t("filtered-from")} ${filterStartDate || "Start"} ${t("filtered-to")} ${filterEndDate || "End"}`
                : t("search-by-date-range-sport")
            }
            className="text-xs text-stone-400"
          />

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {chips.map((chip) => (
                <div
                  key={chip}
                  className="rounded-full border border-primary/40 bg-primary/15 px-3 py-0.5 text-[11px] font-semibold capitalize text-amber-200"
                >
                  {chip}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PlayButton.Primary
        textClassName="text-sm font-semibold text-white"
        title="search-by-date-range"
        type="button"
        onClick={() => open()}
        className="shrink-0 whitespace-nowrap rounded-xl px-5 py-2.5"
      />
    </div>
  );
};
