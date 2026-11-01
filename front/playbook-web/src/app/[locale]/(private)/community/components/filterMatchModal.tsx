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
      <div className="flex w-full flex-col gap-4 pt-1">
        <div className="rounded-2xl border border-white/10 bg-secondary/20 p-3 backdrop-blur-md transition-colors duration-300 hover:border-primary/40">
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
        <div className="rounded-2xl border border-white/10 bg-secondary/20 p-3 backdrop-blur-md transition-colors duration-300 hover:border-primary/40">
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
        <div className="rounded-2xl border border-white/10 bg-secondary/20 p-4 backdrop-blur-md transition-colors duration-300 hover:border-primary/40">
          <DateTimeRangePicker
            onError={(err) => setHasError(err !== undefined)}
            date={filterDate}
            startTime={filterStartTime}
            endTime={filterEndTime}
            changeDate={(date) => {
              setHasError(false);
              setFilterDate(date);
            }}
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

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <PlayButton.Secondary
            title="reset"
            textClassName="text-sm font-semibold text-stone-200"
            type="button"
            onClick={handleClearFilters}
            className="w-full py-3"
          />

          <PlayButton.Primary
            title="apply-filter"
            type="button"
            textClassName="text-sm font-semibold text-white"
            disabled={hasError}
            onClick={() => {
              if (!hasError) close();
            }}
            className="w-full py-3"
          />
        </div>
      </div>
    </PlayModal.Primary>
  );
};
