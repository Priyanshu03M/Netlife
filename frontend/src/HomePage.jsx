import React, { useEffect, useMemo, useState } from 'react';
import { API_ROUTES } from './apiRoutes';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import VideoCard from './VideoCard.jsx';

function formatViews(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0 views';
  }

  return `${new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)} views`;
}

function formatTimeAgo(dateString) {
  if (!dateString) {
    return 'Recently';
  }

  const createdAt = new Date(dateString);
  if (Number.isNaN(createdAt.getTime())) {
    return 'Recently';
  }

  const seconds = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 1000));
  const units = [
    { label: 'year', value: 60 * 60 * 24 * 365 },
    { label: 'month', value: 60 * 60 * 24 * 30 },
    { label: 'week', value: 60 * 60 * 24 * 7 },
    { label: 'day', value: 60 * 60 * 24 },
    { label: 'hour', value: 60 * 60 },
    { label: 'minute', value: 60 }
  ];

  const matchedUnit = units.find((unit) => seconds >= unit.value);
  if (!matchedUnit) {
    return 'Just now';
  }

  const amount = Math.floor(seconds / matchedUnit.value);
  return `${amount} ${matchedUnit.label}${amount === 1 ? '' : 's'} ago`;
}

function getInitials() {
  const username = window.localStorage.getItem('username');
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }

  return 'NL';
}

function HomePage({ pathname, onNavigate, onLogout }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const loadVideos = async () => {
      setLoading(true);
      setError('');

      try {
        const accessToken = window.localStorage.getItem('accessToken');
        const response = await fetch(API_ROUTES.videos, {
          headers: {
            ...(accessToken
              ? {
                  Authorization: `Bearer ${accessToken}`
                }
              : {})
          }
        });

        if (!response.ok) {
          let message = 'Unable to load videos.';

          try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const body = await response.json();
              message = body?.message || message;
            } else {
              message = (await response.text()) || message;
            }
          } catch {
            // Ignore parsing issues and use the default message.
          }

          throw new Error(message);
        }

        const data = await response.json();
        if (!isCancelled) {
          setVideos(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Unable to load videos.');
          setVideos([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadVideos();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredVideos = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return videos;
    }

    return videos.filter((video) => {
      const haystack = [video.title, video.description, video.channelName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchTerm, videos]);

  const selectedVideoId = pathname.startsWith('/watch/')
    ? pathname.replace('/watch/', '')
    : '';
  const selectedVideo = selectedVideoId
    ? videos.find((video) => video.id === selectedVideoId)
    : null;

  return (
    <div className="shell">
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onHomeClick={() => onNavigate('/')}
        onLogout={onLogout}
        avatarLabel={getInitials()}
      />
      <div className="shell-body">
        <Sidebar pathname={pathname} onNavigate={onNavigate} />
        <main className="content-area">
          {pathname.startsWith('/watch/') ? (
            <section className="watch-placeholder">
              <button
                type="button"
                className="back-button"
                onClick={() => onNavigate('/')}
              >
                Back to home
              </button>
              <div className="watch-card">
                <div className="watch-player-placeholder">
                  Watch page placeholder
                </div>
                <h1 className="watch-title">
                  {selectedVideo?.title || 'Video details will appear here'}
                </h1>
                <p className="watch-meta">
                  {selectedVideo
                    ? `${selectedVideo.channelName} - ${formatViews(selectedVideo.views)} - ${formatTimeAgo(selectedVideo.createdAt)}`
                    : 'Open a video from the homepage grid to test navigation.'}
                </p>
                {selectedVideo?.description ? (
                  <p className="watch-description">{selectedVideo.description}</p>
                ) : null}
              </div>
            </section>
          ) : (
            <>
              <header className="content-header">
                <div>
                  <h1 className="content-title">Recommended</h1>
                  <p className="content-subtitle">
                    Browse the latest uploads from your Netlife feed.
                  </p>
                </div>
              </header>

              {loading ? (
                <section className="video-grid" aria-label="Loading videos">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div className="video-card skeleton-card" key={index}>
                      <div className="skeleton skeleton-thumb" />
                      <div className="video-card-body">
                        <div className="skeleton skeleton-line skeleton-line-title" />
                        <div className="skeleton skeleton-line" />
                        <div className="skeleton skeleton-line skeleton-line-short" />
                      </div>
                    </div>
                  ))}
                </section>
              ) : error ? (
                <section className="status-panel">
                  <h2 className="status-title">Unable to load videos</h2>
                  <p className="status-text">{error}</p>
                </section>
              ) : filteredVideos.length === 0 ? (
                <section className="status-panel">
                  <h2 className="status-title">No videos found</h2>
                  <p className="status-text">
                    {videos.length === 0
                      ? 'The backend returned an empty list.'
                      : 'Try a different search term.'}
                  </p>
                </section>
              ) : (
                <section className="video-grid">
                  {filteredVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      viewLabel={formatViews(video.views)}
                      timeAgoLabel={formatTimeAgo(video.createdAt)}
                      onOpen={() => onNavigate(`/watch/${video.id}`)}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default HomePage;
