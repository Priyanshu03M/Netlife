const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  username: 'username',
  userId: 'userId'
};

export function getSession() {
  return {
    accessToken: window.localStorage.getItem(STORAGE_KEYS.accessToken) || '',
    refreshToken: window.localStorage.getItem(STORAGE_KEYS.refreshToken) || '',
    username: window.localStorage.getItem(STORAGE_KEYS.username) || '',
    userId: window.localStorage.getItem(STORAGE_KEYS.userId) || ''
  };
}

export function hasSession() {
  return Boolean(getSession().accessToken);
}

export function saveSession(authData = {}, fallbackUsername = '') {
  const accessToken = authData.accessToken || '';
  const refreshToken = authData.refreshToken || '';
  const userId = authData.userId || authData.id || '';
  const username = authData.username || fallbackUsername || '';

  if (accessToken) {
    window.localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  }
  if (refreshToken) {
    window.localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  }
  if (username) {
    window.localStorage.setItem(STORAGE_KEYS.username, username);
  }
  if (userId) {
    window.localStorage.setItem(STORAGE_KEYS.userId, String(userId));
  }
}

export function clearSession() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function getAvatarLabel(username) {
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }

  return 'NL';
}
