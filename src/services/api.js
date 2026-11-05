import axios from 'axios';
import router from '@/router';

// Content-Type sengaja tidak di-set global: upload produk mengirim FormData,
// dan axios perlu menulis boundary multipart sendiri.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    Accept: 'application/json',
  },
});

const AUTH_TOKEN_KEY = 'auth_token';

apiClient.interceptors.request.use((config) => {
  const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (authToken) {
    config.headers.Authorization = 'Bearer ' + authToken;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('user_data');
      const currentPath = router.currentRoute.value.fullPath;
      if (currentPath !== '/login') {
        router.push({ path: '/login', query: { redirect: currentPath } });
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