import { PlayText } from "@/components/ui/Text";
import Image from "next/image";
import React from "react";

export interface MatchProps {
  match: {
    id: number;
    matchname: string;
    matchType: string;
    playerNbr: string | number;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const Match: React.FC<MatchProps> = ({ match, onEdit, onDelete }) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "live":
        return "bg-red-500 text-white animate-pulse";
      case "upcoming":
        return "bg-blue-600 text-white";
      case "completed":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-700 text-white";
    }
  };

  return (
    <div className="rounded-md border border-gray/50 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
      <div className="py-2 px-4 flex justify-between items-center bg-extra">
        <PlayText.Span
          texts={[
            {
              content: match.status,
              className: `text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${getStatusBadgeColor(
                match.status,
              )}`,
            },
          ]}
        />
        <PlayText.Primary
          content={match.date}
          className="text-sm text-white self-end"
        />
      </div>

      <div className="py-3 px-4 bg-white100 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <PlayText.Primary
            content={match.matchname}
            className="text-base font-bold text-black"
          />
          <PlayText.Span
            texts={[
              {
                content: match.matchType,
                className:
                  "text-xs px-2 py-0.5 bg-gray/20 text-black rounded font-medium",
              },
            ]}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-black/70 pt-2 border-t border-gray/20">
          <div>
            <PlayText.Span
              texts={[
                { content: "Time: ", className: "font-semibold" },
                {
                  content: `${match.startTime} - ${match.endTime}`,
                  className: "text-black/80 mx-1",
                },
              ]}
            />
          </div>
          <div>
            <PlayText.Span
              texts={[
                { content: "Players: ", className: "font-semibold" },
                {
                  content: String(match.playerNbr),
                  className: "text-black/80 mx-1",
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="py-2 px-4 flex justify-end gap-3 bg-extra border-t border-gray/30">
        {onEdit && (
          <button
            onClick={() => onEdit(match.id)}
            className="hover:opacity-80 transition-opacity"
            aria-label="Edit match"
          >
            <Image
              alt="edit"
              src={"/icons/edit-white.png"}
              width={18}
              height={18}
            />
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(match.id)}
            className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
            aria-label="Delete match"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
