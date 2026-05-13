import React, { memo } from 'react';

function Navbar({
  variant = 'default',
  isLoggedIn,
  searchTerm,
  onSearchChange,
  onHomeClick,
  onLoginClick,
  onRegisterClick,
  onUploadClick,
  onProfileClick,
  onLogout,
  avatarLabel,
  profileName
}) {
  if (variant === 'auth') {
    return (
      <header className="shell-navbar shell-navbar-auth">
        <button
          type="button"
          className="brand"
          onClick={onHomeClick}
          aria-label="Go to home"
        >
          <span className="brand-mark" />
          <span className="brand-copy">
            <span className="brand-text">Netlife</span>
            <span className="brand-subtitle">Media dashboard</span>
          </span>
        </button>
      </header>
    );
  }

  return (
    <header className={`shell-navbar ${isLoggedIn ? 'shell-navbar-signed-in' : 'shell-navbar-guest'}`}>
      <button
        type="button"
        className="brand"
        onClick={onHomeClick}
      >
        <span className="brand-mark" />
        <span className="brand-copy">
          <span className="brand-text">Netlife</span>
          <span className="brand-subtitle">Media dashboard</span>
        </span>
      </button>

      <div className="search-wrap">
        <span className="search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path
              d="M10.5 3.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 2.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Z"
              fill="currentColor"
            />
            <path
              d="M16.2 15.6a1.1 1.1 0 0 1 1.6 0l2.7 2.7a1.1 1.1 0 1 1-1.6 1.6l-2.7-2.7a1.1 1.1 0 0 1 0-1.6Z"
              fill="currentColor"
              opacity="0.9"
            />
          </svg>
        </span>
        <input
          type="search"
          className="search-input"
          placeholder="Search titles, descriptions, or channels"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search videos"
        />
      </div>

      <div className={`navbar-actions ${isLoggedIn ? 'navbar-actions-signed-in' : 'navbar-actions-guest'}`}>
        <button
          type="button"
          className={`profile-chip ${isLoggedIn ? 'profile-chip-signed-in' : 'profile-chip-guest'}`}
          onClick={isLoggedIn ? onProfileClick : undefined}
          aria-label={isLoggedIn ? 'Open profile' : profileName}
          disabled={!isLoggedIn}
        >
          <span className="avatar-badge" aria-hidden="true">
            {avatarLabel}
          </span>
          {isLoggedIn ? null : <span className="profile-chip-text">{profileName}</span>}
        </button>
        {isLoggedIn ? (
          <button
            type="button"
            className="upload-button"
            onClick={onUploadClick}
          >
            Upload video
          </button>
        ) : (
          <>
            <button
              type="button"
              className="nav-button"
              onClick={onLoginClick}
            >
              Login
            </button>
            <button
              type="button"
              className="nav-button"
              onClick={onRegisterClick}
            >
              Register
            </button>
          </>
        )}
        {isLoggedIn ? (
          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        ) : null}
      </div>
    </header>
  );
}

export default memo(Navbar);
