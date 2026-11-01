import { UserSummary } from "./user";

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

export interface MatchAnnouncementRequestData {
  title: string;
  sport_id: string;
  remaining_player_slots: number;
  start_time: string;
  end_time: string;
}

interface Player {
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

export interface FollowDataPaginated {
  items: UserSummary[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PlayRequest {
  id: string;
  announcement_id: string;
  sender: UserSummary;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface PlayRequestPaginated {
  items: PlayRequest[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MatchOverview {
  id: string;
  matchname: string;
  matchType: string;
  playerNbr: string | number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface UpdatedMatchRequest {
  title: string;
  sport_id: string;
  remaining_player_slots: number;
  match_status: string;
  start_time: string;
  end_time: string;
}

export type ApiError = {
  status?: number;
  errorCode?: string;
  message?: string;
  detail?: unknown;
  data?: unknown;
};

export interface ChatConversation {
  id: string;
  peer_id: string;
  peer_username: string;
  unread_count: number;
  peer_last_read_message_id: string | null;
}
