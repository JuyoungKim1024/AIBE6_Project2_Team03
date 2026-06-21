import { API_BASE_URL } from '@/lib/api';

const ONBOARDING_PENDING_KEY = 'onboardingPending';

export function saveAuthSession(
  accessToken: string,
  refreshToken: string | undefined,
  onboardingRequired: boolean,
) {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  if (onboardingRequired) {
    localStorage.setItem(ONBOARDING_PENDING_KEY, 'true');
  } else {
    localStorage.removeItem(ONBOARDING_PENDING_KEY);
  }
}

export function completeOnboarding() {
  localStorage.removeItem(ONBOARDING_PENDING_KEY);
}

export function isOnboardingPending() {
  return localStorage.getItem(ONBOARDING_PENDING_KEY) === 'true';
}

export function clearAuthSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem(ONBOARDING_PENDING_KEY);
}

export function discardPendingAuthSession() {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  clearAuthSession();

  if (!accessToken) {
    return;
  }

  void fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {
    // Local tokens are already cleared even if server-side revocation fails.
  });
}
