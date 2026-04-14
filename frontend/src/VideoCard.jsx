import React, { memo } from 'react';

/**
 * @param {{
 *   video: {
 *     id: string,
 *     title: string,
 *     description?: string,
 *     views: number,
 *     duration?: number | null,
 *     size?: number | null
 *   },
 *   onOpen: (videoId: string) => void
 * }} props
 */
function VideoCard({ video, onOpen }) {
  return (
    <article className="video-card">
      <button
        type="button"
        className="video-card-button"
        onClick={() => onOpen(video.id)}
      >
        <div className="video-thumb-wrap">
          <span className="video-card-pill">Uploaded</span>
          <div className="video-thumb video-thumb-placeholder">
            <span className="video-thumb-placeholder-text">Netlife</span>
          </div>
        </div>
        <div className="video-card-body">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-channel">{video.id}</p>
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
