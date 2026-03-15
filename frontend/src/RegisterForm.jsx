import React, { useState } from 'react';
import { API_ROUTES } from './apiRoutes';

const initialValues = {
  username: '',
  email: '',
  password: '',
  role: 'ROLE_USER'
};

const initialErrors = {
  username: '',
  email: '',
  password: '',
  role: ''
};

function RegisterForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(initialErrors);
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

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
          password: values.password,
          role: values.role || 'ROLE_USER'
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
        setServerMessage(bodyText || 'Registration failed.');
      } else {
        setServerMessage(bodyText || 'Registration successful.');
        setValues(initialValues);
      }
    } catch (err) {
      setServerMessage('Unable to connect to server. Check backend.');
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
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={`field-input ${errors.email ? 'field-input-error' : ''}`}
          value={values.email}
          onChange={handleChange}
          autoComplete="email"
          disabled={submitting}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="role" className="field-label">
          Role
        </label>
        <select
          id="role"
          name="role"
          className="field-input"
          value={values.role}
          onChange={handleChange}
          disabled={submitting}
        >
          <option value="ROLE_USER">User</option>
          <option value="ROLE_ADMIN">Admin</option>
        </select>
        {errors.role && <p className="field-error">{errors.role}</p>}
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
          autoComplete="new-password"
          disabled={submitting}
        />
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      <button
        type="submit"
        className="primary-button"
        disabled={submitting}
      >
        {submitting ? 'Registering...' : 'Register'}
      </button>

      {serverMessage && (
        <p className="server-message">
          {serverMessage}
        </p>
      )}
    </form>
  );
}

export default RegisterForm;

