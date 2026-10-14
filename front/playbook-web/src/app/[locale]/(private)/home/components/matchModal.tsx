import { PlayButton } from "@/components/ui/Button";
import { DateTimeRangePicker } from "@/components/ui/Datepicker";
import { PlayInput } from "@/components/ui/Input";
import { PlayList } from "@/components/ui/List";
import { PlayModal } from "@/components/ui/Modal";
import { useTranslations } from "next-intl";
import React from "react";

export const MatchModal: React.FC<{
  close: () => void;
  isOpen: boolean;
}> = ({ close, isOpen }) => {
  const [matchInfos, setMatchInfos] = React.useState({
    matchname: "",
    matchType: "",
    playerNbr: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
  });
  const t = useTranslations();

  const [matchTypeOpen, setMatchTypeOpen] = React.useState(false);
  const [playerNbrOpen, setPlayerNbrOpen] = React.useState(false);
  const [error, setError] = React.useState(false);

  const matchTypes = [
    {
      name: "Baskteball",
      nbrOfPlayersPerTeam: 5,
    },
    {
      name: "Football",
      nbrOfPlayersPerTeam: 11,
    },
  ];

  return (
    <PlayModal.Primary
      title="create-match"
      isOpen={isOpen}
      close={() => {
        close();
      }}
    >
      <>
        <div className="flex flex-col gap-4">
          <PlayInput.Primary
            onChange={(e) =>
              setMatchInfos({ ...matchInfos, matchname: e.target.value })
            }
            placeholder="match-name"
            value={matchInfos.matchname}
            className="bg-primary/20 py-2 text-sm placeholder:text-gray text-black"
          />

          <PlayList.Primary
            value="name"
            toggle={() => {
              setMatchTypeOpen(!matchTypeOpen);
            }}
            isOpen={matchTypeOpen}
            items={matchTypes}
            text={
              matchInfos.matchType.length > 0
                ? matchInfos.matchType
                : t("select-match-type")
            }
            choseItem={(item) => {
              setMatchInfos({
                ...matchInfos,
                matchType: item.name,
                playerNbr: "",
              });
              setMatchTypeOpen(false);
            }}
          />

          {matchInfos.matchType.length > 0 && (
            <PlayList.Primary
              toggle={() => {
                setPlayerNbrOpen(!playerNbrOpen);
              }}
              isOpen={playerNbrOpen}
              items={Array.from(
                {
                  length:
                    matchTypes.find(
                      (type) => type.name === matchInfos.matchType,
                    )?.nbrOfPlayersPerTeam ?? 5,
                },
                (_, index) => index + 1,
              )}
              text={
                matchInfos.playerNbr.length > 0
                  ? matchInfos.playerNbr
                  : t("select-player-number")
              }
              choseItem={(item) => {
                setMatchInfos({
                  ...matchInfos,
                  playerNbr: item.toString(),
                });
                setPlayerNbrOpen(false);
              }}
            />
          )}

          {matchInfos.playerNbr.length > 0 && (
            <DateTimeRangePicker
              onError={(error) => setError(error)}
              date={matchInfos.date}
              startTime={matchInfos.startTime}
              endTime={matchInfos.endTime}
              changeDate={(date) => {
                setMatchInfos({
                  ...matchInfos,
                  date: date,
                });
              }}
              changeStartTime={(startTime) => {
                setMatchInfos({
                  ...matchInfos,
                  startTime: startTime,
                });
              }}
              changeEndTime={(endTime) => {
                setMatchInfos({
                  ...matchInfos,
                  endTime: endTime,
                });
              }}
            />
          )}
        </div>

        {!Object.values(matchInfos).includes("") && !error && (
          <PlayButton.Primary
            onClick={() => {
              close();
            }}
            title="create-match"
            className="bg-primary"
            textClassName="text-white"
          />
        )}
      </>
    </PlayModal.Primary>
  );
};
