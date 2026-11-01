import type { RealtimeMessage } from "@/types/api";

export type ChatContact = {
  id: string;
  peerId: string;
  name: string;
  username: string;
  avatar?: string;
  online: boolean;
  unread: number;
  messages: RealtimeMessage[];
  readThrough: string | null;
};
