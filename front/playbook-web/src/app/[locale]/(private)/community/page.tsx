"use client";

import { api } from "@/services/api";
import { MatchAnnouncement, PostPage } from "@/types/api";
import React, { useEffect, useMemo, useState } from "react";
import { FilterMatchModal } from "./components/filterMatchModal";
import { LeftSideSection } from "./components/leftSideSection";
import { MatchFilterSection } from "./components/matchFilterSection";
import { PostsFeed } from "./components/postsFeed";
import { RightSideSection } from "./components/rightSideSection";

interface CommunityMatch {
  id: string;
  name: string;
  type: string;
  players: string;
  date: string;
  startTime: string;
  endTime: string;
}

export const CommunityPageContent: React.FC = () => {
  const [matchSearchQuery, setMatchSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [posts, setPosts] = useState<PostPage["items"]>([]);
  const [availableMatches, setAvailableMatches] = useState<CommunityMatch[]>(
    [],
  );
  const [user, setUser] = useState({
    name: "",
    username: "",
    avatar: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCommunity = async () => {
      try {
        const [profileResponse, feedResponse, matchesResponse] =
          await Promise.all([
            api.get<{
              firstname: string;
              lastname: string;
              username: string;
              bio?: string;
            }>("/users/me"),
            api.get<PostPage>("/feed", {
              params: { limit: 20, offset: 0 },
            }),
            api.get<{ items: MatchAnnouncement[] }>("/match-announcements", {
              params: { limit: 100, offset: 0 },
            }),
          ]);

        const profile = profileResponse.data;
        setUser({
          name: `${profile.firstname} ${profile.lastname}`,
          username: profile.username,
          avatar: `${profile.firstname.charAt(0)}${profile.lastname.charAt(0)}`,
          bio: profile.bio ?? "",
        });
        setPosts(feedResponse.data.items);
        setAvailableMatches(
          matchesResponse.data.items.map((match) => ({
            id: match.id,
            name: match.title,
            type: match.sport.name,
            players: String(match.remaining_player_slots),
            date: new Date(match.start_time).toLocaleDateString(),
            startTime: new Date(match.start_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            endTime: new Date(match.end_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        );
      } catch (requestError) {
        console.error("Unable to load community:", requestError);
        setError("Unable to load community");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = window.setTimeout(loadCommunity, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredMatches = useMemo(
    () =>
      availableMatches.filter((match) => {
        const query = matchSearchQuery.toLowerCase();
        const matchesQuery =
          match.name.toLowerCase().includes(query) ||
          match.type.toLowerCase().includes(query);
        const matchesDate = filterDate
          ? new Date(match.date).toDateString() ===
            new Date(filterDate).toDateString()
          : true;
        const matchesStartTime = filterStartTime
          ? match.startTime >= filterStartTime
          : true;
        const matchesEndTime = filterEndTime
          ? match.endTime <= filterEndTime
          : true;
        return matchesQuery && matchesDate && matchesStartTime && matchesEndTime;
      }),
    [
      availableMatches,
      filterDate,
      filterEndTime,
      filterStartTime,
      matchSearchQuery,
    ],
  );

  const handleClearFilters = () => {
    setFilterDate("");
    setFilterStartTime("");
    setFilterEndTime("");
    setIsFilterModalOpen(false);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-6 text-white md:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-4">
        <LeftSideSection user={user} />
        <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
          <MatchFilterSection
            open={() => setIsFilterModalOpen(true)}
            filterEndDate={filterEndTime}
            filterStartDate={filterStartTime}
          />
          {isLoading ? (
            <p className="py-12 text-center text-slate-300">Loading...</p>
          ) : error ? (
            <p className="py-12 text-center text-rose-400">{error}</p>
          ) : posts.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-slate-400">
              No posts yet.
            </p>
          ) : (
            <PostsFeed posts={posts} />
          )}
        </div>
        <RightSideSection
          setMatchSearchQuery={setMatchSearchQuery}
          filteredMatches={filteredMatches}
          matchSearchQuery={matchSearchQuery}
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
      />
    </div>
  );
};

export default CommunityPageContent;
