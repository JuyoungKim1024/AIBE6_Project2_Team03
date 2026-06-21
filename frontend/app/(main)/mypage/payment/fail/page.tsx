'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message') ?? '결제가 취소되었거나 실패했습니다.';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-bold text-accent">{message}</p>
        <button
          type="button"
          onClick={() => router.replace('/mypage?tab=point')}
          className="mt-5 px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold"
        >
          포인트로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <PaymentFailContent />
    </Suspense>
  );
}
