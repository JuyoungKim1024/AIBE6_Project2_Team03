'use client';

import { ReactNode } from 'react';
import { BackgroundColorProvider } from '@/store/backgroundStore';
import { DMProvider } from '@/store/chatStore';
import { ModalProvider } from '@/store/modalStore';
import { GlobalModal } from '@/components/common/GlobalModal';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BackgroundColorProvider>
      <DMProvider>
        <ModalProvider>
          {children}
          <GlobalModal />
        </ModalProvider>
      </DMProvider>
    </BackgroundColorProvider>
  );
}
