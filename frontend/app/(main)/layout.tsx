import { NavBar } from '@/components/common/NavBar';
import { PriceTicker } from '@/components/common/PriceTicker';
import { BackgroundColorFAB } from '@/components/common/BackgroundColorFAB';
import { ChatFAB } from '@/components/common/ChatFAB';
import { ModalProvider } from '@/store/modalStore';
import { GlobalModal } from '@/components/common/GlobalModal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <div className="min-h-screen text-text-primary font-sans flex flex-col">
        <NavBar />
        <PriceTicker />
        <main className="flex-grow">{children}</main>
        <BackgroundColorFAB />
        <ChatFAB />
        <GlobalModal />
      </div>
    </ModalProvider>
  );
}
