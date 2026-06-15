'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X } from 'lucide-react';
import type { Notification } from '@/types/notification';

// TODO: 백엔드 연동 후 실제 API 호출로 교체
// GET /api/notifications — 현재 유저의 알림 목록 조회
const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'MATCHING_REQUEST',
    status: 'PENDING',
    senderName: '모션그래픽왕',
    senderAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80',
    matchingId: 'm1',
    message: '영상 편집 매칭을 요청했습니다.',
    createdAt: '방금',
  },
  {
    id: 'n2',
    type: 'MATCHING_REQUEST',
    status: 'PENDING',
    senderName: '쇼츠공장장',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    matchingId: 'm2',
    message: '쇼츠 편집 매칭을 요청했습니다.',
    createdAt: '1시간 전',
  },
];

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const ref = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some((n) => n.status === 'PENDING');

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggleOpen = () => setOpen((prev) => !prev);

  const handleAccept = (notification: Notification) => {
    // TODO: POST /api/matching/{matchingId}/accept 호출
    // 성공 시 채팅방 ID를 응답으로 받아 아래 router.push에 사용
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, status: 'ACCEPTED' } : n)),
    );
    setOpen(false);
    // TODO: 응답받은 실제 채팅방 ID로 교체 ex) router.push(`/chat/${chatRoomId}`)
    router.push('/chat');
  };

  const handleReject = (notification: Notification) => {
    // TODO: POST /api/matching/{matchingId}/reject 호출
    // 백엔드에서 상대방에게 "매칭이 거절되었습니다" 알림 자동 발송
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, status: 'REJECTED' } : n)),
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        className="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="알림"
      >
        <Bell size={20} />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-bold text-text-primary text-sm">알림</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-text-muted py-10">새로운 알림이 없습니다.</p>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onAccept: (n: Notification) => void;
  onReject: (n: Notification) => void;
}

function NotificationItem({ notification, onAccept, onReject }: NotificationItemProps) {
  const isPending = notification.status === 'PENDING';
  const isAccepted = notification.status === 'ACCEPTED';
  const isRejected = notification.status === 'REJECTED';

  return (
    <div className="px-4 py-3 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3">
        {notification.senderAvatar ? (
          <img
            src={notification.senderAvatar}
            alt={notification.senderName}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-surface-elevated flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary">
            <span className="font-bold">{notification.senderName}</span>님이{' '}
            {notification.message}
          </p>
          <p className="text-xs text-text-muted mt-0.5">{notification.createdAt}</p>

          {isPending && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onAccept(notification)}
                className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                수락
              </button>
              <button
                onClick={() => onReject(notification)}
                className="flex-1 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-medium hover:bg-surface-elevated transition-colors"
              >
                거절
              </button>
            </div>
          )}

          {isAccepted && (
            <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
              <Check size={13} />
              매칭 수락됨 · 채팅방으로 이동했습니다.
            </div>
          )}

          {isRejected && (
            <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
              <X size={13} />
              매칭 거절됨 · 상대방에게 알림이 전송됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
