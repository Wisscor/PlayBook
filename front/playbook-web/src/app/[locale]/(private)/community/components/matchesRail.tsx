import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { MatchAnnouncement, PlayRequest } from "@/types/api";
import Image from "next/image";
import React, { useEffect } from "react";
import { MatchCard } from "./matchCard";
import { Pagination } from "./pagination";
import { SectionTitle } from "./sectionTitle";

export const MatchesRail: React.FC<{
  userId?: string;
  matches: MatchAnnouncement[];
  total: number;
  pageNumber: number;
  pages: number;
  scroll: (pageNumber: number) => void;
  requests: PlayRequest[];
  toolbar?: React.ReactNode;
}> = ({
  userId,
  matches,
  total,
  pageNumber,
  pages,
  scroll,
  requests,
  toolbar,
}) => {
  const [matchSearchQuery, setMatchSearchQuery] = React.useState<string>("");
  const [filteredMatches, setFilteredMatches] =
    React.useState<MatchAnnouncement[]>(matches);
  const railRef = React.useRef<HTMLDivElement>(null);

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

  const nudge = (towardEnd: boolean) => {
    const rail = railRef.current;
    if (!rail) return;
    const rtl = getComputedStyle(rail).direction === "rtl";
    const sign = (towardEnd ? 1 : -1) * (rtl ? -1 : 1);
    rail.scrollBy({ left: sign * 340, behavior: "smooth" });
  };

  return (
    <section className="flex flex-col gap-5">
      <SectionTitle
        id="find-matches"
        count={
          <PlayText.Span
            texts={[
              {
                text: "available",
                values: { total: total },
                className: "text-xs font-semibold tabular-nums text-amber-200",
              },
            ]}
          />
        }
      >
        <div className="group relative w-full sm:w-80">
          <Image
            alt=""
            aria-hidden
            src={"/icons/search.png"}
            width={16}
            height={16}
            className="pointer-events-none absolute inset-s-4 top-1/2 z-10 -translate-y-1/2 opacity-50 transition-opacity duration-300 group-focus-within:opacity-100"
          />
          <PlayInput.Primary
            type="text"
            value={matchSearchQuery}
            onChange={(e) => setMatchSearchQuery(e.target.value)}
            placeholder="search-matches"
            className="w-full rounded-2xl py-2.5 ps-11 pe-4 text-sm"
          />
        </div>
      </SectionTitle>

      {toolbar}

      {filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-secondary/20 p-12 text-center backdrop-blur-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-primary/40 to-extra/40">
            <Image
              alt=""
              aria-hidden
              src={"/icons/friendship.png"}
              width={32}
              height={32}
              className="opacity-70"
            />
          </div>
          <PlayText.Primary
            id="no-matches"
            className="text-sm font-medium text-amber-300"
          />
        </div>
      ) : (
        <div className="relative">
          <div
            ref={railRef}
            className="-mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-6 pt-3 [scrollbar-color:var(--color-primary)_transparent] scrollbar-thin"
          >
            {filteredMatches.map((match, index) => {
              return (
                <div
                  key={match.id}
                  style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                  className="cm-anim flex w-72 shrink-0 snap-start animate-[cm-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards] sm:w-80"
                >
                  <MatchCard
                    isOwner={userId === match.owner.id}
                    match={match}
                    requests={requests}
                  />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => nudge(false)}
            aria-label="Scroll matches back"
            className="absolute inset-s-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer rtl:translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-neutral-950/80 text-stone-200 shadow-lg shadow-black/50 backdrop-blur-md transition-all duration-300 hover:border-primary/60 hover:bg-primary/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-90 md:flex"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 rtl:rotate-180"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => nudge(true)}
            aria-label="Scroll matches forward"
            className="absolute inset-e-0 top-1/2 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center rtl:-translate-x-1/2 justify-center rounded-full border border-white/15 bg-neutral-950/80 text-stone-200 shadow-lg shadow-black/50 backdrop-blur-md transition-all duration-300 hover:border-primary/60 hover:bg-primary/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-90 md:flex"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 rtl:rotate-180"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      <Pagination
        page={pageNumber}
        pages={pages}
        onPrevious={() => scroll(pageNumber - 1)}
        onNext={() => scroll(pageNumber + 1)}
      />
    </section>
  );
};
