import React from 'react';

/**
 * @param {{
 *   video: {
 *     id: string,
 *     title: string,
 *     channelName: string,
 *     thumbnailUrl?: string,
 *     views: number,
 *     createdAt: string
 *   },
 *   viewLabel: string,
 *   timeAgoLabel: string,
 *   onOpen: () => void
 * }} props
 */
function VideoCard({ video, viewLabel, timeAgoLabel, onOpen }) {
  return (
    <article className="video-card">
      <button
        type="button"
        className="video-card-button"
        onClick={onOpen}
      >
        <div className="video-thumb-wrap">
          {video.thumbnailUrl ? (
            <img
              className="video-thumb"
              src={video.thumbnailUrl}
              alt={video.title}
              loading="lazy"
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
          <p className="video-meta">
            {viewLabel} - {timeAgoLabel}
          </p>
        </div>
      </button>
    </article>
  );
}

export default VideoCard;
