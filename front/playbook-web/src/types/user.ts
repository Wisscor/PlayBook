export interface User {
  id?: string;
  email: string;
  firstname: string;
  lastname: string;
  username: string;
  avatar?: string;
  bio?: string;
  created_at?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
}

export interface UserSummary {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  avatar?: string;
}

export interface UserPaginated {
  items: UserSummary[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
