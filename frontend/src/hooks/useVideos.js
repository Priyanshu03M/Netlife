import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchVideoMetadata, fetchVideoSectionFeed, VIDEO_FEED_SECTIONS } from '../api/videos';
import { ApiError } from '../api/client';
import { DEMO_VIDEO_IDS, DEMO_VIDEOS } from '../demo/demoVideos';

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

export function useVideos({ query = '', username = '' } = {}) {
  const [videos, setVideos] = useState([]);
  const [sections, setSections] = useState({
    me: [],
    recommendation: [],
    trending: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const activeRequestRef = useRef(0);

  const uniqueVideos = useCallback((items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const seen = new Set();
    return items.filter((video) => {
      const id = typeof video?.id === 'string' ? video.id : '';
      if (!id || seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    });
  }, []);

  const resolveFeedVideos = useCallback(async (feed, { signal, requestId } = {}) => {
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
          return [];
        }

        return baseItems.map((item) => {
          const meta = hydratedById.get(item.id);
          if (!meta) {
            return item;
          }

          return {
            ...meta,
            thumbnailUrl: item.thumbnailUrl || meta.thumbnailUrl || null,
            channelName: item.channelName || meta.channelName || ''
          };
        });
      }

      return baseItems;
    }

    const ids = Array.isArray(feed?.ids) ? feed.ids : [];
    return fetchMetadataBatch(ids, { signal });
  }, []);

  const assignUniqueSections = useCallback((nextSections) => {
    const takeSection = (items, limit) => uniqueVideos(items).slice(0, limit);

    return {
      me: takeSection(nextSections.me, 4),
      recommendation: takeSection(nextSections.recommendation, 8),
      trending: takeSection(nextSections.trending, 8)
    };
  }, [uniqueVideos]);

  const demoSections = useMemo(() => ({
    me: DEMO_VIDEOS.filter((video) => video.id === DEMO_VIDEO_IDS.ME),
    recommendation: DEMO_VIDEOS.filter((video) => video.id === DEMO_VIDEO_IDS.RECOMMENDATION),
    trending: DEMO_VIDEOS.filter((video) => video.id === DEMO_VIDEO_IDS.TRENDING)
  }), []);

  const load = useCallback(async ({ signal } = {}) => {
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;
    const hasUsername = typeof username === 'string' && username.trim().length > 0;

    setLoading(true);
    setError(null);
    setOfflineMode(false);

    try {
      const trendingFeedPromise = fetchVideoSectionFeed({
        section: VIDEO_FEED_SECTIONS.TRENDING,
        signal
      });

      const [meFeed, recommendationFeed, trendingFeed] = await Promise.all([
        hasUsername
          ? fetchVideoSectionFeed({ section: VIDEO_FEED_SECTIONS.ME, username, signal })
          : Promise.resolve({ kind: 'items', items: [] }),
        hasUsername
          ? fetchVideoSectionFeed({ section: VIDEO_FEED_SECTIONS.RECOMMENDATION, username, signal })
          : Promise.resolve({ kind: 'items', items: [] }),
        trendingFeedPromise
      ]);

      const [meVideos, recommendationVideos, trendingVideos] = await Promise.all([
        hasUsername ? resolveFeedVideos(meFeed, { signal, requestId }) : Promise.resolve([]),
        hasUsername ? resolveFeedVideos(recommendationFeed, { signal, requestId }) : Promise.resolve([]),
        resolveFeedVideos(trendingFeed, { signal, requestId })
      ]);

      if (signal?.aborted || requestId !== activeRequestRef.current) {
        return;
      }

      const nextSections = assignUniqueSections({
        me: meVideos,
        recommendation: recommendationVideos,
        trending: trendingVideos
      });

      const combined = uniqueVideos([
        ...nextSections.me,
        ...nextSections.recommendation,
        ...nextSections.trending
      ]);

      setSections(nextSections);
      setVideos(combined);
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError' || requestId !== activeRequestRef.current) {
        return;
      }

      if (err?.code === 'NETWORK_ERROR') {
        setOfflineMode(true);
        setSections(demoSections);
        setVideos(DEMO_VIDEOS);
        setError(null);
      } else {
        setOfflineMode(false);
        setSections({
          me: [],
          recommendation: [],
          trending: []
        });
        setVideos([]);
        setError(err);
      }
    } finally {
      if (signal?.aborted || requestId !== activeRequestRef.current) {
        return;
      }
      setLoading(false);
    }
  }, [assignUniqueSections, demoSections, resolveFeedVideos, uniqueVideos, username]);

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
    continueWatchingVideos: sections.me,
    recommendedVideos: sections.recommendation,
    trendingVideos: sections.trending,
    loading,
    error,
    reload,
    offlineMode
  };
}
