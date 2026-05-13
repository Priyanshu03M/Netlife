import React, { memo } from 'react';

function StatusPanel({ badge, title, description, children }) {
  return (
    <section className="status-panel" role="region" aria-label={title || 'Status'}>
      {badge ? <span className="section-badge">{badge}</span> : null}
      {title ? <h2 className="status-title">{title}</h2> : null}
      {description ? <p className="status-text">{description}</p> : null}
      {children ? <div className="status-actions">{children}</div> : null}
    </section>
  );
}

export default memo(StatusPanel);

