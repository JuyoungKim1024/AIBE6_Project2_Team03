'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, ChevronLeft } from 'lucide-react';
import { useDM } from '@/store/chatStore';
import { RankBadge } from '@/components/common/RankBadge';

const mockChatHistory = [
  { id: '1', partner: '모션그래픽왕', rank: 'diamond', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80', last: '네 가능합니다. 분당 단가는...', time: '방금', unread: 2 },
  { id: '2', partner: '예능자막마스터', rank: 'platinum', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80', last: '수정본 확인 부탁드립니다!', time: '1시간 전', unread: 0 },
  { id: '3', partner: '쇼츠공장장', rank: 'gold', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', last: '포트폴리오 보내드렸어요', time: '어제', unread: 0 },
];

export function ChatFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const { activeDMUser, closeDM } = useDM();

  const isDMActive = activeDMUser !== null;
  const showPopup = isOpen || isDMActive;

  const handleClose = () => {
    setIsOpen(false);
    if (isDMActive) closeDM();
  };

  const activePartner = isDMActive ? activeDMUser : mockChatHistory.find((c) => c.id === activeRoomId);

  return (
    <>
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 md:bottom-24 z-[60] w-[calc(100vw-3rem)] md:w-[640px] h-[500px] max-h-[80vh] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex"
          >
            <div className={`w-full md:w-1/3 border-r border-border flex flex-col ${activePartner ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface-elevated">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <MessageSquare size={16} /> 메시지
                </h3>
                <button onClick={handleClose} className="md:hidden text-text-muted hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {mockChatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => { setActiveRoomId(chat.id); if (isDMActive) closeDM(); }}
                    className={`w-full text-left p-3 border-b border-border/50 hover:bg-surface-elevated transition-colors flex items-center gap-3 ${activeRoomId === chat.id && !isDMActive ? 'bg-surface-elevated' : ''}`}
                  >
                    <div className="relative">
                      <img src={chat.avatar} alt={chat.partner} className="w-10 h-10 rounded-full object-cover" />
                      {chat.unread > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-surface"></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold text-sm text-text-primary truncate">{chat.partner}</span>
                        <span className="text-[10px] text-text-muted flex-shrink-0">{chat.time}</span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{chat.last}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className={`w-full md:w-2/3 flex flex-col bg-background/50 ${!activePartner ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
              {!activePartner ? (
                <div className="text-center text-text-muted">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">대화방을 선택해주세요</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setActiveRoomId(null); if (isDMActive) closeDM(); }} className="md:hidden text-text-muted hover:text-text-primary">
                        <ChevronLeft size={20} />
                      </button>
                      <img src={activePartner.avatar} alt={(activePartner as any).name || (activePartner as any).partner} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text-primary">{(activePartner as any).name || (activePartner as any).partner}</span>
                        <RankBadge tier={activePartner.rank as any} size="sm" showLabel={false} />
                      </div>
                    </div>
                    <button onClick={handleClose} className="hidden md:block text-text-muted hover:text-text-primary">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    <div className="text-center text-xs text-text-muted my-2">채팅이 시작되었습니다.</div>
                    {isDMActive ? (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-primary text-white px-3 py-2 rounded-2xl rounded-br-md text-sm">
                          안녕하세요! 프로필 보고 연락드립니다.
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] bg-surface border border-border text-text-primary px-3 py-2 rounded-2xl rounded-bl-md text-sm">
                          {(activePartner as any).last}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-border bg-surface">
                    <div className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl p-1.5">
                      <input placeholder="메시지 입력..." className="flex-1 bg-transparent px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none" />
                      <button className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
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
        className="fixed bottom-40 right-6 md:bottom-24 md:right-6 z-[55] w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="채팅 열기"
      >
        <Send size={22} className="-ml-1 mt-1" />
      </motion.button>
    </>
  );
}
