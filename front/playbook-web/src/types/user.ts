export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  username: string;
  phone?: string | null;
  avatar?: string | null;
  bio?: string;
  created_at?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}
