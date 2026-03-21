import React, { memo } from 'react';

const navItems = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'subscriptions', label: 'Subscriptions', path: '/' },
  { id: 'library', label: 'Library', path: '/' }
];

function Sidebar({ pathname, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">Browse</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = item.id === 'home'
            ? pathname === '/' || pathname.startsWith('/watch/')
            : false;

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={() => onNavigate(item.path)}
            >
              <span className="sidebar-link-text">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default memo(Sidebar);
