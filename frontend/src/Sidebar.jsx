import React, { memo } from 'react';

const navItems = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'profile', label: 'Your uploads', path: '/profile' },
  { id: 'subscriptions', label: 'Subscriptions', path: '/' },
  { id: 'library', label: 'Library', path: '/' }
];

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3.2 3.2 10.6a1.1 1.1 0 0 0 .7 2H5v7.1c0 .6.5 1.1 1.1 1.1h4.6v-5.7c0-.6.5-1.1 1.1-1.1h.4c.6 0 1.1.5 1.1 1.1v5.7h4.6c.6 0 1.1-.5 1.1-1.1v-7.1h1.1a1.1 1.1 0 0 0 .7-2L12 3.2Z"
        fill="currentColor"
      />
    </svg>
  ),
  subscriptions: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4.5 7.2c0-.6.5-1.1 1.1-1.1h12.8c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1H5.6c-.6 0-1.1-.5-1.1-1.1Zm0 4.8c0-.6.5-1.1 1.1-1.1h12.8c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1H5.6c-.6 0-1.1-.5-1.1-1.1Zm0 4.8c0-.6.5-1.1 1.1-1.1h7.2c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1H5.6c-.6 0-1.1-.5-1.1-1.1Z"
        fill="currentColor"
      />
      <path
        d="M16.2 15.4a1 1 0 0 1 1.5-.9l3.2 1.9c.5.3.5 1 0 1.3l-3.2 1.9a1 1 0 0 1-1.5-.9v-3.3Z"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm0 2.1c-4 0-7.4 2.2-8.5 5.6-.2.6.3 1.3 1 1.3h15c.7 0 1.2-.7 1-1.3-1.1-3.4-4.5-5.6-8.5-5.6Z"
        fill="currentColor"
      />
    </svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M6.2 5.2c0-.6.5-1.1 1.1-1.1h9.4c.6 0 1.1.5 1.1 1.1v15.6c0 .6-.5 1.1-1.1 1.1H7.3c-.6 0-1.1-.5-1.1-1.1V5.2Zm2.2 2.2v2.1h7.2V7.4H8.4Zm0 4.8v2.1h7.2v-2.1H8.4Z"
        fill="currentColor"
      />
    </svg>
  )
};

function Sidebar({ pathname, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">Browse</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = item.id === 'home'
            ? pathname === '/' || pathname.startsWith('/watch/')
            : item.id === 'profile'
              ? pathname === '/profile'
              : false;

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={() => onNavigate(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="sidebar-link-icon" aria-hidden="true">
                {ICONS[item.id] || null}
              </span>
              <span className="sidebar-link-text">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default memo(Sidebar);
