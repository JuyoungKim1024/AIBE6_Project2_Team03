'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, AlertCircle } from 'lucide-react';
import type { PostType } from '@/types/post';

interface WritePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const postTypes: { id: PostType; label: string; color: string; bg: string }[] = [
  { id: 'hiring', label: '구인', color: 'text-accent', bg: 'bg-accent/10 border-accent/30' },
  { id: 'looking', label: '구직', color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  { id: 'rate', label: '단가 토크', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'portfolio', label: '포트폴리오', color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/30' },
  { id: 'free', label: '자유게시판', color: 'text-text-primary', bg: 'bg-surface-elevated border-border' },
];

const availableTags = ['롱폼', '숏폼', '게임', '음악', '브이로그', 'Shorts', 'Premiere Pro', 'Final Cut', 'After Effects'];

export function WritePostModal({ isOpen, onClose }: WritePostModalProps) {
  const [type, setType] = useState<PostType>('free');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const isJobPost = type === 'hiring' || type === 'looking';
  const showPriceWarning = isJobPost && !price;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary">새 글 작성</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-surface-elevated">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">게시글 종류</label>
              <div className="flex flex-wrap gap-2">
                {postTypes.map((pt) => (
                  <button key={pt.id} onClick={() => setType(pt.id)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${type === pt.id ? `${pt.bg} ${pt.color}` : 'bg-transparent border-border text-text-secondary hover:border-border/80 hover:bg-surface-elevated'}`}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <input type="text" placeholder="제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border-b border-border pb-3 text-xl font-bold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <textarea placeholder="내용을 입력하세요..." value={body} onChange={(e) => setBody(e.target.value)} className="w-full h-48 bg-surface-elevated border border-border rounded-xl p-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none" />
            </div>
            {isJobPost && (
              <div className="bg-surface-elevated/50 p-4 rounded-xl border border-border">
                <label className="block text-sm font-medium text-text-primary mb-2">희망 단가 (선택)</label>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary font-medium">₩</span>
                  <input type="number" placeholder="10000" value={price} onChange={(e) => setPrice(e.target.value)} className="w-40 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors font-mono" />
                  <span className="text-text-secondary">/분</span>
                </div>
                {showPriceWarning && (
                  <div className="flex items-center gap-1.5 mt-2 text-amber-500 text-xs font-medium">
                    <AlertCircle size={14} />
                    <span>가격을 입력하지 않으면 피드에서 우선순위가 낮아집니다.</span>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">태그 선택</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedTags.includes(tag) ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-surface-elevated border-border text-text-secondary hover:border-text-muted'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-text-muted hover:border-primary/50 hover:text-primary transition-colors cursor-pointer bg-surface-elevated/30">
              <Paperclip size={24} className="mb-2" />
              <span className="text-sm font-medium">포트폴리오 링크나 파일 첨부</span>
            </div>
          </div>
          <div className="p-6 border-t border-border bg-surface flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-bold text-text-secondary hover:bg-surface-elevated transition-colors">취소</button>
            <button className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">게시하기</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
