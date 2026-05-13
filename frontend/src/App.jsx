import React, { useEffect, useState } from 'react';
import { apiRequest } from './api/client';
import { API_ROUTES } from './apiRoutes';
import { clearSession, hasSession, getSession } from './auth/session';
import { AUTH_SESSION_INVALID_EVENT, ensureAuthenticatedSession } from './auth/sessionManager';
import RegisterForm from './RegisterForm.jsx';
import LoginForm from './LoginForm.jsx';
import HomePage from './HomePage.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(hasSession());
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    let active = true;

    const redirectToLogin = () => {
      if (window.location.pathname !== '/login') {
        window.history.pushState({}, '', '/login');
      }

      if (active) {
        setPathname('/login');
        setIsLoggedIn(false);
      }
    };

    const validateSession = async () => {
      if (!hasSession()) {
        if (active) {
          setIsLoggedIn(false);
        }
        return;
      }

      const authenticated = await ensureAuthenticatedSession();
      if (!active) {
        return;
      }

      setIsLoggedIn(authenticated);

      if (!authenticated) {
        redirectToLogin();
      }
    };

    const handlePopState = () => {
      setPathname(window.location.pathname);
      void validateSession();
    };

    const handleSessionInvalid = () => {
      clearSession();
      redirectToLogin();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, handleSessionInvalid);
    void validateSession();

    return () => {
      active = false;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, handleSessionInvalid);
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
        includeAuth: false,
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

  const handleAuthButtonClick = (nextPath) => {
    navigate(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate('/');
  };

  return (
    <HomePage
      pathname={pathname}
      isLoggedIn={isLoggedIn}
      onNavigate={navigate}
      onLogout={handleLogout}
      onLoginClick={() => handleAuthButtonClick('/login')}
      onRegisterClick={() => handleAuthButtonClick('/register')}
      authPanel={pathname === '/register'
        ? <RegisterForm onLoginClick={() => handleAuthButtonClick('/login')} />
        : pathname === '/login'
          ? <LoginForm onLoginSuccess={handleLoginSuccess} onRegisterClick={() => handleAuthButtonClick('/register')} />
          : null}
    />
  );
}

export default App;
