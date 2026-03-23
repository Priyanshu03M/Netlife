import React, { useEffect, useState } from 'react';
import { uploadVideo } from './api/videos';
import { ApiError } from './api/client';

const initialValues = {
  title: '',
  description: '',
  file: null
};

function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(initialValues);
    setError('');
    setSuccessMessage('');
    setSubmitting(false);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (event) => {
    const [file] = event.target.files || [];
    setValues((prev) => ({
      ...prev,
      file: file || null
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const title = values.title.trim();
    const description = values.description.trim();

    if (!title) {
      setError('Title is required.');
      return;
    }

    if (!values.file) {
      setError('Please select a video file.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = await uploadVideo(undefined, {
        file: values.file,
        title,
        description
      });
      const message = payload?.message || 'Upload completed.';

      setSuccessMessage(message);
      setValues(initialValues);

      if (typeof onUploadSuccess === 'function') {
        onUploadSuccess();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Upload failed.');
      } else {
        setError('Upload failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="section-badge">Uploader</span>
            <h2 id="upload-title" className="modal-title">Upload a new video</h2>
            <p className="modal-subtitle">
              Add metadata, select a file, and send it to the Netlife upload API.
            </p>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={onClose}
            aria-label="Close upload dialog"
          >
            Close
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="title" className="field-label">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="field-input"
              value={values.title}
              onChange={handleChange}
              placeholder="Video title"
              disabled={submitting}
            />
          </div>

          <div className="form-field">
            <label htmlFor="description" className="field-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="field-input field-textarea"
              value={values.description}
              onChange={handleChange}
              placeholder="What is this video about?"
              disabled={submitting}
            />
          </div>

          <div className="form-field">
            <label htmlFor="file" className="field-label">
              File
            </label>
            <input
              id="file"
              name="file"
              type="file"
              className="field-input file-input"
              onChange={handleFileChange}
              disabled={submitting}
            />
            {values.file ? (
              <p className="helper-text">{values.file.name}</p>
            ) : null}
          </div>

          {error ? <p className="server-message server-message-error">{error}</p> : null}
          {successMessage ? <p className="server-message server-message-success">{successMessage}</p> : null}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default UploadModal;
