import { useCallback, useEffect, useState } from 'react';
import { fetchVideos } from '../api/videos';

export function useVideos(initialCursor = '') {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);

  const load = useCallback(async (cursor = initialCursor) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchVideos(undefined, cursor);
      setVideos(result.videos);
      setNextCursor(result.nextCursor);
    } catch (err) {
      setVideos([]);
      setNextCursor(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [initialCursor]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchVideos(undefined, initialCursor);
        if (!active) {
          return;
        }

        setVideos(result.videos);
        setNextCursor(result.nextCursor);
      } catch (err) {
        if (!active) {
          return;
        }

        setVideos([]);
        setNextCursor(null);
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
  }, [initialCursor]);

  const reload = useCallback(async () => {
    await load(initialCursor);
  }, [initialCursor, load]);

  return {
    videos,
    loading,
    error,
    nextCursor,
    reload
  };
}
