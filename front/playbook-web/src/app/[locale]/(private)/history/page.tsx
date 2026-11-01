"use client";

import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { PostsSection } from "./components/postsSection";
import { MatchesSection } from "./components/matchesSection";

export const HistoryPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const type = searchParams.get("type") ?? "matches";

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col gap-8 px-4 py-8 text-stone-100 md:px-12 lg:px-20">
      <style>{`
        @keyframes hp-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hp-anim { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="hp-anim relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-primary/25 bg-secondary/20 p-5 shadow-xl shadow-black/30 backdrop-blur-xl animate-[hp-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-e-12 -top-12 h-36 w-36 rounded-full bg-primary/25 blur-3xl"
          />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/30">
              <Image
                key={type}
                alt={type === "posts" ? "posts" : "matches"}
                src={
                  type === "posts"
                    ? "/icons/addition.png"
                    : "/icons/friendship.png"
                }
                width={28}
                height={28}
                className="hp-anim animate-[hp-in_0.4s_cubic-bezier(0.22,1,0.36,1)_backwards]"
              />
            </div>
            <PlayText.Primary
              id={type === "posts" ? "my-posts" : "my-matches"}
              className="bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent"
            />
          </div>

          <div className="relative grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-neutral-950/40 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("type", "matches");
                router.replace(`${pathname}?${params.toString()}`);
              }}
              className={`cursor-pointer rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                type === "matches"
                  ? "bg-linear-to-r from-primary to-extra text-white shadow-lg shadow-primary/30"
                  : "text-stone-400 hover:bg-white/10 hover:text-white"
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
              className={`cursor-pointer rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                type === "posts"
                  ? "bg-linear-to-r from-primary to-extra text-white shadow-lg shadow-primary/30"
                  : "text-stone-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t("posts")}
            </button>
          </div>
        </div>

        <div
          key={type}
          className="hp-anim rounded-3xl border border-white/10 bg-secondary/20 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl animate-[hp-in_0.5s_cubic-bezier(0.22,1,0.36,1)_0.1s_backwards] md:p-8"
        >
          {type === "posts" ? <PostsSection /> : <MatchesSection />}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
