import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import {
  deleteUserVideo,
  fetchUserUploadedVideoIds,
  fetchVideoMetadata
} from '../api/videos';

async function fetchMetadataBatch(ids, { signal } = {}) {
  const settled = await Promise.allSettled(
    ids.map((id) => fetchVideoMetadata(id, { signal }))
  );

  const fulfilled = settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  if (ids.length > 0 && fulfilled.length === 0) {
    const firstFailure = settled.find((result) => result.status === 'rejected');
    throw new ApiError(firstFailure?.reason?.message || 'Failed to load uploaded videos.', {
      code: firstFailure?.reason?.code || 'REQUEST_FAILED',
      kind: firstFailure?.reason?.kind || 'api',
      details: firstFailure?.reason
    });
  }

  return fulfilled;
}

export function useProfileVideos(userId) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletingVideoId, setDeletingVideoId] = useState('');
  const activeRequestRef = useRef(0);

  const load = useCallback(async ({ signal } = {}) => {
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    if (!userId) {
      setVideos([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ids = await fetchUserUploadedVideoIds(userId, { signal });
      const metadata = ids.length > 0
        ? await fetchMetadataBatch(ids, { signal })
        : [];

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
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(async () => {
    const controller = new AbortController();
    await load({ signal: controller.signal });
  }, [load]);

  const removeVideo = useCallback(async (videoId) => {
    if (!userId || !videoId) {
      return false;
    }

    setDeleteError('');
    setDeletingVideoId(videoId);

    try {
      const deleted = await deleteUserVideo(userId, videoId);
      if (deleted) {
        setVideos((current) => current.filter((video) => video.id !== videoId));
      }
      return deleted;
    } catch (err) {
      setDeleteError(err?.message || 'Unable to delete this video.');
      return false;
    } finally {
      setDeletingVideoId('');
    }
  }, [userId]);

  const clearDeleteError = useCallback(() => {
    setDeleteError('');
  }, []);

  return {
    videos,
    loading,
    error,
    reload,
    removeVideo,
    deletingVideoId,
    deleteError,
    clearDeleteError
  };
}
