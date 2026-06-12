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
  FolderOpen,
  Heart,
  MessageCircle,
  Settings,
  Tag,
  Wallet,
} from 'lucide-react';
import { RankBadge } from '@/components/common/RankBadge';
import { PostCard } from '@/components/post/PostCard';
import type { RankTier } from '@/types/user';
import type { PostType } from '@/types/post';

type Section = 'editor-profile' | 'posts' | 'liked' | 'chats' | 'portfolio' | 'projects' | 'pricing';
type SidebarItemId = Section | 'settings';
type UserRole = 'YOUTUBER' | 'EDITOR' | null;

const sectionIds: Section[] = ['editor-profile', 'posts', 'liked', 'chats', 'portfolio', 'projects', 'pricing'];

const sidebarItems: { id: SidebarItemId; label: string; icon: any; hasDot?: boolean; editorOnly?: boolean }[] = [
  { id: 'editor-profile', label: '에디터 프로필 등록', icon: Tag, editorOnly: true },
  { id: 'posts', label: '내가 쓴 글', icon: FileText },
  { id: 'liked', label: '좋아요한 글', icon: Heart },
  { id: 'chats', label: '채팅', icon: MessageCircle },
  { id: 'portfolio', label: '포트폴리오 관리', icon: FolderOpen, editorOnly: true },
  { id: 'projects', label: '프로젝트 관리', icon: Briefcase, hasDot: true },
  { id: 'pricing', label: '맞춤매칭 단가 설정', icon: Wallet, editorOnly: true },
  { id: 'settings', label: '설정', icon: Settings },
];

const myPosts = [
  { id: '1', category: '구인구직', type: '구인', title: '게임 하이라이트 주 2회 편집해주실 분 구합니다', date: '2일 전', views: 342, comments: 4 },
  { id: '2', category: '커뮤니티', type: '정보공유', title: '프리미어프로 단축키 세팅 공유합니다', date: '5일 전', views: 850, comments: 42 },
  { id: '3', category: '구인구직', type: '구인', title: 'IT 리뷰 채널 전속 편집자 구인', date: '1주 전', views: 1280, comments: 24 },
];

const projects = {
  received: [{ id: '1', partner: '모션그래픽왕', rank: 'diamond' as RankTier, field: '게임 하이라이트', price: 15000, status: 'pending' }],
  ongoing: [
    { id: '2', partner: '예능자막마스터', rank: 'platinum' as RankTier, field: '예능 자막', price: 12000, status: 'active', progress: '작업 중' },
    { id: '3', partner: '빠른컷편집러', rank: 'gold' as RankTier, field: '브이로그 편집', price: 10000, status: 'completed', progress: '작업완료' },
  ],
};

const chatRooms = [
  { id: '1', partner: '모션그래픽왕', rank: 'diamond' as RankTier, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80', last: '네 가능합니다. 분당 단가는...', time: '방금', unread: 2, badge: '진행 중' },
  { id: '2', partner: '예능자막마스터', rank: 'platinum' as RankTier, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80', last: '수정본 확인 부탁드립니다!', time: '1시간 전', unread: 0, badge: null },
  { id: '3', partner: '쇼츠공장장', rank: 'gold' as RankTier, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', last: '포트폴리오 보내드렸어요', time: '어제', unread: 0, badge: null },
];

const initialLikedPosts = [
  { id: 'l1', type: 'hiring' as PostType, title: 'IT 리뷰 채널 전속 편집자 구인', author: { name: '테크리뷰어', rank: 'diamond' as RankTier }, categoryTags: ['롱폼', 'IT/테크'], toolTags: ['Premiere Pro'], minPrice: 20000, maxPrice: 30000, likes: 89, comments: 24, views: 1280, timeAgo: '5시간 전' },
  { id: 'l2', type: 'info' as PostType, title: '프리미어프로 단축키 세팅 공유합니다', author: { name: '편집장인', rank: 'platinum' as RankTier }, categoryTags: ['꿀팁'], toolTags: ['Premiere Pro'], likes: 234, comments: 42, views: 1500, timeAgo: '2시간 전' },
];

const fieldTags = ['롱폼', '숏폼', '썸네일'];
const detailTags = ['게임', '여행', '브이로그', '반려동물', '음악', 'IT', '애니메이션', '기타'];
const videoTools = ['Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'CapCut', '기타'];
const designTools = ['Photoshop', 'Adobe Illustrator', 'Figma', 'Canva', '기타'];

function EditorProfileSection({ onSaved }: { onSaved: () => void }) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isPublic, setIsPublic] = useState(true);
  const [isRepresentative, setIsRepresentative] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('editorProfileDraft');
    if (!saved) {
      return;
    }
    const profile = JSON.parse(saved);
    setSelectedFields(profile.selectedFields ?? []);
    setSelectedDetails(profile.selectedDetails ?? []);
    setSelectedTools(profile.selectedTools ?? []);
    setPortfolioTitle(profile.portfolioTitle ?? '');
    setPortfolioUrl(profile.portfolioUrl ?? '');
    setDisplayOrder(profile.displayOrder ?? '1');
    setIsPublic(profile.isPublic ?? true);
    setIsRepresentative(profile.isRepresentative ?? false);
    setIsRegistered(true);
  }, []);

  const toggleValue = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
  };

  const saveEditorProfile = () => {
    localStorage.setItem('editorProfileDraft', JSON.stringify({
      selectedFields,
      selectedDetails,
      selectedTools,
      portfolioTitle,
      portfolioUrl,
      displayOrder,
      isPublic,
      isRepresentative,
    }));
    setIsRegistered(true);
    onSaved();
    setMessage('에디터 프로필이 저장되었습니다.');
  };

  return (
    <SectionCard title={isRegistered ? '에디터 프로필 수정' : '에디터 프로필 등록'} description="분야와 툴 태그를 선택하고 공개 프로필에 노출할 포트폴리오를 등록합니다.">
      <div className="space-y-8">
        <TagGroup title="분야" options={fieldTags} selected={selectedFields} onToggle={(value) => toggleValue(value, setSelectedFields)} />
        <TagGroup title="세부 분야" options={detailTags} selected={selectedDetails} onToggle={(value) => toggleValue(value, setSelectedDetails)} />
        <TagGroup title="영상편집 툴" options={videoTools} selected={selectedTools} onToggle={(value) => toggleValue(value, setSelectedTools)} />
        <TagGroup title="디자인 툴" options={designTools} selected={selectedTools} onToggle={(value) => toggleValue(value, setSelectedTools)} />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
          <Field label="포트폴리오 제목">
            <input value={portfolioTitle} onChange={(event) => setPortfolioTitle(event.target.value)} placeholder="예: 게임 하이라이트 쇼릴" className="form-input" />
          </Field>
          <Field label="노출 순번">
            <input type="number" min="1" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} className="form-input" />
          </Field>
        </div>
        <Field label="포트폴리오 이미지 URL">
          <input value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="썸네일 또는 이미지 URL" className="form-input" />
        </Field>
        <div className="flex flex-wrap gap-3">
          <ToggleButton active={isPublic} onClick={() => setIsPublic((prev) => !prev)} label={isPublic ? '공개' : '비공개'} />
          <ToggleButton active={isRepresentative} onClick={() => setIsRepresentative((prev) => !prev)} label="대표 설정" />
        </div>
        {message && <p className="text-sm font-bold text-primary">{message}</p>}
        <button onClick={saveEditorProfile} className="px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
          {isRegistered ? '수정 저장' : '등록'}
        </button>
      </div>
    </SectionCard>
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

function PostsSection() {
  return (
    <SectionCard title="내가 쓴 글" description="구인구직과 커뮤니티 작성글을 통합 관리합니다.">
      {myPosts.length > 0 ? (
        <div className="space-y-3">
          {myPosts.map((post) => (
            <div key={post.id} className="bg-surface-elevated border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${post.category === '구인구직' ? 'bg-accent/10 text-accent' : 'bg-cyan-400/10 text-cyan-400'}`}>{post.category}</span>
                <span className="text-xs text-text-muted">{post.type}</span>
                <span className="text-xs text-text-muted">·</span>
                <span className="text-xs text-text-muted">{post.date}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-text-primary">{post.title}</h3>
                <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 transition-colors">삭제</button>
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

function LikedSection({ likedPosts, onUnlike }: { likedPosts: typeof initialLikedPosts; onUnlike: (id: string) => void }) {
  return (
    <SectionCard title="좋아요한 글" description="좋아요한 게시글을 통합 조회합니다.">
      {likedPosts.length > 0 ? (
        <div className="space-y-4">
          {likedPosts.map((post) => (
            <PostCard key={post.id} id={post.id} linkTo={post.type === 'hiring' || post.type === 'looking' ? '/jobs/example' : '/community'} type={post.type} title={post.title} author={post.author} categoryTags={post.categoryTags} toolTags={post.toolTags} minPrice={post.minPrice} maxPrice={post.maxPrice} likes={post.likes} comments={post.comments} views={post.views} timeAgo={post.timeAgo} initialLiked={true} onUnlike={onUnlike} />
          ))}
        </div>
      ) : (
        <EmptyState message="좋아요한 게시글이 없습니다" />
      )}
    </SectionCard>
  );
}

function ChatsSection() {
  return (
    <SectionCard title="채팅" description="진행 중인 DM과 프로젝트 채팅을 확인합니다.">
      <div className="space-y-2">
        {chatRooms.map((room) => (
          <Link key={room.id} href={`/chat/${room.id}`} className="flex items-center gap-4 bg-surface-elevated border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
            <img src={room.avatar} alt={room.partner} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-text-primary">{room.partner}</span>
                <RankBadge tier={room.rank} size="sm" showLabel={false} />
                {room.badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">{room.badge}</span>}
              </div>
              <p className="text-sm text-text-secondary truncate">{room.last}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs text-text-muted">{room.time}</span>
              {room.unread > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{room.unread}</span>}
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

function ProjectsSection() {
  return (
    <SectionCard title="프로젝트 관리" description="받은 매칭 요청과 진행 중인 프로젝트를 관리합니다.">
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
                      <div className="flex items-center gap-2"><span className="font-bold text-text-primary">{project.partner}</span><RankBadge tier={project.rank} size="sm" showLabel={false} /></div>
                      <span className="text-text-muted">·</span><span className="text-sm text-text-secondary">{project.field}</span>
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
                      <div className="flex items-center gap-2"><span className="font-bold text-text-primary">{project.partner}</span><RankBadge tier={project.rank} size="sm" showLabel={false} /></div>
                      <span className="text-text-muted">·</span><span className="text-sm text-text-secondary">{project.field}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${project.status === 'active' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                        {project.status === 'active' ? <Clock size={12} /> : <Check size={12} />}{project.progress}
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
  const defaultSection: Section = userRole === 'EDITOR' ? 'editor-profile' : 'posts';
  const activeSection = sectionParam && sectionIds.includes(sectionParam) ? sectionParam : defaultSection;
  const [likedPosts, setLikedPosts] = useState(initialLikedPosts);
  const [isEditorProfileRegistered, setIsEditorProfileRegistered] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setUserRole(data?.role ?? null));
  }, []);

  useEffect(() => {
    if (sectionParam && !sectionIds.includes(sectionParam)) {
      router.replace(`/mypage?tab=${defaultSection}`);
    }
    if (userRole !== 'EDITOR' && ['editor-profile', 'portfolio', 'pricing'].includes(activeSection)) {
      router.replace('/mypage?tab=posts');
    }
  }, [activeSection, defaultSection, router, sectionParam, userRole]);

  useEffect(() => {
    setIsEditorProfileRegistered(Boolean(localStorage.getItem('editorProfileDraft')));
  }, [activeSection]);

  const visibleSidebarItems = sidebarItems.filter((item) => !item.editorOnly || userRole === 'EDITOR');

  const changeSection = (section: SidebarItemId) => {
    if (section === 'settings') {
      router.push('/settings');
      return;
    }
    router.push(`/mypage?tab=${section}`);
  };

  const handleUnlike = (id: string) => setLikedPosts((prev) => prev.filter((post) => post.id !== id));

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
            {activeSection === 'editor-profile' && <EditorProfileSection onSaved={() => setIsEditorProfileRegistered(true)} />}
            {activeSection === 'posts' && <PostsSection />}
            {activeSection === 'liked' && <LikedSection likedPosts={likedPosts} onUnlike={handleUnlike} />}
            {activeSection === 'chats' && <ChatsSection />}
            {activeSection === 'portfolio' && <PlaceholderSection title="포트폴리오 관리" description="포트폴리오 순번, 공개/비공개, 대표 설정을 관리할 화면입니다." />}
            {activeSection === 'projects' && <ProjectsSection />}
            {activeSection === 'pricing' && <PlaceholderSection title="맞춤매칭 단가 설정" description="맞춤매칭 노출 단가와 단위를 설정할 화면입니다." />}
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
