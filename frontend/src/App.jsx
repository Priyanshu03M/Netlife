import React, { useEffect, useState } from 'react';
import { apiRequest } from './api/client';
import { API_ROUTES } from './apiRoutes';
import { clearSession, hasSession, getSession } from './auth/session';
import RegisterForm from './RegisterForm.jsx';
import LoginForm from './LoginForm.jsx';
import HomePage from './HomePage.jsx';

function App() {
  const [mode, setMode] = useState('register');
  const [isLoggedIn, setIsLoggedIn] = useState(hasSession());
  const [pathname, setPathname] = useState(window.location.pathname);
  const isRegister = mode === 'register';

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (nextPath) => {
    if (window.location.pathname === nextPath) {
      setPathname(nextPath);
      return;
    }

    window.history.pushState({}, '', nextPath);
    setPathname(nextPath);
  };

  const handleLogout = async () => {
    const { refreshToken } = getSession();
    if (!refreshToken) {
      clearSession();
      setIsLoggedIn(false);
      navigate('/');
      return;
    }

    try {
      const response = await apiRequest(API_ROUTES.logout, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });
      clearSession();
      setIsLoggedIn(false);
      navigate('/');

      alert(response?.message || 'User logged out');
    } catch (err) {
      clearSession();
      setIsLoggedIn(false);
      navigate('/');
      alert('Unable to logout. Check backend.');
    }
  };

  const handleAuthButtonClick = (nextMode) => {
    setMode(nextMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate('/');
  };

  if (isLoggedIn) {
    return (
      <HomePage
        pathname={pathname}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="app-root">
      <div className="gradient-bg" />
      <header className="top-nav">
        <div className="nav-brand">
          <span className="nav-brand-mark" />
          <div>
            <div className="nav-title">Netlife</div>
            <div className="nav-caption">Creator workspace</div>
          </div>
        </div>
        <div className="nav-actions">
          <button
            type="button"
            className="nav-button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Home
          </button>
          {!isLoggedIn ? (
            <>
              <button
                type="button"
                className="nav-button"
                onClick={() => handleAuthButtonClick('register')}
              >
                Register
              </button>
              <button
                type="button"
                className="nav-button"
                onClick={() => handleAuthButtonClick('login')}
              >
                Login
              </button>
            </>
          ) : (
            <button
              type="button"
              className="nav-button nav-button-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </header>
      <main className="page-container">
        <section className="auth-layout">
          <aside className="auth-hero">
            <span className="section-badge">Video platform</span>
            <h1 className="auth-hero-title">
              Publish, manage, and explore your Netlife content in one place.
            </h1>
            <p className="auth-hero-text">
              A lightweight creator surface with clean uploads, searchable feeds, and a focused
              playback workflow.
            </p>
            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <strong>Fast auth flow</strong>
                <span>Simple registration and login without unnecessary friction.</span>
              </div>
              <div className="auth-feature-item">
                <strong>Curated feed</strong>
                <span>Recent uploaded videos, backend search, and cursor-based paging.</span>
              </div>
              <div className="auth-feature-item">
                <strong>Upload ready</strong>
                <span>Presigned media delivery and direct file submission support.</span>
              </div>
            </div>
          </aside>

          <section className="card auth-panel">
            <header className="card-header">
              <span className="section-badge">{isRegister ? 'Register' : 'Sign in'}</span>
              <h2 className="card-title">
                {isRegister ? 'Create your workspace access' : 'Welcome back'}
              </h2>
              <p className="card-subtitle">
                {isRegister
                  ? 'Set up a new Netlife account with the correct role and credentials.'
                  : 'Enter your credentials to access the dashboard and manage videos.'}
              </p>
              <div className="auth-toggle">
                <button
                  type="button"
                  className={`auth-toggle-button ${isRegister ? 'auth-toggle-button-active' : ''}`}
                  onClick={() => setMode('register')}
                >
                  Register
                </button>
                <button
                  type="button"
                  className={`auth-toggle-button ${!isRegister ? 'auth-toggle-button-active' : ''}`}
                  onClick={() => setMode('login')}
                >
                  Login
                </button>
              </div>
            </header>

            {isRegister ? (
              <RegisterForm />
            ) : (
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;

