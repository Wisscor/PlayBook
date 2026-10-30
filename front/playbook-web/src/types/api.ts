export interface PostData {
  id: string;
  caption: string;
  created_at: string;
  updated_at: string;
  author?: {
    id?: string;
    username: string;
    firstname: string;
    lastname: string;
    avatar?: string;
  };
}

export interface PostPaginated {
  items: PostData[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Feed {
  id: string;
  caption: string;
  user_id: string;
  author: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    avatar: string;
  };
  created_at: string;
  updated_at: string;
}

export interface FeedPaginated {
  items: Feed[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
  seen?: boolean;
}

export interface Contact {
  id: string;
  profileId: string;
  conversationId: string;
  name: string;
  username: string;
  avatar: string;
  avatarUrl?: string;
  lastMessage: string;
  online: boolean;
  messages: Message[];
}

export interface RealtimeMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
}

export interface ApiError {
  message: string;
  status: number | null;
  details?: unknown;
}

export interface MatchAnnouncementRequestData {
  title: string;
  sport_id: string;
  remaining_player_slots: number;
  start_time: string;
  end_time: string;
}

export interface Player {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  avatar: string;
}

export interface Sport {
  id: string;
  name: string;
  max_players: number;
}

export interface MatchAnnouncement {
  id: string;
  title: string;
  owner: Player;
  sport: Sport;
  remaining_player_slots: number;
  match_status: string;
  accepted_players: Player[];
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface MatchAnnouncementPaginated {
  items: MatchAnnouncement[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
