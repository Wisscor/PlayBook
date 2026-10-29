import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { MatchAnnouncement, PlayRequest } from "@/types/api";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";
import { MatchCard } from "./matchCard";

export const RightSideSection: React.FC<{
  userId?: string;
  matches: MatchAnnouncement[];
  total: number;
  pageNumber: number;
  pages: number;
  scroll: (pageNumber: number) => void;
  requests: PlayRequest[];
}> = ({ userId, matches, total, pageNumber, pages, scroll, requests }) => {
  const t = useTranslations();
  const [matchSearchQuery, setMatchSearchQuery] = React.useState<string>("");
  const [filteredMatches, setFilteredMatches] =
    React.useState<MatchAnnouncement[]>(matches);

  const filterMatch = () => {
    setFilteredMatches(
      matches.filter((match) => {
        const matchTitle = match.title.toLowerCase();
        const matchOwner =
          `${match.owner.firstname} ${match.owner.lastname}`.toLowerCase();
        const query = matchSearchQuery.toLowerCase();
        return matchTitle.includes(query) || matchOwner.includes(query);
      }),
    );
  };

  useEffect(() => {
    filterMatch();
  }, [matchSearchQuery]);

  useEffect(() => {
    setFilteredMatches(matches);
  }, [matches]);

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
                content: `available`,
                values: { total: total },
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
            filteredMatches.map((match) => {
              return (
                <MatchCard
                  userId={userId}
                  isOwner={userId === match.owner.id}
                  key={match.id}
                  match={match}
                />
              );
            })
          )}
        </div>

        <div className="flex items-center justify-center my-6 space-x-4">
          {pageNumber > 1 && (
            <button
              onClick={() => {
                scroll(pageNumber - 1);
              }}
              className="cursor-pointer"
            >
              <PlayText.Primary
                id="previous"
                className="text-sm text-slate-400 hover:text-slate-200 transition-color"
              />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center my-6 space-x-4">
          {pageNumber > 1 && (
            <button
              onClick={() => {
                scroll(pageNumber - 1);
              }}
              className="cursor-pointer"
            >
              <PlayText.Primary
                id="previous"
                className="text-sm text-slate-400 hover:text-slate-200 transition-color"
              />
            </button>
          )}
          <PlayText.Primary
            content={
              pages > 0 ? `${pageNumber}/${pages}` : pageNumber.toString()
            }
            className="text-sm text-slate-400 font-bold transition-color"
          />
          {pageNumber < pages && (
            <button
              onClick={() => {
                scroll(pageNumber + 1);
              }}
              className="cursor-pointer"
            >
              <PlayText.Primary
                id="next"
                className="text-sm text-slate-400 hover:text-slate-200 transition-color"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
