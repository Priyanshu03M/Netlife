import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchVideoFeed, fetchVideoMetadata } from '../api/videos';
import { ApiError } from '../api/client';

async function fetchMetadataBatch(ids, { signal } = {}) {
  const settled = await Promise.allSettled(
    ids.map((id) => fetchVideoMetadata(id, { signal }))
  );

  const fulfilled = settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  if (ids.length > 0 && fulfilled.length === 0) {
    const firstFailure = settled.find((result) => result.status === 'rejected');
    throw new ApiError(firstFailure?.reason?.message || 'Failed to load video metadata.', {
      code: firstFailure?.reason?.code || 'REQUEST_FAILED',
      kind: firstFailure?.reason?.kind || 'api',
      details: firstFailure?.reason
    });
  }

  return fulfilled;
}

export function useVideos({ query = '' } = {}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeRequestRef = useRef(0);

  const load = useCallback(async ({ signal } = {}) => {
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const ids = await fetchVideoFeed({ signal });
      const metadata = await fetchMetadataBatch(ids, { signal });

      if (signal?.aborted || requestId !== activeRequestRef.current) {
        return;
      }

      setVideos(metadata);
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError' || requestId !== activeRequestRef.current) {
        return;
      }

      setVideos([]);
      setError(err);
    } finally {
      if (signal?.aborted || requestId !== activeRequestRef.current) {
        return;
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(async () => {
    const controller = new AbortController();
    await load({ signal: controller.signal });
  }, [load]);

  const filteredVideos = useMemo(() => {
    const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
    if (!q) {
      return videos;
    }

    return videos.filter((video) => {
      const haystack = `${video.title} ${video.description} ${video.id}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, videos]);

  return {
    videos: filteredVideos,
    loading,
    error,
    reload
  };
}
