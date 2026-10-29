import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { usePlayRequestsController } from "@/services/playRequest";
import { MatchAnnouncement } from "@/types/api";
import { useTranslations } from "next-intl";
import React from "react";

export const MatchCard: React.FC<{
  match: MatchAnnouncement;
  isOwner: boolean;
  userId?: string;
}> = ({ match, isOwner, userId }) => {
  const t = useTranslations();
  const { joinMatch, isJoining, loadRequests, requests } =
    usePlayRequestsController();
  const [alreadyJoined, setAlreadyJoined] = React.useState<boolean>(false);
  const [pending, setPending] = React.useState<boolean>(false);

  React.useEffect(() => {
    void loadRequests("sent", undefined, 1, 100);
  }, [match.id]);

  React.useEffect(() => {
    setAlreadyJoined(
      requests.some(
        (request) =>
          request.announcement_id === match.id && request.status === "accepted",
      ),
    );

    setPending(
      requests.some(
        (request) =>
          request.announcement_id === match.id && request.status === "pending",
      ),
    );
  }, [requests]);

  return (
    <div
      key={match.id}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 backdrop-blur-md hover:bg-white/10 transition-all"
    >
      <div className="flex justify-between items-start">
        <PlayText.Primary
          content={`${match.title} (${isOwner ? t("you") : match.owner.firstname + " " + match.owner.lastname})`}
          className="font-bold text-xs text-white"
        />
        <PlayText.Span
          texts={[{ content: match.sport.name }]}
          className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full text-sky-400"
        />
      </div>
      <PlayText.Primary
        content={`${new Date(match.start_time).toISOString().split("T")[0]} • ${new Date(match.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(match.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        className="text-[11px] text-slate-400"
      />

      <div className="flex justify-between items-center pt-2 border-t border-white/5">
        <PlayText.Span
          texts={[
            {
              text: `slots`,
              values: { slots: match.remaining_player_slots },
            },
          ]}
          className="text-[11px] font-medium text-slate-300"
        />

        {!isOwner && alreadyJoined === false && pending === false && (
          <PlayButton.Primary
            disabled={isJoining}
            onClick={() => {
              void joinMatch(match.id, () => {
                window.location.reload();
              });
            }}
            textClassName="text-xs font-semibold text-white"
            title="join-match"
            className="rounded-lg bg-white/10 px-3 py-1  hover:bg-white/20 transition-all cursor-pointer"
          />
        )}

        {alreadyJoined && (
          <PlayText.Span
            texts={[
              {
                text: "already-joined",
                className: "text-[11px] font-semibold text-sky-400",
              },
            ]}
          />
        )}

        {pending && (
          <PlayText.Span
            texts={[
              {
                text: "pending",
                className: "text-[11px] font-semibold text-yellow-400",
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};
