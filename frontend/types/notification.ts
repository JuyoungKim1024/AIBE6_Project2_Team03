export type NotificationType =
  | 'MATCHING_REQUEST'
  | 'MATCHING_ACCEPTED'
  | 'MATCHING_REJECTED'
  | 'CHAT_REQUEST'
  | 'DISPUTE_FILED'
  | 'PROJECT_REQUESTED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_ACCEPTED'
  | 'PROJECT_REJECTED'
  | 'PROJECT_COMPLETION_REQUESTED'
  | 'PROJECT_COMPLETED'
  | 'PROJECT_CANCELLATION_REQUESTED'
  | 'PROJECT_CANCELED';

export type NotificationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'READ';

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  // 매칭 요청자 정보
  senderName: string;
  senderAvatar?: string;
  chatRoomId?: string | null;
  postTitle?: string;
  message?: string;
  createdAt: string;
}

export interface ChatRequestNotification {
  id: string;
  status: 'WAITING' | 'ACCEPTED' | 'REJECTED';
  chatRoomId?: string | null;
  senderName: string;
  senderAvatar?: string | null;
  postTitle?: string;
  message?: string;
  createdAt?: string | null;
}
