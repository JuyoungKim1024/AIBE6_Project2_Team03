'use client';

import { ReactNode } from 'react';
import { BackgroundColorProvider } from '@/store/backgroundStore';
import { DMProvider } from '@/store/chatStore';
import { ModalProvider } from '@/store/modalStore';
import { GlobalModal } from '@/components/common/GlobalModal';
import { AuthSessionBootstrap } from '@/components/auth/AuthSessionBootstrap';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BackgroundColorProvider>
      <DMProvider>
        <ModalProvider>
          <AuthSessionBootstrap>{children}</AuthSessionBootstrap>
          <GlobalModal />
        </ModalProvider>
      </DMProvider>
    </BackgroundColorProvider>
  );
}
