'use client';

import { getAccessToken } from '@/lib/auth-session';
import { API_BASE_URL } from '@/lib/api';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Bell, Check, X } from 'lucide-react';
import type { ChatRequestNotification, Notification } from '@/types/notification';
import { createStompFrame, getWebSocketUrl } from '@/hooks/useChatSocket';
import { useModal } from '@/store/modalStore';

const POLL_INTERVAL_MS = 5_000;

export function NotificationDropdown({ userId }: { userId: string }) {
  const router = useRouter();
  const { openModal } = useModal();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const isUnreadNotification = (n: Notification) =>
    n.status === 'PENDING' ||
    (n.type === 'DISPUTE_FILED' && ['AI_PENDING', 'AI_JUDGED', 'AI_FAILED'].includes(n.status));

  const hasUnread = notifications.some((n) => isUnreadNotification(n) && !seenIds.has(n.id));

  const fetchNotifications = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [notificationRes, chatRequestRes, disputeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/notifications`, { headers }),
        fetch(`${API_BASE_URL}/api/chat/requests/received`, { headers }),
        fetch(`${API_BASE_URL}/api/disputes/notifications`, { headers }),
      ]);

      const notifications = notificationRes.ok
        ? await notificationRes.json() as Notification[]
        : [];
      const chatRequests = chatRequestRes.ok
        ? await chatRequestRes.json() as ChatRequestNotification[]
        : [];
      const disputes = disputeRes.ok
        ? await disputeRes.json() as Notification[]
        : [];

      setNotifications([
        ...disputes,
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
    const accessToken = getAccessToken();
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
      router.push(data.chatRoomId ? `/chat/${data.chatRoomId}` : '/chat');
    } catch {
      // 네트워크 에러 무시
    }
  };

  const handleReject = async (notification: Notification) => {
    const accessToken = getAccessToken();
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

  const openProjectNotification = async (notification: Notification) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) updateNotification(notification.id, 'READ');
    } finally {
      setOpen(false);
      router.push(notification.chatRoomId ? `/chat/${notification.chatRoomId}` : '/chat');
    }
  };

  const handleDelete = async (notification: Notification) => {
    if (deletingId) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;

    // 즉시 목록에서 제거
    setNotifications((current) => current.filter((item) => item.id !== notification.id));

    setDeletingId(notification.id);
    try {
      const path = notification.type === 'CHAT_REQUEST'
        ? `/api/chat/requests/${notification.id}`
        : `/api/notifications/${notification.id}`;
      await fetch(`${API_BASE_URL}${path}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // 백엔드 삭제 실패해도 UI는 이미 제거됨
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isActive = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      socket = new WebSocket(getWebSocketUrl());
      socket.onopen = () => socket?.send(createStompFrame('CONNECT', {
        'accept-version': '1.2',
        'heart-beat': '0,0',
      }));
      socket.onmessage = (event) => {
        String(event.data).split('\0').forEach((rawFrame) => {
          const frame = rawFrame.replace(/^\n+/, '');
          if (frame.startsWith('CONNECTED')) {
            socket?.send(createStompFrame('SUBSCRIBE', {
              id: `notifications-${userId}`,
              destination: `/topic/users/${userId}/notifications`,
              ack: 'auto',
            }));
            return;
          }
          if (!frame.startsWith('MESSAGE')) return;
          const bodyStart = frame.indexOf('\n\n');
          if (bodyStart === -1) return;
          try {
            const notification = JSON.parse(frame.slice(bodyStart + 2)) as Notification;
            setNotifications((current) => current.some((item) => item.id === notification.id)
              ? current
              : [notification, ...current]);
          } catch {
            // 다음 알림 이벤트 수신을 유지한다.
          }
        });
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (isActive) reconnectTimer = setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      isActive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (!socket) return;
      if (socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => socket?.close();
        socket.onerror = null;
        socket.onclose = null;
      } else {
        socket.close();
      }
    };
  }, [userId]);

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
    if (!open) {
      fetchNotifications();
      setSeenIds(new Set(notifications.filter(isUnreadNotification).map((n) => n.id)));
    }
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
                  onOpenProject={openProjectNotification}
                  onDelete={handleDelete}
                  isDeleting={deletingId === notification.id}
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
  onOpenProject: (n: Notification) => void;
  onDelete: (n: Notification) => void;
  isDeleting: boolean;
}

function NotificationItem({ notification, onAccept, onReject, onOpenProject, onDelete, isDeleting }: NotificationItemProps) {
  const router = useRouter();
  const isPending = notification.status === 'PENDING';
  const isAccepted = notification.status === 'ACCEPTED';
  const isRejected = notification.status === 'REJECTED';
  const isChatRequest = notification.type === 'CHAT_REQUEST';
  const isDispute = notification.type === 'DISPUTE_FILED';
  const isProjectNotification = notification.type.startsWith('PROJECT_');
  const actionLabel = isChatRequest ? '채팅 문의' : '매칭';

  if (isDispute) {
    return (
      <div className="px-4 py-3 border-b border-border/50 last:border-0">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary">
              <span className="font-bold">{notification.senderName}</span>님이 AI 분쟁 조정을 신청했습니다.
            </p>
            <p className="text-xs text-text-muted mt-0.5">{notification.createdAt}</p>
            <button
              onClick={() => {
                router.push(`/chat/${notification.chatRoomId}?disputeId=${notification.id}`);
              }}
              className="mt-2 w-full py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium hover:bg-amber-500/20 transition-colors"
            >
              채팅방에서 확인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {isProjectNotification ? (
              <><span className="font-bold">{notification.senderName}</span>님 · {notification.message}</>
            ) : (
              <><span className="font-bold">{notification.senderName}</span>님이 {actionLabel}를 요청했습니다.</>
            )}
          </p>
          {notification.postTitle && (
            <p className="mt-0.5 truncate text-xs font-medium text-text-secondary">
              {notification.postTitle}
            </p>
          )}
          {notification.message && !isProjectNotification && (
            <p className="mt-1 line-clamp-2 text-xs text-text-muted">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-text-muted mt-0.5">{notification.createdAt}</p>

          {isPending && !isProjectNotification && (
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

          {isProjectNotification && (
            <button onClick={() => onOpenProject(notification)} className="mt-2 text-xs font-bold text-primary hover:underline">
              채팅방에서 확인
            </button>
          )}

          {isAccepted && !isProjectNotification && (
            <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
              <Check size={13} />
              {actionLabel} 수락됨 · 채팅방으로 이동했습니다.
            </div>
          )}

          {isRejected && !isProjectNotification && (
            <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
              <X size={13} />
              {actionLabel} 거절됨 · 상대방에게 알림이 전송됩니다.
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(notification)}
          disabled={isDeleting}
          className="flex-shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="알림 닫기"
          title="알림 닫기"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
