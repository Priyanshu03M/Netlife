import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchVideoMetadata, fetchVideoPlaylist } from '../api/videos';

export function useVideoDetails(videoId) {
  const [metadata, setMetadata] = useState(null);
  const [playlistText, setPlaylistText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeRequestRef = useRef(0);

  useEffect(() => {
    if (!videoId) {
      setMetadata(null);
      setPlaylistText('');
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    setLoading(true);
    setError(null);
    setMetadata(null);
    setPlaylistText('');

    Promise.all([
      fetchVideoMetadata(videoId, { signal: controller.signal }),
      fetchVideoPlaylist(videoId, { signal: controller.signal })
    ])
      .then(([meta, playlist]) => {
        if (controller.signal.aborted || requestId !== activeRequestRef.current) {
          return;
        }
        setMetadata(meta);
        setPlaylistText(playlist);
      })
      .catch((err) => {
        if (controller.signal.aborted || requestId !== activeRequestRef.current) {
          return;
        }
        setError(err);
      })
      .finally(() => {
        if (controller.signal.aborted || requestId !== activeRequestRef.current) {
          return;
        }
        setLoading(false);
      });

    return () => controller.abort();
  }, [videoId]);

  const playlistUrl = useMemo(() => {
    if (!playlistText) {
      return '';
    }

    const blob = new Blob([playlistText], { type: 'application/vnd.apple.mpegurl' });
    return URL.createObjectURL(blob);
  }, [playlistText]);

  useEffect(() => {
    if (!playlistUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(playlistUrl);
    };
  }, [playlistUrl]);

  return {
    metadata,
    playlistUrl,
    loading,
    error
  };
}

