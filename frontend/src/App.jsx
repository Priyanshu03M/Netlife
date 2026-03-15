import React, { useState } from 'react';
import { API_ROUTES } from './apiRoutes';
import RegisterForm from './RegisterForm.jsx';
import LoginForm from './LoginForm.jsx';
import HomePage from './HomePage.jsx';

function App() {
  const [mode, setMode] = useState('register');
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(window.localStorage.getItem('accessToken'))
  );
  const isRegister = mode === 'register';

  const handleLogout = async () => {
    const refreshToken = window.localStorage.getItem('refreshToken');
    if (!refreshToken) {
      alert('No refresh token found. You may already be logged out.');
      return;
    }

    try {
      const response = await fetch(API_ROUTES.logout, {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`
            }
          : undefined,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const text = await response.text();

      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);

      if (!response.ok) {
        alert(text || 'Logout failed.');
      } else {
        alert(text || 'User Logged out');
      }
    } catch (err) {
      alert('Unable to logout. Check backend.');
    }
  };

  const handleAuthButtonClick = (nextMode) => {
    setMode(nextMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-root">
      <div className="gradient-bg" />
      <header className="top-nav">
        <div className="nav-title">Netlife</div>
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
        <section className="card">
          <header className="card-header">
            <h1 className="card-title">
              {isRegister ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="card-subtitle">
              {isRegister
                ? 'Fill in the details below to register a new user.'
                : 'Enter your credentials to sign in to your account.'}
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
            <LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />
          )}
        </section>

        <HomePage />
      </main>
    </div>
  );
}

export default App;

