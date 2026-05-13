import { apiRequest, ApiError } from './client';
import { API_ROUTES } from '../apiRoutes';

export const VIDEO_FEED_SECTIONS = {
  ME: 'me',
  RECOMMENDATION: 'recommendation',
  TRENDING: 'trending'
};

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
  const thumbnailUrl = typeof payload.thumbnailUrl === 'string' ? payload.thumbnailUrl : '';
  const channelName = typeof payload.channelName === 'string' ? payload.channelName : '';
  const createdAt = typeof payload.createdAt === 'string' ? payload.createdAt.trim() : '';

  if (!id) {
    return null;
  }

  return {
    id,
    title: title || `Video ${id.slice(0, 8)}`,
    description,
    views,
    size,
    duration,
    thumbnailUrl: thumbnailUrl.trim() || null,
    channelName: channelName.trim() || '',
    createdAt: createdAt || null
  };
}

function normalizeVideoFeedItem(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    // Minimal item, will be hydrated via /videos/{id}.
    return {
      id: trimmed
    };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const id = typeof value.id === 'string' ? value.id : '';
  if (!id.trim()) {
    return null;
  }

  // Feed can optionally include thumbnailUrl/channelName (and may include full metadata).
  return normalizeVideoMetadata(value, id.trim()) || { id: id.trim() };
}

function normalizeFeedPayload(payload) {
  if (!Array.isArray(payload)) {
    throw new ApiError('Malformed feed response: expected an array.', {
      code: 'MALFORMED_DATA',
      kind: 'validation',
      details: payload
    });
  }

  const items = payload
    .map(normalizeVideoFeedItem)
    .filter(Boolean);

  if (items.length === 0 && payload.length > 0) {
    throw new ApiError('Malformed feed response: no usable items found.', {
      code: 'MALFORMED_DATA',
      kind: 'validation',
      details: payload
    });
  }

  const hasAnyMetadataFields = items.some((item) => (
    typeof item.title === 'string'
    || typeof item.thumbnailUrl === 'string'
    || typeof item.channelName === 'string'
    || typeof item.views === 'number'
  ));

  if (hasAnyMetadataFields) {
    return { kind: 'items', items };
  }

  return { kind: 'ids', ids: items.map((item) => item.id) };
}

function resolveVideoFeedRoute({ section, username }) {
  const cleanUsername = typeof username === 'string' ? username.trim() : '';

  switch (section) {
    case VIDEO_FEED_SECTIONS.ME:
      if (!cleanUsername) {
        throw new ApiError('Username is required for the personal feed.', {
          code: 'VALIDATION_ERROR',
          kind: 'validation'
        });
      }
      return API_ROUTES.videoFeedMe(cleanUsername);
    case VIDEO_FEED_SECTIONS.RECOMMENDATION:
      if (!cleanUsername) {
        throw new ApiError('Username is required for the recommendation feed.', {
          code: 'VALIDATION_ERROR',
          kind: 'validation'
        });
      }
      return API_ROUTES.videoFeedRecommendation(cleanUsername);
    case VIDEO_FEED_SECTIONS.TRENDING:
      return API_ROUTES.videoFeedTrending;
    default:
      throw new ApiError('Unknown video feed section.', {
        code: 'VALIDATION_ERROR',
        kind: 'validation',
        details: section
      });
  }
}

export async function fetchVideoSectionFeed({ section, username = '', signal } = {}) {
  const route = resolveVideoFeedRoute({ section, username });
  const payload = await apiRequest(route, {
    method: 'GET',
    includeAuth: false,
    signal
  });

  return normalizeFeedPayload(payload);
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

export async function fetchUserUploadedVideoIds(userId, { signal } = {}) {
  if (!userId) {
    throw new ApiError('User id is required.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    });
  }

  const payload = await apiRequest(API_ROUTES.userVideos(userId), {
    method: 'GET',
    includeAuth: false,
    signal
  });

  if (!Array.isArray(payload)) {
    throw new ApiError('Malformed user videos response.', {
      code: 'MALFORMED_DATA',
      kind: 'validation',
      details: payload
    });
  }

  return payload
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function deleteUserVideo(userId, videoId, { signal } = {}) {
  if (!userId || !videoId) {
    throw new ApiError('User id and video id are required.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    });
  }

  const payload = await apiRequest(API_ROUTES.deleteUserVideo(userId, videoId), {
    method: 'DELETE',
    signal
  });

  if (typeof payload !== 'boolean') {
    throw new ApiError('Malformed delete response.', {
      code: 'MALFORMED_DATA',
      kind: 'validation',
      details: payload
    });
  }

  return payload;
}

export async function initiateVideoUpload({
  title,
  description,
  username,
  signal
}) {
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';
  const cleanUsername = typeof username === 'string' ? username.trim() : '';

  if (!cleanTitle) {
    throw new ApiError('Title is required.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    });
  }

  if (!cleanUsername) {
    throw new ApiError('Username is required for uploads.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    });
  }

  const payload = await apiRequest(API_ROUTES.videoInitiateUpload, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: cleanTitle,
      description: cleanDescription,
      username: cleanUsername
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
