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
}> = ({ filterStartDate, filterEndDate, open, selectedSport }) => {
  const t = useTranslations();
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="space-y-1 text-center sm:text-left">
        <PlayText.Primary
          id="match-filter-search"
          className="text-base font-bold text-white"
        />

        <PlayText.Primary
          content={
            filterStartDate || filterEndDate
              ? ` ${t("filtered-from")} ${filterStartDate || "Start"} ${t("filtered-to")} ${filterEndDate || "End"}`
              : t("search-by-date-range-sport")
          }
          className="text-xs text-slate-400"
        />
      </div>

      <PlayButton.Primary
        textClassName="text-sm font-semibold text-slate-950"
        title="search-by-date-range"
        type="button"
        onClick={() => open()}
        className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5  transition-all hover:bg-slate-100 active:scale-95 cursor-pointer shadow-lg whitespace-nowrap"
      />
    </div>
  );
};
