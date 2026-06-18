'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X } from 'lucide-react';
import type { ChatRequestNotification, Notification } from '@/types/notification';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some((n) => n.status === 'PENDING');

  const fetchNotifications = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [notificationRes, chatRequestRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/notifications`, { headers }),
        fetch(`${API_BASE_URL}/api/chat/requests/received`, { headers }),
      ]);

      const notifications = notificationRes.ok
        ? await notificationRes.json() as Notification[]
        : [];
      const chatRequests = chatRequestRes.ok
        ? await chatRequestRes.json() as ChatRequestNotification[]
        : [];

      setNotifications([
        ...chatRequests.map(toNotification),
        ...notifications,
      ]);
    } catch {
      // 네트워크 에러 무시
    }
  };

  const getActionUrl = (notification: Notification, action: 'accept' | 'reject') => {
    if (notification.type === 'CHAT_REQUEST') {
      return `${API_BASE_URL}/api/chat/requests/${notification.id}/${action}`;
    }
    return `${API_BASE_URL}/api/notifications/${notification.id}/${action}`;
  };

  const updateNotification = (id: string, status: Notification['status'], chatRoomId?: string | null) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status, chatRoomId: chatRoomId ?? n.chatRoomId } : n)),
    );
  };

  const handleAccept = async (notification: Notification) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    try {
      const res = await fetch(getActionUrl(notification, 'accept'), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      updateNotification(notification.id, 'ACCEPTED', data.chatRoomId);
      setOpen(false);
      router.push(data.chatRoomId ? `/mypage?tab=chats&roomId=${data.chatRoomId}` : '/mypage?tab=chats');
    } catch {
      // 네트워크 에러 무시
    }
  };

  const handleReject = async (notification: Notification) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    try {
      const res = await fetch(getActionUrl(notification, 'reject'), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      updateNotification(notification.id, 'REJECTED');
    } catch {
      // 에러 무시
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggleOpen = () => {
    if (!open) fetchNotifications();
    setOpen((prev) => !prev);
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

function toNotification(request: ChatRequestNotification): Notification {
  return {
    id: request.id,
    type: 'CHAT_REQUEST',
    status: request.status === 'WAITING' ? 'PENDING' : request.status,
    senderName: request.senderName,
    senderAvatar: request.senderAvatar ?? undefined,
    chatRoomId: request.chatRoomId,
    postTitle: request.postTitle,
    message: request.message,
    createdAt: request.createdAt ?? '',
  };
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
  const isChatRequest = notification.type === 'CHAT_REQUEST';
  const actionLabel = isChatRequest ? '채팅 문의' : '매칭';

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
            <span className="font-bold">{notification.senderName}</span>님이 {actionLabel}를 요청했습니다.
          </p>
          {notification.postTitle && (
            <p className="mt-0.5 truncate text-xs font-medium text-text-secondary">
              {notification.postTitle}
            </p>
          )}
          {notification.message && (
            <p className="mt-1 line-clamp-2 text-xs text-text-muted">
              {notification.message}
            </p>
          )}
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
              {actionLabel} 수락됨 · 채팅방으로 이동했습니다.
            </div>
          )}

          {isRejected && (
            <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
              <X size={13} />
              {actionLabel} 거절됨 · 상대방에게 알림이 전송됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
