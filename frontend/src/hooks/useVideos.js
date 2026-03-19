import { useCallback, useEffect, useState } from 'react';
import { fetchVideos } from '../api/videos';

export function useVideos({ query = '', limit = 10 } = {}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [pageLimit, setPageLimit] = useState(limit);

  const load = useCallback(async ({ cursor = '', append = false } = {}) => {
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
        limit
      });
      setVideos((current) => (append ? [...current, ...result.items] : result.items));
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setPageLimit(typeof result.limit === 'number' ? result.limit : limit);
    } catch (err) {
      if (!append) {
        setVideos([]);
        setNextCursor(null);
        setHasMore(false);
      }
      setError(err);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [limit, query]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchVideos(undefined, {
          query,
          limit
        });
        if (!active) {
          return;
        }

        setVideos(result.items);
        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
        setPageLimit(typeof result.limit === 'number' ? result.limit : limit);
      } catch (err) {
        if (!active) {
          return;
        }

        setVideos([]);
        setNextCursor(null);
        setHasMore(false);
        setError(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [limit, query]);

  const reload = useCallback(async () => {
    await load();
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
