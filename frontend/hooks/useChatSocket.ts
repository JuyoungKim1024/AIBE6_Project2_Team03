'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import type { ProjectMessagePayload } from '@/components/common/ProjectMessageCard';
import type { ChatMessage } from '@/types/chat';

export function createStompFrame(command: string, headers: Record<string, string>, body = '') {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
  return `${command}\n${headerLines.join('\n')}\n\n${body}\0`;
}

export function getWebSocketUrl() {
  return `${API_BASE_URL.replace(/^http/, 'ws').replace(/\/$/, '')}/ws`;
}

export function useChatSocket(
  roomId: string | null,
  onMessage: (message: ChatMessage) => void,
  onProject?: (project: ProjectMessagePayload) => void,
) {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onProjectRef = useRef(onProject);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onProjectRef.current = onProject;
  }, [onMessage, onProject]);

  useEffect(() => {
    if (!roomId) {
      setIsConnected(false);
      return;
    }

    let isActive = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const socket = new WebSocket(getWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(createStompFrame('CONNECT', {
          'accept-version': '1.2',
          'heart-beat': '0,0',
        }));
      };

      socket.onmessage = (event) => {
        const frames = String(event.data).split('\0');
        frames.forEach((rawFrame) => {
          const frame = rawFrame.replace(/^\n+/, '');
          if (!frame) return;

          const commandEnd = frame.indexOf('\n');
          const command = commandEnd === -1 ? frame : frame.slice(0, commandEnd);

          if (command === 'CONNECTED') {
            setIsConnected(true);
            socket.send(createStompFrame('SUBSCRIBE', {
              id: `chat-room-${roomId}`,
              destination: `/topic/chat/rooms/${roomId}`,
              ack: 'auto',
            }));
            socket.send(createStompFrame('SUBSCRIBE', {
              id: `chat-project-${roomId}`,
              destination: `/topic/chat/rooms/${roomId}/project`,
              ack: 'auto',
            }));
            return;
          }

          if (command !== 'MESSAGE') return;
          const bodyStart = frame.indexOf('\n\n');
          if (bodyStart === -1) return;

          try {
            const body = JSON.parse(frame.slice(bodyStart + 2));
            if (frame.includes(`destination:/topic/chat/rooms/${roomId}/project`)) {
              onProjectRef.current?.(body as ProjectMessagePayload);
            } else {
              onMessageRef.current(body as ChatMessage);
            }
          } catch {
            // 형식이 잘못된 프레임은 다음 메시지 수신을 유지하기 위해 건너뛴다.
          }
        });
      };

      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        setIsConnected(false);
        if (isActive) reconnectTimer = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      isActive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const socket = socketRef.current;
      socketRef.current = null;
      setIsConnected(false);
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(createStompFrame('DISCONNECT', { receipt: `disconnect-${roomId}` }));
      }
      socket?.close();
    };
  }, [roomId]);

  const publishMessage = useCallback((message: {
    senderId: string;
    content: string;
    messageType: ChatMessage['messageType'];
  }) => {
    const socket = socketRef.current;
    if (!roomId || !socket || socket.readyState !== WebSocket.OPEN || !isConnected) return false;

    const body = JSON.stringify(message);
    socket.send(createStompFrame('SEND', {
      destination: `/app/chat/rooms/${roomId}/messages`,
      'content-type': 'application/json',
      'content-length': String(new TextEncoder().encode(body).length),
    }, body));
    return true;
  }, [isConnected, roomId]);

  return { isConnected, publishMessage };
}
