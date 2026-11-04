import { defineStore } from 'pinia';
import { apiClient } from '@/services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user_data') || 'null'),
    token: localStorage.getItem('auth_token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role || 'guest',
  },
  actions: {
    async login(nis_nip, password) {
      const res = await apiClient.post('/auth/login', { nis_nip, password });
      this.token = res.data.data.token;
      this.user = res.data.data.user;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('user_data', JSON.stringify(this.user));
    },
    async register(payload) {
      const res = await apiClient.post('/auth/register', payload);
      this.token = res.data.data.token;
      this.user = res.data.data.user;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('user_data', JSON.stringify(this.user));
    },
    async logout() {
      try {
        await apiClient.post('/auth/logout');
      } finally {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    },
    async fetchMe() {
      if (!this.token) return;
      const res = await apiClient.get('/auth/me');
      this.user = res.data.data;
      localStorage.setItem('user_data', JSON.stringify(this.user));
    },
  },
});
