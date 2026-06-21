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
export type ChatRoomType = 'DIRECT' | 'POST' | 'PROJECT' | 'MATCHING';

export interface ChatPostSummary {
  id: string;
  title: string;
  priceMin: number | null;
  priceMax: number | null;
  deadline: string | null;
  fieldTags: string[];
  revisionCount: number | null;
}

export interface MyChatRoom {
  id: string;
  partnerId?: string;
  partnerName: string;
  lastMessage: string;
  time: string;
  type: ChatRoomType;
  unreadCount: number;
  post: ChatPostSummary | null;
  partnerDeleted?: boolean;
  partnerWithdrawn?: boolean;
}

export interface ChatMessage {
  messageId: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  contentType?: string | null;
  createdAt: string;
}

export type ChatAttachment = {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  messageType: 'IMAGE' | 'FILE';
};
