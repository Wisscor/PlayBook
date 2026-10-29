import { PlayText } from "@/components/ui/Text";
import { getDateDifference } from "@/lib/utils";
import { useMatchController } from "@/services/match";
import { MatchAnnouncement, PlayRequest } from "@/types/api";
import React from "react";

export const PlayRequestCard: React.FC<{
  request: PlayRequest;
}> = ({ request }) => {
  const { getMatch } = useMatchController();
  const [match, setMatch] = React.useState<MatchAnnouncement | undefined>(
    undefined,
  );

  React.useEffect(() => {
    void getMatch(
      request.announcement_id,
      (match) => {
        setMatch(match);
      },
      () => {},
    );
  }, [request.id]);

  if (match) {
    return (
      <div
        key={request.id}
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 te shadow-md shrink-0">
            {match.owner.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${match.owner.avatar}`}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <PlayText.Span
                texts={[
                  {
                    content:
                      `${match.owner.firstname.charAt(0)}${match.owner.lastname.charAt(0)}`.toUpperCase(),
                    className: "font-bold text-sm text-white",
                  },
                ]}
              />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PlayText.Span
                texts={[
                  {
                    content: `${match.owner.firstname} ${match.owner.lastname}`,
                    className: "font-bold text-sm text-white",
                  },
                ]}
              />
              <PlayText.Span
                texts={[
                  {
                    content: `@${match.owner.username}`,
                    className: "text-xs text-slate-400",
                  },
                ]}
              />
            </div>
            <PlayText.Span
              texts={[
                {
                  text: `requested-to-join`,
                  className: "text-xs text-slate-300",
                },
                {
                  content: `#${match.title}`,
                  className: "text-xs font-semibold text-sky-400",
                },
              ]}
            />
            <PlayText.Span
              texts={[
                {
                  text: `scheduled`,
                  className: "text-xs text-slate-300",
                },
                {
                  content: `${match.start_time.split("T")[0]} at ${match.start_time.split("T")[1].split(".")[0]}`,
                  className: "text-xs font-semibold text-sky-400",
                },
              ]}
            />
            <PlayText.Primary
              content={`${getDateDifference(request.created_at)}`}
              className="text-[10px] text-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
          {request.status === "pending" ? (
            <PlayText.Span
              texts={[
                {
                  text: `${request.status}`,
                  className: `rounded-full px-3 py-1 text-xs border font-semibold bg-amber-500/10 text-amber-400 border-amber-500/20`,
                },
              ]}
            />
          ) : (
            <PlayText.Span
              texts={[
                {
                  text: `${request.status}`,
                  className: `rounded-full px-3 py-1 text-xs font-semibold ${
                    request.status === "accepted"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`,
                },
              ]}
            />
          )}
        </div>
      </div>
    );
  }
};
