import React from 'react';

const navItems = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'subscriptions', label: 'Subscriptions', path: '/' },
  { id: 'library', label: 'Library', path: '/' }
];

function Sidebar({ pathname, onNavigate }) {
  return (
    <aside className="sidebar">
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
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
