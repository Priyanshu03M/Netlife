import React, { useEffect, useRef, useState } from 'react';

function canPlayHlsNatively(video) {
  if (!video) {
    return false;
  }

  return Boolean(video.canPlayType?.('application/vnd.apple.mpegurl'));
}

function loadHlsJs() {
  return import('hls.js');
}

function HlsPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [hlsError, setHlsError] = useState('');

  useEffect(() => {
    setHlsError('');

    const video = videoRef.current;
    if (!video) {
      return () => {};
    }

    if (!src) {
      video.removeAttribute('src');
      video.load();
      return () => {};
    }

    if (canPlayHlsNatively(video)) {
      video.src = src;
      return () => {};
    }

    let cancelled = false;

    loadHlsJs()
      .then(({ default: Hls }) => {
        if (cancelled || !videoRef.current) {
          return;
        }

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true
          });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.ERROR, (_evt, data) => {
            if (data?.fatal) {
              setHlsError('Playback failed. Check HLS availability and signed URL expiry.');
            }
          });
          return;
        }

        setHlsError('This browser cannot play HLS without MediaSource support.');
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setHlsError('Unable to load HLS playback support.');
      });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <div className="watch-player-shell">
      <video
        ref={videoRef}
        className="watch-player"
        controls
        preload="metadata"
        poster={poster}
      />
      {hlsError ? (
        <p className="helper-text watch-helper-error">{hlsError}</p>
      ) : null}
    </div>
  );
}

export default HlsPlayer;

