import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    // Mock data selaras dengan Figma node 812:429
    stores: [
      {
        id: 1,
        name: 'JungleFood',
        items: [
          {
            id: 101,
            name: 'Indomie Goreng',
            price: 7000,
            quantity: 1,
            selected: false,
            image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300',
          },
        ],
      },
      {
        id: 2,
        name: 'MeetUp Cafe',
        items: [
          {
            id: 201,
            name: 'Doritos',
            price: 7000,
            quantity: 1,
            selected: false,
            image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300',
          },
          {
            id: 202,
            name: 'Golda',
            price: 8000,
            quantity: 2,
            selected: true,
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300',
          },
        ],
      },
    ],
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
