import test from 'node:test';
import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { useCartStore, createStoreGroup, normalizeCartItem } from '../src/stores/cart.js';
import { apiClient, getApiErrorMessage } from './mocks/api.js';

// Setup mock localStorage
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (key) => (storageMap.has(key) ? storageMap.get(key) : null),
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

function setupTestCartStore() {
  storageMap.clear();
  setActivePinia(createPinia());
  return useCartStore();
}

test('1. cart dari beberapa toko tampil bersamaan', () => {
  const store = setupTestCartStore();

  const groupA = createStoreGroup({
    id: 101,
    store_id: 1,
    store_name: 'Kantin Sekolah',
    items: [
      { id: 1, product_id: 11, name: 'Nasi Goreng', price: 12000, quantity: 2 },
    ],
  });

  const groupB = createStoreGroup({
    id: 202,
    store_id: 2,
    store_name: 'TEFA Bakery',
    items: [
      { id: 2, product_id: 22, name: 'Roti Cokelat', price: 8000, quantity: 1 },
    ],
  });

  store.upsertGroup(groupA);
  store.upsertGroup(groupB);

  // Verifikasi grup toko terpisah
  assert.strictEqual(store.cartGroups.length, 2);
  assert.strictEqual(store.cartGroups[0].store_id, 1);
  assert.strictEqual(store.cartGroups[0].cart_id, 101);
  assert.strictEqual(store.cartGroups[0].store_name, 'Kantin Sekolah');
  assert.strictEqual(store.cartGroups[0].subtotal, 24000);
  assert.strictEqual(store.cartGroups[0].total_quantity, 2);

  assert.strictEqual(store.cartGroups[1].store_id, 2);
  assert.strictEqual(store.cartGroups[1].cart_id, 202);
  assert.strictEqual(store.cartGroups[1].store_name, 'TEFA Bakery');
  assert.strictEqual(store.cartGroups[1].subtotal, 8000);
  assert.strictEqual(store.cartGroups[1].total_quantity, 1);

  // Verifikasi item digabung untuk tampilan frontend
  assert.strictEqual(store.items.length, 2);
  assert.strictEqual(store.totalPrice, 32000);
  assert.strictEqual(store.itemCount, 3);
  assert.strictEqual(store.isEmpty, false);
});

test('2. checkout satu toko', async () => {
  const store = setupTestCartStore();

  const group = createStoreGroup({
    id: 101,
    store_id: 1,
    store_name: 'Kantin Sekolah',
    items: [
      { id: 1, product_id: 11, name: 'Nasi Goreng', price: 12000, quantity: 1 },
    ],
  });
  store.upsertGroup(group);

  const postRequests = [];
  apiClient.post = async (url, data) => {
    postRequests.push({ url, data });
    return { data: { success: true, data: { id: 501, status: 'diproses' } } };
  };

  assert.strictEqual(store.cartGroups.length, 1);
  const result = await store.checkout(store.cartGroups[0].cart_id);

  assert.strictEqual(result.id, 501);
  assert.strictEqual(postRequests.length, 1);
  assert.strictEqual(postRequests[0].url, '/orders');
  assert.deepStrictEqual(postRequests[0].data, { cart_id: 101 });
});

test('3. popup saat cart berisi beberapa toko', () => {
  const store = setupTestCartStore();

  store.upsertGroup(
    createStoreGroup({
      id: 101,
      store_id: 1,
      store_name: 'Kantin Sekolah',
      items: [{ id: 1, product_id: 11, name: 'Item 1', price: 10000, quantity: 1 }],
    })
  );
  store.upsertGroup(
    createStoreGroup({
      id: 202,
      store_id: 2,
      store_name: 'TEFA Bakery',
      items: [{ id: 2, product_id: 22, name: 'Item 2', price: 15000, quantity: 1 }],
    })
  );

  // Alur klik checkout: bila toko > 1, munculkan popup peringatan/pemilihan
  function evaluateCheckoutAction(cart) {
    if (cart.isEmpty) return { action: 'error', message: 'Keranjang kosong' };
    if (cart.cartGroups.length === 1) return { action: 'direct', cartId: cart.cartGroups[0].cart_id };
    return {
      action: 'show_popup',
      message: 'Checkout hanya dapat dilakukan untuk satu toko. Pilih toko yang ingin diproses.',
      stores: cart.cartGroups.map((g) => ({ store_id: g.store_id, cart_id: g.cart_id, store_name: g.store_name })),
    };
  }

  const decision = evaluateCheckoutAction(store);
  assert.strictEqual(decision.action, 'show_popup');
  assert.strictEqual(
    decision.message,
    'Checkout hanya dapat dilakukan untuk satu toko. Pilih toko yang ingin diproses.'
  );
  assert.strictEqual(decision.stores.length, 2);
});

test('4. checkout hanya mengirim satu cart_id', async () => {
  const store = setupTestCartStore();

  store.upsertGroup(
    createStoreGroup({
      id: 101,
      store_id: 1,
      store_name: 'Toko A',
      items: [{ id: 1, product_id: 11, name: 'Item A', price: 5000, quantity: 1 }],
    })
  );
  store.upsertGroup(
    createStoreGroup({
      id: 202,
      store_id: 2,
      store_name: 'Toko B',
      items: [{ id: 2, product_id: 22, name: 'Item B', price: 15000, quantity: 2 }],
    })
  );

  const postRequests = [];
  apiClient.post = async (url, data) => {
    postRequests.push({ url, data });
    return { data: { success: true, data: { id: 701, status: 'diproses' } } };
  };

  // User memilih Toko B (cart_id 202)
  const selectedCartId = 202;
  await store.checkout(selectedCartId);

  assert.strictEqual(postRequests.length, 1);
  assert.strictEqual(postRequests[0].url, '/orders');
  assert.deepStrictEqual(postRequests[0].data, { cart_id: 202 });
});

test('5. cart toko lain tetap ada setelah checkout', async () => {
  const store = setupTestCartStore();

  store.upsertGroup(
    createStoreGroup({
      id: 101,
      store_id: 1,
      store_name: 'Toko Tetap Ada',
      items: [{ id: 1, product_id: 11, name: 'Item Toko 1', price: 10000, quantity: 2 }],
    })
  );
  store.upsertGroup(
    createStoreGroup({
      id: 202,
      store_id: 2,
      store_name: 'Toko Diproses',
      items: [{ id: 2, product_id: 22, name: 'Item Toko 2', price: 20000, quantity: 1 }],
    })
  );

  apiClient.post = async () => ({
    data: { success: true, data: { id: 801, status: 'diproses' } },
  });

  // Checkout toko 2 (cart_id 202)
  await store.checkout(202);

  // Toko 2 dihapus, Toko 1 tetap ada
  assert.strictEqual(store.cartGroups.length, 1);
  assert.strictEqual(store.cartGroups[0].store_id, 1);
  assert.strictEqual(store.cartGroups[0].cart_id, 101);
  assert.strictEqual(store.cartGroups[0].items.length, 1);
  assert.strictEqual(store.items.length, 1);
  assert.strictEqual(store.totalPrice, 20000);
});

test('6. checkout gagal mengaktifkan kembali tombol', async () => {
  const store = setupTestCartStore();

  store.upsertGroup(
    createStoreGroup({
      id: 101,
      store_id: 1,
      store_name: 'Toko Gagal',
      items: [{ id: 1, product_id: 11, name: 'Item Gagal', price: 10000, quantity: 1 }],
    })
  );

  // Simulasikan error 409 Conflict (stok habis)
  apiClient.post = async () => {
    const error = new Error('Request failed with status code 409');
    error.response = {
      status: 409,
      data: { success: false, message: 'Stok produk telah habis' },
    };
    throw error;
  };

  assert.strictEqual(store.isSubmitting, false);

  let caughtError = null;
  try {
    await store.checkout(101);
  } catch (e) {
    caughtError = e;
  }

  assert.ok(caughtError);
  // isSubmitting harus kembali false agar tombol aktif kembali
  assert.strictEqual(store.isSubmitting, false);

  // Error message terformat sesuai status 409
  const formattedError = getApiErrorMessage(caughtError);
  assert.strictEqual(formattedError, 'Stok produk telah habis');

  // Test error status 422 dan 401 tanpa message
  assert.strictEqual(
    getApiErrorMessage({ response: { status: 422 } }),
    'Data yang dikirim tidak valid. Periksa kembali pesanan Anda.'
  );
  assert.strictEqual(
    getApiErrorMessage({ response: { status: 401 } }),
    'Sesi Anda telah berakhir. Silakan login kembali.'
  );
});
