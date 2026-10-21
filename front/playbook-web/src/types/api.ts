export interface Post {
  id: string;
  caption: string;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    firstname: string;
    lastname: string;
    avatar?: string | null;
  } | null;
  user?: {
    username: string;
    firstname: string;
    lastname: string;
    avatar?: string | null;
  } | null;
  like_count: number;
  comment_count: number;
}

export interface Sport {
  id: string;
  name: string;
  max_players: number;
}

export interface MatchAnnouncement {
  id: string;
  title: string;
  owner: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
  };
  sport: Sport;
  remaining_player_slots: number;
  match_status: "upcoming" | "live" | "canceled" | "finished";
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface MatchAnnouncementPage {
  items: MatchAnnouncement[];
  next_offset: number | null;
}

export interface Message {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
}

export interface Contact {
  id: number;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  online: boolean;
  messages: Message[];
}
