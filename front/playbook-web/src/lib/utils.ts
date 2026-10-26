import { MatchAnnouncement, MatchAnnouncementRequestData } from "@/types/api";

export const isEmailValid = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const toForm = (
  match: MatchAnnouncement,
): MatchAnnouncementRequestData => {
  console.log("processing ..... ", match);

  return {
    title: match.title,
    sport_id: match.sport.id,
    remaining_player_slots: match.remaining_player_slots,
    start_time: new Date(match.start_time)
      .toISOString()
      .split("T")[1]
      .slice(0, 5),
    end_time: new Date(match.end_time).toISOString().split("T")[1].slice(0, 5),
  };
};
