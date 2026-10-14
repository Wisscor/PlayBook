"use client";
import { PlayText } from "@/components/ui/Text";
import { User } from "@/types/user";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { useSearchParams } from "next/navigation";
import React from "react";
import { MatchesSection } from "./matchesSection";
import { PostsSection } from "./postsSection";

export const HistoryPageContent: React.FC<{
  sessionCookie: RequestCookie | undefined;
}> = ({ sessionCookie }) => {
  const searchParams = useSearchParams();

  const type = searchParams.get("type") ?? "matches";

  let user: User | null = null;

  if (sessionCookie?.value) {
    try {
      user = JSON.parse(sessionCookie.value);
    } catch (error) {
      console.error("Malformed user session data:", error);
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center py-8">
        <PlayText.Primary
          id="login-to-see"
          className="text-black text-center align-middle"
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-white100 p-4 lg:px-30 justify-center items-center py-8 gap-4">
      {type == "posts" ? <PostsSection /> : <MatchesSection />}
    </div>
  );
};
