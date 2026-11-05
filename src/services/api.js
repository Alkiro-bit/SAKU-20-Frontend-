import axios from 'axios';

// Content-Type sengaja tidak di-set global: upload produk mengirim FormData,
// dan axios perlu menulis boundary multipart sendiri.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    Accept: 'application/json',
  },
});

const GUEST_TOKEN_KEY = 'guest_token';
const AUTH_TOKEN_KEY = 'auth_token';

export function getGuestToken() {
  let token = localStorage.getItem(GUEST_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  }
  return token;
}

apiClient.interceptors.request.use((config) => {
  const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (authToken) {
    config.headers.Authorization = 'Bearer ' + authToken;
  } else {
    config.headers['X-Guest-Token'] = getGuestToken();
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('user_data');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Format error backend: { success: false, message, errors? }
export function getApiErrorMessage(error, fallback = 'Terjadi kesalahan. Coba lagi.') {
  const message = error?.response?.data?.message;
  return typeof message === 'string' && message ? message : fallback;
}

export function getApiValidationErrors(error) {
  const errors = error?.response?.data?.errors;
  return errors && typeof errors === 'object' ? errors : {};
}