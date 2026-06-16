export type NotificationType = 'MATCHING_REQUEST' | 'MATCHING_ACCEPTED' | 'MATCHING_REJECTED';

export type NotificationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'READ';

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  // 매칭 요청자 정보
  senderName: string;
  senderAvatar?: string;
  message?: string;
  createdAt: string;
}
