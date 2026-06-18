'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { parseProjectMessage, ProjectMessageCard } from '@/components/common/ProjectMessageCard';
import type { ChatMessage } from '@/types/chat';

type AuthUser = {
  id: string;
  nickname: string;
};

type ChatRoomDetail = {
  id: string;
  roomType: string;
  createdAt: string;
};

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [room, setRoom] = useState<ChatRoomDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const accessToken = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }, []);

  const fetchJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error('요청에 실패했습니다.');
    }

    return response.json();
  };

  const loadMessages = async () => {
    const data = await fetchJson<ChatMessage[]>(`/api/chat/rooms/${roomId}/messages`);
    setMessages(data);
  };

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }

    Promise.all([
      fetchJson<AuthUser>('/api/auth/me'),
      fetchJson<ChatRoomDetail>(`/api/chat/rooms/${roomId}`),
      fetchJson<ChatMessage[]>(`/api/chat/rooms/${roomId}/messages`),
    ])
      .then(([me, roomDetail, messageList]) => {
        setUser(me);
        setRoom(roomDetail);
        setMessages(messageList);
      })
      .catch(() => setErrorMessage('채팅방 정보를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, [accessToken, roomId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !user || isSending) return;

    setIsSending(true);
    setErrorMessage('');

    try {
      const saved = await fetchJson<ChatMessage>(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          content,
          messageType: 'TEXT',
        }),
      });
      setMessages((current) => [...current, saved]);
      setDraft('');
    } catch {
      setErrorMessage('메시지를 보내지 못했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/mypage?tab=chats" className="rounded-lg p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated">
              <MessageSquare size={18} className="text-text-muted" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-text-primary">채팅방</h1>
              <p className="truncate text-xs text-text-muted">{room?.roomType ?? '대화'} · {roomId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadMessages().catch(() => setErrorMessage('메시지를 새로고침하지 못했습니다.'))}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            aria-label="새로고침"
          >
            <RefreshCw size={17} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-background/40 px-4 py-5">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-text-secondary">채팅방을 불러오는 중입니다</div>
          ) : errorMessage && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-secondary">{errorMessage}</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-secondary">아직 메시지가 없습니다</div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isMine = message.senderId === user?.id;
                const projectMessage = parseProjectMessage(message.content);

                if (projectMessage) {
                  return (
                    <div key={message.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <ProjectMessageCard project={projectMessage} />
                    </div>
                  );
                }

                return (
                  <div key={message.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-border bg-surface text-text-primary'}`}>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-text-muted'}`}>
                        {new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {errorMessage && messages.length > 0 && (
          <div className="border-t border-border px-4 py-2 text-xs text-primary">{errorMessage}</div>
        )}

        <form onSubmit={sendMessage} className="border-t border-border bg-surface px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated p-1.5">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="메시지 입력..."
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="메시지 보내기"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
