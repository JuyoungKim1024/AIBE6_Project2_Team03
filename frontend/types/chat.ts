import type { RankTier } from './user';

export interface ChatRoom {
  id: string;
  partner: string;
  rank: RankTier;
  avatar: string;
  last: string;
  time: string;
  unread: number;
}
