'use client';

import React, { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  FileText,
  Film,
  FolderOpen,
  GripVertical,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Tag,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { useModal } from '@/store/modalStore';
import { ChatRoomList } from '@/components/chat/ChatRoomList';
import {
  parseProjectMessage,
  ProjectMessageCard,
  serializeProjectMessage,
  type ProjectMessagePayload,
} from '@/components/common/ProjectMessageCard';
import type { ChatMessage, ChatPostSummary, MyChatRoom } from '@/types/chat';
import { DisputeModal } from '@/components/dispute/DisputeModal';
import { DisputeResultModal } from '@/components/dispute/DisputeResultModal';
import {
  fetchCommunityPosts,
  fetchJobPosts,
  getLikedPostIds,
  togglePostLike,
} from '@/lib/api/post';

type Section = 'editor-profile' | 'posts' | 'liked' | 'chats' | 'portfolio' | 'projects' | 'pricing' | 'point';
type SidebarItemId = Section | 'settings';
type UserRole = 'YOUTUBER' | 'EDITOR' | null;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

const sectionIds: Section[] = ['editor-profile', 'posts', 'liked', 'chats', 'portfolio', 'projects', 'pricing', 'point'];

const sidebarItems: { id: SidebarItemId; label: string; icon: any; hasDot?: boolean; editorOnly?: boolean }[] = [
  { id: 'editor-profile', label: '에디터 프로필 등록', icon: Tag, editorOnly: true },
  { id: 'posts', label: '내가 쓴 글', icon: FileText },
  { id: 'liked', label: '좋아요한 글', icon: Heart },
  { id: 'chats', label: '채팅', icon: MessageCircle },
  { id: 'portfolio', label: '포트폴리오 관리', icon: FolderOpen, editorOnly: true },
  { id: 'projects', label: '프로젝트 관리', icon: Briefcase },
  { id: 'pricing', label: '맞춤매칭 단가 설정', icon: Wallet, editorOnly: true },
  { id: 'point', label: '포인트', icon: Coins },
  { id: 'settings', label: '설정', icon: Settings },
];

type MyPost = {
  id: string;
  boardType: 'JOB' | 'COMMUNITY';
  postType: 'RECRUITING' | 'JOB_SEARCH' | string | null;
  title: string;
  date: string;
  views: number;
  comments: number;
  likes: number;
  publicVisible: boolean;
};

type MyLikedPost = {
  id: string;
  boardType: 'JOB' | 'COMMUNITY';
  postType: string | null;
  title: string;
  authorName: string;
  likes: number;
  comments: number;
  views: number;
  date: string;
};

type AuthUser = {
  id: string;
  nickname: string;
};

type ChatFilter = 'ALL' | 'POST' | 'DIRECT' | 'UNREAD';

type ProjectCreateForm = {
  field: string;
  price: string;
  videoLength: string;
  deadline: string;
  memo: string;
};

type ProjectFormMode = 'create' | 'edit';
type ProjectAction = 'start' | 'reject' | 'complete' | 'cancel';

type MyProject = {
  id: string;
  roomId?: string;
  requesterId?: string;
  editorId?: string;
  completionRequestedBy?: string | null;
  partnerName: string;
  field: string | null;
  status: string;
  date: string;
};

type MyMatchRequest = {
  id: string;
  requesterName: string;
  status: string;
  date: string;
};

type MyProjects = {
  received: MyMatchRequest[];
  ongoing: MyProject[];
};

type MatchPriceUnit = 'MIN' | 'CASE';

type MatchingPrice = {
  matchEnabled: boolean;
  matchPriceMin: number | null;
  matchPriceMax: number | null;
  matchPriceUnit: MatchPriceUnit | null;
  representativePortfolioConfigured: boolean;
};

type PublicContentVisibility = {
  publicPostsVisible: boolean;
  publicJobPostsVisible: boolean;
  publicCommunityPostsVisible: boolean;
  publicLikedPostsVisible: boolean;
};

const fieldTags = ['롱폼', '숏폼', '썸네일'];
const detailTags = ['게임', '여행', '브이로그', '반려동물', '음악', 'IT', '애니메이션', '기타'];
const videoTools = ['Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'CapCut', '기타'];
const designTools = ['Photoshop', 'Adobe Illustrator', 'Figma', 'Canva', '기타'];

type PortfolioType = 'video' | 'image';

function getTomorrowDateTimeLocalMin() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const timezoneOffsetMs = tomorrow.getTimezoneOffset() * 60 * 1000;
  return new Date(tomorrow.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function toDateTimeLocalValue(value: string | null) {
  return value ? value.slice(0, 16) : '';
}

function isWaitingProject(project: ProjectMessagePayload | null | undefined) {
  return project?.status === 'WAITING';
}

function isWorkingProject(project: ProjectMessagePayload | null | undefined) {
  return project?.status === 'WORKING';
}

function isCompletionPendingProject(project: ProjectMessagePayload | null | undefined) {
  return project?.status === 'COMPLETION_PENDING';
}

function isOpenProject(project: ProjectMessagePayload | null | undefined) {
  return project ? ['WAITING', 'WORKING', 'COMPLETION_PENDING'].includes(project.status) : false;
}

function isVisibleChatProject(project: ProjectMessagePayload | null | undefined) {
  return project ? ['WAITING', 'WORKING', 'COMPLETION_PENDING', 'COMPLETED', 'REJECTED', 'CANCELED'].includes(project.status) : false;
}

function getProjectMessageLabel(project: ProjectMessagePayload) {
  if (project.status === 'WAITING') return '프로젝트 수락 대기';
  if (project.status === 'WORKING') return '프로젝트 진행 중';
  if (project.status === 'COMPLETION_PENDING') return '프로젝트 완료 대기';
  if (project.status === 'COMPLETED') return '프로젝트 완료';
  if (project.status === 'REJECTED') return '프로젝트 거절';
  if (project.status === 'CANCELED') return '프로젝트 취소';
  return '프로젝트';
}

function getChatLastMessageText(lastMessage: string) {
  if (!lastMessage) return '아직 메시지가 없습니다';
  const project = parseProjectMessage(lastMessage);
  return project ? '프로젝트' : lastMessage;
}

function canRespondProject(project: { status?: string; requesterId?: string } | null | undefined, userId: string | null | undefined) {
  if (!project || !userId || project.status !== 'WAITING') return false;
  return project.requesterId ? project.requesterId !== userId : true;
}

type PortfolioDraft = {
  id: string;
  type: PortfolioType;
  title: string;
  fileName: string;
  url: string;          // 서버 업로드 후 받은 URL (또는 로컬 미리보기용 objectUrl)
  isRepresentative: boolean;
  displayOrder: number;
  groupId: string | null;
  uploading?: boolean;  // 업로드 진행 중 여부
};

type PortfolioGroupDraft = {
  id: string;
  name: string;
  displayOrder: number;
  representative: boolean;
};

function getUserStorageKey(userId: string | null | undefined, key: string) {
  return userId ? `${key}:${userId}` : null;
}

function loadPortfolios(userId?: string | null) {
  const storageKey = getUserStorageKey(userId, 'editorPortfolios');
  if (!storageKey) {
    return [];
  }
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as PortfolioDraft[];
  } catch {
    return [];
  }
}

function savePortfolios(userId: string | null | undefined, portfolios: PortfolioDraft[]) {
  const storageKey = getUserStorageKey(userId, 'editorPortfolios');
  if (storageKey) {
    localStorage.setItem(storageKey, JSON.stringify(portfolios));
  }
}

function hasLocalRepresentativePortfolio(userId?: string | null) {
  return loadPortfolios(userId).some((portfolio) => portfolio.isRepresentative && portfolio.displayOrder === 1);
}

function isAcceptedPortfolioFile(type: PortfolioType, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (type === 'image') {
    return ['png', 'jpg', 'jpeg'].includes(extension) || ['image/png', 'image/jpeg'].includes(file.type);
  }
  return ['mp4', 'webm', 'mov'].includes(extension) || file.type.startsWith('video/');
}

function getAccessToken(): string {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Login required');
  return token;
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: formData,
  });

  if (!res.ok) throw new Error('파일 업로드에 실패했습니다.');
  const data = await res.json();
  return data.url as string;
}

async function fetchMyPageData<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (!response.ok) throw new Error('Failed to load data');
  return response.json();
}

async function deleteMyPageData(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (!response.ok) throw new Error('Failed to delete data');
}

async function putMyPageData(path: string, body: unknown): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    try {
      const data = await response.json();
      throw new Error(data.message ?? '저장에 실패했습니다.');
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('저장에 실패했습니다.');
    }
  }
}

async function putMyPageDataWithResponse<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? '저장에 실패했습니다.');
  }
  return response.json();
}

async function postMyPageDataWithResponse<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? '저장에 실패했습니다.');
  }
  return response.json();
}

async function patchMyPageData<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    try {
      const data = await response.json();
      throw new Error(data.message ?? '저장에 실패했습니다.');
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('저장에 실패했습니다.');
    }
  }

  return response.json();
}

function EditorProfileSection({ userId, onSaved }: { userId: string | null; onSaved: () => void }) {
  const { openModal } = useModal();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioDraft[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId) return;

    fetchMyPageData<{ fields: string[]; tools: string[]; contentTypes: string[] }>('/api/users/me/tags')
      .then((data) => {
        setSelectedDetails(data.fields ?? []);
        setSelectedTools(data.tools ?? []);
        setSelectedFields(data.contentTypes ?? []);
        if (data.fields.length > 0 || data.tools.length > 0 || data.contentTypes.length > 0) {
          setIsRegistered(true);
          setIsEditing(false);
        }
      })
      .catch(() => {});

    fetchMyPageData<{ id: string; title: string; url: string; type: string; representative: boolean; displayOrder: number; groupId: string | null }[]>('/api/users/me/portfolios')
      .then((data) => {
        const loaded: PortfolioDraft[] = data.map((item) => ({
          id: item.id,
          type: item.type as PortfolioType,
          title: item.title,
          fileName: item.title,
          url: item.url,
          isRepresentative: item.representative,
          displayOrder: item.displayOrder,
          groupId: item.groupId,
        }));
        setPortfolios(loaded);
        if (loaded.length > 0) {
          setIsRegistered(true);
          setIsEditing(false);
        }
      })
      .catch(() => {});
  }, [userId]);

  const toggleValue = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
  };

  const addPortfolio = async (type: PortfolioType, file: File) => {
    if (!isAcceptedPortfolioFile(type, file)) {
      setMessage(type === 'image' ? 'PNG, JPG, JPEG 이미지만 업로드할 수 있습니다.' : '지원하지 않는 영상 파일입니다.');
      return;
    }

    const tempId = `${type}-${Date.now()}-${crypto.randomUUID()}`;

    // 업로드 중 임시 항목 추가
    setPortfolios((prev) => [
      ...prev,
      {
        id: tempId,
        type,
        title: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        url: '',
        isRepresentative: !prev.some((p) => p.isRepresentative),
        displayOrder: prev.length + 1,
        groupId: null,
        uploading: true,
      },
    ]);

    try {
      const url = await uploadFile(file);
      setPortfolios((prev) =>
        prev.map((p) => p.id === tempId ? { ...p, url, uploading: false } : p)
      );
    } catch {
      setPortfolios((prev) => prev.filter((p) => p.id !== tempId));
      setMessage('파일 업로드에 실패했습니다.');
    }
  };

  const removePortfolio = (id: string) => {
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
  };

  const saveEditorProfile = async () => {
    if (!userId) return;

    if (portfolios.length === 0) {
      openModal({
        title: '포트폴리오를 등록해주세요',
        message: '영상 포트폴리오 또는 이미지 포트폴리오 중 하나 이상을 등록해야 프로필을 저장할 수 있습니다.',
      });
      return;
    }

    if (portfolios.some((p) => p.uploading)) {
      openModal({ title: '잠시만요', message: '파일 업로드가 진행 중입니다. 완료 후 저장해주세요.' });
      return;
    }

    setIsSaving(true);
    setMessage('');
    try {
      await Promise.all([
        putMyPageData('/api/users/me/tags', {
          fields: selectedDetails,
          tools: selectedTools,
          contentTypes: selectedFields,
        }),
        putMyPageData('/api/users/me/portfolios', portfolios.map((p, i) => ({
          title: p.title,
          url: p.url,
          type: p.type,
          representative: p.isRepresentative,
          displayOrder: i + 1,
          groupId: p.groupId,
        }))),
      ]);
      savePortfolios(userId, portfolios);
      setIsRegistered(true);
      setIsEditing(false);
      onSaved();
      setMessage('에디터 프로필이 저장되었습니다.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const isViewMode = isRegistered && !isEditing;

  return (
    <SectionCard title={isRegistered ? '에디터 프로필 수정' : '에디터 프로필 등록'} description="분야와 툴 태그를 선택하고 공개 프로필에 노출할 포트폴리오를 등록합니다.">
      {isViewMode ? (
        <div className="space-y-8">
          <TagSummary title="콘텐츠 유형" values={selectedFields} />
          <TagSummary title="세부 분야" values={selectedDetails} />
          <TagSummary title="툴" values={selectedTools} />
          <PortfolioSummaryList portfolios={portfolios} />
          {message && (
            <p className={`text-sm font-bold ${message.includes('실패') ? 'text-accent' : 'text-primary'}`}>{message}</p>
          )}
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setMessage('');
            }}
            className="px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            수정
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <TagGroup title="콘텐츠 유형" options={fieldTags} selected={selectedFields} onToggle={(value) => toggleValue(value, setSelectedFields)} />
          <TagGroup title="세부 분야" options={detailTags} selected={selectedDetails} onToggle={(value) => toggleValue(value, setSelectedDetails)} />
          <TagGroup title="영상편집 툴" options={videoTools} selected={selectedTools} onToggle={(value) => toggleValue(value, setSelectedTools)} />
          <TagGroup title="디자인 툴" options={designTools} selected={selectedTools} onToggle={(value) => toggleValue(value, setSelectedTools)} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PortfolioDropzone type="video" title="영상 포트폴리오 등록" accept="video/*,.mp4,.webm,.mov" onAdd={addPortfolio} />
            <PortfolioDropzone type="image" title="이미지 포트폴리오 등록" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onAdd={addPortfolio} />
          </div>
          <PortfolioPreviewList portfolios={portfolios} onRemove={removePortfolio} />
          {message && (
            <p className={`text-sm font-bold ${message.includes('실패') ? 'text-accent' : 'text-primary'}`}>{message}</p>
          )}
          <button
            onClick={saveEditorProfile}
            disabled={isSaving}
            className="px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '저장 중...' : isRegistered ? '수정 저장' : '등록'}
          </button>
        </div>
      )}
    </SectionCard>
  );
}

function PortfolioDropzone({ type, title, accept, onAdd }: { type: PortfolioType; title: string; accept: string; onAdd: (type: PortfolioType, file: File) => void }) {
  const inputId = `${type}-portfolio-input`;

  const addFiles = (files: FileList | null) => {
    Array.from(files ?? []).forEach((file) => onAdd(type, file));
  };

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        addFiles(event.dataTransfer.files);
      }}
      className="min-h-44 cursor-pointer rounded-xl border border-dashed border-border bg-surface-elevated p-5 flex flex-col items-center justify-center text-center hover:border-primary/60 transition-colors"
    >
      <input id={inputId} type="file" accept={accept} multiple className="hidden" onChange={(event) => {
        addFiles(event.target.files);
        event.currentTarget.value = '';
      }} />
      <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
        {type === 'video' ? <Film size={20} /> : <ImageIcon size={20} />}
      </div>
      <div className="font-bold text-text-primary">{title}</div>
      <div className="flex items-center gap-1.5 text-xs text-text-muted mt-2">
        <Upload size={13} />
        파일 선택 또는 드래그 앤 드롭
      </div>
    </label>
  );
}

function PortfolioPreviewList({ portfolios, onRemove }: { portfolios: PortfolioDraft[]; onRemove: (id: string) => void }) {
  if (portfolios.length === 0) {
    return <EmptyState message="등록된 포트폴리오가 없습니다" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {portfolios.map((portfolio) => (
        <div key={portfolio.id} className="rounded-xl bg-surface-elevated border border-border p-4 flex gap-3">
          <div className="w-20 h-14 rounded-lg bg-surface border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
            {portfolio.uploading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : portfolio.type === 'image' && portfolio.url ? (
              <img src={portfolio.url} alt={portfolio.title} className="w-full h-full object-cover" />
            ) : (
              <Film size={22} className="text-text-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary">{portfolio.type === 'video' ? '영상' : '이미지'}</span>
              {portfolio.uploading && <span className="text-xs text-text-muted">업로드 중...</span>}
              {!portfolio.uploading && <span className="text-xs text-text-muted truncate">{portfolio.fileName}</span>}
            </div>
            <div className="font-bold text-sm text-text-primary truncate mt-1">{portfolio.title}</div>
          </div>
          <button type="button" onClick={() => onRemove(portfolio.id)} disabled={portfolio.uploading} className="text-xs font-bold text-accent hover:opacity-80 disabled:opacity-30">
            삭제
          </button>
        </div>
      ))}
    </div>
  );
}

function TagSummary({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-text-primary mb-3">{title}</h3>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span key={`${title}-${value}`} className="px-3 py-2 rounded-lg text-sm font-bold border border-primary bg-primary/10 text-primary">
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">선택된 항목이 없습니다</p>
      )}
    </div>
  );
}

function PortfolioSummaryList({ portfolios }: { portfolios: PortfolioDraft[] }) {
  if (portfolios.length === 0) {
    return <EmptyState message="등록된 포트폴리오가 없습니다" />;
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-text-primary mb-3">포트폴리오</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {portfolios.map((portfolio) => (
          <div key={portfolio.id} className="rounded-xl bg-surface-elevated border border-border p-4 flex gap-3">
            <div className="w-24 h-16 rounded-lg bg-surface border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
              {portfolio.type === 'image' && portfolio.url ? (
                <img src={portfolio.url} alt={portfolio.title} className="w-full h-full object-cover" />
              ) : portfolio.type === 'video' && portfolio.url ? (
                <video src={portfolio.url} className="w-full h-full object-cover" muted />
              ) : (
                <Film size={22} className="text-text-muted" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{portfolio.type === 'video' ? '영상' : '이미지'}</span>
                <span className="text-xs text-text-muted truncate">{portfolio.fileName}</span>
              </div>
              <div className="font-bold text-sm text-text-primary truncate mt-1">{portfolio.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagGroup({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-text-primary mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button key={`${title}-${option}`} type="button" onClick={() => onToggle(option)} className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'}`}>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface-elevated text-text-secondary'}`}>
      {label}
    </button>
  );
}

function PublicVisibilityToggle({ field, label, onChanged }: { field: keyof PublicContentVisibility; label: string; onChanged?: (active: boolean) => void }) {
  const [active, setActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMyPageData<PublicContentVisibility>('/api/users/me/public-content-visibility')
      .then((data) => setActive(data[field]))
      .catch(() => setActive(false));
  }, [field]);

  const toggle = async () => {
    const next = !active;
    setActive(next);
    setIsSaving(true);
    try {
      const saved = await patchMyPageData<PublicContentVisibility>('/api/users/me/public-content-visibility', {
        [field]: next,
      });
      setActive(saved[field]);
      onChanged?.(saved[field]);
    } catch {
      setActive(!next);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-xl bg-surface-elevated border border-border p-4">
      <div>
        <div className="font-bold text-text-primary">{label}</div>
        <div className="text-xs text-text-muted mt-1">켜두면 공개 프로필에 이 목록이 표시됩니다.</div>
      </div>
      <button type="button" onClick={toggle} disabled={isSaving} className={`relative w-14 h-8 rounded-full transition-colors ${active ? 'bg-primary' : 'bg-surface border border-border'} ${isSaving ? 'opacity-60' : ''}`}>
        <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${active ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );
}

function PostsSection({ userRole }: { userRole: UserRole }) {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = () => {
    setIsLoading(true);
    fetchMyPageData<MyPost[]>('/api/users/me/posts')
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const deletePost = async (postId: string) => {
    await deleteMyPageData(`/api/users/me/posts/${postId}`);
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const togglePostVisibility = async (postId: string, publicVisible: boolean) => {
    setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, publicVisible } : post));
    try {
      const saved = await patchMyPageData<MyPost>(`/api/users/me/posts/${postId}/visibility`, { publicVisible });
      setPosts((prev) => prev.map((post) => post.id === postId ? saved : post));
    } catch {
      setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, publicVisible: !publicVisible } : post));
    }
  };

  const toggleGroupVisibility = async (targetPosts: MyPost[], publicVisible: boolean) => {
    if (targetPosts.length === 0) return;

    const targetIds = new Set(targetPosts.map((post) => post.id));
    const previousPosts = posts;
    setPosts((prev) => prev.map((post) => targetIds.has(post.id) ? { ...post, publicVisible } : post));

    try {
      const savedPosts = await Promise.all(
        targetPosts.map((post) => patchMyPageData<MyPost>(`/api/users/me/posts/${post.id}/visibility`, { publicVisible }))
      );
      setPosts((prev) => prev.map((post) => savedPosts.find((saved) => saved.id === post.id) ?? post));
    } catch {
      setPosts(previousPosts);
    }
  };

  const jobPosts = posts.filter((post) => post.boardType === 'JOB');
  const communityPosts = posts.filter((post) => post.boardType === 'COMMUNITY');
  const jobTitle = userRole === 'YOUTUBER' ? '구인글' : '구직글';
  const jobEmptyMessage = userRole === 'YOUTUBER' ? '작성한 구인글이 없습니다' : '작성한 구직글이 없습니다';

  return (
    <SectionCard title="내가 쓴 글" description="구인구직과 커뮤니티 작성글을 통합 관리합니다.">
      {isLoading ? (
        <EmptyState message="작성글을 불러오는 중입니다" />
      ) : (
        <div className="space-y-8">
          <PostManageGroup
            title={jobTitle}
            visibilityField="publicJobPostsVisible"
            visibilityLabel={`공개 프로필에 ${jobTitle} 공개`}
            posts={jobPosts}
            emptyMessage={jobEmptyMessage}
            onDelete={deletePost}
            onToggleVisibility={togglePostVisibility}
            onBulkVisibilityChange={(publicVisible) => toggleGroupVisibility(jobPosts, publicVisible)}
          />
          <PostManageGroup
            title="커뮤니티글"
            visibilityField="publicCommunityPostsVisible"
            visibilityLabel="공개 프로필에 커뮤니티글 공개"
            posts={communityPosts}
            emptyMessage="작성한 커뮤니티글이 없습니다"
            onDelete={deletePost}
            onToggleVisibility={togglePostVisibility}
            onBulkVisibilityChange={(publicVisible) => toggleGroupVisibility(communityPosts, publicVisible)}
          />
        </div>
      )}
    </SectionCard>
  );
}

function PostManageGroup({
  title,
  visibilityField,
  visibilityLabel,
  posts,
  emptyMessage,
  onDelete,
  onToggleVisibility,
  onBulkVisibilityChange,
}: {
  title: string;
  visibilityField: keyof PublicContentVisibility;
  visibilityLabel: string;
  posts: MyPost[];
  emptyMessage: string;
  onDelete: (postId: string) => void;
  onToggleVisibility: (postId: string, publicVisible: boolean) => void;
  onBulkVisibilityChange: (publicVisible: boolean) => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <span className="text-sm text-text-muted">{posts.length}개</span>
      </div>
      <PublicVisibilityToggle field={visibilityField} label={visibilityLabel} onChanged={onBulkVisibilityChange} />
      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostManageItem key={post.id} post={post} onDelete={onDelete} onToggleVisibility={onToggleVisibility} />
          ))}
        </div>
      ) : (
        <EmptyState message={emptyMessage} />
      )}
    </section>
  );
}

function PostManageItem({
  post,
  onDelete,
  onToggleVisibility,
}: {
  post: MyPost;
  onDelete: (postId: string) => void;
  onToggleVisibility: (postId: string, publicVisible: boolean) => void;
}) {
  const typeLabel = post.boardType === 'COMMUNITY'
    ? '커뮤니티글'
    : post.postType === 'RECRUITING'
      ? '구인글'
      : '구직글';
  const typeClass = post.boardType === 'COMMUNITY'
    ? 'bg-cyan-400/10 text-cyan-400'
    : post.postType === 'RECRUITING'
      ? 'bg-accent/10 text-accent'
      : 'bg-primary/10 text-primary';

  return (
    <div className="bg-surface-elevated border border-border rounded-xl p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeClass}`}>{typeLabel}</span>
        <span className="text-xs text-text-muted">{post.date}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-bold text-text-primary">{post.title}</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleVisibility(post.id, !post.publicVisible)}
            className={`relative w-12 h-7 rounded-full transition-colors ${post.publicVisible ? 'bg-primary' : 'bg-surface border border-border'}`}
            aria-label="글 공개 여부 변경"
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${post.publicVisible ? 'translate-x-5' : ''}`} />
          </button>
          <button onClick={() => onDelete(post.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 transition-colors">삭제</button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-muted mt-2">
        <span>좋아요 {post.likes}</span>
        <span>조회 {post.views}</span>
        <span>댓글 {post.comments}</span>
      </div>
    </div>
  );
}

function LikedSection() {
  const [likedPosts, setLikedPosts] = useState<MyLikedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getLikedPostIds(),
      fetchJobPosts(),
      fetchCommunityPosts(),
    ])
      .then(([likedIds, jobPosts, communityPosts]) => {
        const likedIdSet = new Set(likedIds);
        const posts = [
          ...jobPosts
            .filter((post) => likedIdSet.has(post.id))
            .map((post) => ({
              id: post.id,
              boardType: 'JOB' as const,
              postType: post.postType,
              title: post.title,
              authorName: post.author.nickname,
              likes: post.likeCount,
              comments: post.commentCount,
              views: post.viewCount,
              date: new Date(post.createdAt).toLocaleDateString('ko-KR'),
              createdAt: post.createdAt,
            })),
          ...communityPosts
            .filter((post) => likedIdSet.has(post.id))
            .map((post) => ({
              id: post.id,
              boardType: 'COMMUNITY' as const,
              postType: null,
              title: post.title,
              authorName: post.author.nickname,
              likes: post.likeCount,
              comments: post.commentCount,
              views: post.viewCount,
              date: new Date(post.createdAt).toLocaleDateString('ko-KR'),
              createdAt: post.createdAt,
            })),
        ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
        setLikedPosts(posts.map(({ createdAt: _createdAt, ...post }) => post));
      })
      .catch(() => {
        setLikedPosts([]);
        setError('좋아요한 게시글을 불러오지 못했습니다.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const unlikePost = async (postId: string) => {
    setError('');
    try {
      const result = await togglePostLike(postId);
      if (!result.liked) {
        setLikedPosts((prev) => prev.filter((post) => post.id !== postId));
      }
    } catch {
      setError('좋아요 해제에 실패했습니다.');
    }
  };

  return (
    <SectionCard title="좋아요한 글" description="좋아요한 게시글을 통합 조회합니다.">
      <PublicVisibilityToggle field="publicLikedPostsVisible" label="공개 프로필에 좋아요한 글 공개" />
      {error && <p className="text-sm font-bold text-accent mb-4">{error}</p>}
      {isLoading ? (
        <EmptyState message="좋아요한 게시글을 불러오는 중입니다" />
      ) : likedPosts.length > 0 ? (
        <div className="space-y-3">
          {likedPosts.map((post) => (
            <div key={post.id} className="bg-surface-elevated border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${post.boardType === 'JOB' ? 'bg-accent/10 text-accent' : 'bg-cyan-400/10 text-cyan-400'}`}>{post.boardType === 'JOB' ? '구인구직' : '커뮤니티'}</span>
                <span className="text-xs text-text-muted">{post.authorName}</span>
                <span className="text-xs text-text-muted">·</span>
                <span className="text-xs text-text-muted">{post.date}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <Link href={post.boardType === 'JOB' ? `/jobs/${post.id}` : `/community/${post.id}`} className="font-bold text-text-primary hover:text-primary transition-colors">
                  {post.title}
                </Link>
                <button onClick={() => unlikePost(post.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors">좋아요 해제</button>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted mt-2"><span>좋아요 {post.likes}</span><span>조회 {post.views}</span><span>댓글 {post.comments}</span></div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="좋아요한 게시글이 없습니다" />
      )}
    </SectionCard>
  );
}

function ChatsSection() {
  const { openModal } = useModal();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get('roomId');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatRooms, setChatRooms] = useState<MyChatRoom[]>([]);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('ALL');
  const [chatPage, setChatPage] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectMessagePayload | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectAction, setProjectAction] = useState<ProjectAction | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showPostCard, setShowPostCard] = useState(false);
  const [showProjectCard, setShowProjectCard] = useState(false);
  const [projectFormMode, setProjectFormMode] = useState<ProjectFormMode>('create');
  const [editingProject, setEditingProject] = useState<ProjectMessagePayload | null>(null);
  const [projectRoomId, setProjectRoomId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectCreateForm>({
    field: '',
    price: '',
    videoLength: '',
    deadline: '',
    memo: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);

  const selectedRoom = chatRooms.find((room) => room.id === selectedRoomId);
  const selectedPost = selectedRoom?.post ?? null;
  const isPartnerWithdrawn = Boolean(selectedRoom?.partnerDeleted || selectedRoom?.partnerWithdrawn);
  const minProjectDeadline = getTomorrowDateTimeLocalMin();
  const roomProject = currentProject?.roomId === selectedRoomId ? currentProject : null;
  const pinnedProject = isVisibleChatProject(roomProject) ? roomProject : null;
  const filteredRooms = chatRooms.filter((room) => {
    if (activeFilter === 'POST') return room.type === 'POST';
    if (activeFilter === 'DIRECT') return room.type === 'DIRECT';
    if (activeFilter === 'UNREAD') return room.unreadCount > 0;
    return true;
  });
  const roomsPerPage = 7;
  const totalChatPages = Math.max(1, Math.ceil(filteredRooms.length / roomsPerPage));
  const pagedRooms = filteredRooms.slice((chatPage - 1) * roomsPerPage, chatPage * roomsPerPage);
  const chatFilters: { id: ChatFilter; label: string }[] = [
    { id: 'ALL', label: '전체' },
    { id: 'POST', label: '문의채팅' },
    { id: 'DIRECT', label: 'DM' },
    { id: 'UNREAD', label: '안읽은 메시지' },
  ];

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const rooms = await fetchMyPageData<MyChatRoom[]>('/api/users/me/chats');
      setChatRooms(rooms);
      setSelectedRoomId((current) => {
        if (roomIdParam && rooms.some((room) => room.id === roomIdParam)) {
          return roomIdParam;
        }
        if (current && rooms.some((room) => room.id === current)) {
          return current;
        }
        return rooms[0]?.id ?? null;
      });
    } catch {
      setChatRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    setIsLoadingMessages(true);
    setErrorMessage('');
    setMessages([]);
    try {
      const data = await fetchMyPageData<ChatMessage[]>(`/api/chat/rooms/${roomId}/messages`);
      setMessages(data);
    } catch {
      setMessages([]);
      setErrorMessage('메시지를 불러오지 못했습니다.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const MONEY_STATUSES = ['WORKING', 'COMPLETED', 'CANCELED'];

  const refreshPointBalance = () => {
    fetchMyPageData<{ point: number; safePaymentPoint: number }>('/api/point')
      .then((balance) => window.dispatchEvent(new CustomEvent('pointBalanceUpdated', { detail: balance })))
      .catch(() => {});
  };

  const fetchProject = async (roomId: string) => {
    try {
      const project = await fetchMyPageData<ProjectMessagePayload>(`/api/projects/rooms/${roomId}`);
      setCurrentProject((prev) => {
        if (prev?.status !== project.status && MONEY_STATUSES.includes(project.status)) {
          refreshPointBalance();
        }
        return project;
      });
      return project;
    } catch {
      try {
        const data = await fetchMyPageData<MyProjects>('/api/users/me/projects');
        const project = data.ongoing.find((item) => item.roomId === roomId && ['COMPLETION_PENDING', 'COMPLETED', 'REJECTED', 'CANCELED'].includes(item.status));
        if (project) {
          const memo =
            project.status === 'REJECTED'
              ? '거절된 프로젝트입니다.'
              : project.status === 'CANCELED'
                ? '취소된 프로젝트입니다.'
                : project.status === 'COMPLETION_PENDING'
                  ? '상대방의 완료 확인을 기다리는 중입니다.'
                  : '완료된 프로젝트입니다.';
          const completedProject: ProjectMessagePayload = {
            id: project.id,
            roomId,
            requesterId: project.requesterId,
            completionRequestedBy: project.completionRequestedBy,
            field: project.field,
            price: null,
            videoLength: null,
            deadline: null,
            memo,
            status: project.status,
          };
          setCurrentProject(completedProject);
          return completedProject;
        }
      } catch {
        // 활성 프로젝트가 없으면 채팅 메시지에 저장된 카드도 숨긴다.
      }
      setCurrentProject(null);
      return null;
    }
  };

  useEffect(() => {
    fetchMyPageData<AuthUser>('/api/auth/me').then(setUser).catch(() => setUser(null));
    loadRooms();
  }, [roomIdParam]);

  useEffect(() => {
    if (!roomIdParam || chatRooms.length === 0) return;
    if (chatRooms.some((room) => room.id === roomIdParam)) {
      setSelectedRoomId(roomIdParam);
      setActiveFilter('ALL');
    }
  }, [chatRooms, roomIdParam]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      setCurrentProject(null);
      return;
    }
    setShowPostCard(false);
    setShowProjectCard(false);
    setCurrentProject(null);
    loadMessages(selectedRoomId);
    fetchProject(selectedRoomId);
  }, [selectedRoomId]);

  useEffect(() => {
    setChatPage(1);
  }, [activeFilter]);

  useEffect(() => {
    if (chatPage > totalChatPages) {
      setChatPage(totalChatPages);
    }
  }, [chatPage, totalChatPages]);

  useEffect(() => {
    if (!selectedRoomId) return;
    const intervalId = window.setInterval(() => fetchProject(selectedRoomId), 10000);
    const refetch = () => {
      if (document.visibilityState === 'visible') fetchProject(selectedRoomId);
    };
    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', refetch);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', refetch);
    };
  }, [selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedRoomId || !user || isSending || isPartnerWithdrawn) return;

    setIsSending(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${selectedRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          senderId: user.id,
          content,
          messageType: 'TEXT',
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const saved = await response.json() as ChatMessage;
      const savedMessage = saved.messageId ? saved : { ...saved, messageId: `requested-${Date.now()}` };
      setMessages((current) => [...current, savedMessage]);
      setDraft('');
      loadRooms();
    } catch {
      setErrorMessage('메시지를 보내지 못했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const deleteRoom = (roomId: string) => {
    openModal({
      title: '확인',
      message: '채팅방을 목록에서 삭제하시겠습니까?',
      confirmLabel: '삭제',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${getAccessToken()}` },
          });

          if (!response.ok) throw new Error('Failed to delete room');

          const nextRooms = chatRooms.filter((room) => room.id !== roomId);
          setChatRooms(nextRooms);

          if (selectedRoomId === roomId) {
            const nextSelectedRoomId = nextRooms.find((room) => {
              if (activeFilter === 'POST') return room.type === 'POST';
              if (activeFilter === 'DIRECT') return room.type === 'DIRECT';
              if (activeFilter === 'UNREAD') return room.unreadCount > 0;
              return true;
            })?.id ?? null;

            setSelectedRoomId(nextSelectedRoomId);
            if (!nextSelectedRoomId) {
              setMessages([]);
            }
          }
        } catch {
          setErrorMessage('채팅방을 삭제하지 못했습니다.');
        }
      },
    });
  };

  const updateProjectForm = (key: keyof ProjectCreateForm, value: string) => {
    setProjectForm((current) => ({ ...current, [key]: value }));
  };

  const closeProjectForm = () => {
    if (isCreatingProject) return;
    setShowProjectForm(false);
    setProjectRoomId(null);
    setEditingProject(null);
    setProjectFormMode('create');
  };

  const openProjectForm = () => {
    const roomId = selectedRoomId ?? filteredRooms[0]?.id ?? null;
    if (!roomId) {
      setErrorMessage('프로젝트를 시작할 채팅방을 선택해주세요.');
      return;
    }

    setProjectRoomId(roomId);
    setSelectedRoomId(roomId);
    setProjectFormMode('create');
    setEditingProject(null);
    setProjectForm({
      field: '',
      price: '',
      videoLength: '',
      deadline: '',
      memo: '',
    });
    setErrorMessage('');
    setShowProjectForm(true);
  };

  const openEditProjectForm = (project: ProjectMessagePayload) => {
    setProjectRoomId(project.roomId);
    setProjectFormMode('edit');
    setEditingProject(project);
    setProjectForm({
      field: project.field ?? '',
      price: project.price ? String(project.price) : '',
      videoLength: project.videoLength ? String(project.videoLength) : '',
      deadline: toDateTimeLocalValue(project.deadline),
      memo: project.memo ?? '',
    });
    setErrorMessage('');
    setShowProjectForm(true);
  };

  const upsertProjectMessage = (project: ProjectMessagePayload) => {
    setCurrentProject(project);
    setMessages((current) => current.map((message) => {
      const messageProject = parseProjectMessage(message.content);
      if (messageProject?.id !== project.id) return message;
      return { ...message, content: serializeProjectMessage(project) };
    }));
  };

  const updateProjectStatus = (project: ProjectMessagePayload, action: ProjectAction) => {
    const confirmMessage =
      action === 'start'
        ? '프로젝트를 수락하시겠습니까?'
        : action === 'reject'
          ? '프로젝트를 거절하시겠습니까?'
          : action === 'complete'
            ? '프로젝트를 완료하시겠습니까?'
            : '프로젝트를 취소하시겠습니까?';

    openModal({
      title: '확인',
      message: confirmMessage,
      confirmLabel: '확인',
      onConfirm: async () => {
        setProjectAction(action);
        setErrorMessage('');
        try {
          const response = await fetch(`${API_BASE_URL}/api/projects/${project.id}/${action}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${getAccessToken()}` },
          });

          if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.message ?? '프로젝트 상태를 변경하지 못했습니다.');
          }

          const savedProject = await response.json() as ProjectMessagePayload;
          upsertProjectMessage(savedProject);

          if (action === 'reject' && user) {
            const messageResponse = await fetch(`${API_BASE_URL}/api/chat/rooms/${project.roomId}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAccessToken()}`,
              },
              body: JSON.stringify({
                senderId: user.id,
                content: '프로젝트가 거절되었습니다.',
                messageType: 'TEXT',
              }),
            }).catch(() => null);
            if (messageResponse?.ok && project.roomId === selectedRoomId) {
              const savedMessage = await messageResponse.json() as ChatMessage;
              setMessages((current) => [...current, savedMessage]);
            }
          }

          openModal({
            title: '알림',
            message: action === 'start'
              ? '프로젝트를 수락했습니다.'
              : action === 'reject'
                ? '프로젝트를 거절했습니다.'
                : action === 'complete'
                  ? savedProject.status === 'COMPLETION_PENDING' ? '프로젝트 완료 요청을 보냈습니다.' : '프로젝트를 완료했습니다.'
                  : '프로젝트를 취소했습니다.',
          });
          loadRooms();
        } catch (error) {
          const message = error instanceof Error ? error.message : '프로젝트 상태를 변경하지 못했습니다.';
          setErrorMessage(message);
          openModal({ title: '오류', message });
        } finally {
          setProjectAction(null);
        }
      },
    });
  };

  const deleteProject = async (project: ProjectMessagePayload) => {
    await updateProjectStatus(project, 'cancel');
  };

  const renderProjectActions = (project: ProjectMessagePayload) => (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
      {canRespondProject(project, user?.id) ? (
        <>
          <button type="button" disabled={Boolean(projectAction)} onClick={() => updateProjectStatus(project, 'start')} className="inline-flex min-w-16 items-center justify-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60">
            <Check size={12} />수락
          </button>
          <button type="button" disabled={Boolean(projectAction)} onClick={() => updateProjectStatus(project, 'reject')} className="inline-flex min-w-16 items-center justify-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60">
            <X size={12} />거절
          </button>
        </>
      ) : null}
      {isWorkingProject(project) ? (
        <>
          <button type="button" disabled={Boolean(projectAction)} onClick={() => updateProjectStatus(project, 'complete')} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60">
            <Check size={12} />완료
          </button>
          <button type="button" disabled={Boolean(projectAction)} onClick={() => deleteProject(project)} className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60">
            <X size={12} />취소
          </button>
        </>
      ) : null}
      {isCompletionPendingProject(project) && project.completionRequestedBy !== user?.id ? (
        <button type="button" disabled={Boolean(projectAction)} onClick={() => updateProjectStatus(project, 'complete')} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60">
          <Check size={12} />완료 확인
        </button>
      ) : null}
      {isOpenProject(project) ? (
        <button type="button" onClick={() => openEditProjectForm(project)} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-primary/50 hover:text-primary">
          <Pencil size={12} />수정
        </button>
      ) : null}
    </div>
  );

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectRoomId || !user || isCreatingProject) return;

    if (projectFormMode === 'create' && projectRoomId !== selectedRoomId) {
      setErrorMessage('현재 선택한 채팅방에서만 프로젝트를 시작할 수 있습니다.');
      return;
    }

    if (projectForm.deadline && projectForm.deadline < minProjectDeadline) {
      setErrorMessage('마감일은 내일 이후로 설정해주세요.');
      return;
    }

    setIsCreatingProject(true);
    setErrorMessage('');
    try {
      const isEdit = projectFormMode === 'edit' && editingProject;
      const response = await fetch(`${API_BASE_URL}/api/projects${isEdit ? `/${editingProject.id}` : ''}`, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          ...(isEdit ? {} : { roomId: projectRoomId }),
          field: projectForm.field.trim(),
          price: projectForm.price ? Number(projectForm.price) : null,
          videoLength: projectForm.videoLength ? Number(projectForm.videoLength) : null,
          deadline: projectForm.deadline ? projectForm.deadline : null,
          memo: projectForm.memo.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? (isEdit ? '프로젝트 수정에 실패했습니다.' : '프로젝트 생성에 실패했습니다.'));
      }
      const project = await response.json() as ProjectMessagePayload;

      if (isEdit) {
        upsertProjectMessage(project);
        setShowProjectForm(false);
        setProjectRoomId(null);
        setEditingProject(null);
        setProjectFormMode('create');
        setProjectForm({ field: '', price: '', videoLength: '', deadline: '', memo: '' });
        setErrorMessage('프로젝트를 수정했습니다.');
        loadRooms();
        return;
      }

      const messageResponse = await fetch(`${API_BASE_URL}/api/chat/rooms/${projectRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          senderId: user.id,
          content: serializeProjectMessage(project),
          messageType: 'TEXT',
        }),
      });

      if (!messageResponse.ok) throw new Error('프로젝트 카드를 채팅에 올리지 못했습니다.');
      const savedMessage = await messageResponse.json() as ChatMessage;

      setShowProjectForm(false);
      setProjectRoomId(null);
      setProjectForm({ field: '', price: '', videoLength: '', deadline: '', memo: '' });
      setCurrentProject(project);
      setMessages((current) => [...current, savedMessage]);
      setSelectedRoomId(projectRoomId);
      setErrorMessage('프로젝트를 시작했습니다.');
      loadRooms();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '프로젝트를 저장하지 못했습니다.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <SectionCard title="채팅" description="진행 중인 DM과 프로젝트 채팅을 확인합니다." showDivider>
      {isLoading ? (
        <EmptyState message="채팅 목록을 불러오는 중입니다" />
      ) : chatRooms.length > 0 ? (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {chatFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.id);
                  const nextRooms = chatRooms.filter((room) => {
                    if (filter.id === 'POST') return room.type === 'POST';
                    if (filter.id === 'DIRECT') return room.type === 'DIRECT';
                    if (filter.id === 'UNREAD') return room.unreadCount > 0;
                    return true;
                  });
                  setChatPage(1);
                  setSelectedRoomId(nextRooms[0]?.id ?? null);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${activeFilter === filter.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex min-h-[720px] flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {pagedRooms.map((room) => (
              <div
                key={room.id}
                className={`w-full flex items-center gap-3 bg-surface-elevated border rounded-xl p-3 text-left transition-colors ${selectedRoomId === room.id ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={16} className="text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm text-text-primary truncate">{room.partnerName}</span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{getChatLastMessageText(room.lastMessage)}</p>
                    {room.type === 'POST' && <p className="mt-1 text-xs font-bold text-primary">문의채팅</p>}
                  </div>
                </button>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-text-muted">{room.time}</span>
                  <div className="flex items-center gap-1">
                    {room.unreadCount > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{room.unreadCount}</span>}
                    <button
                      type="button"
                      onClick={() => deleteRoom(room.id)}
                      className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-accent"
                      aria-label="채팅방 삭제"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
            {totalChatPages > 1 ? (
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                <button type="button" onClick={() => setChatPage((page) => Math.max(1, page - 1))} disabled={chatPage === 1} className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50">이전</button>
                <span className="text-xs font-bold text-text-muted">{chatPage} / {totalChatPages}</span>
                <button type="button" onClick={() => setChatPage((page) => Math.min(totalChatPages, page + 1))} disabled={chatPage === totalChatPages} className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50">다음</button>
              </div>
            ) : null}
          </div>

          <div className="h-[calc(100vh-7rem)] min-h-[776px] max-h-[1036px] min-w-0 overflow-hidden rounded-xl border border-border bg-surface flex flex-col lg:-mt-14">
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated">
                  <MessageCircle size={18} className="text-text-muted" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-text-primary">{selectedRoom?.partnerName ?? '채팅방'}</h3>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {selectedRoom?.type === 'POST' ? '문의채팅' : selectedRoom?.type === 'DIRECT' ? 'DM' : '채팅'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isOpenProject(pinnedProject) ? (
                  <button type="button" onClick={openProjectForm} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20">
                    <Briefcase size={14} />프로젝트 시작
                  </button>
                ) : null}
                {(currentProject?.status === 'WORKING' || currentProject?.status === 'COMPLETION_PENDING') && (
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(true)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/10 transition-colors"
                    aria-label="AI 분쟁 조정"
                  >
                    <AlertTriangle size={14} />
                    AI 분쟁 조정
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => selectedRoomId && loadMessages(selectedRoomId)}
                  className="rounded-lg p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                  aria-label="새로고침"
                >
                  <RefreshCw size={17} />
                </button>
              </div>
            </header>

            {selectedPost ? (
              <div className="shrink-0 border-b border-border bg-surface px-5 py-3">
                <button type="button" onClick={() => setShowPostCard((current) => !current)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-left text-sm font-bold text-text-primary transition-colors hover:border-primary/50">
                  <span className="min-w-0 truncate">게시글 정보</span>
                  <ChevronDown size={16} className={`flex-shrink-0 text-text-muted transition-transform ${showPostCard ? 'rotate-180' : ''}`} />
                </button>
                {showPostCard ? <div className="mt-3"><ChatPostCard post={selectedPost} compact /></div> : null}
              </div>
            ) : null}

            {pinnedProject ? (
              <div className="shrink-0 border-b border-border bg-surface px-5 py-3">
                <button type="button" onClick={() => setShowProjectCard((current) => !current)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-left text-sm font-bold text-text-primary transition-colors hover:border-primary/60">
                  <span className="min-w-0 truncate">
                    {pinnedProject.status === 'COMPLETED'
                      ? '완료된 프로젝트'
                      : pinnedProject.status === 'REJECTED'
                        ? '거절된 프로젝트'
                        : pinnedProject.status === 'CANCELED'
                          ? '취소된 프로젝트'
                          : pinnedProject.status === 'COMPLETION_PENDING'
                            ? '완료 대기 프로젝트'
                            : '진행 중인 프로젝트'}
                  </span>
                  <ChevronDown size={16} className={`flex-shrink-0 text-text-muted transition-transform ${showProjectCard ? 'rotate-180' : ''}`} />
                </button>
                {showProjectCard ? <div className="mt-3"><ProjectMessageCard project={pinnedProject} pinned actions={renderProjectActions(pinnedProject)} /></div> : null}
              </div>
            ) : null}

            <main className="flex-1 overflow-y-auto bg-background/40 px-5 py-5">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center text-sm text-text-secondary">메시지를 불러오는 중입니다</div>
              ) : errorMessage && messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-text-secondary">{errorMessage}</div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-text-secondary">
                  <span>아직 메시지가 없습니다</span>
                  {isPartnerWithdrawn ? <span className="text-xs font-bold text-text-muted">---탈퇴한 회원입니다---</span> : null}
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isMine = message.senderId === user?.id;
                    const projectMessage = parseProjectMessage(message.content);

                    if (projectMessage) {
                      if (roomProject?.id !== projectMessage.id) return null;
                      if (!isVisibleChatProject(roomProject)) return null;
                      const displayProject: ProjectMessagePayload = {
                        ...projectMessage,
                        ...roomProject,
                        price: roomProject.price ?? projectMessage.price,
                        videoLength: roomProject.videoLength ?? projectMessage.videoLength,
                        deadline: roomProject.deadline ?? projectMessage.deadline,
                        memo: roomProject.memo ?? projectMessage.memo,
                      };

                      return (
                        <div key={message.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <ProjectMessageCard project={displayProject} actions={renderProjectActions(displayProject)} />
                        </div>
                      );
                    }

                    return (
                      <div key={message.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isMine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-border bg-surface text-text-primary'}`}>
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
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

            <form onSubmit={sendMessage} className="border-t border-border bg-surface px-4 py-4">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated p-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={isPartnerWithdrawn}
                  placeholder={isPartnerWithdrawn ? '탈퇴한 회원에게는 메시지를 보낼 수 없습니다.' : '메시지 입력...'}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || !selectedRoomId || isSending || isPartnerWithdrawn}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="메시지 보내기"
                >
                  ↑
                </button>
              </div>
            </form>
          </div>
        </div>
          ) : (
            <EmptyState message="선택한 조건의 채팅이 없습니다" />
          )}
        </div>
      ) : (
        <EmptyState message="채팅 목록이 없습니다" />
      )}
      {showProjectForm && projectRoomId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeProjectForm}
            disabled={isCreatingProject}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm disabled:cursor-not-allowed"
            aria-label="프로젝트 입력 닫기"
          />
          <form
            onSubmit={saveProject}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-text-primary">
              {projectFormMode === 'edit' ? '프로젝트 수정' : '프로젝트 시작'}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {projectFormMode === 'edit' ? '프로젝트 조건을 수정합니다.' : '작업 조건을 입력해 프로젝트를 생성합니다.'}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="작업 분야">
                <input
                  value={projectForm.field}
                  onChange={(event) => updateProjectForm('field', event.target.value)}
                  className="form-input"
                  placeholder="예: 숏폼 편집"
                />
              </Field>
              <Field label="금액">
                <input
                  type="number"
                  min="0"
                  value={projectForm.price}
                  onChange={(event) => updateProjectForm('price', event.target.value)}
                  className="form-input"
                  placeholder="예: 150000"
                />
              </Field>
              <Field label="영상 길이(분)">
                <input
                  type="number"
                  min="0"
                  value={projectForm.videoLength}
                  onChange={(event) => updateProjectForm('videoLength', event.target.value)}
                  className="form-input"
                  placeholder="예: 10"
                />
              </Field>
              <Field label="마감일">
                <input
                  type="datetime-local"
                  min={minProjectDeadline}
                  value={projectForm.deadline}
                  onChange={(event) => updateProjectForm('deadline', event.target.value)}
                  className="form-input"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="메모">
                <textarea
                  value={projectForm.memo}
                  onChange={(event) => updateProjectForm('memo', event.target.value)}
                  rows={4}
                  className="form-input resize-none"
                  placeholder="작업 범위, 참고사항 등을 입력하세요."
                />
              </Field>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeProjectForm}
                disabled={isCreatingProject}
                className="flex-1 rounded-xl bg-surface-elevated py-2.5 text-sm font-bold text-text-primary transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isCreatingProject}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingProject
                  ? projectFormMode === 'edit' ? '수정 중...' : '생성 중...'
                  : projectFormMode === 'edit' ? '수정하기' : '프로젝트 시작'}
              </button>
            </div>
          </form>
        </div>
      )}
      {showDisputeModal && currentProject?.id && (
        <DisputeModal
          projectId={currentProject.id}
          accessToken={getAccessToken()}
          onClose={() => setShowDisputeModal(false)}
          onCreated={(disputeId) => {
            setShowDisputeModal(false);
            setActiveDisputeId(disputeId);
          }}
        />
      )}
      {activeDisputeId && (
        <DisputeResultModal
          disputeId={activeDisputeId}
          accessToken={getAccessToken()}
          onClose={() => setActiveDisputeId(null)}
        />
      )}
    </SectionCard>
  );
}

function ChatPostCard({ post, compact = false }: { post: ChatPostSummary; compact?: boolean }) {
  const priceText = formatChatPostPrice(post.priceMin, post.priceMax);
  const deadlineText = post.deadline
    ? new Date(post.deadline).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : '마감기한 없음';

  return (
    <Link href={`/jobs/${post.id}`} className={`${compact ? '' : 'mb-4'} block rounded-xl border border-border bg-surface p-4 hover:border-primary/50 transition-colors`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-primary">게시글 문의</span>
        <span className="text-xs text-text-muted">{deadlineText}</span>
      </div>
      <h4 className="truncate text-sm font-bold text-text-primary">{post.title}</h4>
      <p className="mt-1 text-xs text-text-secondary">{priceText}</p>
    </Link>
  );
}

function formatChatPostPrice(minPrice: number | null, maxPrice: number | null) {
  if (minPrice && maxPrice) {
    return `₩${minPrice.toLocaleString('ko-KR')} ~ ₩${maxPrice.toLocaleString('ko-KR')}`;
  }
  if (minPrice || maxPrice) {
    return `₩${(minPrice ?? maxPrice)!.toLocaleString('ko-KR')}`;
  }
  return '단가 미정';
}

function ProjectsSection() {
  const { openModal } = useModal();
  const [projects, setProjects] = useState<MyProjects>({ received: [], ongoing: [] });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectActionId, setProjectActionId] = useState<string | null>(null);
  const [completionRequestedProjectIds, setCompletionRequestedProjectIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMyPageData<MyProjects>('/api/users/me/projects');
      setProjects(data);
    } catch {
      setProjects({ received: [], ongoing: [] });
      setMessage('프로젝트 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPageData<AuthUser>('/api/auth/me').then(setUser).catch(() => setUser(null));
    loadProjects();
  }, []);

  const updateProjectFromBoard = async (project: MyProject, action: 'start' | 'reject' | 'complete') => {
    const confirmMessage =
      action === 'start'
        ? '프로젝트를 수락하시겠습니까?'
        : action === 'reject'
          ? '프로젝트를 거절하시겠습니까?'
          : '프로젝트를 완료하시겠습니까?';

    openModal({
      title: '확인',
      message: confirmMessage,
      confirmLabel: '확인',
      onConfirm: async () => {
        setProjectActionId(project.id);
        setMessage('');
        try {
          const savedProject = await patchMyPageData<MyProject>(`/api/projects/${project.id}/${action}`, {});
          if (action === 'complete' && savedProject.status === 'COMPLETION_PENDING') {
            setCompletionRequestedProjectIds((current) => current.includes(project.id) ? current : [...current, project.id]);
          }
          openModal({
            title: '알림',
            message: action === 'start'
              ? '프로젝트를 수락했습니다.'
              : action === 'reject'
                ? '프로젝트를 거절했습니다.'
                : savedProject.status === 'COMPLETION_PENDING' ? '프로젝트 완료 요청을 보냈습니다.' : '프로젝트를 완료했습니다.',
          });
          await loadProjects();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '프로젝트 상태를 변경하지 못했습니다.';
          setMessage(errorMessage);
          openModal({ title: '오류', message: errorMessage });
        } finally {
          setProjectActionId(null);
        }
      },
    });
  };

  const visibleProjects = projects.ongoing.filter((project) => !['REJECTED', 'CANCELED'].includes(project.status));
  const pendingProjects = visibleProjects.filter((project) => project.status === 'WAITING');
  const workingProjects = visibleProjects.filter((project) => project.status === 'WORKING');
  const completionPendingProjects = visibleProjects.filter((project) => project.status === 'COMPLETION_PENDING');
  const completedProjects = visibleProjects.filter((project) => project.status === 'COMPLETED');
  const canConfirmCompletion = (project: MyProject) => {
    if (project.completionRequestedBy) return project.completionRequestedBy !== user?.id;
    return !completionRequestedProjectIds.includes(project.id);
  };

  return (
    <SectionCard title="프로젝트 관리" description="받은 매칭 요청과 진행 중인 프로젝트를 관리합니다.">
      {message ? <p className="mb-4 text-sm font-bold text-accent">{message}</p> : null}
      {isLoading ? (
        <EmptyState message="프로젝트 정보를 불러오는 중입니다" />
      ) : (
        <div className="space-y-6">
          <ProjectBoardColumn title="받은 매칭 요청" emptyMessage="새로운 매칭 요청이 없습니다">
            {projects.received.map((request) => (
              <div key={request.id} className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="text-xs font-bold text-primary">새로운 매칭 요청</div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-text-primary">{request.requesterName}</p>
                    <p className="text-xs text-text-muted">{request.date}</p>
                  </div>
                  <span className="w-fit rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-text-secondary">{request.status}</span>
                </div>
              </div>
            ))}
          </ProjectBoardColumn>

          <ProjectBoardColumn title="대기 중 프로젝트" emptyMessage="수락 대기 중인 프로젝트가 없습니다">
            {pendingProjects.map((project) => (
              <ProjectBoardCard
                key={project.id}
                project={project}
                statusLabel="수락 대기"
                accentClass="border-l-primary"
                actions={canRespondProject(project, user?.id) ? (
                  <>
                    <button type="button" disabled={projectActionId === project.id} onClick={() => updateProjectFromBoard(project, 'reject')} className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60">거절</button>
                    <button type="button" disabled={projectActionId === project.id} onClick={() => updateProjectFromBoard(project, 'start')} className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60">수락</button>
                  </>
                ) : null}
              />
            ))}
          </ProjectBoardColumn>

          <ProjectBoardColumn title="진행 중인 프로젝트" emptyMessage="진행 중인 프로젝트가 없습니다">
            {workingProjects.map((project) => (
              <ProjectBoardCard
                key={project.id}
                project={project}
                statusLabel="진행 중"
                accentClass="border-l-amber-500"
                actions={(
                  <button type="button" disabled={projectActionId === project.id} onClick={() => updateProjectFromBoard(project, 'complete')} className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60">완료</button>
                )}
              />
            ))}
          </ProjectBoardColumn>

          <ProjectBoardColumn title="완료 대기 프로젝트" emptyMessage="완료 확인 대기 중인 프로젝트가 없습니다">
            {completionPendingProjects.map((project) => (
              <ProjectBoardCard
                key={project.id}
                project={project}
                statusLabel="완료 대기"
                accentClass="border-l-primary"
                actions={canConfirmCompletion(project) ? (
                  <button type="button" disabled={projectActionId === project.id} onClick={() => updateProjectFromBoard(project, 'complete')} className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60">완료 확인</button>
                ) : null}
              />
            ))}
          </ProjectBoardColumn>

          <ProjectBoardColumn title="완료된 프로젝트" emptyMessage="완료된 프로젝트가 없습니다">
            {completedProjects.map((project) => (
              <ProjectBoardCard key={project.id} project={project} statusLabel="완료" accentClass="border-l-border" />
            ))}
          </ProjectBoardColumn>
        </div>
      )}
    </SectionCard>
  );
}

function ProjectBoardColumn({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: React.ReactNode[];
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-secondary">{title}</h3>
      {children.length > 0 ? <div className="space-y-3">{children}</div> : <EmptyState message={emptyMessage} />}
    </section>
  );
}

function ProjectBoardCard({
  project,
  statusLabel,
  accentClass,
  actions,
}: {
  project: MyProject;
  statusLabel: string;
  accentClass: string;
  actions?: React.ReactNode;
}) {
  const roomHref = project.roomId ? `/chat/${project.roomId}` : '/chat';

  return (
    <div className={`rounded-xl border border-border border-l-4 ${accentClass} bg-surface-elevated p-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={roomHref} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-bold text-text-primary">{project.partnerName}</span>
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-text-secondary">{statusLabel}</span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{project.field ?? '프로젝트'}</p>
          <p className="mt-1 text-xs text-text-muted">{project.date}</p>
        </Link>
        {actions ? <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

function PortfolioManagementSection({ userId }: { userId: string | null }) {
  const [portfolios, setPortfolios] = useState<PortfolioDraft[]>([]);
  const [groups, setGroups] = useState<PortfolioGroupDraft[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Record<string, string[]>>({});
  const [newGroupName, setNewGroupName] = useState('');
  const [message, setMessage] = useState('');
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);
  const [isGroupSaving, setIsGroupSaving] = useState(false);
  const [draggedPortfolioId, setDraggedPortfolioId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const groupSaveLockRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setIsGroupsLoading(false);
      return;
    }

    const applyPortfolios = (saved: PortfolioDraft[]) => {
      setPortfolios(saved);
      savePortfolios(userId, saved);
      const orders: Record<string, string[]> = {};
      saved.forEach((portfolio) => {
        const key = portfolio.groupId ?? 'ungrouped';
        orders[key] = [...(orders[key] ?? []), portfolio.id];
      });
      Object.keys(orders).forEach((key) => {
        orders[key].sort((a, b) => {
          const left = saved.find((portfolio) => portfolio.id === a)?.displayOrder ?? 999;
          const right = saved.find((portfolio) => portfolio.id === b)?.displayOrder ?? 999;
          return left - right;
        });
      });
      setSelectedOrders(orders);
    };

    setIsGroupsLoading(true);
    fetchMyPageData<PortfolioGroupDraft[]>('/api/users/me/portfolio-groups')
      .then(setGroups)
      .catch(() => {
        setGroups([]);
        setMessage('그룹 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => setIsGroupsLoading(false));

    fetchMyPageData<{ id: string; title: string; url: string; type: string; representative: boolean; displayOrder: number; groupId: string | null }[]>('/api/users/me/portfolios')
      .then((data) => applyPortfolios(data.map((item) => ({
        id: item.id,
        type: item.type as PortfolioType,
        title: item.title,
        fileName: item.title,
        url: item.url,
        isRepresentative: item.representative,
        displayOrder: item.displayOrder,
        groupId: item.groupId,
      }))))
      .catch(() => applyPortfolios(loadPortfolios(userId)));
  }, [userId]);

  const saveGroups = async (nextGroups: PortfolioGroupDraft[]) => {
    if (groupSaveLockRef.current) {
      throw new Error('그룹을 저장 중입니다. 잠시 후 다시 시도해주세요.');
    }

    groupSaveLockRef.current = true;
    setIsGroupSaving(true);
    try {
      const saved = await putMyPageDataWithResponse<PortfolioGroupDraft[]>('/api/users/me/portfolio-groups', nextGroups.map((group, index) => ({
        id: group.id.startsWith('new-') ? null : group.id,
        name: group.name,
        displayOrder: index + 1,
        representative: group.representative,
      })));
      setGroups(saved);
      return saved;
    } finally {
      groupSaveLockRef.current = false;
      setIsGroupSaving(false);
    }
  };

  const addGroup = async () => {
    if (isGroupsLoading || groupSaveLockRef.current) {
      return;
    }
    const name = newGroupName.trim();
    if (!name) {
      setMessage('그룹 이름을 입력해주세요.');
      return;
    }
    groupSaveLockRef.current = true;
    setIsGroupSaving(true);
    try {
      const saved = await postMyPageDataWithResponse<PortfolioGroupDraft>('/api/users/me/portfolio-groups', { name });
      setGroups((prev) => [...prev, saved].sort((a, b) => a.displayOrder - b.displayOrder));
      setNewGroupName('');
      setMessage('그룹이 추가되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '그룹 추가에 실패했습니다.');
    } finally {
      groupSaveLockRef.current = false;
      setIsGroupSaving(false);
    }
  };

  const persistGroups = async () => {
    try {
      await saveGroups(groups);
      setMessage('그룹 설정이 저장되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '그룹 저장에 실패했습니다.');
    }
  };

  const removeEmptyGroup = async (groupId: string) => {
    if (portfolios.some((portfolio) => portfolio.groupId === groupId)) {
      setMessage('포트폴리오가 들어 있는 그룹은 삭제할 수 없습니다.');
      return;
    }
    try {
      await saveGroups(groups.filter((group) => group.id !== groupId).map((group, index, next) => ({
        ...group,
        representative: next.some((item) => item.representative) ? group.representative : index === 0,
      })));
      setMessage('그룹이 삭제되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '그룹 삭제에 실패했습니다.');
    }
  };

  const changePortfolioGroup = (portfolioId: string, groupId: string | null) => {
    setPortfolios((prev) => prev.map((portfolio) => portfolio.id === portfolioId
      ? { ...portfolio, groupId, displayOrder: prev.filter((item) => item.groupId === groupId).length + 1 }
      : portfolio));
    setSelectedOrders((prev) => {
      const next = Object.fromEntries(Object.entries(prev).map(([key, ids]) => [key, ids.filter((id) => id !== portfolioId)]));
      const key = groupId ?? 'ungrouped';
      return { ...next, [key]: [...(next[key] ?? []), portfolioId] };
    });
  };

  const dropPortfolioIntoGroup = (groupId: string) => {
    if (!draggedPortfolioId) return;
    changePortfolioGroup(draggedPortfolioId, groupId === 'ungrouped' ? null : groupId);
    setDraggedPortfolioId(null);
    setDragOverGroupId(null);
    setMessage('포트폴리오 이동 후 그룹/순번 저장을 눌러주세요.');
  };

  const toggleOrder = (groupKey: string, id: string) => {
    setSelectedOrders((prev) => {
      const current = prev[groupKey] ?? [];
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { ...prev, [groupKey]: next };
    });
  };

  const saveOrder = async () => {
    const next = portfolios.map((portfolio) => {
        const selectedIds = selectedOrders[portfolio.groupId ?? 'ungrouped'] ?? [];
        const index = selectedIds.indexOf(portfolio.id);
        if (index === -1) {
          return { ...portfolio, displayOrder: 999, isRepresentative: false };
        }
        const group = groups.find((item) => item.id === portfolio.groupId);
        return { ...portfolio, displayOrder: index + 1, isRepresentative: Boolean(group?.representative && index === 0) };
      });
    try {
      await putMyPageData('/api/users/me/portfolios', next.map((p) => ({
        title: p.title,
        url: p.url,
        type: p.type,
        representative: p.isRepresentative,
        displayOrder: p.displayOrder,
        groupId: p.groupId,
      })));
      savePortfolios(userId, next);
      setPortfolios(next);
      setMessage('그룹과 노출 순번이 저장되었습니다.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '저장에 실패했습니다.');
    }
  };

  const groupSections = [
    ...groups.map((group) => ({ id: group.id, name: group.name, representative: group.representative })),
    { id: 'ungrouped', name: '미분류', representative: false },
  ];

  return (
    <SectionCard title="포트폴리오 관리" description="영상과 이미지를 원하는 그룹으로 묶고 그룹별 노출 순서를 지정합니다. 대표 그룹이 공개 프로필과 맞춤매칭에 우선 노출됩니다.">
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          value={newGroupName}
          onChange={(event) => setNewGroupName(event.target.value)}
          placeholder={isGroupsLoading ? '그룹 목록 불러오는 중...' : '새 그룹 이름'}
          disabled={isGroupsLoading || isGroupSaving}
          className="form-input flex-1 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={addGroup}
          disabled={isGroupsLoading || isGroupSaving}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />{isGroupSaving ? '저장 중...' : '그룹 추가'}
        </button>
      </div>

      {groups.length > 0 && (
        <div className="space-y-3 mb-8">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-surface-elevated p-4">
              <input
                value={group.name}
                onChange={(event) => setGroups((prev) => prev.map((item) => item.id === group.id ? { ...item, name: event.target.value } : item))}
                disabled={isGroupSaving}
                className="form-input flex-1 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setGroups((prev) => prev.map((item) => ({ ...item, representative: item.id === group.id })))}
                disabled={isGroupSaving}
                className={`px-3 py-2 rounded-lg text-sm font-bold border disabled:opacity-50 ${group.representative ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}
              >
                {group.representative ? '대표 그룹' : '대표로 설정'}
              </button>
              <button type="button" onClick={() => removeEmptyGroup(group.id)} disabled={isGroupSaving} className="w-10 h-10 flex items-center justify-center text-accent disabled:opacity-50" title="빈 그룹 삭제">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <button type="button" onClick={persistGroups} disabled={isGroupSaving} className="px-4 py-3 rounded-xl border border-primary text-primary text-sm font-bold disabled:opacity-50">
            그룹 설정 저장
          </button>
        </div>
      )}

      <div className="space-y-8">
        {groupSections.map((group) => (
          <PortfolioGroupManageSection
            key={group.id}
            group={group}
            groups={groups}
            portfolios={portfolios.filter((portfolio) => (portfolio.groupId ?? 'ungrouped') === group.id)}
            selectedIds={selectedOrders[group.id] ?? []}
            onToggleOrder={(id) => toggleOrder(group.id, id)}
            onChangeGroup={changePortfolioGroup}
            draggedPortfolioId={draggedPortfolioId}
            isDragOver={dragOverGroupId === group.id}
            onDragStart={setDraggedPortfolioId}
            onDragEnd={() => {
              setDraggedPortfolioId(null);
              setDragOverGroupId(null);
            }}
            onDragOver={() => setDragOverGroupId(group.id)}
            onDrop={() => dropPortfolioIntoGroup(group.id)}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={saveOrder} className="px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
          그룹/순번 저장
        </button>
        {message && <p className="text-sm font-bold text-primary">{message}</p>}
      </div>
    </SectionCard>
  );
}

function PortfolioGroupManageSection({
  group,
  groups,
  portfolios,
  selectedIds,
  onToggleOrder,
  onChangeGroup,
  draggedPortfolioId,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  group: { id: string; name: string; representative: boolean };
  groups: PortfolioGroupDraft[];
  portfolios: PortfolioDraft[];
  selectedIds: string[];
  onToggleOrder: (id: string) => void;
  onChangeGroup: (portfolioId: string, groupId: string | null) => void;
  draggedPortfolioId: string | null;
  isDragOver: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}) {
  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className={`rounded-xl border p-4 transition-colors ${
        isDragOver ? 'border-primary bg-primary/5' : 'border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-bold text-text-primary">{group.name}</h3>
        {group.representative && <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">대표 그룹</span>}
        {isDragOver && <span className="text-xs font-bold text-primary">여기에 놓아 이동</span>}
      </div>
      {portfolios.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {portfolios.map((portfolio) => {
            const selectedOrder = selectedIds.indexOf(portfolio.id) + 1;
            const selected = selectedOrder > 0;
            return (
            <div
              key={portfolio.id}
              className={`rounded-xl border p-4 transition-colors ${
                draggedPortfolioId === portfolio.id
                  ? 'opacity-50 border-primary'
                  : selected
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-elevated border-border'
              }`}
            >
              <div className="flex gap-3">
                <button type="button" onClick={() => onToggleOrder(portfolio.id)} className="relative w-24 h-16 rounded-lg bg-surface border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                  {portfolio.type === 'image' && portfolio.url ? (
                    <img src={portfolio.url} alt={portfolio.title} className="w-full h-full object-cover" />
                  ) : portfolio.type === 'video' && portfolio.url ? (
                    <video src={portfolio.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <Film size={24} className="text-text-muted" />
                  )}
                  {selected && (
                    <span className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                      {selectedOrder}
                    </span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-text-primary truncate flex-1">{portfolio.title}</div>
                    <span
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', portfolio.id);
                        onDragStart(portfolio.id);
                      }}
                      onDragEnd={onDragEnd}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface cursor-grab active:cursor-grabbing"
                      title="드래그하여 그룹 이동"
                    >
                      <GripVertical size={18} />
                    </span>
                  </div>
                  <div className="text-xs text-text-muted truncate mt-1">{portfolio.type === 'video' ? '영상' : '이미지'} · {portfolio.fileName}</div>
                  <button type="button" onClick={() => onToggleOrder(portfolio.id)} className="text-xs font-bold text-primary mt-2">
                    {selected ? '순번 해제' : '순번 지정'}
                  </button>
                </div>
              </div>
              <select
                value={portfolio.groupId ?? ''}
                onChange={(event) => onChangeGroup(portfolio.id, event.target.value || null)}
                className="form-input mt-4"
              >
                <option value="">미분류</option>
                {groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          )})}
        </div>
      ) : (
        <EmptyState message={`${group.name}에 등록된 포트폴리오가 없습니다`} />
      )}
    </section>
  );
}

function PricingSection({ userId }: { userId: string | null }) {
  const [matchEnabled, setMatchEnabled] = useState(false);
  const [matchPriceMin, setMatchPriceMin] = useState('');
  const [matchPriceMax, setMatchPriceMax] = useState('');
  const [matchPriceUnit, setMatchPriceUnit] = useState<MatchPriceUnit>('MIN');
  const [representativePortfolioConfigured, setRepresentativePortfolioConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyPageData<MatchingPrice>('/api/users/me/matching-price')
      .then((data) => {
        setMatchEnabled(data.matchEnabled);
        setMatchPriceMin(data.matchPriceMin ? String(data.matchPriceMin) : '');
        setMatchPriceMax(data.matchPriceMax ? String(data.matchPriceMax) : '');
        setMatchPriceUnit(data.matchPriceUnit ?? 'MIN');
        setRepresentativePortfolioConfigured(data.representativePortfolioConfigured || hasLocalRepresentativePortfolio(userId));
      })
      .catch(() => {
        setMatchEnabled(false);
        setMatchPriceMin('');
        setMatchPriceMax('');
        setMatchPriceUnit('MIN');
        setRepresentativePortfolioConfigured(hasLocalRepresentativePortfolio(userId));
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  useEffect(() => {
    const handleUpdated = (event: Event) => {
      const detail = (event as CustomEvent<MatchingPrice>).detail;
      if (!detail) {
        return;
      }

      const hasRepresentative = detail.representativePortfolioConfigured || hasLocalRepresentativePortfolio(userId);
      setMatchEnabled(detail.matchEnabled);
      setMatchPriceMin(detail.matchPriceMin ? String(detail.matchPriceMin) : '');
      setMatchPriceMax(detail.matchPriceMax ? String(detail.matchPriceMax) : '');
      setMatchPriceUnit(detail.matchPriceUnit ?? 'MIN');
      setRepresentativePortfolioConfigured(hasRepresentative);
    };

    window.addEventListener('matchingPriceUpdated', handleUpdated);
    return () => window.removeEventListener('matchingPriceUpdated', handleUpdated);
  }, [userId]);

  const hasRepresentativeConfigured = () => representativePortfolioConfigured || hasLocalRepresentativePortfolio(userId);

  const validateEnable = () => {
    if (!matchPriceMin || Number(matchPriceMin) <= 0) {
      setError('최소 단가를 먼저 설정해주세요');
      return false;
    }
    if (!matchPriceMax || Number(matchPriceMax) <= 0) {
      setError('최대 단가를 먼저 설정해주세요');
      return false;
    }
    if (Number(matchPriceMin) > Number(matchPriceMax)) {
      setError('최소 단가는 최대 단가보다 클 수 없습니다');
      return false;
    }
    if (!hasRepresentativeConfigured()) {
      setError('대표 포트폴리오를 먼저 설정해주세요');
      return false;
    }
    return true;
  };

  const applyMatchingPriceSaved = (saved: MatchingPrice, representativeConfigured: boolean) => {
    const hasRepresentative = saved.representativePortfolioConfigured || representativeConfigured;
    setMatchEnabled(saved.matchEnabled);
    setMatchPriceMin(saved.matchPriceMin ? String(saved.matchPriceMin) : '');
    setMatchPriceMax(saved.matchPriceMax ? String(saved.matchPriceMax) : '');
    setMatchPriceUnit(saved.matchPriceUnit ?? 'MIN');
    setRepresentativePortfolioConfigured(hasRepresentative);
    window.dispatchEvent(new CustomEvent('matchingPriceUpdated', {
      detail: {
        matchEnabled: saved.matchEnabled,
        matchPriceMin: saved.matchPriceMin,
        matchPriceMax: saved.matchPriceMax,
        matchPriceUnit: saved.matchPriceUnit ?? 'MIN',
        representativePortfolioConfigured: hasRepresentative,
      },
    }));
  };

  const toggleMatchEnabled = async () => {
    setMessage('');
    setError('');
    const nextEnabled = !matchEnabled;
    if (nextEnabled && !validateEnable()) {
      return;
    }

    const previousEnabled = matchEnabled;
    setMatchEnabled(nextEnabled);
    try {
      const representativeConfigured = hasRepresentativeConfigured();
      const saved = await patchMyPageData<MatchingPrice>('/api/users/me/matching-price', {
        matchEnabled: nextEnabled,
        matchPriceMin: matchPriceMin ? Number(matchPriceMin) : null,
        matchPriceMax: matchPriceMax ? Number(matchPriceMax) : null,
        matchPriceUnit,
        representativePortfolioConfigured: representativeConfigured,
      });
      applyMatchingPriceSaved(saved, representativeConfigured);
    } catch (saveError) {
      setMatchEnabled(previousEnabled);
      setError(saveError instanceof Error ? saveError.message : '저장에 실패했습니다.');
    }
  };

  const savePricing = async () => {
    setMessage('');
    setError('');
    setIsSaving(true);
    try {
      const representativeConfigured = representativePortfolioConfigured || hasLocalRepresentativePortfolio(userId);
      const saved = await patchMyPageData<MatchingPrice>('/api/users/me/matching-price', {
        matchEnabled,
        matchPriceMin: matchPriceMin ? Number(matchPriceMin) : null,
        matchPriceMax: matchPriceMax ? Number(matchPriceMax) : null,
        matchPriceUnit,
        representativePortfolioConfigured: representativeConfigured,
      });
      applyMatchingPriceSaved(saved, representativeConfigured);
      setMessage('맞춤매칭 단가 설정이 저장되었습니다.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionCard title="맞춤매칭 단가 설정" description="맞춤매칭 ON 시 공개 프로필과 매칭 화면에 노출할 단가를 지정합니다.">
      {isLoading ? (
        <EmptyState message="맞춤매칭 설정을 불러오는 중입니다" />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-surface-elevated border border-border p-5">
            <div>
              <div className="font-bold text-text-primary">맞춤매칭</div>
              <div className="text-sm text-text-secondary mt-1">단가와 대표 포트폴리오가 설정되어야 ON 할 수 있습니다.</div>
            </div>
            <button type="button" onClick={toggleMatchEnabled} className={`relative w-14 h-8 rounded-full transition-colors ${matchEnabled ? 'bg-primary' : 'bg-surface border border-border'}`}>
              <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${matchEnabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <div className="rounded-xl bg-surface-elevated border border-border p-5">
            <div className="mb-4">
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Pricing</div>
              <div className="font-bold text-text-primary">노출 단가</div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-bold text-text-primary mb-2">단가 범위 (원)</span>
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="number"
                    min="1"
                    value={matchPriceMin}
                    onChange={(event) => { setMatchPriceMin(event.target.value); setError(''); }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="최소"
                    className="form-input flex-1 min-w-0"
                  />
                  <span className="text-text-secondary font-bold shrink-0">~</span>
                  <input
                    type="number"
                    min="1"
                    value={matchPriceMax}
                    onChange={(event) => { setMatchPriceMax(event.target.value); setError(''); }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="최대"
                    className="form-input flex-1 min-w-0"
                  />
                </div>
                {matchPriceMin && matchPriceMax && (
                  <p className="text-xs text-text-secondary mt-2">
                    {Number(matchPriceMin).toLocaleString()}원 ~ {Number(matchPriceMax).toLocaleString()}원 / {matchPriceUnit === 'MIN' ? '분' : '건'}
                  </p>
                )}
              </div>
              <div>
                <span className="block text-sm font-bold text-text-primary mb-2">단위</span>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setMatchPriceUnit('MIN')} className={`px-3 py-3 rounded-xl text-sm font-bold border transition-colors ${matchPriceUnit === 'MIN' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface-elevated text-text-secondary'}`}>
                    원/분
                  </button>
                  <button type="button" onClick={() => setMatchPriceUnit('CASE')} className={`px-3 py-3 rounded-xl text-sm font-bold border transition-colors ${matchPriceUnit === 'CASE' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface-elevated text-text-secondary'}`}>
                    원/건
                  </button>
                </div>
              </div>
            </div>
            <button type="button" onClick={savePricing} disabled={isSaving} className={`mt-5 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isSaving ? 'bg-surface text-text-muted' : 'bg-primary text-white hover:bg-primary/90'}`}>
              저장
            </button>
          </div>

          <div className={`rounded-xl border p-4 text-sm ${representativePortfolioConfigured ? 'border-primary/40 bg-primary/10 text-primary' : 'border-accent/40 bg-accent/10 text-accent'}`}>
            {representativePortfolioConfigured ? '대표 포트폴리오가 설정되어 있습니다.' : '대표 포트폴리오를 먼저 설정해주세요'}
          </div>

          {error && <p className="text-sm font-bold text-accent">{error}</p>}
          {message && <p className="text-sm font-bold text-primary">{message}</p>}
        </div>
      )}
    </SectionCard>
  );
}

type PointTransaction = {
  id: string;
  amount: number;
  type: 'CHARGE' | 'SAFE_PAYMENT_HOLD' | 'SAFE_PAYMENT_RELEASE' | 'SAFE_PAYMENT_REFUND' | 'DISPUTE_SETTLEMENT';
  description: string;
  matchRequestId: string | null;
  createdAt: string;
};

const transactionTypeLabel: Record<PointTransaction['type'], string> = {
  CHARGE: '충전',
  SAFE_PAYMENT_HOLD: '안전결제 차감',
  SAFE_PAYMENT_RELEASE: '작업 완료 지급',
  SAFE_PAYMENT_REFUND: '거래 취소 환불',
  DISPUTE_SETTLEMENT: '분쟁 조정 정산',
};

const transactionTypeClass: Record<PointTransaction['type'], string> = {
  CHARGE: 'bg-primary/10 text-primary',
  SAFE_PAYMENT_HOLD: 'bg-amber-500/10 text-amber-500',
  SAFE_PAYMENT_RELEASE: 'bg-emerald-500/10 text-emerald-500',
  SAFE_PAYMENT_REFUND: 'bg-cyan-400/10 text-cyan-400',
  DISPUTE_SETTLEMENT: 'bg-purple-500/10 text-purple-500',
};

const CHARGE_PRESETS = [1000, 5000, 10000, 30000, 50000, 100000];

function PointSection() {
  const [point, setPoint] = useState(0);
  const [safePaymentPoint, setEscrowPoint] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chargeAmount, setChargeAmount] = useState('');
  const [isCharging, setIsCharging] = useState(false);
  const [chargeError, setChargeError] = useState('');

  const loadData = () => {
    Promise.all([
      fetchMyPageData<{ point: number; safePaymentPoint: number }>('/api/point'),
      fetchMyPageData<PointTransaction[]>('/api/point/transactions'),
    ])
      .then(([balance, txList]) => {
        setPoint(balance.point);
        setEscrowPoint(balance.safePaymentPoint);
        setTransactions(txList);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCharge = async () => {
    const amount = Number(chargeAmount);
    if (!amount || amount <= 0) { setChargeError('충전 금액을 입력해주세요.'); return; }
    setIsCharging(true);
    setChargeError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/point/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error('충전에 실패했습니다.');
      const balance = await res.json();
      setPoint(balance.point);
      setEscrowPoint(balance.safePaymentPoint);
      setChargeAmount('');
      window.dispatchEvent(new CustomEvent('pointBalanceUpdated', { detail: balance }));
      loadData();
    } catch (e) {
      setChargeError(e instanceof Error ? e.message : '충전에 실패했습니다.');
    } finally {
      setIsCharging(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  return (
    <SectionCard title="포인트" description="포인트를 충전하고 보유 잔액과 거래 내역을 확인합니다.">
      {isLoading ? (
        <EmptyState message="포인트 정보를 불러오는 중입니다" />
      ) : (
        <div className="space-y-6">
          {/* 잔액 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-primary/10 border border-primary/30 p-5">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">보유 포인트</p>
              <p className="text-3xl font-extrabold text-text-primary">{fmt(point)}<span className="text-base font-bold text-text-secondary ml-1">P</span></p>
            </div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-5">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">안전결제 보관</p>
              <p className="text-3xl font-extrabold text-text-primary">{fmt(safePaymentPoint)}<span className="text-base font-bold text-text-secondary ml-1">P</span></p>
              <p className="text-xs text-text-muted mt-1">작업 완료 확인 시 에디터에게 지급됩니다</p>
            </div>
          </div>

          {/* 충전 */}
          <div className="rounded-xl bg-surface-elevated border border-border p-5 space-y-4">
            <h3 className="text-sm font-bold text-text-primary">포인트 충전</h3>
            <div className="flex flex-wrap gap-2">
              {CHARGE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setChargeAmount(String((Number(chargeAmount) || 0) + preset))}
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-secondary hover:border-primary/50 hover:text-text-primary transition-colors"
                >
                  +{fmt(preset)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={chargeAmount}
                onChange={(e) => { setChargeAmount(e.target.value); setChargeError(''); }}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="충전할 포인트 입력"
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleCharge}
                disabled={isCharging}
                className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isCharging ? '충전 중...' : '충전하기'}
              </button>
            </div>
            {chargeAmount && Number(chargeAmount) > 0 && (
              <p className="text-xs text-text-secondary">충전 후 잔액: {fmt(point + Number(chargeAmount))}P</p>
            )}
            {chargeError && <p className="text-xs text-accent">{chargeError}</p>}
          </div>

          {/* 거래 내역 */}
          <div>
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">거래 내역</h3>
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-4 rounded-xl bg-surface-elevated border border-border p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold ${transactionTypeClass[tx.type]}`}>
                        {transactionTypeLabel[tx.type]}
                      </span>
                      <span className="text-sm text-text-secondary truncate">{tx.description}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${tx.amount < 0 || tx.type === 'SAFE_PAYMENT_HOLD' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {tx.amount < 0 ? '' : tx.type === 'SAFE_PAYMENT_HOLD' ? '-' : '+'}{fmt(Math.abs(tx.amount))}P
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{tx.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="거래 내역이 없습니다" />
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <SectionCard title={title} description={description}>
      <EmptyState message="화면만 준비되었습니다. 기능은 추후 연결 예정입니다." />
    </SectionCard>
  );
}

function SectionCard({ title, description, children, showDivider = false }: { title: string; description?: string; children: React.ReactNode; showDivider?: boolean }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-xl p-6">
      {showDivider ? (
        <div className="mb-5 border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
        </div>
      )}
      {children}
    </motion.section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-text-primary mb-2">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="min-h-40 flex items-center justify-center rounded-xl bg-surface-elevated border border-border text-sm text-text-muted">
      {message}
    </div>
  );
}

function MypageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get('tab') as Section | null;
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const defaultSection: Section = userRole === 'EDITOR' ? 'editor-profile' : 'posts';
  const activeSection = sectionParam && sectionIds.includes(sectionParam) ? sectionParam : defaultSection;
  const [isEditorProfileRegistered, setIsEditorProfileRegistered] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.replace('/login');
      setIsAuthChecking(false);
      return;
    }
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Login required');
        }
        return response.json();
      })
      .then((data) => {
        setUserRole(data?.role ?? null);
        setUserId(data?.id ?? null);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.replace('/login');
      })
      .finally(() => {
        setIsAuthChecking(false);
      });
  }, [router]);

  useEffect(() => {
    if (isAuthChecking) {
      return;
    }
    if (sectionParam && !sectionIds.includes(sectionParam)) {
      router.replace(`/mypage?tab=${defaultSection}`);
    }
    if (userRole !== 'EDITOR' && ['editor-profile', 'portfolio', 'pricing'].includes(activeSection)) {
      router.replace('/mypage?tab=posts');
    }
  }, [activeSection, defaultSection, isAuthChecking, router, sectionParam, userRole]);

  useEffect(() => {
    if (!userId || userRole !== 'EDITOR') {
      setIsEditorProfileRegistered(false);
      return;
    }

    let cancelled = false;

    Promise.all([
      fetchMyPageData<{ fields: string[]; tools: string[]; contentTypes: string[] }>('/api/users/me/tags').catch(() => null),
      fetchMyPageData<{ id: string }[]>('/api/users/me/portfolios').catch(() => null),
    ]).then(([tags, portfolios]) => {
      if (cancelled) return;

      const hasTags = Boolean(
        tags &&
        ((tags.fields?.length ?? 0) > 0 ||
          (tags.tools?.length ?? 0) > 0 ||
          (tags.contentTypes?.length ?? 0) > 0)
      );
      const hasPortfolios = portfolios ? portfolios.length > 0 : loadPortfolios(userId).length > 0;

      setIsEditorProfileRegistered(hasTags || hasPortfolios);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSection, userId, userRole]);

  const visibleSidebarItems = sidebarItems.filter((item) => !item.editorOnly || userRole === 'EDITOR');

  const changeSection = (section: SidebarItemId) => {
    if (section === 'settings') {
      router.push('/settings');
      return;
    }
    router.push(`/mypage?tab=${section}`);
  };

  if (isAuthChecking) {
    return <div className="min-h-screen flex items-center justify-center text-text-muted">로딩 중...</div>;
  }

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-8">마이페이지</h1>

        {/* 모바일: 가로 스크롤 탭 */}
        <div className="lg:hidden flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-border">
          {visibleSidebarItems.map((item) => {
            const isActive = activeSection === item.id;
            const label = item.id === 'editor-profile' && isEditorProfileRegistered ? '에디터 프로필 수정' : item.label;
            return (
              <button key={item.id} type="button" onClick={() => changeSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary bg-surface-elevated'}`}>
                <item.icon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* 데스크탑: 사이드바 */}
          <aside className="hidden lg:block bg-surface border border-border rounded-xl p-3 h-fit lg:sticky lg:top-24">
            <nav className="space-y-1">
              {visibleSidebarItems.map((item) => {
                const isActive = activeSection === item.id;
                const label = item.id === 'editor-profile' && isEditorProfileRegistered ? '에디터 프로필 수정' : item.label;
                return (
                  <button key={item.id} type="button" onClick={() => changeSection(item.id)} className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-sm font-bold transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'}`}>
                    <span className="flex items-center gap-3">
                      <item.icon size={17} />
                      {label}
                    </span>
                    {item.hasDot && <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-accent'}`} />}
                  </button>
                );
              })}
            </nav>
          </aside>
          <div>
            {activeSection === 'editor-profile' && <EditorProfileSection userId={userId} onSaved={() => setIsEditorProfileRegistered(true)} />}
            {activeSection === 'posts' && <PostsSection userRole={userRole} />}
            {activeSection === 'liked' && <LikedSection />}
            {activeSection === 'chats' && (
              <SectionCard title="채팅" description="채팅방 목록을 확인하고 전용 채팅 페이지로 이동합니다.">
                <ChatRoomList compact />
              </SectionCard>
            )}
            {activeSection === 'portfolio' && <PortfolioManagementSection userId={userId} />}
            {activeSection === 'projects' && <ProjectsSection />}
            {activeSection === 'pricing' && <PricingSection userId={userId} />}
            {activeSection === 'point' && <PointSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MypagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted">로딩 중...</div>}>
      <MypageContent />
    </Suspense>
  );
}
