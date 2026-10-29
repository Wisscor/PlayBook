import { MatchAnnouncement, MatchAnnouncementRequestData } from "@/types/api";

export const isEmailValid = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const toForm = (
  match: MatchAnnouncement,
): MatchAnnouncementRequestData => {
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

export const getDateDifference = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  }
  return `${diffInDays}d`;
};
