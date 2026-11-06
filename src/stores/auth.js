import { defineStore } from 'pinia';
import { apiClient } from '@/services/api';
import { useCartStore } from '@/stores/cart';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem(USER_DATA_KEY) || 'null'),
    token: localStorage.getItem(AUTH_TOKEN_KEY) || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role || 'guest',
    isAdmin: (state) => state.user?.role === 'admin',
    isSuperadmin: (state) => state.user?.role === 'superadmin',
    isPembeli: (state) => state.user?.role === 'pembeli',
  },
  actions: {
    setSession(payload) {
      this.token = payload.token;
      this.user = payload.user;
      localStorage.setItem(AUTH_TOKEN_KEY, this.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.user));
    },
    clearSession() {
      this.token = null;
      this.user = null;
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      useCartStore().resetCart();
    },
    async login(nisNip, password) {
      const res = await apiClient.post('/auth/login', { nis_nip: nisNip, password });
      this.setSession(res.data.data);
    },
    async register(payload) {
      const res = await apiClient.post('/auth/register', payload);
      this.setSession(res.data.data);
    },
    async logout() {
      try {
        await apiClient.post('/auth/logout');
      } finally {
        this.clearSession();
      }
    },
    async fetchMe() {
      if (!this.token) return;
      const res = await apiClient.get('/auth/me');
      this.user = res.data.data;
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.user));
    },
  },
});