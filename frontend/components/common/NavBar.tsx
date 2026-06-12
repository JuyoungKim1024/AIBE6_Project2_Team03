'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  DollarSign,
  Edit2,
  FileText,
  FolderOpen,
  Inbox,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  User,
  UserCircle,
  Video,
  X,
  Zap,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

type AuthUser = {
  id: string;
  nickname: string;
  role: 'YOUTUBER' | 'EDITOR' | null;
  onboardingRequired: boolean;
};

const roleLabel: Record<NonNullable<AuthUser['role']>, string> = {
  YOUTUBER: '유튜버',
  EDITOR: '에디터',
};

function getRoleLabel(role: AuthUser['role']) {
  return role ? roleLabel[role] : '역할 미선택';
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

function ProfileDropdown({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
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

    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
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
  const activityItems = [
    { label: '내가 쓴 글', icon: FileText, to: '/mypage?tab=posts' },
    { label: '받은 프로젝트 요청', icon: Inbox, to: '/mypage?tab=projects' },
    { label: '채팅 목록', icon: MessageSquare, to: '/mypage?tab=chats' },
  ];
  const editorItems = [
    { label: '포트폴리오 관리', icon: FolderOpen, to: '/profile/edit' },
    { label: '가격 설정', icon: DollarSign, to: '/profile/edit' },
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
              <Link key={item.label} href={item.to} onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors">
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
              <Link key={item.label} href={item.to} onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors">
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
                  <Link key={item.label} href={item.to} onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors">
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

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setIsAuthChecked(true);
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unauthorized');
        }
        return response.json();
      })
      .then((data: AuthUser) => setUser(data))
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsAuthChecked(true));
  }, []);

  const navLinks = [
    { name: '구인구직', path: '/jobs' },
    { name: '커뮤니티', path: '/community' },
    { name: '맞춤매칭', path: '/matching' },
    { name: '마이페이지', path: '/mypage' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Video size={24} className="text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight text-text-primary">
                크크<span className="text-primary">킄</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path));
                return (
                  <Link key={link.path} href={link.path} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}`}>
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <button className="p-2 text-text-secondary hover:text-text-primary transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full"></span>
              </button>
            )}
            {user && <div className="h-6 w-px bg-border"></div>}
            {!isAuthChecked ? (
              <div className="w-20 h-8 rounded-lg bg-surface-elevated animate-pulse" />
            ) : user ? (
              <ProfileDropdown user={user} onLogout={() => setUser(null)} />
            ) : (
              <Link href="/login" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                로그인
              </Link>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-text-secondary">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.path);
              return (
                <Link key={link.path} href={link.path} onClick={() => setMobileOpen(false)} className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}`}>
                  {link.name}
                </Link>
              );
            })}
            <div className="h-px bg-border my-2" />
            {user ? (
              <>
                <Link href={`/profile/${user.id}`} onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface">
                  공개 프로필
                </Link>
                <Link href="/profile/edit" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface">
                  프로필 관리
                </Link>
                <Link href="/mypage/settings" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface">
                  설정
                </Link>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-bold text-primary hover:bg-surface">
                로그인
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
