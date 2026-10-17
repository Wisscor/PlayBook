"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { useState } from "react";
import { Action } from "./components/action";
import { MatchModal } from "./components/matchModal";
import { PostModal } from "./components/postModal";

export const HomePage = () => {
  const { goProfile } = useNavigation();
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);

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
      onClick: () => {
        setPostModalOpen(true);
      },
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
      onClick: () => {
        //TODO: Implement navigation to community page
      },
    },
  ];

  return (
    <div className="relative flex min-h-[calc(100vh-140px)] flex-col items-center justify-center py-12 px-6 md:px-12 lg:px-20">
      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Action key={action.action} action={action} />
        ))}
      </div>

      {matchModalOpen && (
        <MatchModal
          isOpen={matchModalOpen}
          close={() => setMatchModalOpen(false)}
        />
      )}

      {postModalOpen && (
        <PostModal
          isOpen={postModalOpen}
          close={() => setPostModalOpen(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
