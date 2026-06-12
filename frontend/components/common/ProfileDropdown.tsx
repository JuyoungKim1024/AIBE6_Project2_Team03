'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  DollarSign,
  Edit2,
  FileText,
  FolderOpen,
  Inbox,
  LogOut,
  MessageSquare,
  Settings,
  User,
  UserCircle,
  Zap,
} from 'lucide-react';
import { type AuthUser, clearTokens } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/api';

const roleLabel: Record<NonNullable<AuthUser['role']>, string> = {
  YOUTUBER: '유튜버',
  EDITOR: '에디터',
};

function getRoleLabel(role: AuthUser['role']) {
  return role ? roleLabel[role] : '역할 미선택';
}

const dropdownLinkClass =
  'flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors';

const activityItems = [
  { label: '내가 쓴 글', icon: FileText, to: '/mypage?tab=posts' },
  { label: '받은 프로젝트 요청', icon: Inbox, to: '/mypage?tab=projects' },
  { label: '채팅 목록', icon: MessageSquare, to: '/mypage?tab=chats' },
];

const editorItems = [
  { label: '포트폴리오 관리', icon: FolderOpen, to: '/profile/edit' },
  { label: '가격 설정', icon: DollarSign, to: '/profile/edit' },
];

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

export function ProfileDropdown({ user, onLogout }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [matchEnabled, setMatchEnabled] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const isEditor = user.role === 'EDITOR';

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const logout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (accessToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      clearTokens();
      setOpen(false);
      onLogout();
      router.push('/');
    }
  };

  const accountItems = [
    { label: '공개 프로필 보기', icon: UserCircle, to: `/profile/${user.id}` },
    { label: '프로필 관리', icon: Edit2, to: '/profile/edit' },
    { label: '설정', icon: Settings, to: '/mypage/settings' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
          <User size={16} className="text-text-secondary" />
        </div>
        <span className="text-sm font-medium text-text-primary">{user.nickname}</span>
        <ChevronDown size={14} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 py-2">
          <div className="px-4 py-3 border-b border-border mb-1">
            <div className="font-bold text-text-primary">{user.nickname}</div>
            <div className="text-xs text-text-muted mt-0.5">{getRoleLabel(user.role)}</div>
          </div>

          <div className="px-2 py-1">
            <div className="px-2 py-1 text-xs font-bold text-text-muted uppercase tracking-wider">계정</div>
            {accountItems.map((item) => (
              <Link key={item.label} href={item.to} onClick={() => setOpen(false)} className={dropdownLinkClass}>
                <item.icon size={16} />{item.label}
              </Link>
            ))}
            <button onClick={logout} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-accent hover:bg-accent/10 transition-colors">
              <LogOut size={16} />로그아웃
            </button>
          </div>

          <div className="h-px bg-border my-1 mx-2" />

          <div className="px-2 py-1">
            <div className="px-2 py-1 text-xs font-bold text-text-muted uppercase tracking-wider">활동</div>
            {activityItems.map((item) => (
              <Link key={item.label} href={item.to} onClick={() => setOpen(false)} className={dropdownLinkClass}>
                <item.icon size={16} />{item.label}
              </Link>
            ))}
          </div>

          {isEditor && (
            <>
              <div className="h-px bg-border my-1 mx-2" />
              <div className="px-2 py-1">
                <div className="px-2 py-1 text-xs font-bold text-primary uppercase tracking-wider">에디터 전용</div>
                {editorItems.map((item) => (
                  <Link key={item.label} href={item.to} onClick={() => setOpen(false)} className={dropdownLinkClass}>
                    <item.icon size={16} />{item.label}
                  </Link>
                ))}
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <Zap size={16} />매칭 활성화
                  </div>
                  <button onClick={() => setMatchEnabled(!matchEnabled)} className={`relative w-10 h-6 rounded-full transition-colors ${matchEnabled ? 'bg-primary' : 'bg-surface-elevated border border-border'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${matchEnabled ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
