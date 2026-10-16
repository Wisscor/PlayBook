"use client";
import { useSearchParams } from "next/navigation";
import React from "react";
import { MatchesSection } from "./matchesSection";
import { PostsSection } from "./postsSection";

export const HistoryPageContent: React.FC = () => {
  const searchParams = useSearchParams();

  const type = searchParams.get("type") ?? "matches";

  return (
    <div className="flex flex-col min-h-screen bg-white100 p-4 lg:px-30 justify-center items-center py-8 gap-4">
      {type === "posts" ? (
        <PostsSection />
      ) : type === "matches" ? (
        <MatchesSection />
      ) : (
        <>
          <PostsSection />
          <MatchesSection />
        </>
      )}
    </div>
  );
};
