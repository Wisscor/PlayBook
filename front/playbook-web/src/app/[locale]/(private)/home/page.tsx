"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { Action } from "./components/action";
import React from "react";
import { MatchModal } from "./components/matchModal";

export const HomePage = () => {
  const { goProfile } = useNavigation();
  const [matchModalOpen, setMatchModalOpen] = React.useState(false);
  const actions = [
    {
      action: "make-matche-room",
      description: "make-matche-room-description",
      icon: "/icons/friendship.png",
      onClick: () => {
        setMatchModalOpen(true);
      },
    },
    {
      action: "make-post",
      description: "make-post-description",
      icon: "/icons/addition.png",
      onClick: () => {},
    },
    {
      action: "go-to-profile",
      description: "go-to-profile-description",
      icon: "/icons/avatar.png",
      onClick: () => {
        goProfile();
      },
    },
    {
      action: "go-to-matches-posts",
      description: "go-to-matches-posts-description",
      icon: "/icons/view-files.png",
      onClick: () => {},
    },
  ];
  return (
    <div className="flex flex-col min-h-screen relative justify-center items-center py-8 p-4 lg:px-30">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          return <Action key={action.action} action={action} />;
        })}
      </div>

      {matchModalOpen && (
        <MatchModal
          isOpen={matchModalOpen}
          close={() => setMatchModalOpen(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
