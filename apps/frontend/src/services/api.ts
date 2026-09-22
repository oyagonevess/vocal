import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE_URL = rawApiUrl ? `${rawApiUrl}/api` : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
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
      !originalRequest.url?.includes('/auth/register')
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
        setAccessToken(null);
        window.dispatchEvent(new Event('vocalis-logout'));
      }
    }
    return Promise.reject(error);
  }
);

