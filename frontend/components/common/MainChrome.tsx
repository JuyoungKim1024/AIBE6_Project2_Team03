'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from '@/components/common/NavBar';
import { PriceTicker } from '@/components/common/PriceTicker';
import { ChatFAB } from '@/components/common/ChatFAB';
import { GlobalModal } from '@/components/common/GlobalModal';

export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen text-text-primary font-sans flex flex-col">
      <NavBar />
      {!isAdminPage && <PriceTicker />}
      <main className="flex-grow">{children}</main>
      {!isAdminPage && <ChatFAB />}
      <GlobalModal />
    </div>
  );
}
