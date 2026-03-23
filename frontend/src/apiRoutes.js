export const API_BASE_URL = 'http://localhost:8765';
export const VIDEOS_API_BASE_URL = 'http://localhost:8081';

export const API_ROUTES = {
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  refresh: `${API_BASE_URL}/auth/refresh`,
  logout: `${API_BASE_URL}/auth/logout`,
  pages: `${API_BASE_URL}/auth/pages`,
  videos: `${API_BASE_URL}/videos`,
  videoUpload: `${API_BASE_URL}/videos/upload`
};
