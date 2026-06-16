'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Film,
  FolderOpen,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Settings,
  Tag,
  Upload,
  Wallet,
} from 'lucide-react';
import { useModal } from '@/store/modalStore';

type Section = 'editor-profile' | 'posts' | 'liked' | 'chats' | 'portfolio' | 'projects' | 'pricing';
type SidebarItemId = Section | 'settings';
type UserRole = 'YOUTUBER' | 'EDITOR' | null;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

const sectionIds: Section[] = ['editor-profile', 'posts', 'liked', 'chats', 'portfolio', 'projects', 'pricing'];

const sidebarItems: { id: SidebarItemId; label: string; icon: any; hasDot?: boolean; editorOnly?: boolean }[] = [
  { id: 'editor-profile', label: '에디터 프로필 등록', icon: Tag, editorOnly: true },
  { id: 'posts', label: '내가 쓴 글', icon: FileText },
  { id: 'liked', label: '좋아요한 글', icon: Heart },
  { id: 'chats', label: '채팅', icon: MessageCircle },
  { id: 'portfolio', label: '포트폴리오 관리', icon: FolderOpen, editorOnly: true },
  { id: 'projects', label: '프로젝트 관리', icon: Briefcase },
  { id: 'pricing', label: '맞춤매칭 단가 설정', icon: Wallet, editorOnly: true },
  { id: 'settings', label: '설정', icon: Settings },
];

type MyPost = {
  id: string;
  boardType: 'JOB' | 'COMMUNITY';
  postType: string | null;
  title: string;
  date: string;
  views: number;
  comments: number;
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

type MyChatRoom = {
  id: string;
  partnerName: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
};

type MyProject = {
  id: string;
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
  publicLikedPostsVisible: boolean;
};

const fieldTags = ['롱폼', '숏폼', '썸네일'];
const detailTags = ['게임', '여행', '브이로그', '반려동물', '음악', 'IT', '애니메이션', '기타'];
const videoTools = ['Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'CapCut', '기타'];
const designTools = ['Photoshop', 'Adobe Illustrator', 'Figma', 'Canva', '기타'];

type PortfolioType = 'video' | 'image';

type PortfolioDraft = {
  id: string;
  type: PortfolioType;
  title: string;
  fileName: string;
  url: string;          // 서버 업로드 후 받은 URL (또는 로컬 미리보기용 objectUrl)
  isRepresentative: boolean;
  displayOrder: number;
  uploading?: boolean;  // 업로드 진행 중 여부
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

    fetchMyPageData<{ id: string; title: string; url: string; type: string; representative: boolean; displayOrder: number }[]>('/api/users/me/portfolios')
      .then((data) => {
        const loaded: PortfolioDraft[] = data.map((item) => ({
          id: item.id,
          type: item.type as PortfolioType,
          title: item.title,
          fileName: item.title,
          url: item.url,
          isRepresentative: item.representative,
          displayOrder: item.displayOrder,
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
          <TagSummary title="분야" values={selectedFields} />
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
          <TagGroup title="분야" options={fieldTags} selected={selectedFields} onToggle={(value) => toggleValue(value, setSelectedFields)} />
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

function PublicVisibilityToggle({ field, label }: { field: keyof PublicContentVisibility; label: string }) {
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

function PostsSection() {
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

  return (
    <SectionCard title="내가 쓴 글" description="구인구직과 커뮤니티 작성글을 통합 관리합니다.">
      <PublicVisibilityToggle field="publicPostsVisible" label="공개 프로필에 내가 쓴 글 공개" />
      {isLoading ? (
        <EmptyState message="작성글을 불러오는 중입니다" />
      ) : posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-surface-elevated border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${post.boardType === 'JOB' ? 'bg-accent/10 text-accent' : 'bg-cyan-400/10 text-cyan-400'}`}>{post.boardType === 'JOB' ? '구인구직' : '커뮤니티'}</span>
                {post.postType && <span className="text-xs text-text-muted">{post.postType}</span>}
                <span className="text-xs text-text-muted">·</span>
                <span className="text-xs text-text-muted">{post.date}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-text-primary">{post.title}</h3>
                <button onClick={() => deletePost(post.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 transition-colors">삭제</button>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted mt-2"><span>조회 {post.views}</span><span>댓글 {post.comments}</span></div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="아직 작성한 글이 없습니다" />
      )}
    </SectionCard>
  );
}

function LikedSection() {
  const [likedPosts, setLikedPosts] = useState<MyLikedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyPageData<MyLikedPost[]>('/api/users/me/liked-posts')
      .then(setLikedPosts)
      .catch(() => setLikedPosts([]))
      .finally(() => setIsLoading(false));
  }, []);

  const unlikePost = async (postId: string) => {
    await deleteMyPageData(`/api/users/me/liked-posts/${postId}`);
    setLikedPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  return (
    <SectionCard title="좋아요한 글" description="좋아요한 게시글을 통합 조회합니다.">
      <PublicVisibilityToggle field="publicLikedPostsVisible" label="공개 프로필에 좋아요한 글 공개" />
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
                <h3 className="font-bold text-text-primary">{post.title}</h3>
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
  const [chatRooms, setChatRooms] = useState<MyChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyPageData<MyChatRoom[]>('/api/users/me/chats')
      .then(setChatRooms)
      .catch(() => setChatRooms([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SectionCard title="채팅" description="진행 중인 DM과 프로젝트 채팅을 확인합니다.">
      {isLoading ? (
        <EmptyState message="채팅 목록을 불러오는 중입니다" />
      ) : chatRooms.length > 0 ? (
        <div className="space-y-2">
        {chatRooms.map((room) => (
          <Link key={room.id} href={`/chat/${room.id}`} className="flex items-center gap-4 bg-surface-elevated border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
              <MessageCircle size={18} className="text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-text-primary">{room.partnerName}</span>
              </div>
              <p className="text-sm text-text-secondary truncate">{room.lastMessage || '아직 메시지가 없습니다'}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs text-text-muted">{room.time}</span>
              {room.unreadCount > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{room.unreadCount}</span>}
            </div>
          </Link>
        ))}
        </div>
      ) : (
        <EmptyState message="채팅 목록이 없습니다" />
      )}
    </SectionCard>
  );
}

function ProjectsSection() {
  const [projects, setProjects] = useState<MyProjects>({ received: [], ongoing: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyPageData<MyProjects>('/api/users/me/projects')
      .then(setProjects)
      .catch(() => setProjects({ received: [], ongoing: [] }))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SectionCard title="프로젝트 관리" description="받은 매칭 요청과 진행 중인 프로젝트를 관리합니다.">
      {isLoading ? (
        <EmptyState message="프로젝트 정보를 불러오는 중입니다" />
      ) : (
      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">받은 매칭 요청</h3>
          {projects.received.length > 0 ? (
            <div className="space-y-3">
              {projects.received.map((project) => (
                <div key={project.id} className="bg-surface-elevated border border-primary/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div>
                    <div className="text-xs text-primary font-bold mb-1">새로운 매칭 요청이 도착했습니다!</div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-text-primary">{project.requesterName}</span>
                      <span className="text-text-muted">·</span><span className="text-sm text-text-secondary">{project.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold text-text-secondary bg-surface hover:bg-border transition-colors">거절</button>
                    <Link href="/chat/1" className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors text-center">수락 후 채팅</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="새로운 매칭 요청이 없습니다" />
          )}
        </section>
        <section>
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">진행 중인 프로젝트</h3>
          {projects.ongoing.length > 0 ? (
            <div className="space-y-3">
              {projects.ongoing.map((project) => (
                <Link key={project.id} href="/chat/1" className="block bg-surface-elevated border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-text-primary">{project.partnerName}</span>
                      <span className="text-text-muted">·</span><span className="text-sm text-text-secondary">{project.field ?? '프로젝트'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${project.status === 'WORKING' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                        {project.status === 'WORKING' ? <Clock size={12} /> : <Check size={12} />}{project.status === 'COMPLETED' ? '작업완료' : '작업 중'}
                      </span>
                      <ChevronRight size={16} className="text-text-muted" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message="진행 중인 프로젝트가 없습니다" />
          )}
        </section>
      </div>
      )}
    </SectionCard>
  );
}

function PortfolioManagementSection({ userId }: { userId: string | null }) {
  const [portfolios, setPortfolios] = useState<PortfolioDraft[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Record<PortfolioType, string[]>>({ video: [], image: [] });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId) return;

    const applyPortfolios = (saved: PortfolioDraft[]) => {
      setPortfolios(saved);
      savePortfolios(userId, saved);
      setSelectedOrders({
        video: saved.filter((portfolio) => portfolio.type === 'video').sort((a, b) => a.displayOrder - b.displayOrder).map((portfolio) => portfolio.id),
        image: saved.filter((portfolio) => portfolio.type === 'image').sort((a, b) => a.displayOrder - b.displayOrder).map((portfolio) => portfolio.id),
      });
    };

    fetchMyPageData<{ id: string; title: string; url: string; type: string; representative: boolean; displayOrder: number }[]>('/api/users/me/portfolios')
      .then((data) => applyPortfolios(data.map((item) => ({
        id: item.id,
        type: item.type as PortfolioType,
        title: item.title,
        fileName: item.title,
        url: item.url,
        isRepresentative: item.representative,
        displayOrder: item.displayOrder,
      }))))
      .catch(() => applyPortfolios(loadPortfolios(userId)));
  }, [userId]);

  const updatePortfolio = (id: string, patch: Partial<PortfolioDraft>) => {
    setPortfolios((prev) => {
      const next = prev.map((portfolio) => portfolio.id === id ? { ...portfolio, ...patch } : portfolio);
      savePortfolios(userId, next);
      return next;
    });
  };

  const toggleOrder = (type: PortfolioType, id: string) => {
    setSelectedOrders((prev) => {
      const current = prev[type];
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { ...prev, [type]: next };
    });
  };

  const saveOrder = async () => {
    const next = portfolios.map((portfolio) => {
        const selectedIds = selectedOrders[portfolio.type];
        const index = selectedIds.indexOf(portfolio.id);
        if (index === -1) {
          return { ...portfolio, displayOrder: 999, isRepresentative: false };
        }
        return { ...portfolio, displayOrder: index + 1, isRepresentative: index === 0 };
      });
    await putMyPageData('/api/users/me/portfolios', next.map((p) => ({
      title: p.title,
      url: p.url,
      type: p.type,
      representative: p.isRepresentative,
      displayOrder: p.displayOrder,
    })));
    savePortfolios(userId, next);
    setPortfolios(next);
    setMessage('순번이 저장되었습니다.');
  };

  const videoPortfolios = portfolios.filter((portfolio) => portfolio.type === 'video').sort((a, b) => a.displayOrder - b.displayOrder);
  const imagePortfolios = portfolios.filter((portfolio) => portfolio.type === 'image').sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <SectionCard title="포트폴리오 관리" description="영상 포트폴리오와 이미지 포트폴리오를 클릭해 노출 순번을 지정합니다. 각 목록의 1번이 대표 포트폴리오입니다.">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PortfolioManageColumn title="영상 포트폴리오" type="video" portfolios={videoPortfolios} selectedIds={selectedOrders.video} onToggleOrder={toggleOrder} onUpdate={updatePortfolio} />
        <PortfolioManageColumn title="이미지 포트폴리오" type="image" portfolios={imagePortfolios} selectedIds={selectedOrders.image} onToggleOrder={toggleOrder} onUpdate={updatePortfolio} />
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={saveOrder} className="px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
          순번 저장
        </button>
        {message && <p className="text-sm font-bold text-primary">{message}</p>}
      </div>
    </SectionCard>
  );
}

function PortfolioManageColumn({ title, type, portfolios, selectedIds, onToggleOrder, onUpdate }: { title: string; type: PortfolioType; portfolios: PortfolioDraft[]; selectedIds: string[]; onToggleOrder: (type: PortfolioType, id: string) => void; onUpdate: (id: string, patch: Partial<PortfolioDraft>) => void }) {
  return (
    <section>
      <h3 className="text-sm font-bold text-text-primary mb-3">{title}</h3>
      {portfolios.length > 0 ? (
        <div className="space-y-3">
          {portfolios.map((portfolio) => {
            const selectedOrder = selectedIds.indexOf(portfolio.id) + 1;
            const selected = selectedOrder > 0;
            return (
            <div key={portfolio.id} className={`rounded-xl border p-4 transition-colors ${selected ? 'bg-primary/10 border-primary' : 'bg-surface-elevated border-border'}`}>
              <div className="flex gap-3">
                <button type="button" onClick={() => onToggleOrder(type, portfolio.id)} className="relative w-24 h-16 rounded-lg bg-surface border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
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
                  <div className="font-bold text-text-primary truncate">{portfolio.title}</div>
                  <div className="text-xs text-text-muted truncate mt-1">{portfolio.fileName}</div>
                  <button type="button" onClick={() => onToggleOrder(type, portfolio.id)} className="text-xs font-bold text-primary mt-2">
                    {selected ? '순번 해제' : '순번 지정'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <ToggleButton active={portfolio.isRepresentative} onClick={() => onUpdate(portfolio.id, { isRepresentative: !portfolio.isRepresentative })} label={portfolio.isRepresentative ? '대표' : '일반'} />
                {selectedOrder === 1 && <span className="px-3 py-2 rounded-lg text-sm font-bold bg-primary/10 text-primary border border-primary">대표</span>}
              </div>
            </div>
          )})}
        </div>
      ) : (
        <EmptyState message={`${title}가 없습니다`} />
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

  const publishMatchingPriceUpdate = (saved: MatchingPrice, representativeConfigured: boolean) => {
    window.dispatchEvent(new CustomEvent('matchingPriceUpdated', {
      detail: {
        matchEnabled: saved.matchEnabled,
        matchPriceMin: saved.matchPriceMin,
        matchPriceMax: saved.matchPriceMax,
        matchPriceUnit: saved.matchPriceUnit ?? 'MIN',
        representativePortfolioConfigured: representativeConfigured,
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
      const hasRepresentative = saved.representativePortfolioConfigured || representativeConfigured;
      setMatchEnabled(saved.matchEnabled);
      setMatchPriceMin(saved.matchPriceMin ? String(saved.matchPriceMin) : '');
      setMatchPriceMax(saved.matchPriceMax ? String(saved.matchPriceMax) : '');
      setMatchPriceUnit(saved.matchPriceUnit ?? 'MIN');
      setRepresentativePortfolioConfigured(hasRepresentative);
      publishMatchingPriceUpdate(saved, hasRepresentative);
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
      setMatchEnabled(saved.matchEnabled);
      setMatchPriceMin(saved.matchPriceMin ? String(saved.matchPriceMin) : '');
      setMatchPriceMax(saved.matchPriceMax ? String(saved.matchPriceMax) : '');
      setMatchPriceUnit(saved.matchPriceUnit ?? 'MIN');
      const hasRepresentative = saved.representativePortfolioConfigured || representativeConfigured;
      setRepresentativePortfolioConfigured(hasRepresentative);
      publishMatchingPriceUpdate(saved, hasRepresentative);
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
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={matchPriceMin}
                    onChange={(event) => { setMatchPriceMin(event.target.value); setError(''); }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="최소"
                    className="form-input flex-1"
                  />
                  <span className="text-text-secondary font-bold">~</span>
                  <input
                    type="number"
                    min="1"
                    value={matchPriceMax}
                    onChange={(event) => { setMatchPriceMax(event.target.value); setError(''); }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="최대"
                    className="form-input flex-1"
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

          <button type="button" onClick={savePricing} disabled={isSaving} className="hidden">
            저장
          </button>
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

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
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
    if (sectionParam && !sectionIds.includes(sectionParam)) {
      router.replace(`/mypage?tab=${defaultSection}`);
    }
    if (userRole !== 'EDITOR' && ['editor-profile', 'portfolio', 'pricing'].includes(activeSection)) {
      router.replace('/mypage?tab=posts');
    }
  }, [activeSection, defaultSection, router, sectionParam, userRole]);

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
        <h1 className="text-3xl font-bold text-text-primary mb-8">마이페이지</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <aside className="bg-surface border border-border rounded-xl p-3 h-fit lg:sticky lg:top-24">
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
            {activeSection === 'posts' && <PostsSection />}
            {activeSection === 'liked' && <LikedSection />}
            {activeSection === 'chats' && <ChatsSection />}
            {activeSection === 'portfolio' && <PortfolioManagementSection userId={userId} />}
            {activeSection === 'projects' && <ProjectsSection />}
            {activeSection === 'pricing' && <PricingSection userId={userId} />}
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
