import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
import React from "react";

export const RightSideSection: React.FC<{
  filteredMatches: {
    id: number;
    name: string;
    type: string;
    players: string;
    date: string;
    startTime: string;
    endTime: string;
  }[];
  matchSearchQuery: string;
  setMatchSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}> = ({ filteredMatches, matchSearchQuery, setMatchSearchQuery }) => {
  const t = useTranslations();

  return (
    <div className="col-span-1 lg:col-span-1 flex flex-col gap-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 shadow-xl flex flex-col gap-4 sticky top-20">
        <div className="flex justify-between items-center">
          <PlayText.Primary
            id="find-matches"
            className="text-base font-bold text-white"
          />

          <PlayText.Span
            texts={[
              {
                content: `${filteredMatches.length} ${t("available")}`,
              },
            ]}
            className="text-xs text-slate-400 font-medium"
          />
        </div>

        <PlayInput.Primary
          type="text"
          value={matchSearchQuery}
          onChange={(e) => setMatchSearchQuery(e.target.value)}
          placeholder="search-matches"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-white/30 focus:outline-none backdrop-blur-md"
        />

        <div className="flex flex-col gap-3 mt-2">
          {filteredMatches.length === 0 ? (
            <PlayText.Primary
              id="no-matches"
              className="text-xs text-slate-400 text-center py-4"
            />
          ) : (
            filteredMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 backdrop-blur-md hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-start">
                  <PlayText.Primary
                    content={match.name}
                    className="font-bold text-xs text-white"
                  />
                  <PlayText.Span
                    texts={[{ content: match.type }]}
                    className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full text-sky-400"
                  />
                </div>
                <PlayText.Primary
                  content={`${match.date} • ${match.startTime} - ${match.endTime}`}
                  className="text-[11px] text-slate-400"
                />

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <PlayText.Span
                    texts={[{ content: `Slots: ${match.players}` }]}
                    className="text-[11px] font-medium text-slate-300"
                  />

                  <PlayButton.Primary
                    textClassName="text-xs font-semibold text-white"
                    title="join-match"
                    className="rounded-lg bg-white/10 px-3 py-1  hover:bg-white/20 transition-all cursor-pointer"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
