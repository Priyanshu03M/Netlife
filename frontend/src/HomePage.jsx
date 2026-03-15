import React, { useState } from 'react';
import { API_ROUTES } from './apiRoutes';

function HomePage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPages = async () => {
    setLoading(true);
    try {
      const accessToken = window.localStorage.getItem('accessToken');

      const response = await fetch(API_ROUTES.pages, {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`
            }
          : undefined
      });

      const text = await response.text();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setMessage(text || 'You must be logged in to view pages.');
        } else {
          setMessage(text || 'Failed to load pages.');
        }
        return;
      }

      setMessage(text || 'No content returned.');
    } catch (err) {
      setMessage('Unable to load pages. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="home-section">
      <button
        type="button"
        className="secondary-button"
        onClick={loadPages}
        disabled={loading}
      >
        {loading ? 'Loading pages...' : 'Load pages'}
      </button>
      {message && <p className="home-message">{message}</p>}
    </section>
  );
}

export default HomePage;

