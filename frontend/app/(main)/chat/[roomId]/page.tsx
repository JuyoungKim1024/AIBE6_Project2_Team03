'use client';

import { getAccessToken } from '@/lib/auth-session';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Loader2, Paperclip, Send } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { ChatRoomList } from '@/components/chat/ChatRoomList';
import { ChatProjectPanel } from '@/components/chat/ChatProjectPanel';
import { ChatMessageContent } from '@/components/chat/ChatMessageContent';
import { useChatSocket } from '@/hooks/useChatSocket';
import { CHAT_ATTACHMENT_ACCEPT, uploadChatAttachment } from '@/lib/api/chat-attachments';
import type { ChatUnreadState } from '@/hooks/useChatUnreadCount';
import { parseProjectMessage, ProjectMessageCard, type ProjectMessagePayload } from '@/components/common/ProjectMessageCard';
import { DisputeModal } from '@/components/dispute/DisputeModal';
import { DisputeResultModal } from '@/components/dispute/DisputeResultModal';
import type { ChatMessage, MyChatRoom } from '@/types/chat';
import { PartnerAvatarDropdown } from '@/components/chat/PartnerAvatarDropdown';
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
  const searchParams = useSearchParams();
  const roomId = params.roomId;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [room, setRoom] = useState<ChatRoomDetail | null>(null);
  const [roomSummary, setRoomSummary] = useState<MyChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectMessagePayload | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPartnerWithdrawn, setIsPartnerWithdrawn] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(
    () => searchParams.get('disputeId')
  );
  const [isCheckingDispute, setIsCheckingDispute] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const getToken = () => getAccessToken();
  const accessToken = getToken();

  const { isConnected, publishMessage } = useChatSocket(roomId, (message) => {
    setMessages((current) => current.some((item) => item.messageId === message.messageId)
      ? current
      : [...current, message]);
    if (document.visibilityState === 'visible') markRoomAsRead();
  }, (project) => {
    setCurrentProject(project);
    if (document.visibilityState === 'visible') markRoomAsRead();
  });

  const fetchJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error('요청에 실패했습니다.');
    }

    if (response.status === 204) return null as T;
    return response.json();
  };

  const loadMessages = async () => {
    const data = await fetchJson<ChatMessage[]>(`/api/chat/rooms/${roomId}/messages`);
    setMessages(data);
  };

  const markRoomAsRead = async () => {
    if (!accessToken) return;
    try {
      const state = await fetchJson<ChatUnreadState>(`/api/chat/rooms/${roomId}/read`, { method: 'PATCH' });
      window.dispatchEvent(new CustomEvent<ChatUnreadState>('chatUnreadChanged', { detail: state }));
    } catch {
      // 읽음 처리 실패가 채팅 이용을 막지 않도록 다음 진입 또는 포커스 시 재시도한다.
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }

    Promise.all([
      fetchJson<AuthUser>('/api/auth/me'),
      fetchJson<ChatRoomDetail>(`/api/chat/rooms/${roomId}`),
      fetchJson<ChatMessage[]>(`/api/chat/rooms/${roomId}/messages`),
      fetchJson<MyChatRoom[]>('/api/users/me/chats'),
      fetchJson<ProjectMessagePayload>(`/api/projects/rooms/${roomId}`).catch(() => null),
    ])
      .then(([me, roomDetail, messageList, rooms, project]) => {
        setUser(me);
        setRoom(roomDetail);
        setMessages(messageList);
        const currentRoom = rooms.find((item) => item.id === roomId);
        setRoomSummary(currentRoom ?? null);
        setIsPartnerWithdrawn(Boolean(currentRoom?.partnerDeleted || currentRoom?.partnerWithdrawn));
        setCurrentProject(project);
        if (document.visibilityState === 'visible') markRoomAsRead();
      })
      .catch(() => setErrorMessage('채팅방 정보를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));

  }, [accessToken, roomId, router]);

  // currentProject 로드 후 진행 중인 분쟁 ID 자동 조회
  useEffect(() => {
    if (!currentProject?.id) return;
    if (searchParams.get('disputeId')) return;

    const token = getToken();
    if (!token) return;

    fetch(`${API_BASE_URL}/api/disputes/project/${currentProject.id}/active`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.status === 200 ? r.json() : null))
      .then((d) => { if (d?.id) setActiveDisputeId(d.id); })
      .catch(() => {});
  }, [currentProject?.id, accessToken]);

  useEffect(() => {
    const markWhenVisible = () => {
      if (document.visibilityState === 'visible') markRoomAsRead();
    };
    window.addEventListener('focus', markWhenVisible);
    document.addEventListener('visibilitychange', markWhenVisible);
    return () => {
      window.removeEventListener('focus', markWhenVisible);
      document.removeEventListener('visibilitychange', markWhenVisible);
    };
  }, [accessToken, roomId]);

  useEffect(() => {
    const disputeId = searchParams.get('disputeId');
    if (disputeId) setActiveDisputeId(disputeId);
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !user || isPartnerWithdrawn) return;

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
    if (!file || !user || !isConnected || isPartnerWithdrawn || isUploadingAttachment) return;

    setIsUploadingAttachment(true);
    setErrorMessage('');
    try {
      const attachment = await uploadChatAttachment(roomId, file);
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

  return (
    <>
      {showDisputeModal && currentProject && (
        <DisputeModal
          projectId={currentProject.id}
          accessToken={accessToken}
          onClose={() => setShowDisputeModal(false)}
          onCreated={(disputeId) => {
            setShowDisputeModal(false);
            setActiveDisputeId(disputeId);
            window.history.replaceState(null, '', `?disputeId=${disputeId}`);
          }}
        />
      )}
      {activeDisputeId && (
        <DisputeResultModal
          disputeId={activeDisputeId}
          accessToken={accessToken}
          onClose={() => {
            setActiveDisputeId(null);
            fetchJson<ProjectMessagePayload>(`/api/projects/rooms/${roomId}`)
              .then((project) => { if (project !== null) setCurrentProject(project); })
              .catch(() => {});
          }}
        />
      )}
    <div className="flex h-[calc(100dvh-6rem)] min-h-[560px] w-full overflow-hidden border-y border-border bg-surface">
      <aside className="hidden h-full w-80 flex-shrink-0 border-r border-border bg-surface md:block">
        <ChatRoomList compact sidebar activeRoomId={roomId} />
      </aside>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/chat" className="rounded-lg p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary" aria-label="채팅 목록으로 이동">
              <ArrowLeft size={18} />
            </Link>
            <PartnerAvatarDropdown
              partnerName={roomSummary?.partnerName ?? '?'}
              partnerId={roomSummary?.partnerId}
              size="lg"
              dropdownPosition="below"
            />
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-text-primary">{roomSummary?.partnerName ?? '채팅방'}</h1>
              <p className="truncate text-xs text-text-muted">
                {roomSummary?.type === 'POST' ? '문의채팅' : roomSummary?.type === 'DIRECT' ? 'DM' : roomSummary?.type === 'MATCHING' ? '맞춤매칭' : room?.roomType ?? '채팅'}
                <span className={`ml-2 ${isConnected ? 'text-green-500' : 'text-text-muted'}`}>● {isConnected ? '연결됨' : '연결 안됨'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(currentProject?.status === 'WORKING' || currentProject?.status === 'COMPLETION_PENDING') && (
              <button
                type="button"
                onClick={async () => {
                  if (!currentProject || isCheckingDispute) return;
                  setIsCheckingDispute(true);
                  try {
                    const token = getToken();
                    const res = await fetch(`${API_BASE_URL}/api/disputes/project/${currentProject.id}/active`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (res.status === 200) {
                      const dispute = await res.json();
                      if (dispute?.id) {
                        setActiveDisputeId(dispute.id);
                        return;
                      }
                    }
                    setShowDisputeModal(true);
                  } catch {
                    setShowDisputeModal(true);
                  } finally {
                    setIsCheckingDispute(false);
                  }
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/10 transition-colors"
                aria-label="AI 분쟁 조정"
              >
                <AlertTriangle size={14} />
                AI 분쟁 조정
              </button>
            )}
          </div>
        </header>

        <ChatProjectPanel
          roomId={roomId}
          userId={user?.id ?? null}
          project={currentProject}
          post={roomSummary?.post ?? null}
          onProjectChange={setCurrentProject}
          publishMessage={publishMessage}
        />

        <main className="flex-1 overflow-y-auto bg-background/40 px-4 py-5">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-text-secondary">채팅방을 불러오는 중입니다</div>
          ) : errorMessage && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-secondary">{errorMessage}</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-text-secondary">
              <span>아직 메시지가 없습니다</span>
              {isPartnerWithdrawn ? <span className="text-xs font-bold text-text-muted">---탈퇴한 회원입니다---</span> : null}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => {
                const isMine = message.senderId === user?.id;
                const isLastInGroup =
                  index === messages.length - 1 ||
                  messages[index + 1].senderId !== message.senderId;
                const projectMessage = parseProjectMessage(message.content);

                if (projectMessage) {
                  const displayProject = currentProject?.id === projectMessage.id
                    ? { ...projectMessage, ...currentProject }
                    : projectMessage;
                  return (
                    <div key={message.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <ProjectMessageCard project={displayProject} />
                    </div>
                  );
                }

                return (
                  <div key={message.messageId} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      isLastInGroup
                        ? <PartnerAvatarDropdown partnerName={roomSummary?.partnerName ?? '?'} partnerId={roomSummary?.partnerId} />
                        : <div className="w-8 flex-shrink-0" />
                    )}
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-border bg-surface text-text-primary'}`}>
                      <ChatMessageContent message={message} isMine={isMine} />
                      <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-text-muted'}`}>
                        {new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {isPartnerWithdrawn ? (
                <div className="py-2 text-center text-xs font-bold text-text-muted">---탈퇴한 회원입니다---</div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {errorMessage && messages.length > 0 && (
          <div className="border-t border-border px-4 py-2 text-xs text-primary">{errorMessage}</div>
        )}

        <form onSubmit={sendMessage} className="border-t border-border bg-surface px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated p-1.5">
            <input ref={attachmentInputRef} type="file" accept={CHAT_ATTACHMENT_ACCEPT} onChange={sendAttachment} className="hidden" />
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              disabled={isPartnerWithdrawn || !isConnected || isUploadingAttachment}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="파일 첨부"
            >
              {isUploadingAttachment ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={isPartnerWithdrawn}
              placeholder={isPartnerWithdrawn ? '탈퇴한 회원에게는 메시지를 보낼 수 없습니다.' : '메시지 입력...'}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isPartnerWithdrawn || !isConnected || isUploadingAttachment}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="메시지 보내기"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
