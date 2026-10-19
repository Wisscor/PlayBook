"use client";

import { PlayText } from "@/components/ui/Text";
import { User } from "@/types/user";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import React from "react";
import { MatchesSection } from "./matchesSection";
import { PostsSection } from "./postsSection";
import { PlayButton } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export const HistoryPageContent: React.FC<{
  sessionCookie: RequestCookie | undefined;
}> = ({ sessionCookie }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const type = searchParams.get("type") ?? "matches";

  let user: User | null = null;

  if (sessionCookie?.value) {
    try {
      user = JSON.parse(sessionCookie.value);
    } catch (error) {
      console.error("Malformed user session data:", error);
    }
  }

  const handleTabChange = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", newType);
    router.replace(`${pathname}?rel=${params.toString()}`);
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-8">
        <PlayText.Primary
          id="login-to-see"
          className="text-lg font-medium text-slate-300 text-center"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 p-6 md:p-12 lg:px-30 py-12 gap-8 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-6 sm:flex-row">
        <PlayText.Primary
          id={type === "posts" ? "my-posts" : "my-matches"}
          className="text-2xl font-bold tracking-tight text-white"
        />

        <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("type", "matches");
              router.replace(`${pathname}?${params.toString()}`);
            }}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all cursor-pointer ${
              type === "matches"
                ? "bg-white text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t("matches")}
          </button>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("type", "posts");
              router.replace(`${pathname}?${params.toString()}`);
            }}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all cursor-pointer ${
              type === "posts"
                ? "bg-white text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t("posts")}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        {type === "posts" ? <PostsSection /> : <MatchesSection />}
      </div>
    </div>
  );
};
