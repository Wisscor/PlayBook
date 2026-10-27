import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayLabel } from "@/components/ui/Label";
import React from "react";

export const ModifyMatchModal: React.FC<{
  close: () => void;
  matchInfos: {
    matchname: string;
    matchType: string;
    playerNbr: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  setMatchInfos: React.Dispatch<
    React.SetStateAction<{
      matchname: string;
      matchType: string;
      playerNbr: string;
      date: string;
      startTime: string;
      endTime: string;
      status: string;
    }>
  >;
  handleUpdateMatch: (e: React.SubmitEvent) => void;
}> = ({ close, handleUpdateMatch, matchInfos, setMatchInfos }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-lg font-bold text-white">Edit Match</h3>
          <button
            type="button"
            onClick={() => close()}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUpdateMatch} className="flex flex-col gap-4">
          <PlayLabel.Primary content="Match Name">
            <PlayInput.Primary
              value={matchInfos.matchname}
              onChange={(e) =>
                setMatchInfos({ ...matchInfos, matchname: e.target.value })
              }
              placeholder="match-name"
            />
          </PlayLabel.Primary>

          <PlayLabel.Primary content="Match Type">
            <PlayInput.Primary
              value={matchInfos.matchType}
              onChange={(e) =>
                setMatchInfos({ ...matchInfos, matchType: e.target.value })
              }
              placeholder="match-type"
            />
          </PlayLabel.Primary>

          <div className="grid grid-cols-2 gap-4">
            <PlayLabel.Primary content="Players">
              <PlayInput.Primary
                value={matchInfos.playerNbr}
                onChange={(e) =>
                  setMatchInfos({
                    ...matchInfos,
                    playerNbr: e.target.value,
                  })
                }
                placeholder="nbr-players"
              />
            </PlayLabel.Primary>

            <PlayLabel.Primary content="Date">
              <PlayInput.Primary
                type="date"
                value={matchInfos.date}
                onChange={(e) =>
                  setMatchInfos({ ...matchInfos, date: e.target.value })
                }
              />
            </PlayLabel.Primary>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PlayLabel.Primary content="Start Time">
              <PlayInput.Primary
                type="time"
                value={matchInfos.startTime}
                onChange={(e) =>
                  setMatchInfos({
                    ...matchInfos,
                    startTime: e.target.value,
                  })
                }
              />
            </PlayLabel.Primary>

            <PlayLabel.Primary content="End Time">
              <PlayInput.Primary
                type="time"
                value={matchInfos.endTime}
                onChange={(e) =>
                  setMatchInfos({ ...matchInfos, endTime: e.target.value })
                }
              />
            </PlayLabel.Primary>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => close()}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <PlayButton.Primary
              title="save-changes"
              className="flex-1 rounded-2xl bg-white py-3 font-semibold text-slate-950 hover:bg-slate-100 transition-all cursor-pointer"
              type="submit"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
