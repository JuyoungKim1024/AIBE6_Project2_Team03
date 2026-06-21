type TossPaymentRequest = {
  method: 'CARD';
  amount: {
    currency: 'KRW';
    value: number;
  };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
};

type TossPaymentsInstance = {
  payment: (options: { customerKey: string }) => {
    requestPayment: (request: TossPaymentRequest) => Promise<void>;
  };
};

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

let tossScriptPromise: Promise<void> | null = null;

function loadTossPaymentsScript() {
  if (window.TossPayments) {
    return Promise.resolve();
  }
  if (tossScriptPromise) {
    return tossScriptPromise;
  }

  tossScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('토스페이먼츠 결제창을 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return tossScriptPromise;
}

export async function requestPointPayment(order: {
  orderId: string;
  orderName: string;
  amount: number;
}) {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
  }

  await loadTossPaymentsScript();
  if (!window.TossPayments) {
    throw new Error('토스페이먼츠 결제창을 초기화하지 못했습니다.');
  }

  const payment = window.TossPayments(clientKey).payment({
    customerKey: 'ANONYMOUS',
  });

  await payment.requestPayment({
    method: 'CARD',
    amount: {
      currency: 'KRW',
      value: order.amount,
    },
    orderId: order.orderId,
    orderName: order.orderName,
    successUrl: `${window.location.origin}/mypage/payment/success`,
    failUrl: `${window.location.origin}/mypage/payment/fail`,
  });
}
