import React, { useMemo, useState } from 'react';
import { getAvatarLabel, getSession } from './auth/session';
import { useVideos } from './hooks/useVideos';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import VideoCard from './VideoCard.jsx';
import UploadModal from './UploadModal.jsx';

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

function getVideoErrorContent(error) {
  if (!error) {
    return {
      title: 'Unable to load videos',
      description: 'An unknown error occurred while loading the feed.'
    };
  }

  if (error.code === 'UNAUTHORIZED') {
    return {
      title: 'Session expired',
      description: error.message || 'Please log in again to continue.'
    };
  }

  if (error.code === 'NETWORK_ERROR') {
    return {
      title: 'Network error',
      description: error.message || 'Check your connection and backend availability.'
    };
  }

  if (error.code === 'MALFORMED_DATA') {
    return {
      title: 'Invalid video data',
      description: error.message || 'The backend returned malformed video data.'
    };
  }

  return {
    title: 'Unable to load videos',
    description: error.message || 'The video feed could not be loaded.'
  };
}

function HomePage({ pathname, onNavigate, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { videos, loading, error, reload } = useVideos();
  const session = getSession();
  const videoErrorContent = getVideoErrorContent(error);

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
        onUploadClick={() => setIsUploadOpen(true)}
        onLogout={onLogout}
        avatarLabel={getAvatarLabel(session.username)}
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
                  <h2 className="status-title">{videoErrorContent.title}</h2>
                  <p className="status-text">{videoErrorContent.description}</p>
                  {error.code !== 'UNAUTHORIZED' ? (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        reload();
                      }}
                    >
                      Retry
                    </button>
                  ) : null}
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
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={async () => {
          setIsUploadOpen(false);
          await reload();
        }}
      />
    </div>
  );
}

export default HomePage;
