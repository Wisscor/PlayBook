"use client";

import { PlayButton } from "@/components/ui/Button";
import { DateTimeRangePicker } from "@/components/ui/Datepicker";
import { PlayInput } from "@/components/ui/Input";
import { PlayList } from "@/components/ui/List";
import { PlayModal } from "@/components/ui/Modal";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

export const MatchModal: React.FC<{
  close: () => void;
  isOpen: boolean;
}> = ({ close, isOpen }) => {
  const [matchInfos, setMatchInfos] = useState({
    matchname: "",
    matchType: "",
    playerNbr: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
  });
  const t = useTranslations();

  const [matchTypeOpen, setMatchTypeOpen] = useState(false);
  const [playerNbrOpen, setPlayerNbrOpen] = useState(false);
  const [error, setError] = useState(false);

  const matchTypes = [
    {
      name: "Basketball",
      nbrOfPlayersPerTeam: 5,
    },
    {
      name: "Football",
      nbrOfPlayersPerTeam: 11,
    },
  ];

  const isFormComplete = !Object.values(matchInfos).includes("") && !error;

  return (
    <PlayModal.Primary title="create-match" isOpen={isOpen} close={close}>
      <div className="flex flex-col gap-5 p-1">
        <div className="space-y-4">
          <PlayInput.Primary
            onChange={(e) =>
              setMatchInfos({ ...matchInfos, matchname: e.target.value })
            }
            placeholder="match-name"
            value={matchInfos.matchname}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 backdrop-blur-md focus:border-white/30 focus:outline-none transition-all"
          />

          <PlayList.Primary
            value="name"
            toggle={() => setMatchTypeOpen(!matchTypeOpen)}
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
              toggle={() => setPlayerNbrOpen(!playerNbrOpen)}
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
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <DateTimeRangePicker
                onError={(err) => setError(err)}
                date={matchInfos.date}
                startTime={matchInfos.startTime}
                endTime={matchInfos.endTime}
                changeDate={(date) => setMatchInfos({ ...matchInfos, date })}
                changeStartTime={(startTime) =>
                  setMatchInfos({ ...matchInfos, startTime })
                }
                changeEndTime={(endTime) =>
                  setMatchInfos({ ...matchInfos, endTime })
                }
              />
            </div>
          )}
        </div>

        {isFormComplete && (
          <div className="pt-2">
            <PlayButton.Primary
              onClick={close}
              title="create-match"
              className="w-full rounded-2xl bg-white py-3.5 shadow-lg shadow-white/5 hover:bg-slate-100 transition-all font-semibold text-slate-950"
            />
          </div>
        )}
      </div>
    </PlayModal.Primary>
  );
};

export default MatchModal;
