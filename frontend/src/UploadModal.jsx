import React, { useEffect, useState } from 'react';
import { completeVideoUpload, initiateVideoUpload } from './api/videos';
import { ApiError } from './api/client';
import { uploadFileToPresignedUrl } from './api/presignedUpload';
import { getSession } from './auth/session';
import { decodeJwt } from './auth/jwt';

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
  const [step, setStep] = useState('idle'); // idle | initiating | uploading | completing | success | error
  const [progress, setProgress] = useState(0);
  const [videoId, setVideoId] = useState('');
  const [abortController, setAbortController] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(initialValues);
    setError('');
    setSuccessMessage('');
    setSubmitting(false);
    setStep('idle');
    setProgress(0);
    setVideoId('');
    setAbortController(null);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (abortController) {
      abortController.abort();
    }
    onClose();
  };

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
    setStep('initiating');
    setProgress(0);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const session = getSession();
      const claims = decodeJwt(session.accessToken);
      const clientId = claims?.userId || session.username || 'guest';

      const initiated = await initiateVideoUpload({
        title,
        description,
        clientId,
        token: session.accessToken,
        signal: controller.signal
      });

      setVideoId(initiated.videoId);
      setStep('uploading');

      await uploadFileToPresignedUrl({
        url: initiated.uploadUrl,
        file: values.file,
        signal: controller.signal,
        onProgress: (next) => {
          if (typeof next === 'number') {
            setProgress(next);
          }
        }
      });

      setStep('completing');
      await completeVideoUpload({
        videoId: initiated.videoId,
        signal: controller.signal
      });

      setStep('success');
      setSuccessMessage('Upload completed. Processing will start shortly.');
      setValues(initialValues);

      if (typeof onUploadSuccess === 'function') {
        onUploadSuccess();
      }
    } catch (err) {
      setStep('error');
      if (err instanceof ApiError) {
        setError(err.message || 'Upload failed.');
      } else {
        setError('Upload failed.');
      }
    } finally {
      setSubmitting(false);
      setAbortController(null);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleClose}>
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
              Initiate upload, upload to the presigned URL, and complete the upload.
            </p>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={handleClose}
            aria-label="Close upload dialog"
          >
            Close
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="upload-status">
            <div className="upload-status-row">
              <span className={`upload-step ${step === 'initiating' || step === 'uploading' || step === 'completing' || step === 'success' ? 'upload-step-active' : ''}`}>
                1. Initiate
              </span>
              <span className={`upload-step ${step === 'uploading' || step === 'completing' || step === 'success' ? 'upload-step-active' : ''}`}>
                2. Upload
              </span>
              <span className={`upload-step ${step === 'completing' || step === 'success' ? 'upload-step-active' : ''}`}>
                3. Complete
              </span>
            </div>
            {videoId ? (
              <p className="helper-text">Video id: {videoId}</p>
            ) : null}
            {step === 'uploading' ? (
              <div className="upload-progress">
                <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
                <div className="upload-progress-label">
                  {Number.isFinite(progress) ? `${progress}%` : 'Uploading...'}
                </div>
              </div>
            ) : null}
          </div>

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
              onClick={handleClose}
              disabled={submitting}
            >
              {submitting ? 'Cancel upload' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting
                ? step === 'initiating'
                  ? 'Initiating...'
                  : step === 'uploading'
                    ? 'Uploading...'
                    : 'Completing...'
                : 'Upload'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default UploadModal;
