import React, { useEffect, useState } from 'react';
import { apiRequest } from './api/client';
import { API_ROUTES } from './apiRoutes';
import { clearSession, hasSession, getSession } from './auth/session';
import RegisterForm from './RegisterForm.jsx';
import LoginForm from './LoginForm.jsx';
import HomePage from './HomePage.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(hasSession());
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
      setIsLoggedIn(hasSession());
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
        ? <RegisterForm />
        : pathname === '/login'
          ? <LoginForm onLoginSuccess={handleLoginSuccess} />
          : null}
    />
  );
}

export default App;

