'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, MessageSquare, Video, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDropdown } from '@/components/common/ProfileDropdown';
import { NotificationDropdown } from '@/components/common/NotificationDropdown';
import { SearchBar } from '@/components/common/SearchBar';
import { useChatUnreadCount } from '@/hooks/useChatUnreadCount';

type NavLink = { name: string; path: string; requireAuth?: boolean; hideForEditor?: boolean };

const navLinks: NavLink[] = [
  { name: '구인구직', path: '/jobs' },
  { name: '커뮤니티', path: '/community' },
  { name: '맞춤매칭', path: '/matching', requireAuth: true, hideForEditor: true },
  { name: '마이페이지', path: '/mypage' },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, isAuthChecked } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadChatCount = useChatUnreadCount(user?.id);

  const handleNavClick = (e: React.MouseEvent, link: NavLink, closeMobile?: () => void) => {
    if (link.requireAuth && !user) {
      e.preventDefault();
      router.push('/login');
    } else if (pathname === link.path) {
      e.preventDefault();
      window.location.reload();
    }
    closeMobile?.();
  };

  const navLinkClass = (isActive: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
    }`;

  const mobileNavLinkClass = (isActive: boolean) =>
    `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Video size={24} className="text-primary" />
              </div>
              <span className="glitch font-bold text-xl tracking-tight text-text-primary">
                크크<span className="text-primary">킄</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.filter((link) => !(link.hideForEditor && user?.role === 'EDITOR') && !(link.requireAuth && !user)).map((link) => {
                const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
                return (
                  <Link key={link.path} href={link.path} onClick={(e) => handleNavClick(e, link)} className={navLinkClass(isActive)}>
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {pathname !== '/' && (
            <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-4">
              <Suspense fallback={<div className="w-full h-9 rounded-xl bg-surface-elevated animate-pulse" />}>
                <SearchBar />
              </Suspense>
            </div>
          )}

          <div className="hidden md:flex items-center gap-4">
            {user && (
              <>
                <Link href="/chat" className="relative p-2 text-text-secondary hover:text-text-primary transition-colors">
                  <MessageSquare size={20} />
                  {unreadChatCount > 0 && (
                    <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" aria-label="읽지 않은 새 메시지 또는 프로젝트 알림" />
                  )}
                </Link>
                <NotificationDropdown userId={user.id} />
                <div className="h-6 w-px bg-border" />
              </>
            )}
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
            {navLinks.filter((link) => !(link.hideForEditor && user?.role === 'EDITOR') && !(link.requireAuth && !user)).map((link) => {
              const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
              return (
                <Link key={link.path} href={link.path} onClick={(e) => handleNavClick(e, link, () => setMobileOpen(false))} className={mobileNavLinkClass(isActive)}>
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
                <Link href="/mypage" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface">
                  마이페이지
                </Link>
                <Link href="/settings" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface">
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
