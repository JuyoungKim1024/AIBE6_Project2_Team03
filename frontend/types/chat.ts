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

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE';

export interface ChatMessage {
  messageId: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  createdAt: string;
}
