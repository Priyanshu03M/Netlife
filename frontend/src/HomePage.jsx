import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { getAvatarLabel, getSession } from './auth/session';
import { useVideos } from './hooks/useVideos';
import { useVideoDetails } from './hooks/useVideoDetails';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import VideoCard from './VideoCard.jsx';
import UploadModal from './UploadModal.jsx';
import HlsPlayer from './HlsPlayer.jsx';

const skeletonItems = Array.from({ length: 6 }, (_, index) => index);

function getVideoErrorContent(error) {
  if (!error) {
    return {
      title: 'Unable to load videos',
      description: 'An unknown error occurred while loading the feed.'
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

function HomePage({
  pathname,
  isLoggedIn,
  onNavigate,
  onLogout,
  onLoginClick,
  onRegisterClick,
  authPanel
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());
  const {
    videos,
    loading,
    error,
    reload
  } = useVideos({
    query: deferredSearchTerm,
  });
  const session = getSession();
  const videoErrorContent = getVideoErrorContent(error);
  const handleHomeClick = useCallback(() => {
    onNavigate('/');
  }, [onNavigate]);
  const handleUploadClick = useCallback(() => {
    setIsUploadOpen(true);
  }, []);
  const handleCloseUpload = useCallback(() => {
    setIsUploadOpen(false);
  }, []);
  const handleOpenVideo = useCallback((videoId) => {
    onNavigate(`/watch/${videoId}`);
  }, [onNavigate]);

  const selectedVideoId = useMemo(() => (
    pathname.startsWith('/watch/') ? pathname.replace('/watch/', '') : ''
  ), [pathname]);
  const {
    metadata: selectedVideo,
    playlistUrl,
    loading: selectedLoading,
    error: selectedError
  } = useVideoDetails(selectedVideoId);
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const authTitle = pathname === '/register' ? 'Create your workspace access' : 'Welcome back';
  const authSubtitle = pathname === '/register'
    ? 'Set up a new Netlife account with the correct role and credentials.'
    : 'Enter your credentials to access the dashboard and manage videos.';
  const profileName = session.username || 'Guest';
  const videoCards = useMemo(() => (
    videos.map((video) => (
      <VideoCard
        key={video.id}
        video={video}
        onOpen={handleOpenVideo}
      />
    ))
  ), [handleOpenVideo, videos]);

  return (
    <div className="shell">
      <Navbar
        isLoggedIn={isLoggedIn}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onHomeClick={handleHomeClick}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onUploadClick={handleUploadClick}
        onLogout={onLogout}
        avatarLabel={getAvatarLabel(profileName === 'Guest' ? 'guest' : session.username)}
        profileName={profileName}
      />
      <div className="shell-body">
        <Sidebar pathname={pathname} onNavigate={onNavigate} />
        <main className="content-area">
          {pathname.startsWith('/watch/') ? (
            <section className="watch-placeholder">
              <button
                type="button"
                className="back-button"
                onClick={handleHomeClick}
              >
                Back to home
              </button>
              <div className="watch-card">
                {selectedLoading ? (
                  <div className="watch-player-placeholder">Loading video...</div>
                ) : selectedError ? (
                  <div className="watch-player-placeholder">
                    Failed to load playback: {selectedError.message || 'Unknown error'}
                  </div>
                ) : playlistUrl ? (
                  <HlsPlayer src={playlistUrl} />
                ) : (
                  <div className="watch-player-placeholder">No playback source available.</div>
                )}
                <h1 className="watch-title">
                  {selectedVideo?.title || 'Video details will appear here'}
                </h1>
                <p className="watch-meta">
                  {selectedVideo
                    ? `${selectedVideo.views} view${selectedVideo.views === 1 ? '' : 's'}`
                    : 'Open a video from the homepage grid to preview playback.'}
                </p>
                {selectedVideo?.description ? (
                  <p className="watch-description">{selectedVideo.description}</p>
                ) : null}
              </div>
            </section>
          ) : isAuthRoute && !isLoggedIn ? (
            <section className="auth-inline-layout">
              <aside className="auth-hero">
                <span className="section-badge">Video platform</span>
                <h1 className="auth-hero-title">
                  Publish, manage, and explore your Netlife content in one place.
                </h1>
                <p className="auth-hero-text">
                  A lightweight creator surface with clean uploads, searchable feeds, and a focused
                  playback workflow.
                </p>
                <div className="auth-feature-list">
                  <div className="auth-feature-item">
                    <strong>Guest browsing</strong>
                    <span>Open the homepage first and explore videos before logging in.</span>
                  </div>
                  <div className="auth-feature-item">
                    <strong>Fast auth flow</strong>
                    <span>Use the navbar to switch between registration and login instantly.</span>
                  </div>
                  <div className="auth-feature-item">
                    <strong>Upload ready</strong>
                    <span>Upload actions appear as soon as a valid user session is available.</span>
                  </div>
                </div>
              </aside>

              <section className="card auth-panel">
                <header className="card-header">
                  <span className="section-badge">
                    {pathname === '/register' ? 'Register' : 'Sign in'}
                  </span>
                  <h2 className="card-title">{authTitle}</h2>
                  <p className="card-subtitle">{authSubtitle}</p>
                  <div className="auth-toggle">
                    <button
                      type="button"
                      className={`auth-toggle-button ${pathname === '/register' ? 'auth-toggle-button-active' : ''}`}
                      onClick={onRegisterClick}
                    >
                      Register
                    </button>
                    <button
                      type="button"
                      className={`auth-toggle-button ${pathname === '/login' ? 'auth-toggle-button-active' : ''}`}
                      onClick={onLoginClick}
                    >
                      Login
                    </button>
                  </div>
                </header>

                {authPanel}
              </section>
            </section>
          ) : (
            <>
              <header className="content-header">
                <div className="content-heading">
                  <span className="section-badge">Feed</span>
                  <h1 className="content-title">Recommended</h1>
                  <p className="content-subtitle">
                    Browse the latest uploaded videos from your Netlife workspace.
                  </p>
                </div>
                <div className="content-summary">
                  <div className="content-summary-value">{videos.length}</div>
                  <div className="content-summary-label">
                    {deferredSearchTerm ? 'results in this query' : 'videos loaded'}
                  </div>
                </div>
              </header>

              {loading ? (
                <section className="video-grid" aria-label="Loading videos">
                  {skeletonItems.map((index) => (
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
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      reload();
                    }}
                  >
                    Retry
                  </button>
                </section>
              ) : videos.length === 0 ? (
                <section className="status-panel">
                  <h2 className="status-title">No videos found</h2>
                  <p className="status-text">
                    {deferredSearchTerm
                      ? `No videos matched "${deferredSearchTerm}".`
                      : 'The backend returned an empty list.'}
                  </p>
                </section>
              ) : (
                <>
                  <section className="video-grid">{videoCards}</section>
                </>
              )}
            </>
          )}
        </main>
      </div>
      <UploadModal
        isOpen={isLoggedIn && isUploadOpen}
        onClose={handleCloseUpload}
        onUploadSuccess={async () => {
          setIsUploadOpen(false);
          await reload();
        }}
      />
    </div>
  );
}

export default HomePage;
