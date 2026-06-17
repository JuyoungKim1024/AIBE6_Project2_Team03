'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, Check, MessageCircle, Search, Settings, ShieldCheck, Sparkles, UserCircle } from 'lucide-react';

const creatorGuides = [
  '구인글을 작성해 필요한 작업 조건과 예산을 등록할 수 있습니다.',
  '에디터 공개 프로필에서 포트폴리오, 전투력, 리뷰를 확인할 수 있습니다.',
  '맞춤매칭을 통해 조건에 맞는 에디터를 추천받을 수 있습니다.',
  '게시글, 공개 프로필, 댓글에서 유저 아이콘을 눌러 DM을 시작할 수 있습니다.',
  '마이페이지에서 작성글 공개 여부와 프로젝트 진행 상태를 관리할 수 있습니다.',
];

const editorGuides = [
  '구직글을 작성해 작업 가능 분야와 사용 툴을 알릴 수 있습니다.',
  '에디터 프로필에 분야/툴 태그와 포트폴리오를 등록할 수 있습니다.',
  '포트폴리오 관리에서 영상/이미지 포트폴리오 노출 순서를 설정할 수 있습니다.',
  '맞춤매칭 단가를 설정하고 매칭 활성화를 켜면 요청을 받을 수 있습니다.',
  '작업 완료 후 리뷰에 따라 전투력이 변동되고 공개 프로필에 신뢰 지표로 표시됩니다.',
];

const commonGuides = [
  { icon: UserCircle, title: '공개 프로필', desc: '닉네임, 프로필 이미지, 작성글 공개 여부, 에디터 포트폴리오와 리뷰를 확인할 수 있습니다.' },
  { icon: MessageCircle, title: 'DM', desc: '실제 계정의 유저 아이콘을 누르면 공개 프로필 보기와 DM 보내기 메뉴가 표시됩니다.' },
  { icon: Settings, title: '설정', desc: '닉네임, 이름, 전화번호, 프로필 이미지를 변경하고 회원탈퇴를 진행할 수 있습니다.' },
  { icon: ShieldCheck, title: '공개 관리', desc: '내가 쓴 글은 전체 공개 후 개별 글을 제외하는 방식으로 공개 범위를 조정할 수 있습니다.' },
];

function GuideList({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2 text-sm text-text-secondary leading-relaxed">
          <Check size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <section className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">크크킄 서비스 가이드</h1>
              <p className="text-sm text-text-secondary mt-1">역할별로 사용할 수 있는 기능과 기본 흐름을 정리했습니다.</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <Search size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">크리에이터 계정</h2>
                <p className="text-xs text-text-muted mt-1">편집자를 찾고 프로젝트를 맡기는 계정입니다.</p>
              </div>
            </div>
            <GuideList items={creatorGuides} />
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">에디터 계정</h2>
                <p className="text-xs text-text-muted mt-1">작업을 찾고 포트폴리오를 공개하는 계정입니다.</p>
              </div>
            </div>
            <GuideList items={editorGuides} />
          </div>
        </section>

        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-5">공통 기능</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonGuides.map((guide) => (
              <div key={guide.title} className="rounded-xl bg-surface-elevated border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <guide.icon size={18} className="text-primary" />
                  <h3 className="font-bold text-text-primary">{guide.title}</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{guide.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Link href="/mypage" className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
            마이페이지로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
