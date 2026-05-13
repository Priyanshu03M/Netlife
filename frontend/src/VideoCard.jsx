import React, { memo, useEffect, useState } from 'react';

function formatCompactNumber(value) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const abs = Math.abs(value);
  if (abs < 1000) {
    return `${Math.round(value)}`;
  }

  const units = [
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' }
  ];

  const unit = units.find((u) => abs >= u.v) || units[units.length - 1];
  const scaled = value / unit.v;
  const rounded = scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
  return `${rounded}${unit.s}`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '';
  }

  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const mm = `${mins}`.padStart(2, '0');
  const ss = `${secs}`.padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${mm}:${ss}`;
  }

  return `${mins}:${ss}`;
}

function hashToInt(input) {
  const str = typeof input === 'string' ? input : '';
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function estimateDuration({ duration, size, id }) {
  if (Number.isFinite(duration) && duration > 0) {
    return duration;
  }

  // If size is present, assume ~2.2 Mbps average bitrate for a reasonable estimate.
  if (Number.isFinite(size) && size > 0) {
    const seconds = (size * 8) / 2_200_000;
    return Math.max(45, Math.min(7200, Math.round(seconds)));
  }

  // Deterministic fallback: 1–58 minutes based on id hash.
  const seed = hashToInt(id);
  return 60 + (seed % (58 * 60));
}

function formatTimeAgoFromId(videoId) {
  const seed = hashToInt(videoId);
  const minutes = 10 + (seed % (60 * 24 * 30)); // up to ~30 days
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function parseCreatedAt(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTimeAgo(createdAt, fallbackVideoId) {
  const parsed = parseCreatedAt(createdAt);
  if (!parsed) {
    return fallbackVideoId === 'local-demo' ? 'Just now' : formatTimeAgoFromId(fallbackVideoId);
  }

  const diffMs = Date.now() - parsed.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 'Just now';
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

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
 *     thumbnailUrl?: string | null,
 *     createdAt?: string | null
 *   },
 *   onOpen: (videoId: string) => void
 *   variant?: 'grid' | 'row'
 *   footerAction?: React.ReactNode
 * }} props
 */
function VideoCard({ video, onOpen, variant = 'grid', footerAction = null }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    // Reset if we swap cards or the backend starts returning a thumbnail later.
    setThumbnailFailed(false);
  }, [video?.thumbnailUrl, video?.id]);

  const shouldShowThumbnail = Boolean(video.thumbnailUrl) && !thumbnailFailed;
  const avatarLabel = (video.channelName || 'N').trim().slice(0, 1).toUpperCase();
  const durationSeconds = estimateDuration({ duration: video.duration, size: video.size, id: video.id });
  const durationLabel = formatDuration(durationSeconds);
  const viewsLabel = `${formatCompactNumber(video.views)} view${video.views === 1 ? '' : 's'}`;
  const timeAgoLabel = formatTimeAgo(video.createdAt, video.id);

  return (
    <article className={`video-card ${variant === 'row' ? 'video-card-row' : ''}`} role="listitem">
      <button
        type="button"
        className="video-card-button"
        onClick={() => onOpen(video.id)}
        aria-label={video.title ? `Open ${video.title}` : 'Open video'}
      >
        <div className="video-thumb-wrap">
          {durationLabel ? (
            <span className="video-duration" aria-label={`Duration ${durationLabel}`}>
              {durationLabel}
            </span>
          ) : null}
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
          <div className="video-thumb-scrim" aria-hidden="true" />
          <div className="video-thumb-overlay">
            <h3 className="video-title-overlay">{video.title}</h3>
          </div>
        </div>
        <div className="video-card-body">
          <div className="video-byline">
            <span className="video-avatar" aria-hidden="true">{avatarLabel}</span>
            <div className="video-byline-text">
              <p className="video-channel">{video.channelName || 'Netlife'}</p>
              <p className="video-meta">
                {viewsLabel}
                <span className="video-meta-sep" aria-hidden="true">•</span>
                {timeAgoLabel}
              </p>
            </div>
          </div>
          {variant === 'row' && video.description ? (
            <p className="video-description">{video.description}</p>
          ) : null}
        </div>
      </button>
      {footerAction ? (
        <div className="video-card-footer">
          {footerAction}
        </div>
      ) : null}
    </article>
  );
}

export default memo(VideoCard);
