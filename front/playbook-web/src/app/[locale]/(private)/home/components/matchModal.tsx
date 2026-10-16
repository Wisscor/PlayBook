import { PlayButton } from "@/components/ui/Button";
import { DateTimeRangePicker } from "@/components/ui/Datepicker";
import { PlayList } from "@/components/ui/List";
import { PlayModal } from "@/components/ui/Modal";
import { api } from "@/services/api";
import axios from "axios";
import { useTranslations } from "next-intl";
import React from "react";

type Sport = {
  id: string;
  name: string;
};

export const MatchModal: React.FC<{
  close: () => void;
  isOpen: boolean;
}> = ({ close, isOpen }) => {
  const t = useTranslations();
  const [sports, setSports] = React.useState<Sport[]>([]);
  const [sportId, setSportId] = React.useState("");
  const [matchType, setMatchType] = React.useState("");
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("10:00");
  const [sportListOpen, setSportListOpen] = React.useState(false);
  const [typeListOpen, setTypeListOpen] = React.useState(false);
  const [dateError, setDateError] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoadingSports, setIsLoadingSports] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetForm = () => {
    setSportId("");
    setMatchType("");
    setDate("");
    setStartTime("09:00");
    setEndTime("10:00");
    setSportListOpen(false);
    setTypeListOpen(false);
    setDateError(false);
    setError(null);
  };

  React.useEffect(() => {
    const loadSports = async () => {
      try {
        const response = await api.get<Sport[]>("/sports");
        setSports(response.data);
      } catch (requestError) {
        if (axios.isAxiosError(requestError)) {
          const detail = requestError.response?.data?.detail;
          setError(
            typeof detail === "string"
              ? detail
              : t("match-sports-error"),
          );
        } else {
          setError(t("match-sports-error"));
        }
      } finally {
        setIsLoadingSports(false);
      }
    };

    void loadSports();
  }, [t]);

  const handleSubmit = async () => {
    if (!sportId || !matchType || !date || dateError || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.post("/match-announcements", {
        sport_id: sportId,
        type: matchType,
        start_time: new Date(`${date}T${startTime}:00`).toISOString(),
        end_time: new Date(`${date}T${endTime}:00`).toISOString(),
      });
      resetForm();
      close();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const detail = requestError.response?.data?.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          setError(detail[0].msg);
        } else {
          setError(t("match-create-error"));
        }
      } else {
        setError(t("match-create-error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    close();
  };

  return (
    <PlayModal.Primary
      title="create-match"
      isOpen={isOpen}
      close={handleClose}
    >
      <>
        <div className="flex flex-col gap-4">
          <PlayList.Primary
            value="name"
            toggle={() => setSportListOpen((open) => !open)}
            isOpen={sportListOpen}
            items={sports}
            text={
              isLoadingSports
                ? t("loading-sports")
                : sports.find((sport) => sport.id === sportId)?.name ??
                  t("select-sport")
            }
            choseItem={(sport: Sport) => {
              setSportId(sport.id);
              setSportListOpen(false);
            }}
          />

          <PlayList.Primary
            value="label"
            toggle={() => setTypeListOpen((open) => !open)}
            isOpen={typeListOpen}
            items={[
              { label: t("need-player"), value: "player" },
              { label: t("need-opponent"), value: "opponent" },
            ]}
            text={
              matchType === "player"
                ? t("need-player")
                : matchType === "opponent"
                  ? t("need-opponent")
                  : t("select-match-type")
            }
            choseItem={(item: { label: string; value: string }) => {
              setMatchType(item.value);
              setTypeListOpen(false);
            }}
          />

          <DateTimeRangePicker
            onError={setDateError}
            date={date}
            startTime={startTime}
            endTime={endTime}
            changeDate={setDate}
            changeStartTime={setStartTime}
            changeEndTime={setEndTime}
          />
        </div>

        {error && (
          <p role="alert" className="text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {sportId && matchType && date && !dateError && (
          <PlayButton.Primary
            onClick={handleSubmit}
            title={
              isSubmitting
                ? "creating-match"
                : "create-match"
            }
            className="bg-primary"
            textClassName="text-white"
          />
        )}
      </>
    </PlayModal.Primary>
  );
};
