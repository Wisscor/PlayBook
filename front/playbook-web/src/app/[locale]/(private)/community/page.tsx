"use client";

import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { pageSize } from "@/lib/constants";
import { useMatchController } from "@/services/match";
import { usePlayRequestsController } from "@/services/playRequest";
import { usePostController } from "@/services/post";
import { useProfileController } from "@/services/profile";
import { Sport } from "@/types/api";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { CommunityHero } from "./components/communityHero";
import { FilterMatchModal } from "./components/filterMatchModal";
import { MatchFilterSection } from "./components/matchFilterSection";
import { MatchesRail } from "./components/matchesRail";
import { Pagination } from "./components/pagination";
import { PostsFeed } from "./components/postsFeed";
import { QuickActions } from "./components/quickActions";
import { SectionTitle } from "./components/sectionTitle";

const CommunityPage = () => {
  const { connectedUser, isLoading } = useAuth();
  const { fetchUser } = useProfileController();
  const { loadFeeds, feedPageNumber, feeds, totalFeeds, feedPages } =
    usePostController();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterStartTime, setFilterStartTime] = useState<string>("");
  const [filterEndTime, setFilterEndTime] = useState<string>("");
  const [selectedSport, setSelectedSport] = useState<Sport | undefined>(
    undefined,
  );
  const [matchStatus, setMatchStatus] = useState<string | undefined>(undefined);
  const { loadMatches, pageNumber, matches, total, pages } =
    useMatchController();
  const { loadRequests, requests } = usePlayRequestsController();

  const handleClearFilters = () => {
    setFilterDate("");
    setFilterStartTime("");
    setFilterEndTime("");
    setSelectedSport(undefined);
    setMatchStatus(undefined);
  };

  const buildMatchFilters = () => [
    { field: "sport_id", value: selectedSport?.id || "" },
    {
      field: "start_from",
      value:
        filterDate.length > 0 ? `${filterDate}T${filterStartTime}:00.000Z` : "",
    },
    {
      field: "end_to",
      value:
        filterDate.length > 0 ? `${filterDate}T${filterEndTime}:00.000Z` : "",
    },
    { field: "match_status", value: matchStatus || "" },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUser(() => {});
      void loadFeeds(feedPageNumber);
      void loadRequests("sent", undefined, 1, 100);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isFilterModalOpen) {
      void loadMatches(undefined, 1, pageSize, () => {}, buildMatchFilters());
    }
  }, [isFilterModalOpen]);

  let feedContent: React.ReactNode;
  if (isLoading && totalFeeds === 0) {
    feedContent = (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 120}ms` }}
            className="flex animate-pulse flex-col gap-4 rounded-3xl border border-white/10 bg-secondary/20 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary/50" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-1/3 rounded-full bg-secondary/50" />
                <div className="h-3 w-1/2 rounded-full bg-secondary/30" />
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary/30" />
            <div className="h-3 w-2/3 rounded-full bg-secondary/30" />
          </div>
        ))}
        <PlayText.Primary
          id="loading"
          className="col-span-full py-2 text-center text-sm text-stone-400"
        />
      </div>
    );
  } else if (totalFeeds === 0 && !isLoading) {
    feedContent = (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-secondary/20 p-12 text-center backdrop-blur-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-primary/40 to-extra/40">
          <Image
            alt=""
            aria-hidden
            src={"/icons/globe.png"}
            width={32}
            height={32}
            className="opacity-70"
          />
        </div>
        <PlayText.Primary
          id="no-feeds"
          className="text-sm font-medium text-amber-300"
        />
      </div>
    );
  } else {
    feedContent = (
      <div className="flex flex-col gap-6">
        <PostsFeed feeds={feeds} />
        <Pagination
          page={feedPageNumber}
          pages={feedPages}
          onPrevious={() => {
            void loadFeeds(feedPageNumber - 1);
          }}
          onNext={() => {
            void loadFeeds(feedPageNumber + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex w-full flex-col gap-10 pb-6 text-stone-100">
      <style>{`
        @keyframes cm-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cm-float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(28px, -20px, 0) scale(1.1); }
        }
        @keyframes cm-sheen {
          from { background-position: 0% 50%; }
          to   { background-position: 200% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cm-anim { animation: none !important; }
        }
      `}</style>

      <CommunityHero
        user={connectedUser}
        totalMatches={total}
        totalPosts={totalFeeds}
      />

      <QuickActions />

      <MatchesRail
        requests={requests}
        scroll={(pageNumber) => {
          void loadMatches(
            undefined,
            pageNumber,
            pageSize,
            () => {},
            buildMatchFilters(),
          );
        }}
        pageNumber={pageNumber}
        pages={pages}
        total={total}
        matches={matches}
        userId={connectedUser?.id}
        toolbar={
          <MatchFilterSection
            open={() => setIsFilterModalOpen(true)}
            filterEndDate={filterEndTime}
            filterStartDate={filterStartTime}
            selectedSport={selectedSport}
            filterDate={filterDate}
            matchStatus={matchStatus}
          />
        }
      />

      <section className="flex flex-col gap-5">
        <SectionTitle
          id="latest-posts"
          count={totalFeeds > 0 ? totalFeeds : undefined}
        />
        {feedContent}
      </section>

      <FilterMatchModal
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filterStartTime={filterStartTime}
        setFilterStartTime={setFilterStartTime}
        filterEndTime={filterEndTime}
        setFilterEndTime={setFilterEndTime}
        handleClearFilters={handleClearFilters}
        isOpen={isFilterModalOpen}
        close={() => setIsFilterModalOpen(false)}
        setSelectedSport={setSelectedSport}
        selectedSport={selectedSport}
        setMatchStatus={setMatchStatus}
        matchStatus={matchStatus}
      />
    </div>
  );
};

export default CommunityPage;
