import Link from 'next/link';
import { Mail, Video } from 'lucide-react';

const serviceLinks = [
  { label: '이용 가이드', href: '/guide' },
  { label: '구인구직', href: '/jobs' },
  { label: '맞춤매칭', href: '/matching' },
  { label: '커뮤니티', href: '/community' },
];

const supportLinks = [
  { label: '공지사항', href: '/notices' },
  { label: '자주 묻는 질문', href: '/faq' },
  { label: '문의하기', href: '/contact' },
  { label: '신고센터', href: '/report' },
];
const policyLinks = [
  { label: '이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy' },
  { label: '운영정책', href: '/policy' },
];

export function HomeFooter({
  onQuickAccessClick,
  onSupportClick,
}: {
  onQuickAccessClick: (event: React.MouseEvent<HTMLAnchorElement>, path: string) => void;
  onSupportClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr] gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Video size={21} />
              </span>
              <span className="text-xl font-bold text-text-primary">
                크크<span className="text-primary">킄</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              크리에이터와 영상 편집자를 연결하는 포트폴리오 기반 매칭 서비스
            </p>
          </div>

          <FooterColumn title="서비스">
            {serviceLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={item.href === '/matching' ? (event) => onQuickAccessClick(event, item.href) : undefined}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="고객지원">
            {supportLinks.map((item) => (
              <Link key={item.href} href={item.href} onClick={onSupportClick} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </FooterColumn>

          <div>
            <h2 className="text-sm font-bold text-text-primary mb-4">사업자 정보</h2>
            <p className="text-sm font-bold text-text-secondary">크크킄</p>
            <p className="mt-2 text-sm text-text-secondary">영상 편집자 매칭 플랫폼</p>
            <p className="mt-2 text-sm text-text-secondary">고객지원 평일 10:00–18:00</p>
            <a
              href="mailto:keukeukkeu47@gmail.com"
              className="inline-flex items-center gap-2 mt-3 text-sm text-text-secondary hover:text-primary transition-colors"
            >
              <Mail size={15} />
              keukeukkeu47@gmail.com
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-10 pt-6 border-t border-border">
          <p className="text-xs text-text-muted">© 2026 크크킄. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {policyLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-xs text-text-muted hover:text-text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-text-primary mb-4">{title}</h2>
      <div className="flex flex-col items-start gap-3">{children}</div>
    </div>
  );
}
