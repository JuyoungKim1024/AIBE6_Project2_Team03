import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: '크크킄',
  description: '크리에이터와 편집자를 연결하는 매칭 플랫폼',
  icons: {
    icon: [{ url: '/favicon.ico?v=20260623', type: 'image/x-icon' }],
    shortcut: '/favicon.ico?v=20260623',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
