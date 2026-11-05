import { defineStore } from 'pinia';
import { apiClient } from '@/services/api';

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartId: null,
    storeId: null,
    storeName: '',
    items: [],
    loading: false,
  }),
  getters: {
    totalPrice(state) {
      return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    itemCount(state) {
      return state.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    isEmpty(state) {
      return state.items.length === 0;
    },
  },
  actions: {
    async fetchCart(storeId) {
      this.loading = true;
      try {
        const res = await apiClient.get('/cart', { params: { store_id: storeId } });
        const cart = res.data.data;
        this.cartId = cart.id;
        this.storeId = storeId;
        this.storeName = cart.store_name || '';
        this.items = cart.items || [];
      } catch (e) {
        if (e.response?.status === 404) {
          this.cartId = null;
          this.items = [];
        } else {
          throw e;
        }
      } finally {
        this.loading = false;
      }
    },
    async addItem(storeId, productId, quantity = 1) {
      const res = await apiClient.post('/cart/items', {
        store_id: storeId,
        product_id: productId,
        quantity,
      });
      // Refetch to sync state
      await this.fetchCart(storeId);
      return res.data;
    },
    async updateQuantity(itemId, quantity) {
      await apiClient.patch(`/cart/items/${itemId}`, { quantity });
      if (this.storeId) await this.fetchCart(this.storeId);
    },
    async removeItem(itemId) {
      await apiClient.delete(`/cart/items/${itemId}`);
      if (this.storeId) await this.fetchCart(this.storeId);
    },
    async clearCart() {
      if (!this.cartId) return;
      await apiClient.delete(`/cart/${this.cartId}`);
      this.cartId = null;
      this.items = [];
    },
    async checkout() {
      if (!this.cartId) throw new Error('Keranjang kosong');
      const res = await apiClient.post('/orders', { cart_id: this.cartId });
      this.cartId = null;
      this.items = [];
      return res.data.data;
    },
    resetCart() {
      this.cartId = null;
      this.storeId = null;
      this.storeName = '';
      this.items = [];
    },
  },
});
