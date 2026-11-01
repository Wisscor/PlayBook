"use client";

import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { useMatchController } from "@/services/match";
import { useState } from "react";
import { Action } from "./components/action";
import { MatchModal } from "./components/matchModal";
import { PostModal } from "./components/postModal";

const HomePage = () => {
  const { goProfile, goCommunity } = useNavigation();
  const { addMatch } = useMatchController();
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
      action: "go-to-community",
      description: "go-to-community-description",
      icon: "/icons/globe.png",
      onClick: () => {
        goCommunity();
      },
    },
  ];

  return (
    <div className="relative flex min-h-[calc(100vh-140px)] flex-col items-center justify-center gap-12 px-6 py-12 md:px-12 lg:px-20">
      <style>{`
        @keyframes home-card-in {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes home-hero-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes home-glow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.9;  transform: scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-anim { animation: none !important; }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="home-anim h-80 w-full max-w-4xl rounded-full bg-linear-to-r from-primary/25 via-extra/20 to-secondary/30 blur-3xl animate-[home-glow_8s_ease-in-out_infinite]" />
      </div>

      <div className="home-anim relative flex max-w-2xl flex-col items-center gap-3 text-center animate-[home-hero-in_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
        <PlayText.Primary
          id="home-title"
          className="bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl"
        />
        <PlayText.Primary
          id="home-subtitle"
          className="text-sm leading-relaxed text-stone-400 sm:text-base"
        />
      </div>

      <div className="relative grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <div
            key={action.action}
            style={{ animationDelay: `${150 + index * 110}ms` }}
            className={`home-anim h-full animate-[home-card-in_0.7s_cubic-bezier(0.22,1,0.36,1)_both] lg:col-span-2 lg:[&>button]:py-6`}
          >
            <Action action={action} />
          </div>
        ))}
      </div>

      {matchModalOpen && (
        <MatchModal
          isOpen={matchModalOpen}
          close={() => setMatchModalOpen(false)}
          onSave={(form) => {
            void addMatch(form, () => {
              setMatchModalOpen(false);
            });
          }}
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
