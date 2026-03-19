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

function LoginForm({ onLoginSuccess }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(initialErrors);
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

  const validate = () => {
    const newErrors = { ...initialErrors };
    let isValid = true;

    const username = values.username.trim();
    if (!username) {
      newErrors.username = 'Username is required.';
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

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const body = await apiRequest(API_ROUTES.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: values.username.trim(),
          password: values.password
        })
      });
      const { accessToken, refreshToken, userId, id } = body || {};

      saveSession({
        accessToken,
        refreshToken,
        username: values.username.trim(),
        userId: userId || id || ''
      });

      setServerMessage('Login successful.');
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess({ accessToken, refreshToken, userId: userId || id || '' });
      }
      setValues(initialValues);
    } catch (err) {
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
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="username" className="field-label">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          className={`field-input ${errors.username ? 'field-input-error' : ''}`}
          value={values.username}
          onChange={handleChange}
          autoComplete="username"
          disabled={submitting}
        />
        {errors.username && <p className="field-error">{errors.username}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={`field-input ${errors.password ? 'field-input-error' : ''}`}
          value={values.password}
          onChange={handleChange}
          autoComplete="current-password"
          disabled={submitting}
        />
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      <button
        type="submit"
        className="primary-button"
        disabled={submitting}
      >
        {submitting ? 'Logging in...' : 'Login'}
      </button>

      {serverMessage && (
        <p className="server-message">
          {serverMessage}
        </p>
      )}
    </form>
  );
}

export default LoginForm;

