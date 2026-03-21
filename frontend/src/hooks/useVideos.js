import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchVideos } from '../api/videos';

export function useVideos({ query = '', limit = 10 } = {}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [pageLimit, setPageLimit] = useState(limit);
  const activeRequestRef = useRef(0);

  const load = useCallback(async ({ cursor = '', append = false, signal } = {}) => {
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchVideos(undefined, {
        cursor,
        query,
        limit,
        signal
      });

      if (signal?.aborted || requestId !== activeRequestRef.current) {
        return;
      }

      setVideos((current) => (append ? [...current, ...result.items] : result.items));
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setPageLimit(typeof result.limit === 'number' ? result.limit : limit);
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError' || requestId !== activeRequestRef.current) {
        return;
      }

      if (!append) {
        setVideos([]);
        setNextCursor(null);
        setHasMore(false);
      }
      setError(err);
    } finally {
      if (signal?.aborted || requestId !== activeRequestRef.current) {
        return;
      }

      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [limit, query]);

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [load]);

  const reload = useCallback(async () => {
    const controller = new AbortController();
    await load({ signal: controller.signal });
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || !hasMore || loadingMore) {
      return;
    }

    await load({
      cursor: nextCursor,
      append: true
    });
  }, [hasMore, load, loadingMore, nextCursor]);

  return {
    videos,
    loading,
    loadingMore,
    error,
    nextCursor,
    hasMore,
    limit: pageLimit,
    query,
    reload,
    loadMore
  };
}
