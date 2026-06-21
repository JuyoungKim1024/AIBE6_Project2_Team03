'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, Flag, Inbox, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { clearTokens, type AuthUser } from '@/hooks/useAuth';

const adminLinks = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { label: '공지사항', href: '/admin?tab=notices', icon: Bell },
  { label: '문의 관리', href: '/admin?tab=inquiries', icon: Inbox },
  { label: '신고 관리', href: '/admin?tab=reports', icon: Flag },
];

export function AdminNavBar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const logout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      if (accessToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } finally {
      clearTokens();
      onLogout();
      router.replace('/login');
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-primary/30 bg-[#0d1117]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/admin" className="flex items-center gap-3 shrink-0">
            <span className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">
              <ShieldCheck size={20} />
            </span>
            <span className="font-bold text-text-primary">크크킄 Admin</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {adminLinks.map((item) => {
              const itemTab = item.href.includes('?tab=') ? item.href.split('?tab=')[1] : null;
              const active = pathname === '/admin'
                && (itemTab ? searchParams.get('tab') === itemTab : !searchParams.get('tab'));
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${active ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}>
                  <item.icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-black text-primary">ADMIN</span>
            <span className="text-sm font-bold text-text-primary">{user.nickname}</span>
          </div>
          <button type="button" onClick={logout} className="w-9 h-9 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent/40 flex items-center justify-center" title="로그아웃">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </nav>
  );
}
