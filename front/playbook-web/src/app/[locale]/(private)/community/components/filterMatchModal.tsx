import { PlayModal } from "@/components/ui/Modal";
import { DateTimeRangePicker } from "@/components/ui/Datepicker";
import React, { useEffect, useState } from "react";
import { PlayButton } from "@/components/ui/Button";
import { PlayList } from "@/components/ui/List";
import { useMatchController } from "@/services/match";
import { Sport } from "@/types/api";
import { useTranslations } from "next-intl";

export const FilterMatchModal: React.FC<{
  isOpen: boolean;
  close: () => void;
  filterDate: string;
  setFilterDate: React.Dispatch<React.SetStateAction<string>>;
  filterStartTime: string;
  setFilterStartTime: React.Dispatch<React.SetStateAction<string>>;
  filterEndTime: string;
  setFilterEndTime: React.Dispatch<React.SetStateAction<string>>;
  handleClearFilters: () => void;
  setSelectedSport: React.Dispatch<React.SetStateAction<Sport | undefined>>;
  selectedSport: Sport | undefined;
  setMatchStatus: React.Dispatch<React.SetStateAction<string | undefined>>;
  matchStatus: string | undefined;
}> = ({
  close,
  isOpen,
  filterDate,
  setFilterDate,
  filterStartTime,
  setFilterStartTime,
  filterEndTime,
  setFilterEndTime,
  handleClearFilters,
  setSelectedSport,
  selectedSport,
  setMatchStatus,
  matchStatus,
}) => {
  const { sports, getSports } = useMatchController();
  const t = useTranslations();

  const [hasError, setHasError] = useState(false);
  const [matchTypeOpen, setMatchTypeOpen] = useState(false);
  const [matchStatusOpen, setMatchStatusOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      setHasError(false);
      void getSports(
        () => {},
        () => {
          setHasError(true);
        },
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  return (
    <PlayModal.Primary
      isOpen={isOpen}
      close={() => {
        close();
      }}
      title="filter-matches"
    >
      <div className="w-full rounded-3xl border border-white/10 bg-slate-950 p-6 sm:p-8 shadow-2xl flex flex-col self-center gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <PlayList.Primary
            value="name"
            toggle={() => setMatchStatusOpen(!matchStatusOpen)}
            isOpen={matchStatusOpen}
            items={["upcoming", "live", "finished"]}
            text={matchStatus ?? t("select-match-status")}
            choseItem={(item) => {
              setMatchStatus(item);
              setMatchStatusOpen(false);
            }}
          />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <PlayList.Primary
            value="name"
            toggle={() => setMatchTypeOpen(!matchTypeOpen)}
            isOpen={matchTypeOpen}
            items={sports}
            text={
              selectedSport
                ? (selectedSport?.name ?? t("select-match-type"))
                : t("select-match-type")
            }
            choseItem={(item) => {
              setSelectedSport(item);
              setMatchTypeOpen(false);
            }}
          />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <DateTimeRangePicker
            onError={(err) => setHasError(err !== undefined)}
            date={filterDate}
            startTime={filterStartTime}
            endTime={filterEndTime}
            changeDate={(date) => setFilterDate(date)}
            changeStartTime={(startTime) => {
              setHasError(false);
              setFilterStartTime(startTime);
            }}
            changeEndTime={(endTime) => {
              setHasError(false);
              setFilterEndTime(endTime);
            }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <PlayButton.Primary
            title="reset"
            textClassName="text-sm font-semibold text-slate-300"
            type="button"
            onClick={handleClearFilters}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3  hover:bg-white/10 transition-all cursor-pointer text-sm"
          />

          <PlayButton.Primary
            title="apply-filter"
            type="button"
            textClassName={`text-sm font-semibold ${hasError ? "text-slate-400" : "text-slate-950"}`}
            disabled={hasError}
            onClick={() => {
              if (!hasError) close();
            }}
            className={`flex-1 rounded-2xl py-3 font-semibold transition-all text-sm ${
              hasError
                ? "bg-white/20 cursor-not-allowed"
                : "bg-white hover:bg-slate-100 cursor-pointer shadow-lg"
            }`}
          />
        </div>
      </div>
    </PlayModal.Primary>
  );
};

export default FilterMatchModal;
