import React from 'react';

function Navbar({
  searchTerm,
  onSearchChange,
  onHomeClick,
  onUploadClick,
  onLogout,
  avatarLabel
}) {
  return (
    <header className="shell-navbar">
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
        <span className="search-icon" aria-hidden="true">Search</span>
        <input
          type="search"
          className="search-input"
          placeholder="Search titles, descriptions, or channels"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search videos"
        />
      </div>

      <div className="navbar-actions">
        <button
          type="button"
          className="upload-button"
          onClick={onUploadClick}
        >
          Upload video
        </button>
        <div className="avatar-badge" aria-hidden="true">
          {avatarLabel}
        </div>
        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
