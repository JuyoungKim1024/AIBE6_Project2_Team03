'use client';

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MessageSquare, RefreshCw, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDM } from '@/store/chatStore';
import { API_BASE_URL } from '@/lib/api';
import { createDirectChatRequest } from '@/lib/api/chat';
import { DirectChatRequestModal } from '@/components/common/DirectChatRequestModal';
import type { ChatMessage } from '@/types/chat';

type AuthUser = {
  id: string;
  nickname: string;
};

type MyChatRoom = {
  id: string;
  partnerName: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  partnerDeleted?: boolean;
  partnerWithdrawn?: boolean;
};

export function ChatFAB() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [chatRooms, setChatRooms] = useState<MyChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRequestingDm, setIsRequestingDm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { activeDMUser, closeDM } = useDM();

  const isDMActive = activeDMUser !== null;
  const showPopup = isOpen;
  const activeRoom = chatRooms.find((chat) => chat.id === activeRoomId);
  const activePartnerName = activeRoom?.partnerName ?? '채팅방';
  const isPartnerWithdrawn = Boolean(activeRoom?.partnerDeleted || activeRoom?.partnerWithdrawn);

  const accessToken = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }, [showPopup]);

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

  const loadRooms = async () => {
    setIsLoadingRooms(true);
    setErrorMessage('');

    try {
      const rooms = await fetchJson<MyChatRoom[]>('/api/users/me/chats');
      setChatRooms(rooms);
    } catch {
      setChatRooms([]);
      setErrorMessage('채팅 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    setIsLoadingMessages(true);
    setErrorMessage('');

    try {
      const data = await fetchJson<ChatMessage[]>(`/api/chat/rooms/${roomId}/messages`);
      setMessages(data);
    } catch {
      setMessages([]);
      setErrorMessage('메시지를 불러오지 못했습니다.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!showPopup) return;
    if (!accessToken) {
      router.push('/login');
      return;
    }

    fetchJson<AuthUser>('/api/auth/me')
      .then(setUser)
      .catch(() => {
        setUser(null);
        router.push('/login');
      });

    loadRooms();
  }, [accessToken, router, showPopup]);

  useEffect(() => {
    if (!showPopup || !activeRoomId || isDMActive) return;
    loadMessages(activeRoomId);
  }, [activeRoomId, isDMActive, showPopup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClose = () => {
    setIsOpen(false);
    if (isDMActive) closeDM();
  };

  const openRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    if (isDMActive) closeDM();
  };

  const submitDmRequest = async (message: string) => {
    if (!activeDMUser || isRequestingDm) return;

    setIsRequestingDm(true);
    setErrorMessage('');
    try {
      await createDirectChatRequest(activeDMUser.id, message);
      closeDM();
      setErrorMessage('DM 요청을 보냈습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DM 요청을 보내지 못했습니다.';
      if (message.includes('로그인')) {
        router.push('/login');
        return;
      }
      setErrorMessage(message);
    } finally {
      setIsRequestingDm(false);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeRoomId || !user || isSending || isPartnerWithdrawn) return;

    setIsSending(true);
    setErrorMessage('');

    try {
      const saved = await fetchJson<ChatMessage>(`/api/chat/rooms/${activeRoomId}/messages`, {
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
      loadRooms();
    } catch {
      setErrorMessage('메시지를 보내지 못했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {activeDMUser && (
        <DirectChatRequestModal
          targetName={activeDMUser.name}
          isSubmitting={isRequestingDm}
          onClose={closeDM}
          onSubmit={submitDmRequest}
        />
      )}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 md:bottom-24 z-[60] w-[calc(100vw-3rem)] md:w-[640px] h-[500px] max-h-[80vh] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex"
          >
            <div className={`w-full md:w-1/3 border-r border-border flex flex-col ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface-elevated">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <MessageSquare size={16} /> 메시지
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadRooms}
                    className="text-text-muted hover:text-text-primary"
                    aria-label="채팅 목록 새로고침"
                  >
                    <RefreshCw size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-text-muted hover:text-text-primary"
                    aria-label="채팅 닫기"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {isLoadingRooms ? (
                  <div className="p-4 text-sm text-text-secondary">채팅 목록을 불러오는 중입니다</div>
                ) : chatRooms.length === 0 ? (
                  <div className="p-4 text-sm text-text-secondary">채팅 목록이 없습니다</div>
                ) : (
                  chatRooms.map((chat) => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => openRoom(chat.id)}
                      className={`w-full text-left p-3 border-b border-border/50 hover:bg-surface-elevated transition-colors flex items-center gap-3 ${activeRoomId === chat.id ? 'bg-surface-elevated' : ''}`}
                    >
                      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                        <MessageSquare size={17} className="text-text-muted" />
                        {chat.unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-white">{chat.unreadCount}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5 gap-2">
                          <span className="font-bold text-sm text-text-primary truncate">{chat.partnerName}</span>
                          <span className="text-[10px] text-text-muted flex-shrink-0">{chat.time}</span>
                        </div>
                        <p className="text-xs text-text-secondary truncate">
                          {chat.partnerDeleted || chat.partnerWithdrawn ? '탈퇴한 회원입니다' : chat.lastMessage || '아직 메시지가 없습니다'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className={`w-full md:w-2/3 flex flex-col bg-background/50 ${!activeRoomId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
              {!activeRoomId ? (
                <div className="text-center text-text-muted">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">대화방을 선택해주세요</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => { setActiveRoomId(null); if (isDMActive) closeDM(); }} className="md:hidden text-text-muted hover:text-text-primary">
                        <ChevronLeft size={20} />
                      </button>
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated">
                        <MessageSquare size={15} className="text-text-muted" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-bold text-sm text-text-primary">{activePartnerName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => activeRoomId && loadMessages(activeRoomId)}
                        className="text-text-muted hover:text-text-primary"
                        aria-label="새로고침"
                      >
                        <RefreshCw size={17} />
                      </button>
                      <button type="button" onClick={handleClose} className="hidden md:block text-text-muted hover:text-text-primary">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {isLoadingMessages ? (
                      <div className="flex h-full items-center justify-center text-sm text-text-secondary">메시지를 불러오는 중입니다</div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-text-secondary">아직 메시지가 없습니다</div>
                    ) : (
                      messages.map((message) => {
                        const isMine = message.senderId === user?.id;
                        return (
                          <div key={message.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-border bg-surface text-text-primary'}`}>
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-text-muted'}`}>
                                {new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {isPartnerWithdrawn ? (
                      <div className="py-2 text-center text-xs font-bold text-text-muted">---탈퇴한 회원입니다---</div>
                    ) : null}
                    <div ref={messagesEndRef} />
                  </div>
                  {errorMessage && <div className="border-t border-border px-4 py-2 text-xs text-primary">{errorMessage}</div>}
                  <form onSubmit={sendMessage} className="p-3 border-t border-border bg-surface">
                    <div className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl p-1.5">
                      <input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        disabled={isPartnerWithdrawn}
                        placeholder={isPartnerWithdrawn ? '탈퇴한 회원에게는 메시지를 보낼 수 없습니다.' : '메시지 입력...'}
                        className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!draft.trim() || !activeRoomId || isSending || isPartnerWithdrawn}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="메시지 보내기"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setIsOpen(!isOpen); if (isDMActive) closeDM(); }}
        className="fixed bottom-6 right-6 z-[55] w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="채팅 열기"
      >
        <Send size={22} className="-ml-1 mt-1" />
      </motion.button>
    </>
  );
}
