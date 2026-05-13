import React, { useState } from 'react';
import { API_ROUTES } from './apiRoutes';

const initialValues = {
  username: '',
  email: '',
  password: ''
};

const initialErrors = {
  username: '',
  email: '',
  password: ''
};

function RegisterForm({ onLoginClick }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(initialErrors);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [serverTone, setServerTone] = useState('neutral');

  const validate = () => {
    const newErrors = { ...initialErrors };
    let isValid = true;

    // Username: required, 3–50 chars
    const username = values.username.trim();
    if (!username) {
      newErrors.username = 'Username is required.';
      isValid = false;
    } else if (username.length < 3 || username.length > 50) {
      newErrors.username = 'Username must be between 3 and 50 characters.';
      isValid = false;
    }

    // Email: required, valid format, max 100 chars
    const email = values.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (email.length > 100) {
      newErrors.email = 'Email must be at most 100 characters.';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    // Password: required, 8–100 chars
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
      const response = await fetch(API_ROUTES.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password
        })
      });

      let bodyText = '';

      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          bodyText = data?.message || '';
        } else {
          bodyText = await response.text();
        }
      } catch {
        // ignore parse errors and fall back to default messages
      }

      if (!response.ok) {
        setServerTone('error');
        setServerMessage(bodyText || 'Registration failed.');
      } else {
        setServerTone('success');
        setServerMessage(bodyText || 'Registration successful.');
        setValues(initialValues);
      }
    } catch (err) {
      setServerTone('error');
      setServerMessage('Unable to connect to server. Check backend.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="username" className="field-label sr-only">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          className={`auth-input ${errors.username ? 'field-input-error' : ''}`}
          value={values.username}
          onChange={handleChange}
          autoComplete="username"
          placeholder="Username"
          disabled={submitting}
        />
        {errors.username && <p className="field-error">{errors.username}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="email" className="field-label sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={`auth-input ${errors.email ? 'field-input-error' : ''}`}
          value={values.email}
          onChange={handleChange}
          autoComplete="email"
          placeholder="Email"
          disabled={submitting}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
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
            autoComplete="new-password"
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
        {submitting ? 'Registering...' : 'Register'}
      </button>

      {serverMessage && (
        <p className={`server-message server-message-${serverTone}`}>
          {serverMessage}
        </p>
      )}

      <p className="auth-switch">
        Already have an account?{' '}
        <button
          type="button"
          className="auth-link"
          onClick={() => {
            if (typeof onLoginClick === 'function') {
              onLoginClick();
            }
          }}
          disabled={submitting}
        >
          Log in
        </button>
      </p>
    </form>
  );
}

export default RegisterForm;
