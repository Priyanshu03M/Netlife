import { API_ROUTES } from '../apiRoutes';
import { decodeJwt } from './jwt';
import { clearSession, getSession, saveSession } from './session';

export const AUTH_SESSION_INVALID_EVENT = 'auth:session-invalid';

const REFRESH_BUFFER_MS = 60 * 1000;

let refreshPromise = null;

function getTokenExpiryTime(token) {
  const payload = decodeJwt(token);
  const exp = typeof payload?.exp === 'number' ? payload.exp : 0;

  if (!exp) {
    return 0;
  }

  return exp * 1000;
}

function isTokenExpired(token, bufferMs = 0) {
  if (typeof token !== 'string' || !token.trim()) {
    return true;
  }

  const expiryTime = getTokenExpiryTime(token);
  if (!expiryTime) {
    return true;
  }

  return Date.now() + bufferMs >= expiryTime;
}

function notifySessionInvalid() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_INVALID_EVENT));
}

async function parseRefreshResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

async function performTokenRefresh() {
  const session = getSession();

  if (!session.refreshToken) {
    clearSession();
    notifySessionInvalid();
    return '';
  }

  const response = await fetch(API_ROUTES.refresh, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: session.refreshToken
    })
  });

  const payload = await parseRefreshResponse(response);

  if (!response.ok) {
    clearSession();
    notifySessionInvalid();

    const message = typeof payload === 'string'
      ? payload
      : payload?.message || 'Unable to refresh session.';

    throw new Error(message);
  }

  const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken : '';
  const refreshToken = typeof payload?.refreshToken === 'string' ? payload.refreshToken : session.refreshToken;

  if (!accessToken) {
    clearSession();
    notifySessionInvalid();
    throw new Error('Refresh response did not include an access token.');
  }

  saveSession({
    accessToken,
    refreshToken,
    username: session.username
  });

  return accessToken;
}

export async function ensureValidAccessToken({ forceRefresh = false } = {}) {
  const session = getSession();
  const accessToken = session.accessToken;

  if (!forceRefresh && accessToken && !isTokenExpired(accessToken, REFRESH_BUFFER_MS)) {
    return accessToken;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performTokenRefresh()
    .catch((error) => {
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function ensureAuthenticatedSession() {
  try {
    const accessToken = await ensureValidAccessToken();
    return Boolean(accessToken);
  } catch {
    return false;
  }
}
