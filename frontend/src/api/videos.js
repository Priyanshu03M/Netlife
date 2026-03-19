import { apiRequest, ApiError } from './client';
import { API_ROUTES } from '../apiRoutes';

function isIsoDateString(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const isoDatePattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

  return isoDatePattern.test(value) && !Number.isNaN(new Date(value).getTime());
}

export function normalizeVideo(raw) {
  const problems = [];

  if (!raw || typeof raw !== 'object') {
    console.warn('Rejected video: expected object.', raw);
    return null;
  }

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id) {
    problems.push('id must be a non-empty string');
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) {
    problems.push('title must be a non-empty string');
  }

  const videoUrl = typeof raw.videoUrl === 'string' ? raw.videoUrl.trim() : '';
  if (!videoUrl) {
    problems.push('videoUrl must be a non-empty string');
  }

  const channelName = typeof raw.channelName === 'string' ? raw.channelName.trim() : '';
  if (!channelName) {
    problems.push('channelName must be a non-empty string');
  }

  const views = raw.views;
  if (typeof views !== 'number' || Number.isNaN(views) || views < 0) {
    problems.push('views must be a number greater than or equal to 0');
  }

  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt.trim() : '';
  if (!isIsoDateString(createdAt)) {
    problems.push('createdAt must be a valid ISO date string');
  }

  if (problems.length > 0) {
    console.warn('Rejected video item:', {
      reasons: problems,
      item: raw
    });
    return null;
  }

  return {
    id,
    title,
    description: typeof raw.description === 'string' ? raw.description : '',
    videoUrl,
    thumbnailUrl: typeof raw.thumbnailUrl === 'string' ? raw.thumbnailUrl : '',
    channelName,
    views,
    createdAt
  };
}

function extractCollection(payload) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      nextCursor: null
    };
  }

  if (payload && typeof payload === 'object') {
    const items = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.videos)
        ? payload.videos
        : null;

    if (items) {
      return {
        items,
        nextCursor: typeof payload.nextCursor === 'string' ? payload.nextCursor : null
      };
    }
  }

  throw new ApiError('Malformed video response: expected an array or paged object.', {
    code: 'MALFORMED_DATA',
    kind: 'validation',
    details: payload
  });
}

export async function fetchVideos(token, cursor = '') {
  const url = new URL(API_ROUTES.videos);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  console.debug('[videos] Fetching videos', {
    endpoint: API_ROUTES.videos,
    requestUrl: url.toString(),
    cursor: cursor || null
  });

  const payload = await apiRequest(url.toString(), {
    method: 'GET',
    token
  });

  console.debug('[videos] Raw videos payload received', {
    requestUrl: url.toString(),
    payload
  });

  const { items, nextCursor } = extractCollection(payload);
  const videos = [];
  let rejectedCount = 0;

  items.forEach((item) => {
    const normalized = normalizeVideo(item);
    if (normalized) {
      videos.push(normalized);
    } else {
      rejectedCount += 1;
    }
  });

  if (rejectedCount > 0) {
    console.warn(`Rejected ${rejectedCount} invalid video item(s) from GET /videos.`);
  }

  if (items.length > 0 && videos.length === 0) {
    throw new ApiError('Malformed video response: every video item was rejected by validation.', {
      code: 'MALFORMED_DATA',
      kind: 'validation',
      details: payload
    });
  }

  console.debug('[videos] Normalized videos result', {
    requestUrl: url.toString(),
    receivedCount: items.length,
    acceptedCount: videos.length,
    rejectedCount,
    nextCursor
  });

  return {
    videos,
    nextCursor
  };
}

export async function uploadVideo(token, { userId, file, title, description }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('description', description);

  console.debug('[videos] Uploading video', {
    endpoint: API_ROUTES.videoUpload,
    userId,
    title,
    descriptionLength: description.length,
    fileName: file?.name || null,
    fileType: file?.type || null,
    fileSize: file?.size || null
  });

  return apiRequest(API_ROUTES.videoUpload, {
    method: 'POST',
    token,
    headers: {
      'X-User-Id': userId
    },
    body: formData
  });
}
