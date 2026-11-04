import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

function getOrCreateGuestToken() {
  let token = localStorage.getItem('guest_token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('guest_token', token);
  }
  return token;
}

apiClient.interceptors.request.use((config) => {
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  } else {
    config.headers['X-Guest-Token'] = getOrCreateGuestToken();
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
