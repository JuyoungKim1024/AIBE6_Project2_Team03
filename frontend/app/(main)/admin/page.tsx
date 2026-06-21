'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, FileText, Flag, Inbox, LayoutDashboard, MessageSquare, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminNoticesPanel, AdminTicketsPanel } from '@/components/admin/AdminSupportPanels';
import { AdminCommentsPanel, AdminPostsPanel, AdminUsersPanel } from '@/components/admin/AdminManagementPanels';

const sections = {
  dashboard: { title: '관리자 대시보드', description: '서비스 운영 현황과 관리 기능을 확인합니다.', icon: LayoutDashboard },
  users: { title: '회원 관리', description: '전체 회원을 조회하고 계정 이용을 임시 제한합니다.', icon: Users },
  posts: { title: '게시글 관리', description: '작성자 상태와 관계없이 게시글을 조회하고 삭제합니다.', icon: FileText },
  comments: { title: '댓글 관리', description: '전체 댓글을 조회하고 삭제합니다.', icon: MessageSquare },
  notices: { title: '공지사항 관리', description: '서비스 공지사항을 작성하고 노출 상태를 관리합니다.', icon: Bell },
  inquiries: { title: '문의 관리', description: '사용자 문의 접수와 처리 상태를 관리합니다.', icon: Inbox },
  reports: { title: '신고 관리', description: '사용자가 접수한 신고를 검토하고 처리합니다.', icon: Flag },
} as const;

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthChecked } = useAuth();
  const requestedTab = searchParams.get('tab');
  const tab = requestedTab && requestedTab in sections ? requestedTab as keyof typeof sections : 'dashboard';
  const section = sections[tab];

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.admin) router.replace('/');
  }, [isAuthChecked, router, user]);

  if (!isAuthChecked || !user?.admin) {
    return <div className="min-h-screen flex items-center justify-center text-text-muted">관리자 권한을 확인하는 중입니다.</div>;
  }

  const dashboardItems = [
    { label: '회원 관리', value: '회원 조회 및 임시 제한', icon: Users, href: '/admin?tab=users' },
    { label: '게시글 관리', value: '전체 게시글 조회 및 삭제', icon: FileText, href: '/admin?tab=posts' },
    { label: '댓글 관리', value: '전체 댓글 조회 및 삭제', icon: MessageSquare, href: '/admin?tab=comments' },
    { label: '공지사항', value: '작성 및 노출 관리', icon: Bell, href: '/admin?tab=notices' },
    { label: '문의', value: '접수 내역 관리', icon: Inbox, href: '/admin?tab=inquiries' },
    { label: '신고', value: '신고 검토 및 처리', icon: Flag, href: '/admin?tab=reports' },
  ];

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <section.icon size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{section.title}</h1>
            <p className="text-sm text-text-secondary mt-1">{section.description}</p>
          </div>
        </div>

        {tab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {dashboardItems.map((item) => (
              <Link key={item.label} href={item.href} className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                <item.icon size={20} className="text-primary mb-4" />
                <div className="text-sm text-text-muted">{item.label}</div>
                <div className="font-bold text-text-primary mt-1">{item.value}</div>
              </Link>
            ))}
          </div>
        ) : tab === 'users' ? <AdminUsersPanel />
          : tab === 'posts' ? <AdminPostsPanel />
            : tab === 'comments' ? <AdminCommentsPanel />
              : tab === 'notices' ? <AdminNoticesPanel />
                : tab === 'inquiries' ? <AdminTicketsPanel type="INQUIRY" />
                  : <AdminTicketsPanel type="REPORT" />}
      </div>
    </div>
  );
}
