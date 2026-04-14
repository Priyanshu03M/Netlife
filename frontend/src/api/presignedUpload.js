import { ApiError } from './client';

export function uploadFileToPresignedUrl({ url, file, onProgress, signal }) {
  if (!url) {
    return Promise.reject(new ApiError('Upload URL is missing.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    }));
  }

  if (!file) {
    return Promise.reject(new ApiError('No file selected.', {
      code: 'VALIDATION_ERROR',
      kind: 'validation'
    }));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', url, true);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        if (typeof onProgress === 'function') {
          onProgress(null);
        }
        return;
      }

      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
      if (typeof onProgress === 'function') {
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new ApiError(`Upload failed with status ${xhr.status}.`, {
        code: 'UPLOAD_FAILED',
        kind: 'api',
        status: xhr.status,
        details: xhr.responseText
      }));
    };

    xhr.onerror = () => {
      reject(new ApiError('Upload failed due to a network error.', {
        code: 'NETWORK_ERROR',
        kind: 'network'
      }));
    };

    xhr.onabort = () => {
      reject(new ApiError('Upload was cancelled.', {
        code: 'UPLOAD_ABORTED',
        kind: 'api'
      }));
    };

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
      } else {
        signal.addEventListener('abort', () => xhr.abort(), { once: true });
      }
    }

    try {
      xhr.send(file);
    } catch (error) {
      reject(new ApiError('Upload failed.', {
        code: 'UPLOAD_FAILED',
        kind: 'api',
        details: error
      }));
    }
  });
}

