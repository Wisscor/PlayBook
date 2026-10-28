import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { useMatchController } from "@/services/match";
import { MatchAnnouncement, PlayRequest } from "@/types/api";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";

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
  const { joinMatch, isJoining } = useMatchController();
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
                content: `${total} ${t("available")}`,
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
              const isUserOwner = userId === match.owner.id;
              const alreadyJoined = requests.some(
                (request) => request.announcement_id === match.id,
              );

              return (
                <div
                  key={match.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 backdrop-blur-md hover:bg-white/10 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <PlayText.Primary
                      content={`${match.title} (${userId === match.owner.id ? t("you") : match.owner.firstname + " " + match.owner.lastname})`}
                      className="font-bold text-xs text-white"
                    />
                    <PlayText.Span
                      texts={[{ content: match.sport.name }]}
                      className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full text-sky-400"
                    />
                  </div>
                  <PlayText.Primary
                    content={`${new Date(match.start_time).toISOString().split("T")[0]} • ${new Date(match.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(match.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                    className="text-[11px] text-slate-400"
                  />

                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <PlayText.Span
                      texts={[
                        {
                          content: `Slotss: ${match.remaining_player_slots}`,
                        },
                      ]}
                      className="text-[11px] font-medium text-slate-300"
                    />

                    {isUserOwner === false && alreadyJoined === false && (
                      <PlayButton.Primary
                        disabled={isJoining}
                        onClick={() => {
                          void joinMatch(match.id, () => {
                            window.location.reload();
                          });
                        }}
                        textClassName="text-xs font-semibold text-white"
                        title="join-match"
                        className="rounded-lg bg-white/10 px-3 py-1  hover:bg-white/20 transition-all cursor-pointer"
                      />
                    )}
                  </div>
                </div>
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
