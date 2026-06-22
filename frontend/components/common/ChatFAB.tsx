'use client';

import { getAccessToken } from '@/lib/auth-session';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ExternalLink, Loader2, MessageSquare, Paperclip, RefreshCw, Send, Trash2, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useDM } from '@/store/chatStore';
import { API_BASE_URL } from '@/lib/api';
import { createDirectChatRequest, getInitialChatRequestMessage, markInitialChatRequestMessageUsed } from '@/lib/api/chat';
import { DirectChatRequestModal } from '@/components/common/DirectChatRequestModal';
import { parseProjectMessage, type ProjectMessagePayload } from '@/components/common/ProjectMessageCard';
import type { ChatMessage, MyChatRoom } from '@/types/chat';
import { useChatSocket } from '@/hooks/useChatSocket';
import type { ChatUnreadState } from '@/hooks/useChatUnreadCount';
import { ChatMessageContent } from '@/components/chat/ChatMessageContent';
import { CHAT_ATTACHMENT_ACCEPT, uploadChatAttachment } from '@/lib/api/chat-attachments';
import { useModal } from '@/store/modalStore';

type AuthUser = {
  id: string;
  nickname: string;
};

type MyProject = {
  id: string;
  roomId?: string;
  requesterId?: string;
  completionRequestedBy?: string | null;
  cancellationRequestedBy?: string | null;
  field: string | null;
  status: string;
};

type MyProjects = {
  received: unknown[];
  ongoing: MyProject[];
};

export function ChatFAB() {
  const router = useRouter();
  const { openModal, confirmModal } = useModal();
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const prevProjectStatusRef = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [chatRooms, setChatRooms] = useState<MyChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectMessagePayload | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRequestingDm, setIsRequestingDm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const { activeDMUser, closeDM } = useDM();

  const isDMActive = activeDMUser !== null;
  const activeRoom = chatRooms.find((chat) => chat.id === activeRoomId);
  const activePartnerName = activeRoom?.partnerName ?? '채팅방';
  const isPartnerWithdrawn = Boolean(activeRoom?.partnerDeleted || activeRoom?.partnerWithdrawn);
  const { isConnected, publishMessage } = useChatSocket(activeRoomId, (message) => {
    setMessages((current) => current.some((item) => item.messageId === message.messageId)
      ? current
      : [...current, message]);
    loadRooms();
    if (isOpen && document.visibilityState === 'visible') markActiveRoomAsRead();
  }, (project) => {
    setCurrentProject(project);
    if (isOpen && document.visibilityState === 'visible') markActiveRoomAsRead();
  });

  const accessToken = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return getAccessToken();
  }, [isOpen]);

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

  const markActiveRoomAsRead = async () => {
    if (!activeRoomId || !accessToken) return;
    try {
      const state = await fetchJson<ChatUnreadState>(`/api/chat/rooms/${activeRoomId}/read`, { method: 'PATCH' });
      window.dispatchEvent(new CustomEvent<ChatUnreadState>('chatUnreadChanged', { detail: state }));
    } catch {
      // 팝업을 다시 열거나 메시지를 수신할 때 재시도한다.
    }
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

  const loadProject = async (roomId: string) => {
    try {
      const project = await fetchJson<ProjectMessagePayload>(`/api/projects/rooms/${roomId}`);
      setCurrentProject(project);
    } catch {
      try {
        const data = await fetchJson<MyProjects>('/api/users/me/projects');
        const project = data.ongoing.find((item) => item.roomId === roomId && ['COMPLETION_PENDING', 'CANCELLATION_PENDING', 'COMPLETED', 'REJECTED', 'CANCELED'].includes(item.status));
        if (project) {
          setCurrentProject({
            id: project.id,
            roomId,
            requesterId: project.requesterId,
            completionRequestedBy: project.completionRequestedBy,
            cancellationRequestedBy: project.cancellationRequestedBy,
            field: project.field,
            price: null,
            workAmount: null,
            workUnit: 'MINUTE',
            deadline: null,
            memo: null,
            status: project.status,
          });
          return;
        }
      } catch {
        // 프로젝트가 없으면 약식 카드의 저장 상태를 그대로 사용한다.
      }
      setCurrentProject(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
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
  }, [accessToken, router, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeRoomId || isDMActive) return;
    loadMessages(activeRoomId);
    loadProject(activeRoomId);
    markActiveRoomAsRead();
  }, [activeRoomId, isDMActive, isOpen]);

  useEffect(() => {
    if (!activeDMUser) return;

    const token = getAccessToken();
    if (!token) {
      closeDM();
      router.push('/login');
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() as Promise<AuthUser> : null))
      .then((me) => {
        if (!me) return;
        setUser(me);
        if (me.id === activeDMUser.id) {
          closeDM();
          setErrorMessage('본인에게는 DM을 보낼 수 없습니다.');
          openModal({ title: 'DM 전송 불가', message: '본인에게는 DM을 보낼 수 없습니다.' });
        }
      })
      .catch(() => {
        closeDM();
        router.push('/login');
      });
  }, [activeDMUser, closeDM, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClose = () => {
    setIsOpen(false);
    if (isDMActive) closeDM();
  };

  const openRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setCurrentProject(null);
    if (isDMActive) closeDM();
  };

  const deleteRoom = async (roomId: string) => {
    const confirmed = await confirmModal({
      title: '채팅방 삭제',
      message: '채팅방을 목록에서 삭제하시겠습니까?',
      confirmLabel: '삭제',
    });
    if (!confirmed) return;

    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) throw new Error('Failed to delete room');

      setChatRooms((current) => current.filter((room) => room.id !== roomId));
      if (activeRoomId === roomId) {
        setActiveRoomId(null);
        setMessages([]);
        setCurrentProject(null);
        setDraft('');
      }
    } catch {
      setErrorMessage('채팅방을 삭제하지 못했습니다.');
    }
  };

  const refreshActiveRoom = () => {
    if (!activeRoomId) return;
    loadMessages(activeRoomId);
    loadProject(activeRoomId);
  };

  const getLastMessagePreview = (chat: MyChatRoom) => {
    if (chat.partnerDeleted || chat.partnerWithdrawn) return '탈퇴한 회원입니다';
    if (!chat.lastMessage) return '아직 메시지가 없습니다';
    return parseProjectMessage(chat.lastMessage) ? '프로젝트' : chat.lastMessage;
  };

  const submitDmRequest = async (message: string) => {
    if (!activeDMUser || isRequestingDm) return;
    if (user?.id === activeDMUser.id) {
      closeDM();
      setErrorMessage('본인에게는 DM을 보낼 수 없습니다.');
      openModal({ title: 'DM 전송 불가', message: '본인에게는 DM을 보낼 수 없습니다.' });
      return;
    }

    setIsRequestingDm(true);
    setErrorMessage('');
    try {
      await createDirectChatRequest(activeDMUser.id, message);
      markInitialChatRequestMessageUsed(activeDMUser.id);
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
    if (!content || !activeRoomId || !user || isPartnerWithdrawn) return;

    setErrorMessage('');

    const published = publishMessage({
      senderId: user.id,
      content,
      messageType: 'TEXT',
    });
    if (!published) {
      setErrorMessage('실시간 채팅 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setDraft('');
  };

  const sendAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeRoomId || !user || !isConnected || isPartnerWithdrawn || isUploadingAttachment) return;

    setIsUploadingAttachment(true);
    setErrorMessage('');
    try {
      const attachment = await uploadChatAttachment(activeRoomId, file);
      const published = publishMessage({
        senderId: user.id,
        content: attachment.fileName,
        ...attachment,
      });
      if (!published) throw new Error('실시간 채팅 서버에 연결되어 있지 않습니다.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '첨부파일을 전송하지 못했습니다.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  if (pathname.startsWith('/chat')) return null;

  return (
    <>
      {activeDMUser && (
        <DirectChatRequestModal
          targetName={activeDMUser.name}
          initialMessage={getInitialChatRequestMessage(activeDMUser.id, '안녕하세요. DM 문의드립니다.')}
          isSubmitting={isRequestingDm}
          onClose={closeDM}
          onSubmit={submitDmRequest}
        />
      )}
      <AnimatePresence>
        {isOpen && (
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
                    <div
                      key={chat.id}
                      className={`w-full text-left p-3 border-b border-border/50 hover:bg-surface-elevated transition-colors flex items-center gap-3 ${activeRoomId === chat.id ? 'bg-surface-elevated' : ''}`}
                    >
                      <button type="button" onClick={() => openRoom(chat.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                          <MessageSquare size={17} className="text-text-muted" />
                          {chat.unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-white">{chat.unreadCount}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5 gap-2">
                            <span className="font-bold text-sm text-text-primary truncate">{chat.partnerName}</span>
                            <span className="text-[10px] text-text-muted flex-shrink-0">{chat.time}</span>
                          </div>
                          <p className="text-xs text-text-secondary truncate">{getLastMessagePreview(chat)}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRoom(chat.id)}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-accent"
                        aria-label="채팅방 삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
                        onClick={() => { router.push(`/chat/${activeRoomId}`); handleClose(); }}
                        className="text-text-muted hover:text-text-primary"
                        aria-label="전체 화면으로 열기"
                        title="전체 화면으로 열기"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={refreshActiveRoom}
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
                        const projectMessage = parseProjectMessage(message.content);
                        if (projectMessage) {
                          const displayProject = currentProject?.id === projectMessage.id
                            ? {
                              ...projectMessage,
                              ...currentProject,
                              field: currentProject.field ?? projectMessage.field,
                            }
                            : projectMessage;
                          const statusText =
                            displayProject.status === 'WAITING'
                              ? '프로젝트 수락 대기'
                              : displayProject.status === 'WORKING'
                                ? '프로젝트 진행 중'
                                : displayProject.status === 'COMPLETION_PENDING'
                                  ? '프로젝트 완료 대기'
                                  : displayProject.status === 'CANCELLATION_PENDING'
                                    ? '프로젝트 취소 대기'
                                  : displayProject.status === 'COMPLETED'
                                    ? '완료된 프로젝트입니다'
                                    : displayProject.status === 'REJECTED'
                                      ? '거절된 프로젝트입니다'
                                      : displayProject.status === 'CANCELED'
                                        ? '취소된 프로젝트입니다'
                                        : '프로젝트';

                          return (
                            <div key={message.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className="max-w-[80%] rounded-xl border border-primary/30 bg-surface px-3 py-2 text-sm">
                                <p className="text-xs font-bold text-primary">프로젝트</p>
                                <p className="mt-0.5 truncate font-bold text-text-primary">{displayProject.field || '프로젝트'}</p>
                                <p className="mt-1 text-xs text-text-secondary">{statusText}</p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={message.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-border bg-surface text-text-primary'}`}>
                              <ChatMessageContent message={message} isMine={isMine} />
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
                      <input ref={attachmentInputRef} type="file" accept={CHAT_ATTACHMENT_ACCEPT} onChange={sendAttachment} className="hidden" />
                      <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        disabled={!activeRoomId || isPartnerWithdrawn || !isConnected || isUploadingAttachment}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="파일 첨부"
                      >
                        {isUploadingAttachment ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
                      </button>
                      <input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        disabled={isPartnerWithdrawn}
                        placeholder={isPartnerWithdrawn ? '탈퇴한 회원에게는 메시지를 보낼 수 없습니다.' : '메시지 입력...'}
                        className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!draft.trim() || !activeRoomId || isPartnerWithdrawn || !isConnected || isUploadingAttachment}
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
