import { apiRequest, ApiError } from './client';
import { API_ROUTES } from '../apiRoutes';

export function normalizeVideoMetadata(payload, fallbackId = '') {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const id = typeof payload.id === 'string' ? payload.id : fallbackId;
  const title = typeof payload.title === 'string' ? payload.title : '';
  const description = typeof payload.description === 'string' ? payload.description : '';
  const views = typeof payload.views === 'number' ? payload.views : 0;
  const size = typeof payload.size === 'number' ? payload.size : null;
  const duration = typeof payload.duration === 'number' ? payload.duration : null;

  if (!id) {
    return null;
  }

  return {
    id,
    title: title || `Video ${id.slice(0, 8)}`,
    description,
    views,
    size,
    duration
  };
}

export async function fetchVideoFeed({ signal } = {}) {
  const payload = await apiRequest(API_ROUTES.videoFeed, {
    method: 'GET',
    includeAuth: false,
    signal
  });

  if (!Array.isArray(payload)) {
    throw new ApiError('Malformed feed response: expected an array of ids.', {
      code: 'MALFORMED_DATA',
      kind: 'validation',
      details: payload
    });
  }

  return payload
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim());
}

export async function fetchVideoMetadata(videoId, { signal } = {}) {
  if (!videoId) {
    throw new ApiError('Video id is required.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    });
  }

  const payload = await apiRequest(API_ROUTES.videoById(videoId), {
    method: 'GET',
    includeAuth: false,
    signal
  });

  const normalized = normalizeVideoMetadata(payload, videoId);
  if (!normalized) {
    throw new ApiError('Malformed video metadata response.', {
      code: 'MALFORMED_DATA',
      kind: 'validation',
      details: payload
    });
  }

  return normalized;
}

export async function fetchVideoPlaylist(videoId, { signal } = {}) {
  if (!videoId) {
    throw new ApiError('Video id is required.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    });
  }

  const playlist = await apiRequest(API_ROUTES.videoPlayById(videoId), {
    method: 'GET',
    includeAuth: false,
    signal
  });

  if (typeof playlist !== 'string' || !playlist.trim()) {
    throw new ApiError('Malformed playlist response.', {
      code: 'MALFORMED_DATA',
      kind: 'validation',
      details: playlist
    });
  }

  return playlist;
}

export async function initiateVideoUpload({
  title,
  description,
  clientId,
  token,
  signal
}) {
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';

  if (!cleanTitle) {
    throw new ApiError('Title is required.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    });
  }

  if (!clientId) {
    throw new ApiError('Client id is required for uploads.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    });
  }

  const payload = await apiRequest(API_ROUTES.videoInitiateUpload, {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-ID': clientId
    },
    body: JSON.stringify({
      title: cleanTitle,
      description: cleanDescription
    }),
    signal
  });

  const videoId = typeof payload?.videoId === 'string' ? payload.videoId : '';
  const url = typeof payload?.url === 'string' ? payload.url : '';

  if (!videoId || !url) {
    throw new ApiError('Malformed initiate-upload response.', {
      code: 'MALFORMED_DATA',
      kind: 'validation',
      details: payload
    });
  }

  return {
    videoId,
    uploadUrl: url,
    status: typeof payload?.status === 'string' ? payload.status : ''
  };
}

function shouldFallbackToGateway(error) {
  // CORS failures surface as network errors in the browser (TypeError -> ApiError NETWORK_ERROR).
  return error?.code === 'NETWORK_ERROR' || error?.kind === 'network';
}

export async function completeVideoUpload({ videoId, signal } = {}) {
  if (!videoId) {
    throw new ApiError('Video id is required.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    });
  }

  const body = JSON.stringify({ videoId });
  const directRequest = {
    method: 'POST',
    includeAuth: false,
    headers: { 'Content-Type': 'application/json' },
    body,
    signal
  };

  try {
    return await apiRequest(API_ROUTES.videoCompleteUploadDirect, directRequest);
  } catch (error) {
    if (!shouldFallbackToGateway(error)) {
      throw error;
    }
  }

  // Gateway endpoint is protected (requires JWT). Use the session token implicitly.
  return apiRequest(API_ROUTES.videoCompleteUploadGateway, {
    method: 'POST',
    includeAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body,
    signal
  });
}
