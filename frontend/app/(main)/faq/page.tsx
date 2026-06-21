'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SupportLayout } from '@/components/support/SupportLayout';

const faqs = [
  ['크리에이터와 에디터 계정은 무엇이 다른가요?', '크리에이터는 구인과 맞춤매칭을 이용하고, 에디터는 구직글·포트폴리오·단가 설정으로 작업 요청을 받을 수 있습니다.'],
  ['맞춤매칭은 누가 사용할 수 있나요?', '맞춤매칭 검색은 크리에이터 계정 전용이며, 에디터는 대표 포트폴리오와 단가를 설정한 뒤 매칭 요청을 받을 수 있습니다.'],
  ['포트폴리오는 어떻게 관리하나요?', '마이페이지에서 이미지와 영상을 그룹별로 관리하고 대표 그룹과 노출 순서를 설정할 수 있습니다.'],
  ['전투력과 등급은 어떻게 올라가나요?', '완료 프로젝트와 리뷰 수, 전투력 조건을 충족하면 실버·골드·플래티넘·다이아몬드 등급으로 표시됩니다.'],
  ['회원탈퇴 후 게시글은 어떻게 되나요?', '개인정보는 삭제 또는 익명화되며 기존 게시글은 작성자가 탈퇴한 사용자로 표시된 상태로 남을 수 있습니다.'],
  ['DM을 보낼 수 없는 경우가 있나요?', '본인 계정과 탈퇴한 사용자에게는 DM을 보낼 수 없습니다.'],
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <SupportLayout title="자주 묻는 질문" description="크크킄 이용 중 자주 묻는 내용을 정리했습니다." currentPath="/faq">
      <div className="space-y-3">
        {faqs.map(([question, answer], index) => (
          <section key={question} className="bg-surface border border-border rounded-xl overflow-hidden">
            <button type="button" onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
              <span className="font-bold text-text-primary">{question}</span>
              <ChevronDown size={18} className={`text-text-muted transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
            </button>
            {openIndex === index && <p className="px-5 pb-5 pt-1 border-t border-border text-sm text-text-secondary leading-7">{answer}</p>}
          </section>
        ))}
      </div>
    </SupportLayout>
  );
}
