'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, MessageCircle, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { parseProjectMessage } from '@/components/common/ProjectMessageCard';
import type { MyChatRoom } from '@/types/chat';

type ChatFilter = 'ALL' | 'POST' | 'DIRECT' | 'UNREAD';

const filters: { id: ChatFilter; label: string }[] = [
  { id: 'ALL', label: '전체' },
  { id: 'POST', label: '문의채팅' },
  { id: 'DIRECT', label: 'DM' },
  { id: 'UNREAD', label: '안읽은 메시지' },
];

function getLastMessageText(room: MyChatRoom) {
  if (room.partnerDeleted || room.partnerWithdrawn) return '탈퇴한 회원입니다';
  if (!room.lastMessage) return '아직 메시지가 없습니다';
  return parseProjectMessage(room.lastMessage) ? '프로젝트' : room.lastMessage;
}

type ChatRoomListProps = {
  compact?: boolean;
  sidebar?: boolean;
  activeRoomId?: string;
};

export function ChatRoomList({ compact = false, sidebar = false, activeRoomId }: ChatRoomListProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<MyChatRoom[]>([]);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const filteredRooms = useMemo(() => rooms.filter((room) => {
    if (activeFilter === 'POST') return room.type === 'POST';
    if (activeFilter === 'DIRECT') return room.type === 'DIRECT';
    if (activeFilter === 'UNREAD') return room.unreadCount > 0;
    return true;
  }), [activeFilter, rooms]);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.replace('/login');
      return;
    }

    fetch(`${API_BASE_URL}/api/users/me/chats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<MyChatRoom[]>;
      })
      .then(setRooms)
      .catch(() => setErrorMessage('채팅 목록을 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, [router]);

  const deleteRoom = async (roomId: string) => {
    if (!window.confirm('채팅방을 목록에서 삭제하시겠습니까?')) return;

    const accessToken = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!response.ok) throw new Error();
      setRooms((current) => current.filter((room) => room.id !== roomId));
      if (activeRoomId === roomId) router.push('/chat');
    } catch {
      setErrorMessage('채팅방을 삭제하지 못했습니다.');
    }
  };

  return (
    <section className={sidebar ? 'flex h-full flex-col' : compact ? '' : 'mx-auto w-full max-w-6xl px-4 py-8 sm:px-6'}>
      {!compact && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">채팅</h1>
          <p className="mt-1 text-sm text-text-secondary">대화할 채팅방을 선택하세요.</p>
        </div>
      )}

      {sidebar && (
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-full items-center justify-between border-b border-border px-4 py-4 text-left font-bold text-text-primary hover:bg-surface-elevated"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2"><MessageCircle size={17} />채팅 목록</span>
          <ChevronDown size={17} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {!sidebar && <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${activeFilter === filter.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>}

      {errorMessage && <p className="mb-3 text-sm font-bold text-accent">{errorMessage}</p>}

      <div className={`${sidebar ? `min-h-0 flex-1 overflow-y-auto ${isOpen ? 'block' : 'hidden'}` : 'overflow-hidden rounded-xl border border-border bg-surface'}`}>
        {isLoading ? (
          <p className="px-5 py-12 text-center text-sm text-text-secondary">채팅 목록을 불러오는 중입니다</p>
        ) : filteredRooms.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-text-secondary">선택한 조건의 채팅이 없습니다</p>
        ) : (
          filteredRooms.map((room) => (
            <div key={room.id} className={`flex items-center gap-2 border-b border-border/70 p-3 last:border-b-0 hover:bg-surface-elevated ${activeRoomId === room.id ? 'bg-primary/5' : ''}`}>
              <Link href={`/chat/${room.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border bg-surface-elevated ${activeRoomId === room.id ? 'border-primary text-primary' : 'border-border'}`}>
                  <MessageCircle size={18} className="text-text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-text-primary">{room.partnerName}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {room.type === 'POST' ? '문의채팅' : room.type === 'DIRECT' ? 'DM' : '프로젝트'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-text-secondary">{getLastMessageText(room)}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-text-muted">{room.time}</p>
                  {room.unreadCount > 0 && <span className="mt-1 inline-flex min-w-5 justify-center rounded-full bg-primary px-1.5 text-xs font-bold leading-5 text-white">{room.unreadCount}</span>}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => deleteRoom(room.id)}
                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-accent"
                aria-label="채팅방 삭제"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
