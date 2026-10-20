"use client";

import React, { useState } from "react";
import { Link } from "../../../../../i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { LeftSideSection } from "./components/leftSideSection";
import { RightSideSection } from "./components/rightSideSection";
import { FilterMatchModal } from "./components/filterMatchModal";
import { MatchFilterSection } from "./components/matchFilterSection";
import { PostsFeed } from "./components/postsFeed";

export const CommunityPageContent: React.FC = () => {
  const [matchSearchQuery, setMatchSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStartTime, setFilterStartTime] = useState("09:00");
  const [filterEndTime, setFilterEndTime] = useState("10:00");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [availableMatches, setAvailableMatches] = useState([
    {
      id: 1,
      name: "Downtown 5v5 Basketball",
      type: "Basketball",
      players: "4/5",
      date: "2026-06-01",
      startTime: "09:00",
      endTime: "10:00",
    },
    {
      id: 2,
      name: "Weekend Football League",
      type: "Football",
      players: "18/22",
      date: "2026-06-05",
      startTime: "14:00",
      endTime: "16:00",
    },
    {
      id: 3,
      name: "Casual Tennis Doubles",
      type: "Tennis",
      players: "2/4",
      date: "2026-06-10",
      startTime: "11:00",
      endTime: "12:30",
    },
  ]);

  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "Alex Johnson",
      username: "alexj",
      avatar: "AJ",
      createdAt: "2026-06-01T10:00:00Z",
      content:
        "Looking for one more player for our 5v5 basketball game tonight at the downtown court! Hit me up if you're around.",
    },
    {
      id: 2,
      author: "Sarah Connor",
      username: "sconnor",
      avatar: "SC",
      createdAt: "2026-06-02T14:30:00Z",
      content:
        "Great match today everyone! The new turf field is amazing. Looking forward to the next tournament.",
    },
  ]);

  const filteredMatches = availableMatches.filter((m) => {
    const matchesQuery =
      m.name.toLowerCase().includes(matchSearchQuery.toLowerCase()) ||
      m.type.toLowerCase().includes(matchSearchQuery.toLowerCase());

    const matchesDate = filterDate
      ? new Date(m.date).toDateString() === new Date(filterDate).toDateString()
      : true;

    const matchesStartTime = filterStartTime
      ? m.startTime >= filterStartTime
      : true;

    const matchesEndTime = filterEndTime ? m.endTime <= filterEndTime : true;

    return matchesQuery && matchesDate && matchesStartTime && matchesEndTime;
  });

  const handleClearFilters = () => {
    setFilterDate("");
    setFilterStartTime("09:00");
    setFilterEndTime("10:00");
    setIsFilterModalOpen(false);
  };

  let user = {
    name: "John Doe",
    username: "johndoe",
    avatar: "JD",
    bio: "Sports enthusiast and community organizer.",
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-white px-4 py-6 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <LeftSideSection user={user} />

        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <MatchFilterSection
            open={() => setIsFilterModalOpen(true)}
            filterEndDate={filterEndTime}
            filterStartDate={filterStartTime}
          />

          <PostsFeed posts={posts} />
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
        close={() => {
          setIsFilterModalOpen(false);
        }}
      />
    </div>
  );
};

export default CommunityPageContent;
