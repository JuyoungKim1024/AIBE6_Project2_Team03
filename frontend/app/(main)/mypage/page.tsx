'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Briefcase, MessageCircle, ChevronRight, Clock, Check, Heart } from 'lucide-react';
import { RankBadge } from '@/components/common/RankBadge';
import { PostCard } from '@/components/post/PostCard';
import type { RankTier } from '@/types/user';
import type { PostType } from '@/types/post';

type Tab = 'posts' | 'projects' | 'chats' | 'liked';

const myPosts = [
  { id: '1', category: '구인구직', type: '구인', title: '게임 하이라이트 주 2회 편집해주실 분 구합니다', date: '2일 전', views: 342, comments: 4 },
  { id: '2', category: '커뮤니티', type: '정보공유', title: '프리미어프로 단축키 세팅 공유합니다', date: '5일 전', views: 850, comments: 42 },
  { id: '3', category: '구인구직', type: '구인', title: 'IT 리뷰 채널 전속 편집자 구인', date: '1주 전', views: 1280, comments: 24 },
];

const projects = {
  received: [{ id: '1', partner: '모션그래픽왕', rank: 'diamond' as RankTier, field: '게임 하이라이트', price: 15000, status: 'pending' }],
  ongoing: [
    { id: '2', partner: '예능자막마스터', rank: 'platinum' as RankTier, field: '예능 자막', price: 12000, status: 'active', progress: '작업 중' },
    { id: '3', partner: '빠른컷편집러', rank: 'gold' as RankTier, field: '브이로그 편집', price: 10000, status: 'review', progress: '검수 중' },
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

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'posts', label: '내가 쓴 글', icon: FileText },
  { id: 'projects', label: '프로젝트', icon: Briefcase },
  { id: 'chats', label: '채팅', icon: MessageCircle },
  { id: 'liked', label: '좋아요한 글', icon: Heart },
];

function MypageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && ['posts', 'projects', 'chats', 'liked'].includes(tabParam) ? tabParam : 'posts'
  );
  const [likedPosts, setLikedPosts] = useState(initialLikedPosts);

  useEffect(() => {
    if (tabParam && ['posts', 'projects', 'chats', 'liked'].includes(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/mypage?tab=${tab}`);
  };

  const handleUnlike = (id: string) => setLikedPosts((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary mb-8">마이페이지</h1>
        <div className="flex border-b border-border mb-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => changeTab(tab.id)} className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                <tab.icon size={16} />{tab.label}
                {isActive && <motion.div layoutId="mypageTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            );
          })}
        </div>

        {activeTab === 'posts' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {myPosts.map((post) => (
              <Link key={post.id} href={post.category === '구인구직' ? '/jobs/example' : '/community'} className="block bg-surface border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${post.category === '구인구직' ? 'bg-accent/10 text-accent' : 'bg-cyan-400/10 text-cyan-400'}`}>{post.type}</span>
                  <span className="text-xs text-text-muted">{post.category}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{post.date}</span>
                </div>
                <h3 className="font-bold text-text-primary mb-2">{post.title}</h3>
                <div className="flex items-center gap-4 text-xs text-text-muted"><span>조회 {post.views}</span><span>댓글 {post.comments}</span></div>
              </Link>
            ))}
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <section>
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">받은 매칭 요청</h2>
              <div className="space-y-3">
                {projects.received.map((p) => (
                  <div key={p.id} className="bg-surface border border-primary/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <div>
                      <div className="text-xs text-primary font-bold mb-1">새로운 매칭 요청이 도착했습니다!</div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2"><span className="font-bold text-text-primary">{p.partner}</span><RankBadge tier={p.rank} size="sm" showLabel={false} /></div>
                        <span className="text-text-muted">·</span><span className="text-sm text-text-secondary">{p.field}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold text-text-secondary bg-surface-elevated hover:bg-border transition-colors">거절</button>
                      <Link href="/chat/1" className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors text-center">수락 후 채팅</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">진행 중인 프로젝트</h2>
              <div className="space-y-3">
                {projects.ongoing.map((p) => (
                  <Link key={p.id} href="/chat/1" className="block bg-surface border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2"><span className="font-bold text-text-primary">{p.partner}</span><RankBadge tier={p.rank} size="sm" showLabel={false} /></div>
                        <span className="text-text-muted">·</span><span className="text-sm text-text-secondary">{p.field}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${p.status === 'active' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                          {p.status === 'active' ? <Clock size={12} /> : <Check size={12} />}{p.progress}
                        </span>
                        <ChevronRight size={16} className="text-text-muted" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'chats' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {chatRooms.map((room) => (
              <Link key={room.id} href={`/chat/${room.id}`} className="flex items-center gap-4 bg-surface border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
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
          </motion.div>
        )}

        {activeTab === 'liked' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {likedPosts.length > 0 ? likedPosts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                <PostCard id={post.id} linkTo={post.type === 'hiring' || post.type === 'looking' ? '/jobs/example' : '/community'} type={post.type} title={post.title} author={post.author} categoryTags={post.categoryTags} toolTags={post.toolTags} minPrice={post.minPrice} maxPrice={post.maxPrice} likes={post.likes} comments={post.comments} views={post.views} timeAgo={post.timeAgo} initialLiked={true} onUnlike={handleUnlike} />
              </motion.div>
            )) : (
              <div className="text-center py-20 text-text-muted">
                <Heart size={48} className="mx-auto mb-4 opacity-20" />
                <p>좋아요한 글이 없습니다.</p>
              </div>
            )}
          </motion.div>
        )}
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
