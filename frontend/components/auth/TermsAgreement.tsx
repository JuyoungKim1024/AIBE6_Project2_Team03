'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, FileText } from 'lucide-react';

export function TermsAgreement({
  onContinue,
  isSubmitting = false,
  showLoginLink = false,
}: {
  onContinue: () => void;
  isSubmitting?: boolean;
  showLoginLink?: boolean;
}) {
  const termsRef = useRef<HTMLDivElement>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsReadToEnd, setTermsReadToEnd] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  const handleTermsScroll = () => {
    const element = termsRef.current;
    if (!element) return;
    const scrollableHeight = element.scrollHeight - element.clientHeight;
    const progress = scrollableHeight <= 0 ? 100 : Math.min(100, Math.round((element.scrollTop / scrollableHeight) * 100));
    setReadProgress(progress);
    if (element.scrollHeight - element.scrollTop - element.clientHeight <= 32) {
      setTermsReadToEnd(true);
      setReadProgress(100);
    }
  };

  const scrollTermsDown = () => {
    termsRef.current?.scrollBy({ top: 220, behavior: 'smooth' });
  };

  return (
    <>
      <div className="flex justify-center mb-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <FileText size={22} />
        </div>
      </div>
      <h1 className="text-xl font-bold text-text-primary text-center mb-1">서비스 이용 동의</h1>
      <p className="text-sm text-text-secondary text-center mb-6">아래 내용을 끝까지 확인한 후 동의해주세요.</p>

      <div className="relative">
        <div
          ref={termsRef}
          onScroll={handleTermsScroll}
          tabIndex={0}
          className="terms-scrollbar h-72 sm:h-80 overflow-y-scroll overscroll-contain scroll-smooth rounded-xl border border-border bg-surface-elevated p-5 pb-16 space-y-6 text-sm text-text-secondary leading-7 focus:outline-none focus:border-primary"
        >
          <section>
          <h2 className="font-bold text-text-primary mb-2">서비스 이용약관</h2>
          <p>크크킄은 크리에이터와 에디터가 구인구직, 포트폴리오, 맞춤매칭, 채팅 및 프로젝트 기능을 이용할 수 있도록 온라인 공간을 제공하는 중개 서비스입니다.</p>
          <p className="mt-2">회원은 정확한 정보를 제공하고 타인의 권리와 관련 법령을 침해하지 않아야 합니다. 작업 범위, 일정, 대금, 수정 조건과 저작권은 거래 당사자가 협의하여 정합니다.</p>
          <Link href="/terms" target="_blank" className="inline-block mt-2 text-primary font-bold hover:underline">이용약관 전문 보기</Link>
          </section>

          <section>
          <h2 className="font-bold text-text-primary mb-2">개인정보 수집 및 이용</h2>
          <p>회원가입과 서비스 제공을 위해 이메일, 암호화된 비밀번호 또는 소셜 식별자, 닉네임, 역할, 이름, 전화번호 및 서비스 활동 정보를 처리합니다.</p>
          <p className="mt-2">회원탈퇴 시 개인정보와 로그인 정보는 삭제 또는 익명화됩니다. 게시글과 거래 기록은 분쟁 방지 및 서비스 문맥 보존을 위해 작성자가 ‘탈퇴한 사용자’로 표시된 상태로 남을 수 있습니다.</p>
          <Link href="/privacy" target="_blank" className="inline-block mt-2 text-primary font-bold hover:underline">개인정보처리방침 전문 보기</Link>
          </section>

          <section>
          <h2 className="font-bold text-text-primary mb-2">운영정책</h2>
          <p>허위 구인구직, 포트폴리오 도용, 사기, 대금 미지급, 욕설, 혐오 표현, 성희롱, 반복 광고, 리뷰 및 지표 조작을 금지합니다.</p>
          <p className="mt-2">정책 위반 시 경고, 콘텐츠 제한, 기능 정지 또는 계정 이용 제한이 적용될 수 있습니다.</p>
          <Link href="/policy" target="_blank" className="inline-block mt-2 text-primary font-bold hover:underline">운영정책 전문 보기</Link>
          </section>

          <div className="pt-4 border-t border-border text-xs text-text-muted">
            위 내용을 모두 확인했습니다. 아래 동의 항목을 선택하면 회원가입을 계속할 수 있습니다.
          </div>
        </div>

        <div className="absolute inset-x-px bottom-px rounded-b-xl bg-surface-elevated/95 backdrop-blur-sm border-t border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${readProgress}%` }} />
            </div>
            <span className="w-9 text-right text-xs font-bold text-text-muted">{readProgress}%</span>
            {!termsReadToEnd && (
              <button
                type="button"
                onClick={scrollTermsDown}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/50"
                title="약관 아래로 이동"
              >
                <ChevronDown size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <label className={`flex items-start gap-3 mt-5 ${termsReadToEnd ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
          disabled={!termsReadToEnd}
          className="mt-1 w-4 h-4 accent-primary"
        />
        <span className="text-sm font-bold text-text-primary">
          이용약관, 개인정보처리방침 및 운영정책에 모두 동의합니다.
          <span className="block mt-1 text-xs font-normal text-text-muted">
            {termsReadToEnd ? '동의 후 회원가입을 계속해주세요.' : '약관을 끝까지 내려 확인해주세요.'}
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={onContinue}
        disabled={!termsAccepted || isSubmitting}
        className="w-full mt-5 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '처리 중...' : '동의하고 계속'}
      </button>

      {showLoginLink && (
        <Link href="/login" className="block text-center text-sm text-text-secondary mt-6 hover:text-text-primary">
          이미 계정이 있나요? 로그인
        </Link>
      )}
    </>
  );
}
