import { getSession } from '../auth/session';

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = details.status || 0;
    this.code = details.code || 'UNKNOWN_ERROR';
    this.kind = details.kind || 'api';
    this.details = details.details;
  }
}

function buildHeaders(token, headers = {}) {
  return {
    ...headers,
    ...(token
      ? {
          Authorization: `Bearer ${token}`
        }
      : {})
  };
}

function maskToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  if (token.length <= 10) {
    return '***';
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

function isApiEnvelope(payload) {
  return Boolean(payload) && typeof payload === 'object' && 'success' in payload && 'data' in payload;
}

function getStatusCode(status) {
  if (status === 401) {
    return {
      code: 'UNAUTHORIZED',
      kind: 'auth',
      message: 'Your session has expired. Please log in again.'
    };
  }

  if (status === 403) {
    return {
      code: 'FORBIDDEN',
      kind: 'auth',
      message: 'You do not have permission to access this resource.'
    };
  }

  if (status >= 500) {
    return {
      code: 'SERVER_ERROR',
      kind: 'server',
      message: 'The server failed to process the request.'
    };
  }

  return {
    code: 'REQUEST_FAILED',
    kind: 'api',
    message: 'The request could not be completed.'
  };
}

export async function apiRequest(url, options = {}) {
  const {
    token,
    headers = {},
    signal,
    ...fetchOptions
  } = options;
  const accessToken = token ?? getSession().accessToken;
  const requestHeaders = buildHeaders(accessToken, headers);

  console.debug('[apiRequest] Sending request', {
    url,
    method: fetchOptions.method || 'GET',
    headers: requestHeaders,
    hasBody: Boolean(fetchOptions.body),
    tokenPreview: maskToken(accessToken)
  });

  let response;

  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    console.error('[apiRequest] Network failure', {
      url,
      method: fetchOptions.method || 'GET',
      error
    });
    throw new ApiError('Network error. Check your connection and backend.', {
      code: 'NETWORK_ERROR',
      kind: 'network',
      details: error
    });
  }

  const payload = await parseResponseBody(response);

  console.debug('[apiRequest] Received response', {
    url,
    method: fetchOptions.method || 'GET',
    status: response.status,
    ok: response.ok,
    payload
  });

  if (!response.ok) {
    const statusMeta = getStatusCode(response.status);
    const apiError = isApiEnvelope(payload) ? payload.error : null;
    const message = typeof payload === 'string'
      ? payload
      : apiError?.message || payload?.message || statusMeta.message;

    console.error('[apiRequest] Request failed', {
      url,
      method: fetchOptions.method || 'GET',
      status: response.status,
      code: apiError?.code || statusMeta.code,
      payload
    });

    throw new ApiError(message, {
      status: response.status,
      code: apiError?.code || statusMeta.code,
      kind: statusMeta.kind,
      details: payload
    });
  }

  if (isApiEnvelope(payload)) {
    if (!payload.success) {
      throw new ApiError(payload.error?.message || 'The request could not be completed.', {
        status: response.status,
        code: payload.error?.code || 'REQUEST_FAILED',
        kind: 'api',
        details: payload
      });
    }

    return payload.data;
  }

  return payload;
}
