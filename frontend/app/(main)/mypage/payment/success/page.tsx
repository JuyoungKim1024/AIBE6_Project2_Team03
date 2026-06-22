'use client';

import { getAccessToken } from '@/lib/auth-session';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount'));
    const accessToken = getAccessToken();

    if (!paymentKey || !orderId || !amount || !accessToken) {
      setError('결제 승인 정보가 올바르지 않습니다.');
      return;
    }

    fetch(`${API_BASE_URL}/api/point/payments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message ?? '포인트 충전 승인에 실패했습니다.');
        }
        router.replace('/mypage?tab=point&payment=success');
      })
      .catch((confirmError) => {
        setError(confirmError instanceof Error ? confirmError.message : '포인트 충전 승인에 실패했습니다.');
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm font-bold text-accent">{error}</p>
            <button
              type="button"
              onClick={() => router.replace('/mypage?tab=point')}
              className="mt-5 px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold"
            >
              포인트로 돌아가기
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="mx-auto text-primary animate-spin" size={34} />
            <p className="mt-4 text-sm font-bold text-text-primary">결제를 승인하고 있습니다.</p>
            <p className="mt-1 text-xs text-text-secondary">창을 닫지 말고 잠시 기다려주세요.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <CheckCircle2 className="text-primary" size={34} />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
