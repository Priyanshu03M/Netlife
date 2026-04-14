export const API_BASE_URL = 'http://localhost:8765';
export const VIDEOS_API_BASE_URL = 'http://localhost:8081';

export const API_ROUTES = {
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  refresh: `${API_BASE_URL}/auth/refresh`,
  logout: `${API_BASE_URL}/auth/logout`,
  pages: `${API_BASE_URL}/auth/pages`,
  videoFeed: `${API_BASE_URL}/videos/feed`,
  videoById: (id) => `${API_BASE_URL}/videos/${id}`,
  videoPlayById: (id) => `${API_BASE_URL}/videos/${id}/play`,
  videoInitiateUpload: `${API_BASE_URL}/videos/initiate-upload`,
  // Prefer direct service for completion as documented, but fall back to gateway on CORS/network issues.
  videoCompleteUploadDirect: `${VIDEOS_API_BASE_URL}/videos/complete-upload`,
  videoCompleteUploadGateway: `${API_BASE_URL}/videos/complete-upload`
};
