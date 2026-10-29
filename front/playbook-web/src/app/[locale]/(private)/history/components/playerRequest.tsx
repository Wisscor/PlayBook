import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { useMatchController } from "@/services/match";
import { PlayRequest } from "@/types/api";
import Image from "next/image";
import React from "react";

export const PlayerRequest: React.FC<{
  request: PlayRequest;
}> = ({ request }) => {
  const { goUserProfile } = useNavigation();
  const { decide } = useMatchController();

  const getColor = () => {
    switch (request.status) {
      case "pending":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
      case "accepted":
        return "bg-green-500/10 text-green-400 border border-green-500/30";
      case "declined":
        return "bg-red-500/10 text-red-400 border border-red-500/30";
      default:
        return "bg-slate-800 text-slate-300 border border-white/10";
    }
  };

  return (
    <div
      className={`${getColor()} flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl backdrop-blur-xl p-3.5 sm:p-4 shadow-lg transition-all`}
    >
      <button
        type="button"
        onClick={() => {
          goUserProfile(request.sender.id);
        }}
        className="flex items-center gap-3 text-left cursor-pointer group/sender"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 font-bold text-sm text-white shadow-md overflow-hidden">
          {request.sender.avatar ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${request.sender.avatar}`}
              alt={`${request.sender.firstname} avatar`}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              {request.sender.firstname.charAt(0)}
              {request.sender.lastname.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <PlayText.Primary
            content={`${request.sender.firstname} ${request.sender.lastname}`}
            className="font-bold text-sm sm:text-base text-white truncate group-hover/sender:text-slate-200 transition-colors"
          />
          <PlayText.Primary
            content={`@${request.sender.username}`}
            className="text-xs text-slate-400 truncate"
          />
        </div>
      </button>

      {request.status === "pending" && (
        <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          <button
            type="button"
            onClick={() => {
              void decide(request.id, "declined");
            }}
            className="flex items-center justify-center rounded-xl border border-red-500/30 bg-red-600/20 px-3.5 py-2 backdrop-blur-md transition-all hover:bg-red-600 hover:text-white shadow-sm cursor-pointer"
            aria-label="Reject request"
          >
            <Image
              alt="reject"
              src={"/icons/close.png"}
              width={14}
              height={14}
              className="opacity-90 invert"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              void decide(request.id, "accepted");
            }}
            className="flex items-center justify-center rounded-xl border border-green-500/30 bg-green-600/20 px-3.5 py-2 backdrop-blur-md transition-all hover:bg-green-600 hover:text-white shadow-sm cursor-pointer"
            aria-label="Accept request"
          >
            <Image
              alt="accept"
              src={"/icons/check.png"}
              width={14}
              height={14}
              className="opacity-90 invert"
            />
          </button>
        </div>
      )}
    </div>
  );
};
