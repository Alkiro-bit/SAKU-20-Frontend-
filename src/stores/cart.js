import { defineStore } from 'pinia';
import { apiClient, resolveImageUrl, getStore } from '@/services/api';

const CART_STORE_IDS_KEY = 'cart_store_ids';
const LEGACY_CART_STORE_ID_KEY = 'cart_store_id';
const CART_SELLER_NOTES_KEY = 'cart_seller_notes';

function getStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function normalizeCartItem(raw, defaultStoreId = null) {
  const product = raw.product || {};
  const storeId = Number(raw.store_id ?? raw.storeId ?? product.store_id ?? product.storeId ?? defaultStoreId);
  return {
    id: raw.id,
    store_id: storeId,
    storeId,
    productId: raw.product_id || product.id,
    name: product.name || raw.name || 'Produk',
    price: Number(product.price ?? raw.price ?? 0),
    quantity: Number(raw.quantity || 1),
    image: resolveImageUrl(product.image_url || raw.image || raw.image_url),
    rawProduct: product,
  };
}

export function createStoreGroup(rawCart, fallbackStoreId = null, fallbackStoreName = '') {
  const storeId = Number(rawCart.store_id ?? rawCart.storeId ?? fallbackStoreId);
  const cartId = rawCart.id ?? rawCart.cart_id ?? rawCart.cartId ?? null;
  const storeName = rawCart.store_name || rawCart.store?.name || fallbackStoreName || (storeId ? `Toko #${storeId}` : 'Toko');
  const items = (rawCart.items || []).map((item) => normalizeCartItem(item, storeId));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const sellerNote = rawCart.seller_note || rawCart.sellerNote || null;

  return {
    store_id: storeId,
    storeId,
    cart_id: cartId,
    cartId,
    store_name: storeName,
    storeName,
    items,
    subtotal,
    total_quantity: totalQuantity,
    totalQuantity,
    seller_note: sellerNote,
  };
}

export function getStoredSellerNotes() {
  const storage = getStorage();
  if (!storage) return {};
  const stored = storage.getItem(CART_SELLER_NOTES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return {};
}

export function saveStoredSellerNotes(notes) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(CART_SELLER_NOTES_KEY, JSON.stringify(notes || {}));
}

export function getStoredStoreIds() {
  const storage = getStorage();
  if (!storage) return [];
  const stored = storage.getItem(CART_STORE_IDS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.map(Number).filter(Boolean);
    } catch {
      // ignore
    }
  }
  const legacy = Number(storage.getItem(LEGACY_CART_STORE_ID_KEY));
  return legacy ? [legacy] : [];
}

export function saveStoredStoreIds(storeIds) {
  const storage = getStorage();
  if (!storage) return;
  const unique = Array.from(new Set(storeIds.map(Number).filter(Boolean)));
  storage.setItem(CART_STORE_IDS_KEY, JSON.stringify(unique));
  if (unique.length > 0) {
    storage.setItem(LEGACY_CART_STORE_ID_KEY, String(unique[0]));
  } else {
    storage.removeItem(LEGACY_CART_STORE_ID_KEY);
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    groups: [],
    sellerNotes: getStoredSellerNotes(),
    loading: false,
    isSubmitting: false,
  }),
  getters: {
    cartGroups(state) {
      return state.groups.filter((g) => g.items && g.items.length > 0);
    },
    items(state) {
      return state.groups.flatMap((g) => g.items || []);
    },
    totalPrice(state) {
      return state.groups.reduce((sum, g) => sum + (g.subtotal || 0), 0);
    },
    itemCount(state) {
      return state.groups.reduce((sum, g) => sum + (g.total_quantity || 0), 0);
    },
    isEmpty(state) {
      return !state.groups.some((g) => g.items && g.items.length > 0);
    },
    storeCount(state) {
      return state.groups.filter((g) => g.items && g.items.length > 0).length;
    },
    cartId(state) {
      const active = state.groups.find((g) => g.items && g.items.length > 0);
      return active?.cart_id || null;
    },
    storeId(state) {
      const active = state.groups.find((g) => g.items && g.items.length > 0);
      return active?.store_id || null;
    },
    storeName(state) {
      const active = state.groups.find((g) => g.items && g.items.length > 0);
      return active?.store_name || '';
    },
    sellerNote(state) {
      const active = state.groups.find((g) => g.items && g.items.length > 0);
      return (
        active?.seller_note ||
        (active?.store_id ? state.sellerNotes[String(active.store_id)] : '') ||
        ''
      );
    },
  },
  actions: {
    setSellerNote(storeId, note) {
      if (!storeId) return;
      const key = String(storeId);
      const cleanNote = typeof note === 'string' ? note.slice(0, 500) : '';
      if (cleanNote) {
        this.sellerNotes[key] = cleanNote;
      } else {
        delete this.sellerNotes[key];
      }
      saveStoredSellerNotes(this.sellerNotes);

      const group = this.groups.find((g) => g.store_id === Number(storeId));
      if (group) {
        group.seller_note = cleanNote || null;
      }
    },

    getSellerNote(storeId) {
      if (!storeId) return '';
      return (
        this.sellerNotes[String(storeId)] ||
        this.groups.find((g) => g.store_id === Number(storeId))?.seller_note ||
        ''
      );
    },

    removeSellerNote(storeId) {
      if (!storeId) return;
      delete this.sellerNotes[String(storeId)];
      saveStoredSellerNotes(this.sellerNotes);
    },

    upsertGroup(group) {
      if (!group || !group.store_id) return;
      const storedNote = this.sellerNotes[String(group.store_id)];
      if (storedNote && !group.seller_note) {
        group.seller_note = storedNote;
      } else if (group.seller_note && !storedNote) {
        this.sellerNotes[String(group.store_id)] = group.seller_note;
        saveStoredSellerNotes(this.sellerNotes);
      }
      const idx = this.groups.findIndex((g) => g.store_id === group.store_id);
      if (idx >= 0) {
        this.groups[idx] = group;
      } else {
        this.groups.push(group);
      }
      this.persistStoreIds();
    },

    removeGroup(cartId = null, storeId = null) {
      const removedStoreIds = [];
      this.groups = this.groups.filter((g) => {
        const matchesCart = Boolean(cartId && (g.cart_id === cartId || g.cartId === cartId));
        const matchesStore = Boolean(storeId && (g.store_id === storeId || g.storeId === storeId));
        if (matchesCart || matchesStore) {
          if (g.store_id) removedStoreIds.push(g.store_id);
          return false;
        }
        return true;
      });
      removedStoreIds.forEach((id) => this.removeSellerNote(id));
      this.persistStoreIds();
    },

    persistStoreIds() {
      const activeIds = this.groups
        .filter((g) => g.items && g.items.length > 0)
        .map((g) => g.store_id);
      saveStoredStoreIds(activeIds);
    },

    findStoreIdByItemId(itemId) {
      for (const group of this.groups) {
        if (group.items.some((item) => item.id === itemId)) {
          return group.store_id;
        }
      }
      return null;
    },

    async fetchCart(targetStoreId = this.storeId) {
      if (!targetStoreId) return null;
      this.loading = true;
      try {
        const res = await apiClient.get('/cart', { params: { store_id: targetStoreId } });
        const cart = res.data?.data;
        if (!cart || !cart.items || cart.items.length === 0) {
          this.removeGroup(null, targetStoreId);
          return null;
        }
        let storeName = cart?.store_name || cart?.store?.name || '';
        if (!storeName && targetStoreId) {
          try {
            const storeData = await getStore(targetStoreId);
            if (storeData?.name) storeName = storeData.name;
          } catch {
            storeName = `Toko #${targetStoreId}`;
          }
        }
        const group = createStoreGroup(cart, targetStoreId, storeName);
        this.upsertGroup(group);
        return group;
      } catch (e) {
        if (e.response?.status === 404) {
          this.removeGroup(null, targetStoreId);
          return null;
        }
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchAllCarts(storeIds = null) {
      const ids = storeIds || getStoredStoreIds();
      if (!ids.length) {
        this.groups = [];
        return [];
      }
      this.loading = true;
      try {
        await Promise.allSettled(ids.map((id) => this.fetchCart(id)));
        return this.cartGroups;
      } finally {
        this.loading = false;
      }
    },

    async addItem(storeId, productId, quantity = 1, sellerNote = null) {
      if (sellerNote && typeof sellerNote === 'string' && sellerNote.trim()) {
        this.setSellerNote(storeId, sellerNote.trim());
      }
      const res = await apiClient.post('/cart/items', {
        store_id: storeId,
        product_id: productId,
        quantity,
      });
      const latestCart = res.data?.data;
      if (latestCart && latestCart.items) {
        const existing = this.groups.find((g) => g.store_id === Number(storeId));
        let storeName = latestCart.store_name || latestCart.store?.name || existing?.store_name;
        if (!storeName) {
          try {
            const storeData = await getStore(storeId);
            if (storeData?.name) storeName = storeData.name;
          } catch {
            storeName = `Toko #${storeId}`;
          }
        }
        const group = createStoreGroup(latestCart, storeId, storeName);
        this.upsertGroup(group);
      } else {
        await this.fetchCart(storeId);
      }
      return res.data;
    },

    async updateQuantity(itemId, quantity, storeId = null) {
      const targetStoreId = storeId || this.findStoreIdByItemId(itemId);
      const res = await apiClient.patch(`/cart/items/${itemId}`, { quantity });
      const latestCart = res.data?.data;
      if (latestCart && latestCart.items) {
        const existing = this.groups.find((g) => g.store_id === Number(targetStoreId));
        const group = createStoreGroup(latestCart, targetStoreId, existing?.store_name);
        this.upsertGroup(group);
      } else if (targetStoreId) {
        await this.fetchCart(targetStoreId);
      }
    },

    async removeItem(itemId, storeId = null) {
      const targetStoreId = storeId || this.findStoreIdByItemId(itemId);
      const res = await apiClient.delete(`/cart/items/${itemId}`);
      const latestCart = res.data?.data;
      if (latestCart && latestCart.items) {
        if (latestCart.items.length === 0) {
          this.removeGroup(null, targetStoreId);
        } else {
          const existing = this.groups.find((g) => g.store_id === Number(targetStoreId));
          const group = createStoreGroup(latestCart, targetStoreId, existing?.store_name);
          this.upsertGroup(group);
        }
      } else if (targetStoreId) {
        await this.fetchCart(targetStoreId);
      }
    },

    async clearCart(targetCartId = null) {
      const cartId = targetCartId || this.cartId;
      if (!cartId) return;
      await apiClient.delete(`/cart/${cartId}`);
      this.removeGroup(cartId);
    },

    async checkout(targetCartId = null, noteOverride = undefined, selectedCartItemIds = null) {
      const targetGroup = targetCartId
        ? this.groups.find((g) => g.cart_id === targetCartId || g.cartId === targetCartId)
        : this.cartGroups[0];
      const cartId = targetGroup?.cart_id || targetCartId;
      const storeId = targetGroup?.store_id;

      if (!cartId && !storeId) throw new Error('Keranjang kosong');
      if (this.isSubmitting) return;

      const rawNote =
        noteOverride !== undefined
          ? noteOverride
          : (storeId ? this.getSellerNote(storeId) : '') || targetGroup?.seller_note || '';

      const trimmedNote = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : null;

      if (trimmedNote && trimmedNote.length > 500) {
        const error = new Error('Catatan untuk penjual maksimal 500 karakter.');
        error.response = {
          status: 422,
          data: {
            success: false,
            message: 'Catatan untuk penjual maksimal 500 karakter.',
            errors: { seller_note: ['Catatan untuk penjual tidak boleh lebih dari 500 karakter.'] },
          },
        };
        throw error;
      }

      this.isSubmitting = true;
      try {
        const payload = {};
        if (Array.isArray(selectedCartItemIds) && selectedCartItemIds.length > 0) {
          payload.cart_item_ids = selectedCartItemIds;
        } else if (cartId) {
          payload.cart_id = cartId;
        } else if (storeId) {
          payload.store_id = storeId;
        }
        if (trimmedNote) {
          payload.seller_note = trimmedNote;
        }

        const res = await apiClient.post('/orders', payload);
        if (Array.isArray(selectedCartItemIds) && selectedCartItemIds.length > 0 && targetGroup) {
          const selectedIds = new Set(selectedCartItemIds.map(Number));
          const remainingItems = targetGroup.items.filter((item) => !selectedIds.has(Number(item.id)));
          if (remainingItems.length > 0) {
            this.upsertGroup(createStoreGroup({
              id: targetGroup.cart_id,
              store_id: targetGroup.store_id,
              store_name: targetGroup.store_name,
              items: remainingItems,
              seller_note: targetGroup.seller_note,
            }));
          } else if (cartId) {
            this.removeGroup(cartId);
          } else if (storeId) {
            this.removeGroup(null, storeId);
          }
        } else if (cartId) {
          this.removeGroup(cartId);
        } else if (storeId) {
          this.removeGroup(null, storeId);
        }
        if (storeId) {
          this.removeSellerNote(storeId);
        }
        return res.data?.data || null;
      } finally {
        this.isSubmitting = false;
      }
    },

    resetCart() {
      this.groups = [];
      this.sellerNotes = {};
      this.isSubmitting = false;
      const storage = getStorage();
      if (storage) {
        storage.removeItem(CART_STORE_IDS_KEY);
        storage.removeItem(LEGACY_CART_STORE_ID_KEY);
        storage.removeItem(CART_SELLER_NOTES_KEY);
      }
    },
  },
});

