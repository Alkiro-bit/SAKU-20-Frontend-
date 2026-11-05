import { defineStore } from 'pinia';
import { apiClient, resolveImageUrl } from '@/services/api';

const CART_STORE_ID_KEY = 'cart_store_id';

function normalizeCartItem(raw) {
  const product = raw.product || {};
  return {
    id: raw.id,
    productId: raw.product_id || product.id,
    name: product.name || raw.name || 'Produk',
    price: Number(product.price ?? raw.price ?? 0),
    quantity: Number(raw.quantity || 1),
    image: resolveImageUrl(product.image_url || raw.image || raw.image_url),
    rawProduct: product,
  };
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartId: null,
    storeId: Number(localStorage.getItem(CART_STORE_ID_KEY)) || null,
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
    async fetchCart(targetStoreId = this.storeId) {
      if (!targetStoreId) {
        this.items = [];
        return;
      }
      this.loading = true;
      try {
        const res = await apiClient.get('/cart', { params: { store_id: targetStoreId } });
        const cart = res.data.data;
        this.cartId = cart?.id || null;
        this.storeId = targetStoreId;
        this.storeName = cart?.store_name || cart?.store?.name || '';
        this.items = (cart?.items || []).map(normalizeCartItem);
        localStorage.setItem(CART_STORE_ID_KEY, String(targetStoreId));
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
      this.resetCart();
    },
    async checkout() {
      if (!this.cartId) throw new Error('Keranjang kosong');
      const res = await apiClient.post('/orders', { cart_id: this.cartId });
      this.resetCart();
      return res.data.data;
    },
    resetCart() {
      this.cartId = null;
      this.storeId = null;
      this.storeName = '';
      this.items = [];
      localStorage.removeItem(CART_STORE_ID_KEY);
    },
  },
});
