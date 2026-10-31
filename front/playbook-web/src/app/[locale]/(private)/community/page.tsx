"use client";

import { useAuth } from "@/hooks/contexts/authContext";
import { pageSize } from "@/lib/constants";
import { useMatchController } from "@/services/match";
import { usePostController } from "@/services/post";
import { useProfileController } from "@/services/profile";
import { Sport } from "@/types/api";
import React, { useEffect, useState } from "react";
import { FilterMatchModal } from "./components/filterMatchModal";
import { LeftSideSection } from "./components/leftSideSection";
import { MatchFilterSection } from "./components/matchFilterSection";
import { PostsFeed } from "./components/postsFeed";
import { RightSideSection } from "./components/rightSideSection";
import { usePlayRequestsController } from "@/services/playRequest";
import { PlayText } from "@/components/ui/Text";

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUser(() => {});
      void loadFeeds(feedPageNumber);
      void loadRequests("sent");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isFilterModalOpen) {
      void loadMatches(undefined, pageNumber, pageSize, () => {}, [
        {
          field: "sport_id",
          value: selectedSport?.id || "",
        },
        {
          field: "start_from",
          value:
            filterDate.length > 0
              ? `${filterDate}T${filterStartTime}:00.000Z`
              : "",
        },
        {
          field: "end_to",
          value:
            filterDate.length > 0
              ? `${filterDate}T${filterEndTime}:00.000Z`
              : "",
        },
        {
          field: "match_status",
          value: matchStatus || "",
        },
      ]);
    }
  }, [isFilterModalOpen]);

  let feedContent: React.ReactNode;
  if (isLoading && totalFeeds === 0) {
    feedContent = (
      <PlayText.Primary
        id="loading"
        className="py-12 text-center text-slate-300"
      />
    );
  } else if (totalFeeds === 0 && !isLoading) {
    feedContent = (
      <PlayText.Primary
        id="no-feeds"
        className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-slate-400"
      />
    );
  } else {
    feedContent = (
      <div>
        <PostsFeed feeds={feeds} />
        <div className="flex items-center justify-center my-6 space-x-4">
          {feedPageNumber > 1 && (
            <button
              onClick={() => {
                void loadFeeds(feedPageNumber - 1);
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
              feedPageNumber > 0
                ? `${feedPageNumber}/${feedPages}`
                : feedPageNumber.toString()
            }
            className="text-sm text-slate-400 font-bold transition-color"
          />
          {feedPageNumber < feedPages && (
            <button
              onClick={() => {
                void loadFeeds(feedPageNumber + 1);
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
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-6 text-white md:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-3">
        <LeftSideSection user={connectedUser} />
        <div className="col-span-1 flex flex-col gap-6 lg:col-span-1">
          <MatchFilterSection
            open={() => setIsFilterModalOpen(true)}
            filterEndDate={filterEndTime}
            filterStartDate={filterStartTime}
            selectedSport={selectedSport}
          />
          {feedContent}
        </div>
        <RightSideSection
          scroll={(pageNumber) => {
            void loadMatches(undefined, pageNumber, pageSize, () => {});
          }}
          pageNumber={pageNumber}
          pages={pages}
          total={total}
          matches={matches}
          userId={connectedUser?.id}
          requests={requests}
        />
      </div>
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
