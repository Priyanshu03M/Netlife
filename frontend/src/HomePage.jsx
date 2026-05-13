import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { getAvatarLabel, getSession } from './auth/session';
import { useVideos } from './hooks/useVideos';
import { useVideoDetails } from './hooks/useVideoDetails';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import VideoCard from './VideoCard.jsx';
import UploadModal from './UploadModal.jsx';
import HlsPlayer from './HlsPlayer.jsx';
import StatusPanel from './StatusPanel.jsx';
import ProfilePage from './ProfilePage.jsx';
import { DEMO_VIDEO_IDS, getDemoVideoSrc } from './demo/demoVideos';

const skeletonItems = Array.from({ length: 6 }, (_, index) => index);

function getUniqueVideos(videos) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return [];
  }

  const seen = new Set();
  return videos.filter((video) => {
    const id = typeof video?.id === 'string' ? video.id : '';
    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

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
  const session = getSession();
  const {
    videos,
    continueWatchingVideos,
    recommendedVideos,
    trendingVideos,
    loading,
    error,
    reload,
    offlineMode
  } = useVideos({
    query: deferredSearchTerm,
    username: session.username,
  });
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
  const handleProfileClick = useCallback(() => {
    if (!isLoggedIn) {
      return;
    }
    onNavigate('/profile');
  }, [isLoggedIn, onNavigate]);

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
  const authTitle = pathname === '/register' ? 'Create account' : 'Welcome';
  const authSubtitle = pathname === '/register'
    ? 'Create an account to start uploading and managing videos.'
    : 'Log in to your account to continue.';
  const profileName = session.username || 'Guest';
  const isSearching = Boolean(deferredSearchTerm);
  const uniqueVideos = useMemo(() => getUniqueVideos(videos), [videos]);
  const searchCards = useMemo(() => (
    uniqueVideos.map((video) => (
      <VideoCard
        key={video.id}
        video={video}
        onOpen={handleOpenVideo}
      />
    ))
  ), [handleOpenVideo, uniqueVideos]);
  const continueWatchingCards = useMemo(() => (
    (isSearching ? [] : continueWatchingVideos).map((video, index) => (
      <VideoCard
        key={`${video.id}-continue-${index}`}
        video={video}
        onOpen={handleOpenVideo}
      />
    ))
  ), [continueWatchingVideos, handleOpenVideo, isSearching]);
  const recommendedCards = useMemo(() => (
    (isSearching ? [] : recommendedVideos).map((video, index) => (
      <VideoCard
        key={`${video.id}-recommended-${index}`}
        video={video}
        onOpen={handleOpenVideo}
      />
    ))
  ), [handleOpenVideo, isSearching, recommendedVideos]);
  const trendingCards = useMemo(() => (
    (isSearching ? [] : trendingVideos).map((video, index) => (
      <VideoCard
        key={`${video.id}-trending-${index}`}
        video={video}
        onOpen={handleOpenVideo}
      />
    ))
  ), [handleOpenVideo, isSearching, trendingVideos]);
  const selectedDemoSrc = useMemo(() => getDemoVideoSrc(selectedVideoId), [selectedVideoId]);
  const offlineDemoSrc = useMemo(() => getDemoVideoSrc(DEMO_VIDEO_IDS.ME), []);
  const isSelectedNetworkError = Boolean(selectedError?.code === 'NETWORK_ERROR');

  return (
    <div className="shell">
      <Navbar
        variant={isAuthRoute && !isLoggedIn ? 'auth' : 'default'}
        isLoggedIn={isLoggedIn}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onHomeClick={handleHomeClick}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onUploadClick={handleUploadClick}
        onProfileClick={handleProfileClick}
        onLogout={onLogout}
        avatarLabel={getAvatarLabel(profileName === 'Guest' ? 'guest' : session.username)}
        profileName={profileName}
      />
      <div className={isAuthRoute && !isLoggedIn ? 'shell-body shell-body-no-sidebar' : 'shell-body'}>
        {isAuthRoute && !isLoggedIn ? null : (
          <Sidebar pathname={pathname} onNavigate={onNavigate} />
        )}
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
	                ) : playlistUrl ? (
	                  <HlsPlayer src={playlistUrl} />
	                ) : selectedDemoSrc ? (
	                  <div className="watch-player-shell">
	                    <video
	                      className="watch-player"
	                      controls
	                      preload="metadata"
	                      src={selectedDemoSrc}
	                    />
	                  </div>
	                ) : isSelectedNetworkError && offlineDemoSrc ? (
	                  <div className="watch-player-shell">
	                    <video
	                      className="watch-player"
	                      controls
	                      preload="metadata"
	                      src={offlineDemoSrc}
	                    />
	                  </div>
	                ) : selectedError ? (
	                  <div className="watch-player-placeholder">
	                    Failed to load playback: {selectedError.message || 'Unknown error'}
	                  </div>
	                ) : (
	                  <div className="watch-player-placeholder">No playback source available.</div>
	                )}
	                <h1 className="watch-title">
	                  {selectedVideo?.title || 'Video details will appear here'}
	                </h1>
	                {isSelectedNetworkError ? (
	                  <p className="helper-text watch-helper-error">
	                    Backend unreachable. Showing offline playback when available.
	                  </p>
	                ) : null}
	                {selectedVideo?.channelName ? (
	                  <p className="video-channel">{selectedVideo.channelName}</p>
	                ) : null}
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
            <section className="auth-centered" aria-label="Authentication">
              <div className="auth-split-card">
                <aside className="auth-split-hero" aria-hidden="true">
                  <div className="auth-hero-brand">
                    <span className="brand-mark auth-hero-mark" />
                    <div className="auth-hero-brand-copy">
                      <div className="auth-hero-brand-name">NETLIFE</div>
                      <div className="auth-hero-brand-tagline">Media dashboard</div>
                    </div>
                  </div>
                  <p className="auth-hero-fineprint">
                    Stream, upload, and manage video content in one focused workspace.
                  </p>
                </aside>

                <section className="auth-split-panel">
                  <header className="auth-panel-header">
                    <h1 className="auth-panel-title">{authTitle}</h1>
                    <p className="auth-panel-subtitle">{authSubtitle}</p>
                  </header>
                  {authPanel}
                </section>
              </div>
            </section>
          ) : pathname === '/profile' && isLoggedIn ? (
            <ProfilePage
              userId={session.userId}
              username={session.username}
              onOpenVideo={handleOpenVideo}
            />
          ) : (
            <>
	              {offlineMode ? (
	                <div className="inline-banner" role="status" aria-live="polite">
	                  <strong>Offline mode.</strong> Backend is unreachable, showing the local demo video.
	                  <button
	                    type="button"
	                    className="ghost-button inline-banner-action"
	                    onClick={() => reload()}
	                  >
	                    Retry backend
	                  </button>
	                </div>
	              ) : null}

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
                <StatusPanel
                  badge="Error"
                  title={videoErrorContent.title}
                  description={videoErrorContent.description}
                >
                  <button
                    type="button"
                    className="primary-button primary-button-inline"
                    onClick={() => {
                      reload();
                    }}
                  >
                    Retry
                  </button>
                </StatusPanel>
              ) : uniqueVideos.length === 0 ? (
                <StatusPanel
                  badge="Empty"
                  title="No videos found"
                  description={deferredSearchTerm
                    ? `No videos matched "${deferredSearchTerm}".`
                    : 'The backend returned an empty list.'}
                />
              ) : (
                <>
                  {!isSearching && continueWatchingVideos.length > 0 ? (
                    <section className="content-section" aria-label="Continue watching">
                      <div className="section-header">
                        <div className="section-header-copy">
                          <h2 className="section-title">Continue Watching</h2>
                        </div>
                      </div>
                      <div className="video-grid video-grid-featured" role="list">
                        {continueWatchingCards}
                      </div>
                    </section>
                  ) : null}

                  {!isSearching && recommendedVideos.length > 0 ? (
                    <section className="content-section" aria-label="Recommended videos">
                      <div className="section-header">
                        <div className="section-header-copy">
                          <h2 className="section-title">Recommended</h2>
                        </div>
                      </div>
                      <div className="video-grid video-grid-featured" role="list">
                        {recommendedCards}
                      </div>
                    </section>
                  ) : null}

                  {isSearching ? (
                    <section className="content-section" aria-label="Search results">
                      <div className="video-grid video-grid-search">
                        {searchCards}
                      </div>
                    </section>
                  ) : (
                    <section className="content-section" aria-label="Trending videos">
                      <div className="section-header">
                        <div className="section-header-copy">
                          <h2 className="section-title">Trending</h2>
                        </div>
                      </div>
                      <div className="video-grid video-grid-featured" role="list">
                        {trendingCards}
                      </div>
                    </section>
                  )}
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
