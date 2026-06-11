'use client';

import { ReactNode } from 'react';
import { BackgroundColorProvider } from '@/store/backgroundStore';
import { DMProvider } from '@/store/chatStore';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BackgroundColorProvider>
      <DMProvider>{children}</DMProvider>
    </BackgroundColorProvider>
  );
}
