<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useCartStore } from '@/stores/cart';
import { getApiErrorMessage } from '@/services/api';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';

const router = useRouter();
const cartStore = useCartStore();
const error = ref('');
const updatingItem = ref(null);

function formatRupiah(value) {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

async function handleIncrement(item) {
  updatingItem.value = item.id;
  try {
    await cartStore.updateQuantity(item.id, item.quantity + 1);
  } catch (e) {
    error.value = getApiErrorMessage(e);
  } finally {
    updatingItem.value = null;
  }
}

async function handleDecrement(item) {
  if (item.quantity <= 1) return;
  updatingItem.value = item.id;
  try {
    await cartStore.updateQuantity(item.id, item.quantity - 1);
  } catch (e) {
    error.value = getApiErrorMessage(e);
  } finally {
    updatingItem.value = null;
  }
}

async function handleRemove(item) {
  updatingItem.value = item.id;
  try {
    await cartStore.removeItem(item.id);
  } catch (e) {
    error.value = getApiErrorMessage(e);
  } finally {
    updatingItem.value = null;
  }
}

function handleCheckout() {
  if (cartStore.isEmpty) return;
  router.push('/checkout');
}
</script>

<template>
  <div class="cart-view">
    <MobileHeader />

    <main class="main-content">
      <div class="page-title-wrap">
        <h1 class="page-title">My Cart</h1>
      </div>

      <p v-if="error" class="cart-error" role="alert">{{ error }}</p>

      <div v-if="cartStore.loading" class="cart-empty">
        <p>Memuat keranjang…</p>
      </div>

      <div v-else-if="cartStore.isEmpty" class="cart-empty">
        <Icon icon="mdi:cart-off" width="48" height="48" />
        <p>Keranjang kosong</p>
      </div>

      <div v-else class="cart-list">
        <div class="cart-card">
          <div class="store-header">
            <Icon icon="mdi:store" width="20" height="20" />
            <span class="store-name">{{ cartStore.storeName }}</span>
          </div>

          <div class="product-list">
            <div
              v-for="item in cartStore.items"
              :key="'item-' + item.id"
              class="product-row"
            >
              <div class="product-left">
                <div class="product-thumb">
                  <img :src="item.image" :alt="item.name" loading="lazy" />
                </div>
                <div class="product-meta">
                  <p class="product-name">{{ item.name }}</p>
                  <p class="product-price">{{ formatRupiah(item.price) }}</p>
                </div>
              </div>

              <div class="product-right">
                <button
                  type="button"
                  class="remove-btn"
                  :disabled="updatingItem === item.id"
                  @click="handleRemove(item)"
                  aria-label="Hapus Item"
                >
                  <Icon icon="mdi:trash-can-outline" width="18" height="18" />
                </button>

                <div class="quantity-control">
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="item.quantity <= 1 || updatingItem === item.id"
                    @click="handleDecrement(item)"
                    aria-label="Kurangi Jumlah"
                  >
                    <Icon icon="akar-icons:minus" width="14" height="14" />
                  </button>
                  <span class="qty-num">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="updatingItem === item.id"
                    @click="handleIncrement(item)"
                    aria-label="Tambah Jumlah"
                  >
                    <Icon icon="akar-icons:plus" width="14" height="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="!cartStore.isEmpty" class="checkout-bar">
      <div class="total-info">
        <span class="total-label">Total:</span>
        <span class="total-value">{{ formatRupiah(cartStore.totalPrice) }}</span>
      </div>
      <button
        type="button"
        class="checkout-btn"
        :disabled="cartStore.isEmpty"
        @click="handleCheckout"
      >
        Checkout
      </button>
    </div>

    <BottomNav />
  </div>
</template>

<style scoped>
.cart-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 155px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0 var(--space-2);
}

.page-title-wrap {
  padding: var(--space-2) 0 var(--space-1);
  text-align: center;
}

.page-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 24px;
  color: var(--color-text);
}

.cart-error {
  color: #b42318;
  font-size: var(--font-size-sm);
  text-align: center;
  padding: 8px;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: var(--space-3) 0;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.cart-card {
  background-color: var(--color-surface);
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.store-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 0.5px solid #d1d5db;
  background-color: #fafbfc;
}

.store-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.product-list {
  display: flex;
  flex-direction: column;
}

.product-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 0.5px solid #f3f4f6;
  gap: 8px;
}

.product-row:last-child {
  border-bottom: none;
}

.product-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.product-thumb {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f3f4f6;
  flex-shrink: 0;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.product-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.product-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #b42318;
  border-radius: 4px;
}

.remove-btn:hover {
  background-color: rgba(180, 35, 24, 0.08);
}

.quantity-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 96px;
  height: 34px;
  border: 0.5px solid var(--color-border);
  border-radius: 10px;
  padding: 0 8px;
  background-color: var(--color-background);
  flex-shrink: 0;
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-text);
}

.qty-btn:disabled {
  opacity: 0.3;
}

.qty-num {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.checkout-bar {
  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background-color: var(--color-background);
  border-top: 1px solid #e5e7eb;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0px -4px 10px rgba(0, 0, 0, 0.05);
  z-index: 45;
}

.total-info {
  display: flex;
  flex-direction: column;
}

.total-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.total-value {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: 20px;
  color: var(--color-text);
}

.checkout-btn {
  background-color: var(--color-primary);
  color: var(--color-text-on-accent);
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 16px;
  padding: 10px 24px;
  border-radius: 10px;
  transition: opacity var(--transition-fast);
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
