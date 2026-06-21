import { ModalProvider } from '@/store/modalStore';
import { MainChrome } from '@/components/common/MainChrome';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <MainChrome>{children}</MainChrome>
    </ModalProvider>
  );
}
