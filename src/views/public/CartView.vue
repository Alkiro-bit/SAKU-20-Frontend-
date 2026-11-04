<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useCartStore } from '@/stores/cart';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';

const router = useRouter();
const cartStore = useCartStore();

function formatRupiah(value) {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function handleCheckout() {
  if (!cartStore.hasSelected) {
    alert('Pilih minimal 1 item untuk checkout');
    return;
  }
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

      <div class="cart-list">
        <div
          v-for="store in cartStore.stores"
          :key="'store-' + store.id"
          class="cart-card"
        >
          <!-- Store Header -->
          <div class="store-header" @click="cartStore.toggleStore(store.id)">
            <button
              type="button"
              class="checkbox-custom"
              :class="{ 'is-checked': cartStore.isStoreAllSelected(store.id) }"
              aria-label="Pilih Semua di Toko Ini"
            >
              <Icon
                v-if="cartStore.isStoreAllSelected(store.id)"
                icon="akar-icons:check"
                width="16"
                height="16"
              />
            </button>
            <span class="store-name">{{ store.name }}</span>
          </div>

          <!-- Product Items -->
          <div class="product-list">
            <div
              v-for="item in store.items"
              :key="'item-' + item.id"
              class="product-row"
            >
              <div class="product-left">
                <button
                  type="button"
                  class="checkbox-custom"
                  :class="{ 'is-checked': item.selected }"
                  @click="cartStore.toggleItem(store.id, item.id)"
                  aria-label="Pilih Produk"
                >
                  <Icon
                    v-if="item.selected"
                    icon="akar-icons:check"
                    width="16"
                    height="16"
                  />
                </button>

                <div class="product-thumb">
                  <img :src="item.image" :alt="item.name" loading="lazy" />
                </div>

                <div class="product-meta">
                  <p class="product-name">{{ item.name }}</p>
                  <p class="product-price">{{ formatRupiah(item.price) }}</p>
                </div>
              </div>

              <!-- Quantity Controls -->
              <div class="quantity-control">
                <button
                  type="button"
                  class="qty-btn"
                  @click="cartStore.decrement(store.id, item.id)"
                  aria-label="Kurangi Jumlah"
                >
                  <Icon icon="akar-icons:minus" width="14" height="14" />
                </button>
                <span class="qty-num">{{ item.quantity }}</span>
                <button
                  type="button"
                  class="qty-btn"
                  @click="cartStore.increment(store.id, item.id)"
                  aria-label="Tambah Jumlah"
                >
                  <Icon icon="akar-icons:plus" width="14" height="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Sticky Bottom Checkout Bar -->
    <div class="checkout-bar">
      <div class="total-info">
        <span class="total-label">Total:</span>
        <span class="total-value">{{ formatRupiah(cartStore.totalPrice) }}</span>
      </div>
      <button
        type="button"
        class="checkout-btn"
        :disabled="!cartStore.hasSelected"
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
  padding-bottom: 155px; /* Spacing agar checkout bar & bottom nav tidak menutupi item */
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
  cursor: pointer;
  background-color: #fafbfc;
}

.store-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.checkbox-custom {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.checkbox-custom.is-checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
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

.qty-num {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

/* Sticky Checkout Bar */
.checkout-bar {
  position: fixed;
  bottom: 70px; /* Tepat di atas bottom nav */
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
