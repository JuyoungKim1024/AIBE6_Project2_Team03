'use client';

import { clearAuthSession, getAccessToken } from '@/lib/auth-session';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  Circle,
  KeyRound,
  Trash2,
  User,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const DELETE_CONFIRMATION = '탈퇴하겠습니다';
type SettingsSection = 'profile' | 'password' | 'delete';

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

function formatPhoneNumber(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [provider, setProvider] = useState('');
  const [isTestAccount, setIsTestAccount] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isLocalAccount = provider === 'LOCAL';
  const canDelete = !isTestAccount && confirmation === DELETE_CONFIRMATION && !isDeleting;
  const canSaveProfile = nickname.trim().length > 0 && !isProfileSubmitting;
  const passwordChecks = [
    { label: '8자 이상 입력', valid: newPassword.length >= 8 },
    { label: '영문 대문자 포함', valid: /[A-Z]/.test(newPassword) },
    { label: '영문 소문자 포함', valid: /[a-z]/.test(newPassword) },
    { label: '숫자 포함', valid: /\d/.test(newPassword) },
  ];
  const isNewPasswordValid = passwordChecks.every((check) => check.valid);
  const isNewPasswordMatched = newPasswordConfirm.length > 0 && newPassword === newPasswordConfirm;
  const canChangePassword = currentPassword.length > 0
    && isNewPasswordValid
    && isNewPasswordMatched
    && !isPasswordSubmitting;

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace('/login');
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data) return;
        setProvider(data.provider ?? '');
        setIsTestAccount(Boolean(data.testAccount));
        setName(data.name ?? '');
        setPhone(data.phone ?? '');
        setNickname(data.nickname ?? '');
        setProfileImage(data.profileImage ?? '');
      });
  }, [router]);

  const changeProfileImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileError('이미지 파일만 등록할 수 있습니다');
      return;
    }
    setProfileImage(await readImageAsDataUrl(file));
    setProfileError('');
    setProfileMessage('');
  };

  const saveProfile = async () => {
    if (!canSaveProfile) return;
    if (nickname.trim().length < 2) {
      setProfileError('닉네임은 2글자 이상 입력해주세요');
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      router.push('/login');
      return;
    }

    setProfileMessage('');
    setProfileError('');
    setIsProfileSubmitting(true);
    const response = await fetch(`${API_BASE_URL}/api/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name, phone, nickname, profileImage }),
    });
    setIsProfileSubmitting(false);

    if (!response.ok) {
      setProfileError(await readErrorMessage(response, '사용자 정보 저장에 실패했습니다.'));
      return;
    }
    const savedUser = await response.json();
    setProfileImage(savedUser.profileImage ?? profileImage);
    window.dispatchEvent(new CustomEvent('authUserUpdated', { detail: savedUser }));
    setProfileMessage('사용자 정보가 저장되었습니다.');
  };

  const changePassword = async () => {
    if (!canChangePassword) return;
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.push('/login');
      return;
    }

    setPasswordMessage('');
    setPasswordError('');
    setIsPasswordSubmitting(true);
    const response = await fetch(`${API_BASE_URL}/api/users/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setIsPasswordSubmitting(false);

    if (!response.ok) {
      setPasswordError(await readErrorMessage(response, '비밀번호 변경에 실패했습니다.'));
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setPasswordMessage('비밀번호가 변경되었습니다.');
  };

  const deleteAccount = async () => {
    if (!canDelete) return;
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.push('/login');
      return;
    }

    setDeleteError('');
    setIsDeleting(true);
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ confirmation }),
    });
    setIsDeleting(false);

    if (!response.ok) {
      setDeleteError(await readErrorMessage(response, '회원탈퇴에 실패했습니다.'));
      return;
    }
    clearAuthSession();
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'profile' as const, label: '프로필 수정', icon: User },
    { id: 'password' as const, label: '비밀번호', icon: KeyRound },
    { id: 'delete' as const, label: '회원 탈퇴', icon: Trash2 },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 mb-5 text-sm font-bold text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={18} />
          뒤로가기
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-8">설정</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside className="bg-surface border border-border rounded-xl p-3 h-fit">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  <item.icon size={17} />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <main>
            {activeSection === 'profile' && (
              <section className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-lg font-bold text-text-primary mb-1">프로필 수정</h2>
                <p className="text-sm text-text-secondary mb-6">프로필 이미지, 이름, 전화번호, 닉네임을 변경합니다.</p>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    {profileImage ? (
                      <img src={profileImage} alt="프로필 이미지" className="w-20 h-20 rounded-full object-cover bg-surface-elevated border border-border" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-muted">
                        <User size={30} />
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-surface-elevated border border-border text-text-primary hover:border-primary cursor-pointer">
                      <Camera size={16} />
                      이미지 등록
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => changeProfileImage(event.target.files?.[0])} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="block text-sm font-bold text-text-primary mb-2">이름</span>
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="이름을 입력해주세요" className="form-input" />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-bold text-text-primary mb-2">전화번호</span>
                    <input value={phone} onChange={(event) => setPhone(formatPhoneNumber(event.target.value))} placeholder="010-1234-5678" className="form-input" />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-bold text-text-primary mb-2">닉네임</span>
                    <input value={nickname} onChange={(event) => { setNickname(event.target.value); setProfileError(''); }} placeholder="닉네임을 입력해주세요" className="form-input" />
                  </label>
                  {profileError && <p className="text-sm font-bold text-accent">{profileError}</p>}
                  {profileMessage && <p className="text-sm font-bold text-primary">{profileMessage}</p>}
                  <button type="button" onClick={saveProfile} disabled={!canSaveProfile} className="px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white disabled:opacity-50">
                    {isProfileSubmitting ? '저장 중...' : '저장'}
                  </button>
                </div>
              </section>
            )}

            {activeSection === 'password' && (
              <section className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-lg font-bold text-text-primary mb-1">비밀번호 변경</h2>
                <p className="text-sm text-text-secondary mb-6">현재 비밀번호 확인 후 새 비밀번호로 변경합니다.</p>
                {isLocalAccount ? (
                  <div className="space-y-4 max-w-xl">
                    <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="현재 비밀번호" autoComplete="current-password" className="form-input" />
                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="새 비밀번호" autoComplete="new-password" className="form-input" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-1">
                      {passwordChecks.map((check) => (
                        <span key={check.label} className={`flex items-center gap-1.5 text-xs font-bold ${check.valid ? 'text-primary' : 'text-accent'}`}>
                          {check.valid ? <Check size={13} /> : <Circle size={13} />}
                          {check.label}
                        </span>
                      ))}
                    </div>
                    <input type="password" value={newPasswordConfirm} onChange={(event) => setNewPasswordConfirm(event.target.value)} placeholder="새 비밀번호 확인" autoComplete="new-password" className="form-input" />
                    {newPasswordConfirm.length > 0 && (
                      <p className={`flex items-center gap-1.5 px-1 text-xs font-bold ${isNewPasswordMatched ? 'text-primary' : 'text-accent'}`}>
                        {isNewPasswordMatched ? <Check size={13} /> : <Circle size={13} />}
                        {isNewPasswordMatched ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                      </p>
                    )}
                    {passwordError && <p className="text-sm font-bold text-accent">{passwordError}</p>}
                    {passwordMessage && <p className="text-sm font-bold text-primary">{passwordMessage}</p>}
                    <button type="button" onClick={changePassword} disabled={!canChangePassword} className="px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white disabled:opacity-50">
                      {isPasswordSubmitting ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-surface-elevated p-5 text-sm text-text-secondary">
                    소셜 로그인 계정의 비밀번호는 해당 로그인 서비스에서 변경해주세요.
                  </div>
                )}
              </section>
            )}

            {activeSection === 'delete' && (
              <section className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">회원 탈퇴</h2>
                    <p className="text-sm text-text-secondary mt-1">탈퇴하면 계정과 연결된 데이터가 삭제됩니다.</p>
                  </div>
                </div>
                {isTestAccount ? (
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm font-bold text-accent">
                    테스트 계정은 탈퇴할 수 없습니다.
                  </div>
                ) : (
                  <>
                    <label className="block text-sm font-bold text-text-primary mb-2">확인 문구</label>
                    <input type="text" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={DELETE_CONFIRMATION} className="form-input" />
                    <p className="text-xs text-text-muted mt-2">회원탈퇴를 진행하려면 &apos;{DELETE_CONFIRMATION}&apos;를 입력해주세요.</p>
                  </>
                )}
                {deleteError && <p className="text-sm font-bold text-accent mt-4">{deleteError}</p>}
                {!isTestAccount && (
                  <button type="button" onClick={deleteAccount} disabled={!canDelete} className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-accent text-white disabled:opacity-50">
                    <Trash2 size={16} />
                    {isDeleting ? '탈퇴 중...' : '회원 탈퇴'}
                  </button>
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
