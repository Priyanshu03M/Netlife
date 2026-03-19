import React from 'react';

function Navbar({
  searchTerm,
  onSearchChange,
  onHomeClick,
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
        <span className="brand-text">Netlife</span>
      </button>

      <div className="search-wrap">
        <input
          type="search"
          className="search-input"
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search videos"
        />
      </div>

      <div className="navbar-actions">
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
