import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE_URL = rawApiUrl ? `${rawApiUrl}/api` : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let accessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('vocalis_access_token') : null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('vocalis_access_token', token);
    } else {
      localStorage.removeItem('vocalis_access_token');
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken() || (typeof window !== 'undefined' ? localStorage.getItem('vocalis_access_token') : null);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshUrl = `${API_BASE_URL}/auth/refresh`;
        const res = await axios.post(refreshUrl, {}, { withCredentials: true });
        const newAccessToken = res.data.accessToken;
        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('vocalis_access_token') : null;
        if (!savedToken) {
          setAccessToken(null);
          window.dispatchEvent(new Event('vocalis-logout'));
        }
      }
    }
    return Promise.reject(error);
  }
);

