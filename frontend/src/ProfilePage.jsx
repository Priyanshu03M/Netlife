import React, { useMemo } from 'react';
import { useProfileVideos } from './hooks/useProfileVideos';
import VideoCard from './VideoCard.jsx';
import StatusPanel from './StatusPanel.jsx';

const skeletonItems = Array.from({ length: 4 }, (_, index) => index);

function getProfileErrorContent(error) {
  if (!error) {
    return {
      title: 'Unable to load uploads',
      description: 'An unknown error occurred while loading your uploaded videos.'
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
      title: 'Invalid upload data',
      description: error.message || 'The backend returned malformed upload data.'
    };
  }

  return {
    title: 'Unable to load uploads',
    description: error.message || 'Your uploaded videos could not be loaded.'
  };
}

function ProfilePage({ userId, username, onOpenVideo }) {
  const {
    videos,
    loading,
    error,
    reload,
    removeVideo,
    deletingVideoId,
    deleteError,
    clearDeleteError
  } = useProfileVideos(userId);

  const errorContent = useMemo(() => getProfileErrorContent(error), [error]);

  return (
    <section className="profile-page">
      <header className="content-header">
        <div className="content-heading">
          <h1 className="content-title">Your uploads</h1>
          <p className="content-subtitle">
            Videos uploaded by {username || 'this account'}.
          </p>
        </div>
        <div className="content-summary">
          <div className="content-summary-value">{videos.length}</div>
          <div className="content-summary-label">Videos</div>
        </div>
      </header>

      {deleteError ? (
        <div className="inline-banner inline-banner-error" role="alert">
          <strong>Delete failed.</strong> {deleteError}
          <button
            type="button"
            className="ghost-button inline-banner-action"
            onClick={clearDeleteError}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {loading ? (
        <section className="video-grid" aria-label="Loading uploads">
          {skeletonItems.map((index) => (
            <div className="video-card skeleton-card" key={index}>
              <div className="video-card-button">
                <div className="skeleton skeleton-thumb" />
                <div className="video-card-body">
                  <div className="skeleton skeleton-line skeleton-line-title" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line skeleton-line-short" />
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : error ? (
        <StatusPanel
          badge="Error"
          title={errorContent.title}
          description={errorContent.description}
        >
          <button
            type="button"
            className="primary-button primary-button-inline"
            onClick={() => reload()}
          >
            Retry
          </button>
        </StatusPanel>
      ) : videos.length === 0 ? (
        <StatusPanel
          badge="Profile"
          title="No uploaded videos"
          description="Upload a video and it will appear here."
        />
      ) : (
        <section className="video-grid" aria-label="Uploaded videos">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onOpen={onOpenVideo}
              footerAction={(
                <button
                  type="button"
                  className="delete-video-button"
                  onClick={() => removeVideo(video.id)}
                  disabled={deletingVideoId === video.id}
                >
                  {deletingVideoId === video.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
            />
          ))}
        </section>
      )}
    </section>
  );
}

export default ProfilePage;
