import { NavBar } from '@/components/common/NavBar';
import { PriceTicker } from '@/components/common/PriceTicker';
import { BackgroundColorFAB } from '@/components/common/BackgroundColorFAB';
import { ChatFAB } from '@/components/common/ChatFAB';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-text-primary font-sans flex flex-col">
      <NavBar />
      <PriceTicker />
      <main className="flex-grow">{children}</main>
      <BackgroundColorFAB />
      <ChatFAB />
    </div>
  );
}
