"use client";

import { PlayText } from "@/components/ui/Text";
import { usePlayRequestsController } from "@/services/playRequest";
import Image from "next/image";
import React, { useEffect } from "react";
import { PlayRequestCard } from "./components/playRequestCard";

const PlayRequestsPage = () => {
  const { loadRequests, requests, requestsPageNumber, requestsPages } =
    usePlayRequestsController();

  const [filter, setFilter] = React.useState<"all" | "pending" | "accepted">(
    "all",
  );

  const tabs: Array<"all" | "pending" | "accepted"> = [
    "all",
    "pending",
    "accepted",
  ];

  useEffect(() => {
    void loadRequests("sent", filter, 1);
  }, [filter]);

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col gap-8 px-4 py-8 text-stone-100 md:px-12 lg:px-20">
      <style>{`
        @keyframes rp-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rp-anim { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="rp-anim relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-primary/25 bg-secondary/20 p-5 shadow-xl shadow-black/30 backdrop-blur-xl animate-[rp-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-e-12 -top-12 h-36 w-36 rounded-full bg-primary/25 blur-3xl"
          />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/30">
              <Image
                alt="play requests"
                src={"/icons/friendship.png"}
                width={28}
                height={28}
              />
            </div>
            <PlayText.Primary
              id="play-requests"
              className="bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent"
            />
          </div>

          <div className="relative grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-neutral-950/40 p-1 backdrop-blur-md">
            {tabs.map((tab) => (
              <button
                title={tab}
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`cursor-pointer rounded-xl px-4 py-2 capitalize transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  filter === tab
                    ? "bg-linear-to-r from-primary to-extra shadow-lg shadow-primary/30"
                    : "bg-transparent hover:bg-white/10"
                }`}
              >
                <PlayText.Primary
                  id={tab}
                  className={`text-xs font-semibold transition-colors duration-300 ${
                    filter === tab ? "text-white" : "text-stone-400"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {requests.length === 0 ? (
            <div className="rp-anim flex flex-col items-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-secondary/20 p-12 text-center backdrop-blur-xl animate-[rp-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-primary/40 to-extra/40">
                <Image
                  alt="no requests"
                  src={"/icons/friendship.png"}
                  width={32}
                  height={32}
                  className="opacity-70"
                />
              </div>
              <PlayText.Primary
                id="no-play-requests"
                className="text-sm font-medium text-stone-400"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {requests.map((request, index) => {
                  return (
                    <div
                      key={request.id}
                      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
                      className="rp-anim animate-[rp-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]"
                    >
                      <PlayRequestCard request={request} />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-secondary/30 p-1.5 backdrop-blur-md">
                {requestsPageNumber > 1 && (
                  <button
                    onClick={() => {
                      void loadRequests("sent", filter, requestsPageNumber - 1);
                    }}
                    className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 active:scale-95"
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:translate-x-0.5"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <PlayText.Primary
                      id="previous"
                      className="text-sm text-stone-300 transition-colors group-hover:text-white"
                    />
                  </button>
                )}
                <PlayText.Primary
                  content={
                    requestsPages > 0
                      ? `${requestsPageNumber}/${requestsPages}`
                      : requestsPageNumber.toString()
                  }
                  className="rounded-full bg-linear-to-r from-primary to-extra px-4 py-1.5 text-sm font-bold tabular-nums text-white shadow-md shadow-primary/30"
                />
                {requestsPageNumber < requestsPages && (
                  <button
                    onClick={() => {
                      void loadRequests("sent", filter, requestsPageNumber + 1);
                    }}
                    className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 active:scale-95"
                  >
                    <PlayText.Primary
                      id="next"
                      className="text-sm text-stone-300 transition-colors group-hover:text-white"
                    />
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayRequestsPage;
