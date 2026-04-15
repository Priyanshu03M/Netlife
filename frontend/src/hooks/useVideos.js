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

function isPlaceholderVideoMetadata(video) {
  if (!video || typeof video !== 'object') {
    return true;
  }

  const id = typeof video.id === 'string' ? video.id : '';
  const defaultTitle = id ? `Video ${id.slice(0, 8)}` : '';

  return (
    !id
    || video.title === defaultTitle
    || (typeof video.title === 'string' && !video.title.trim())
  );
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
      const feed = await fetchVideoFeed({ signal });

      if (feed?.kind === 'items') {
        const baseItems = Array.isArray(feed.items) ? feed.items : [];
        const hydrateIds = baseItems
          .filter(isPlaceholderVideoMetadata)
          .map((item) => item.id)
          .filter(Boolean);

        if (hydrateIds.length > 0) {
          const hydrated = await fetchMetadataBatch(hydrateIds, { signal });
          const hydratedById = new Map(hydrated.map((item) => [item.id, item]));

          if (signal?.aborted || requestId !== activeRequestRef.current) {
            return;
          }

          const merged = baseItems.map((item) => {
            const meta = hydratedById.get(item.id);
            if (!meta) {
              return item;
            }

            return {
              ...meta,
              // Prefer fields provided by the feed when present.
              thumbnailUrl: item.thumbnailUrl || meta.thumbnailUrl || null,
              channelName: item.channelName || meta.channelName || ''
            };
          });

          setVideos(merged);
          return;
        }

        if (signal?.aborted || requestId !== activeRequestRef.current) {
          return;
        }

        setVideos(baseItems);
        return;
      }

      const ids = Array.isArray(feed?.ids) ? feed.ids : [];
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
      const haystack = `${video.title} ${video.description} ${video.channelName || ''} ${video.id}`.toLowerCase();
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
