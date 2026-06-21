import Link from 'next/link';

const legalLinks = [
  { label: '이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy' },
  { label: '운영정책', href: '/policy' },
];

export function LegalDocument({
  title,
  description,
  currentPath,
  children,
}: {
  title: string;
  description: string;
  currentPath: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-bold text-primary mb-2">크크킄 정책</p>
          <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
          <p className="text-sm text-text-secondary leading-relaxed mt-3">{description}</p>
          <p className="text-xs text-text-muted mt-3">시행일: 2026년 6월 21일</p>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-2 mb-8 border-b border-border">
          {legalLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3 py-2 text-sm font-bold border-b-2 transition-colors ${
                currentPath === item.href
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <article className="bg-surface border border-border rounded-xl p-6 sm:p-8 space-y-9">
          {children}
          <section className="pt-6 border-t border-border">
            <h2 className="text-lg font-bold text-text-primary mb-2">문의처</h2>
            <p className="text-sm text-text-secondary">
              크크킄 · <a href="mailto:keukeukkeu47@gmail.com" className="text-primary hover:underline">keukeukkeu47@gmail.com</a>
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-text-primary mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-text-secondary leading-7">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-5 list-disc marker:text-primary">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead className="bg-surface-elevated">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-xs font-bold text-text-primary border-b border-border">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`} className="border-b border-border last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={`${cellIndex}-${cell}`} className="px-4 py-3 text-xs text-text-secondary align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
