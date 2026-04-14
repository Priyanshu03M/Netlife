function base64UrlDecode(value) {
  if (typeof value !== 'string' || !value) {
    return '';
  }

  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  try {
    return atob(padded);
  } catch {
    return '';
  }
}

export function decodeJwt(token) {
  if (typeof token !== 'string' || !token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  const json = base64UrlDecode(parts[1]);
  if (!json) {
    return null;
  }

  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

