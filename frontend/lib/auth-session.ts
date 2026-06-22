import { API_BASE_URL } from '@/lib/api';

type AuthSessionResponse = {
  accessToken: string;
  onboardingRequired: boolean;
  user: {
    role: 'YOUTUBER' | 'EDITOR' | null;
  };
};

let accessToken: string | null = null;
let onboardingPending = false;
let userRole: 'YOUTUBER' | 'EDITOR' | null = null;
let restorePromise: Promise<AuthSessionResponse | null> | null = null;

export function saveAuthSession(
  token: string,
  onboardingRequired: boolean,
  role: 'YOUTUBER' | 'EDITOR' | null = null,
) {
  accessToken = token;
  onboardingPending = onboardingRequired;
  userRole = role;
  window.dispatchEvent(new Event('authSessionUpdated'));
}

export function getAccessToken() {
  return accessToken;
}

export function getUserRole() {
  return userRole;
}

export function setUserRole(role: 'YOUTUBER' | 'EDITOR' | null) {
  userRole = role;
}

export function completeOnboarding() {
  onboardingPending = false;
}

export function isOnboardingPending() {
  return onboardingPending;
}

export function clearAuthSession() {
  accessToken = null;
  onboardingPending = false;
  userRole = null;
}

export async function restoreAuthSession() {
  if (accessToken) {
    return { accessToken, onboardingRequired: onboardingPending };
  }
  return refreshAuthSession();
}

export async function refreshAuthSession() {
  if (restorePromise) return restorePromise;

  restorePromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (response) => {
      if (response.status === 204) {
        clearAuthSession();
        return null;
      }
      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          clearAuthSession();
          window.dispatchEvent(new Event('authSessionCleared'));
        }
        return null;
      }
      const auth = await response.json() as AuthSessionResponse;
      saveAuthSession(auth.accessToken, auth.onboardingRequired, auth.user.role);
      return auth;
    })
    .catch(() => null)
    .finally(() => {
      restorePromise = null;
    });

  return restorePromise;
}

export async function discardPendingAuthSession() {
  const token = accessToken;
  clearAuthSession();

  if (!token) return;

  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => undefined);
}
