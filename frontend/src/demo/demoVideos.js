export const DEMO_VIDEO_IDS = {
  ME: 'local-demo-me',
  RECOMMENDATION: 'local-demo-recommendation',
  TRENDING: 'local-demo-trending'
};

export const DEMO_VIDEO_SRC_BY_ID = {
  [DEMO_VIDEO_IDS.ME]: '/demo/12380703_2560_1440_50fps.mp4',
  [DEMO_VIDEO_IDS.RECOMMENDATION]: '/demo/12380703_2560_1440_50fps.mp4',
  [DEMO_VIDEO_IDS.TRENDING]: '/demo/12380703_2560_1440_50fps.mp4'
};

export const DEMO_VIDEOS = [
  {
    id: DEMO_VIDEO_IDS.ME,
    title: 'Continue watching demo',
    description: 'Shown when the backend is unreachable.',
    channelName: 'Netlife',
    views: 0,
    duration: null,
    size: null,
    thumbnailUrl: null
  },
  {
    id: DEMO_VIDEO_IDS.RECOMMENDATION,
    title: 'Recommended demo',
    description: 'Shown when the backend is unreachable.',
    channelName: 'Netlife',
    views: 0,
    duration: null,
    size: null,
    thumbnailUrl: null
  },
  {
    id: DEMO_VIDEO_IDS.TRENDING,
    title: 'Trending demo',
    description: 'Shown when the backend is unreachable.',
    channelName: 'Netlife',
    views: 0,
    duration: null,
    size: null,
    thumbnailUrl: null
  }
];

export function getDemoVideoById(videoId) {
  return DEMO_VIDEOS.find((video) => video.id === videoId) || null;
}

export function getDemoVideoSrc(videoId) {
  return DEMO_VIDEO_SRC_BY_ID[videoId] || '';
}
