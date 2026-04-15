import React, { memo, useEffect, useState } from 'react';

/**
 * @param {{
 *   video: {
 *     id: string,
 *     channelName: string,
 *     title: string,
 *     description?: string,
 *     views: number,
 *     duration?: number | null,
 *     size?: number | null,
 *     thumbnailUrl?: string | null
 *   },
 *   onOpen: (videoId: string) => void
 * }} props
 */
function VideoCard({ video, onOpen }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    // Reset if we swap cards or the backend starts returning a thumbnail later.
    setThumbnailFailed(false);
  }, [video?.thumbnailUrl, video?.id]);

  const shouldShowThumbnail = Boolean(video.thumbnailUrl) && !thumbnailFailed;

  return (
    <article className="video-card">
      <button
        type="button"
        className="video-card-button"
        onClick={() => onOpen(video.id)}
      >
        <div className="video-thumb-wrap">
          <span className="video-card-pill">Uploaded</span>
          {shouldShowThumbnail ? (
            <img
              className="video-thumb"
              src={video.thumbnailUrl}
              alt={video.title ? `${video.title} thumbnail` : 'Video thumbnail'}
              loading="lazy"
              decoding="async"
              onError={() => setThumbnailFailed(true)}
            />
          ) : (
            <div className="video-thumb video-thumb-placeholder">
              <span className="video-thumb-placeholder-text">Netlife</span>
            </div>
          )}
        </div>
        <div className="video-card-body">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-channel">{video.channelName}</p>
          {video.description ? (
            <p className="video-description">{video.description}</p>
          ) : null}
          <p className="video-meta">
            {Number.isFinite(video.views) ? `${video.views} view${video.views === 1 ? '' : 's'}` : '0 views'}
          </p>
        </div>
      </button>
    </article>
  );
}

export default memo(VideoCard);
