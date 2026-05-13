import React, { useState } from 'react';
import { apiRequest, ApiError } from './api/client';
import { API_ROUTES } from './apiRoutes';
import { saveSession } from './auth/session';

const initialValues = {
  username: '',
  password: ''
};

const initialErrors = {
  username: '',
  password: ''
};

function LoginForm({ onLoginSuccess, onRegisterClick }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(initialErrors);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [serverTone, setServerTone] = useState('neutral');

  const validate = () => {
    const newErrors = { ...initialErrors };
    let isValid = true;

    const username = values.username.trim();
    if (!username) {
      newErrors.username = 'Username or email is required.';
      isValid = false;
    }

    const password = values.password;
    if (!password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (password.length < 8 || password.length > 100) {
      newErrors.password = 'Password must be between 8 and 100 characters.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage('');
    setServerTone('neutral');

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const body = await apiRequest(API_ROUTES.login, {
        method: 'POST',
        includeAuth: false,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usernameOrEmail: values.username.trim(),
          password: values.password
        })
      });
      const { accessToken, refreshToken } = body || {};

      saveSession({
        accessToken,
        refreshToken,
        username: values.username.trim()
      });

      setServerMessage('Login successful.');
      setServerTone('success');
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess({ accessToken, refreshToken });
      }
      setValues(initialValues);
    } catch (err) {
      setServerTone('error');
      if (err instanceof ApiError) {
        setServerMessage(err.message || 'Login failed.');
      } else {
        setServerMessage('Unable to connect to server. Check backend.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="username" className="field-label sr-only">
          Username or Email
        </label>
        <input
          id="username"
          name="username"
          type="text"
          className={`auth-input ${errors.username ? 'field-input-error' : ''}`}
          value={values.username}
          onChange={handleChange}
          autoComplete="username"
          placeholder="Email or username"
          disabled={submitting}
        />
        {errors.username && <p className="field-error">{errors.username}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="password" className="field-label sr-only">
          Password
        </label>
        <div className="password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            className={`auth-input auth-input-with-action ${errors.password ? 'field-input-error' : ''}`}
            value={values.password}
            onChange={handleChange}
            autoComplete="current-password"
            placeholder="Password"
            disabled={submitting}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            disabled={submitting}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      <button
        type="submit"
        className="primary-button auth-primary"
        disabled={submitting}
      >
        {submitting ? 'Logging in...' : 'Log in'}
      </button>

      {serverMessage && (
        <p className={`server-message server-message-${serverTone}`}>
          {serverMessage}
        </p>
      )}

      <p className="auth-switch">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          className="auth-link"
          onClick={() => {
            if (typeof onRegisterClick === 'function') {
              onRegisterClick();
            }
          }}
          disabled={submitting}
        >
          Sign up
        </button>
      </p>
    </form>
  );
}

export default LoginForm;
