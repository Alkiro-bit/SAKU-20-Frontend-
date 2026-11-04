import { defineStore } from 'pinia';
import { createCartSeed } from '@/data/products';

export const useCartStore = defineStore('cart', {
  state: () => ({
    stores: createCartSeed(),
  }),
  getters: {
    totalPrice(state) {
      let total = 0;
      state.stores.forEach((store) => {
        store.items.forEach((item) => {
          if (item.selected) {
            total += item.price * item.quantity;
          }
        });
      });
      return total;
    },
    hasSelected(state) {
      return state.stores.some((s) => s.items.some((i) => i.selected));
    },
  },
  actions: {
    toggleItem(storeId, itemId) {
      const store = this.stores.find((s) => s.id === storeId);
      if (store) {
        const item = store.items.find((i) => i.id === itemId);
        if (item) item.selected = !item.selected;
      }
    },
    toggleStore(storeId) {
      const store = this.stores.find((s) => s.id === storeId);
      if (store) {
        const allSelected = store.items.every((i) => i.selected);
        store.items.forEach((i) => (i.selected = !allSelected));
      }
    },
    isStoreAllSelected(storeId) {
      const store = this.stores.find((s) => s.id === storeId);
      return store ? store.items.every((i) => i.selected) : false;
    },
    increment(storeId, itemId) {
      const store = this.stores.find((s) => s.id === storeId);
      if (store) {
        const item = store.items.find((i) => i.id === itemId);
        if (item) item.quantity++;
      }
    },
    decrement(storeId, itemId) {
      const store = this.stores.find((s) => s.id === storeId);
      if (store) {
        const item = store.items.find((i) => i.id === itemId);
        if (item && item.quantity > 1) {
          item.quantity--;
        }
      }
    },
  },
});
