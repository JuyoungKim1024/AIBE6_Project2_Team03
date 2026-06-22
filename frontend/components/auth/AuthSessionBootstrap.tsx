'use client';

import { useEffect, useState } from 'react';
import {
  getAccessToken,
  refreshAuthSession,
  restoreAuthSession,
} from '@/lib/auth-session';

const TOKEN_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function AuthSessionBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restoreAuthSession().finally(() => setReady(true));
    const intervalId = window.setInterval(() => {
      if (getAccessToken()) {
        void refreshAuthSession();
      }
    }, TOKEN_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-background" />;
  }

  return children;
}
