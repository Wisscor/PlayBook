"use client";

import { PlayText } from "@/components/ui/Text";
import { api } from "@/services/api";
import { ApiError, Player } from "@/types/api";
import { useNavigation } from "@/hooks/useNavigation";
import React from "react";

export const MatchParticipantsPage = () => {
  const { goUserProfile } = useNavigation();
  const [matchId, setMatchId] = React.useState<string | null>(null);
  const [matchTitle, setMatchTitle] = React.useState("");
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [pendingRequests, setPendingRequests] = React.useState<
    { id: string; sender: Player }[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [pendingDecision, setPendingDecision] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedMatchId = localStorage.getItem("match_id_for_participants");
      setMatchId(storedMatchId);
      setIsLoading(Boolean(storedMatchId));
      if (!storedMatchId) return;

      const loadParticipants = async () => {
        try {
          const [response, requestsResponse] = await Promise.all([
            api.get<{
              title: string;
              accepted_players: Player[];
            }>(`/match-announcements/${storedMatchId}`),
            api.get<{
              items: {
                id: string;
                sender: Player;
                status: string;
              }[];
            }>(`/match-announcements/${storedMatchId}/play-requests`),
          ]);
          setMatchTitle(response.data.title);
          setPlayers(response.data.accepted_players);
          setPendingRequests(
            requestsResponse.data.items.filter(
              (request) => request.status === "pending",
            ),
          );
        } catch (requestError) {
          console.error("Unable to load joined players:", requestError);
          setError("Unable to load joined players");
        } finally {
          setIsLoading(false);
        }
      };

      void loadParticipants();
    });

    return () => window.clearTimeout(timer);
  }, []);

  const decideRequest = async (requestId: string, status: "accepted" | "declined") => {
    if (pendingDecision) return;
    setPendingDecision(requestId);
    try {
      await api.patch(`/play-requests/${requestId}`, { status });
      setPendingRequests((current) =>
        current.filter((request) => request.id !== requestId),
      );
      if (status === "accepted") {
        const request = pendingRequests.find((item) => item.id === requestId);
        if (request) setPlayers((current) => [...current, request.sender]);
      }
    } catch (requestError) {
      const apiError =
        requestError && typeof requestError === "object"
          ? (requestError as Partial<ApiError>)
          : {};
      console.error("Unable to decide player request:", {
        error: requestError,
        message: apiError.message ?? String(requestError),
        status: apiError.status ?? null,
        details: apiError.details ?? null,
      });
      setError(apiError.message ?? "Unable to update player request");
    } finally {
      setPendingDecision(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col bg-slate-950 px-4 py-8 text-white md:px-12 lg:px-20">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="border-b border-white/10 pb-4">
          <PlayText.Primary
            content={matchTitle || "Joined players"}
            className="text-2xl font-extrabold tracking-tight text-white"
          />
          <PlayText.Primary
            content={`${players.length} joined`}
            className="text-xs text-slate-400"
          />
        </div>

        {isLoading ? (
          <PlayText.Primary
            content="Loading..."
            className="py-8 text-center text-sm text-slate-400"
          />
        ) : error || !matchId ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
            <PlayText.Primary
              content={error || "Match not found"}
              className="text-sm font-medium text-slate-400"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <PlayText.Primary
                content="Joined players"
                className="text-sm font-bold text-white"
              />
              {players.length === 0 ? (
                <PlayText.Primary
                  content="No players have joined this match yet"
                  className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400"
                />
              ) : null}
              {players.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => goUserProfile(player.id)}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg transition-all hover:bg-white/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 text-sm font-bold text-white">
                    {player.avatar ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${player.avatar}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      `${player.firstname.charAt(0)}${player.lastname.charAt(0)}`
                    )}
                  </div>
                  <div className="min-w-0">
                    <PlayText.Primary
                      content={`${player.firstname} ${player.lastname}`}
                      className="truncate text-sm font-bold text-white"
                    />
                    <PlayText.Primary
                      content={`@${player.username}`}
                      className="truncate text-xs text-slate-400"
                    />
                  </div>
                </button>
              ))}
            </section>

            {pendingRequests.length > 0 && (
              <section className="flex flex-col gap-3">
                <PlayText.Primary
                  content="Pending requests"
                  className="text-sm font-bold text-white"
                />
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
                  >
                    <button
                      type="button"
                      onClick={() => goUserProfile(request.sender.id)}
                      className="min-w-0 text-left cursor-pointer"
                    >
                      <PlayText.Primary
                        content={`${request.sender.firstname} ${request.sender.lastname}`}
                        className="truncate text-sm font-bold text-white"
                      />
                      <PlayText.Primary
                        content={`@${request.sender.username}`}
                        className="truncate text-xs text-slate-400"
                      />
                    </button>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={pendingDecision === request.id}
                        onClick={() => void decideRequest(request.id, "accepted")}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 cursor-pointer disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={pendingDecision === request.id}
                        onClick={() => void decideRequest(request.id, "declined")}
                        className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 cursor-pointer disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchParticipantsPage;
