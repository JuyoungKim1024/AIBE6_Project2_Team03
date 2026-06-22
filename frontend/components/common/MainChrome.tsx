'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from '@/components/common/NavBar';
import { PriceTicker } from '@/components/common/PriceTicker';
import { ChatFAB } from '@/components/common/ChatFAB';
import { AccountStatusWatcher } from '@/components/auth/AccountStatusWatcher';

export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen text-text-primary font-sans flex flex-col">
      <NavBar />
      <AccountStatusWatcher />
      {!isAdminPage && <PriceTicker />}
      <main className="flex-grow">{children}</main>
      {!isAdminPage && <ChatFAB />}
    </div>
  );
}
