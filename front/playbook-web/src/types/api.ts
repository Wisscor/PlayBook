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
  liked_by_me?: boolean;
  is_liked_by_me?: boolean;
}

export interface PostPage {
  items: Post[];
  next_offset: number | null;
}

// export interface Sport {
//   id: string;
//   name: string;
//   max_players: number;
// }

// export interface MatchAnnouncement {
//   id: string;
//   title: string;
//   owner: {
//     id: string;
//     username: string;
//     firstname: string;
//     lastname: string;
//   };
//   sport: Sport;
//   remaining_player_slots: number;
//   match_status: "upcoming" | "live" | "canceled" | "finished";
//   start_time: string;
//   end_time: string;
//   created_at: string;
// }

// export interface MatchAnnouncementPage {
//   items: MatchAnnouncement[];
//   next_offset: number | null;
// }

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
