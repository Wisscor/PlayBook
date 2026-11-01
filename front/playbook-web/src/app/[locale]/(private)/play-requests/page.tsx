"use client";

import { PlayText } from "@/components/ui/Text";
import { usePlayRequestsController } from "@/services/playRequest";
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
    void loadRequests("sent", filter, requestsPageNumber);
  }, [filter]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 text-white px-4 py-8 md:px-12 lg:px-20 gap-8">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <PlayText.Primary
            id="play-requests"
            className="text-2xl font-extrabold tracking-tight text-white"
          />

          <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-md">
            {tabs.map((tab) => (
              <button
                title={tab}
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-xl bg- px-3 py-1.5 ${filter === tab ? "bg-indigo-500" : "bg-transparent"}  capitalize transition-all cursor-pointer `}
              >
                <PlayText.Primary
                  id={tab}
                  className={`text-xs font-semibold ${filter === tab ? "text-slate-950" : "text-slate-400 hover:text-white"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {requests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
              <PlayText.Primary
                id="no-play-requests"
                className="text-sm font-medium text-slate-400"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center my-6 space-x-4">
                {requestsPageNumber > 1 && (
                  <button
                    onClick={() => {
                      void loadRequests("sent", filter, requestsPageNumber - 1);
                    }}
                    className="cursor-pointer"
                  >
                    <PlayText.Primary
                      id="previous"
                      className="text-sm text-slate-400 hover:text-slate-200 transition-color"
                    />
                  </button>
                )}
                <PlayText.Primary
                  content={
                    requestsPages > 0
                      ? `${requestsPageNumber}/${requestsPages}`
                      : requestsPageNumber.toString()
                  }
                  className="text-sm text-slate-400 font-bold transition-color"
                />
                {requestsPageNumber < requestsPages && (
                  <button
                    onClick={() => {
                      void loadRequests("sent", filter, requestsPageNumber + 1);
                    }}
                    className="cursor-pointer"
                  >
                    <PlayText.Primary
                      id="next"
                      className="text-sm text-slate-400 hover:text-slate-200 transition-color"
                    />
                  </button>
                )}
              </div>

              {requests.map((request) => {
                return <PlayRequestCard key={request.id} request={request} />;
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayRequestsPage;
