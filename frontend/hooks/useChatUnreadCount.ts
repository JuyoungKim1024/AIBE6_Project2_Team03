'use client';

import { getAccessToken } from '@/lib/auth-session';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { createStompFrame, getWebSocketUrl } from '@/hooks/useChatSocket';

export type ChatUnreadState = {
  roomId: string | null;
  roomUnreadCount: number;
  totalUnreadCount: number;
};

function notifyUnreadChanged(state: ChatUnreadState) {
  window.dispatchEvent(new CustomEvent<ChatUnreadState>('chatUnreadChanged', { detail: state }));
}

export function useChatUnreadCount(userId?: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleUnreadChanged = (event: Event) => {
      const state = (event as CustomEvent<ChatUnreadState>).detail;
      if (state) setUnreadCount(state.totalUnreadCount);
    };
    window.addEventListener('chatUnreadChanged', handleUnreadChanged);
    return () => window.removeEventListener('chatUnreadChanged', handleUnreadChanged);
  }, []);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const accessToken = getAccessToken();
    if (accessToken) {
      fetch(`${API_BASE_URL}/api/chat/rooms/unread-count`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((response) => response.ok ? response.json() as Promise<ChatUnreadState> : null)
        .then((state) => {
          if (!state) return;
          setUnreadCount(state.totalUnreadCount);
          notifyUnreadChanged(state);
        })
        .catch(() => undefined);
    }

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
              id: `chat-unread-${userId}`,
              destination: `/topic/users/${userId}/chat/unread`,
              ack: 'auto',
            }));
            return;
          }
          if (!frame.startsWith('MESSAGE')) return;
          const bodyStart = frame.indexOf('\n\n');
          if (bodyStart === -1) return;
          try {
            const state = JSON.parse(frame.slice(bodyStart + 2)) as ChatUnreadState;
            setUnreadCount(state.totalUnreadCount);
            notifyUnreadChanged(state);
          } catch {
            // 다음 unread 이벤트 수신을 유지한다.
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
      socket?.close();
    };
  }, [userId]);

  return unreadCount;
}
