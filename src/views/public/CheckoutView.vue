<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useCartStore } from '@/stores/cart';
import { getApiErrorMessage } from '@/services/api';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';

const router = useRouter();
const cartStore = useCartStore();
const isSubmitting = ref(false);
const error = ref('');
const selectedStoreId = ref(null);

const BMS_PER_ITEM = 1000;

const activeGroup = computed(() => {
  if (selectedStoreId.value) {
    const found = cartStore.cartGroups.find((g) => g.store_id === selectedStoreId.value);
    if (found) return found;
  }
  return cartStore.cartGroups[0] || null;
});

const totalItems = computed(() => activeGroup.value?.total_quantity || 0);
const subtotal = computed(() => activeGroup.value?.subtotal || 0);
const commission = computed(() => totalItems.value * BMS_PER_ITEM);
const grandTotal = computed(() => subtotal.value + commission.value);

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

async function handleSimulatePaid() {
  if (isSubmitting.value) return;
  if (!activeGroup.value?.cart_id) {
    error.value = 'Keranjang kosong. Tidak bisa checkout.';
    return;
  }
  isSubmitting.value = true;
  error.value = '';

  try {
    const order = await cartStore.checkout(activeGroup.value.cart_id);
    router.replace({ path: `/orders/${order.id}`, query: { new: '1' } });
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Checkout gagal. Coba lagi.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="checkout-view">
    <MobileHeader />

    <main class="main-content">
      <div class="page-title-wrap">
        <button type="button" class="back-btn" @click="router.back()" aria-label="Kembali">
          <Icon icon="bx:arrow-back" width="24" height="24" />
        </button>
        <h1 class="page-title">Checkout</h1>
      </div>

      <div v-if="cartStore.isEmpty" class="empty-state">
        <p>Keranjang kosong. Tidak bisa checkout.</p>
        <button type="button" class="back-link" @click="router.push('/stores')">
          Belanja sekarang
        </button>
      </div>

      <template v-else>
        <div v-if="cartStore.cartGroups.length > 1" class="store-selector">
          <p class="selector-label">Pilih toko yang ingin diproses:</p>
          <div class="store-tabs">
            <button
              v-for="group in cartStore.cartGroups"
              :key="group.store_id"
              type="button"
              class="store-tab"
              :class="{ 'is-active': activeGroup?.store_id === group.store_id }"
              @click="selectedStoreId = group.store_id"
            >
              {{ group.store_name }}
            </button>
          </div>
        </div>

        <section v-if="activeGroup" class="summary-card">
          <h2 class="card-title">{{ activeGroup.store_name }}</h2>
          <div class="summary-items">
            <div v-for="item in activeGroup.items" :key="item.id" class="summary-row">
              <span class="item-name">{{ item.name }} x{{ item.quantity }}</span>
              <span class="item-price">{{ formatRupiah(item.price * item.quantity) }}</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>{{ formatRupiah(subtotal) }}</span>
          </div>
          <div class="summary-row">
            <span>Komisi BMS ({{ totalItems }} item × Rp1.000)</span>
            <span>{{ formatRupiah(commission) }}</span>
          </div>
          <div class="divider"></div>
          <div class="summary-row total-row">
            <span>Total</span>
            <span>{{ formatRupiah(grandTotal) }}</span>
          </div>
        </section>

        <p v-if="error" class="checkout-error" role="alert">{{ error }}</p>

        <div class="action-bar">
          <button
            type="button"
            class="pay-btn"
            :disabled="isSubmitting"
            @click="handleSimulatePaid"
          >
            <Icon v-if="!isSubmitting" icon="mdi:qrcode-scan" width="20" height="20" />
            {{ isSubmitting ? 'Memproses…' : 'Simulate Paid' }}
          </button>
        </div>
      </template>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.checkout-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 85px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0 var(--space-2);
}

.page-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--space-2) 0 var(--space-1);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--color-text);
}

.page-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 24px;
  color: var(--color-text);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: var(--space-3) 0;
  color: var(--color-text-muted);
}

.back-link {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.store-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.selector-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.store-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.store-tabs::-webkit-scrollbar {
  display: none;
}

.store-tab {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.store-tab.is-active {
  background-color: rgba(30, 144, 255, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.summary-card {
  background-color: var(--color-surface);
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.12);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 18px;
  color: var(--color-text);
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.item-name {
  color: var(--color-text-muted);
}

.total-row {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
}

.divider {
  height: 1px;
  background-color: #e5e7eb;
}

.checkout-error {
  color: #b42318;
  font-size: var(--font-size-sm);
  text-align: center;
}

.action-bar {
  padding: var(--space-1) 0;
}

.pay-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 50px;
  padding: var(--space-1);
  border-radius: 10px;
  background-color: var(--color-primary);
  color: var(--color-text-on-accent);
  font-family: var(--font-family-brand);
  font-size: 18px;
  font-weight: 600;
  transition: background-color var(--transition-fast);
}

.pay-btn:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.pay-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>
