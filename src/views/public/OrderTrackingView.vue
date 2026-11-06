<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { apiClient, getApiErrorMessage } from '@/services/api';
import { usePolling } from '@/composables/usePolling';

const route = useRoute();
const router = useRouter();

const order = ref(null);
const loading = ref(true);
const error = ref('');

const orderId = computed(() => route.params.id);

const storeDisplayName = computed(() =>
  order.value?.store_name ||
  order.value?.store?.name ||
  order.value?.cart?.store_name ||
  order.value?.cart?.store?.name ||
  'Store'
);

const orderItems = computed(() => {
  const items = order.value?.items || order.value?.order_items || [];
  return items.map((item) => ({
    ...item,
    id: item.id || item.cart_item_id || item.product_id,
    name: item.name || item.product_name || item.product?.name || item.menu_item?.name || 'Item',
    image: item.image || item.product?.image || item.product?.image_url || item.menu_item?.image,
    quantity: item.quantity || item.qty || 0,
    price: item.price ?? item.unit_price ?? item.product?.price ?? 0,
  }));
});

const isFinalStatus = computed(() =>
  ['selesai', 'dibatalkan'].includes(order.value?.status)
);

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

async function fetchOrder() {
  try {
    const res = await apiClient.get(`/orders/${orderId.value}`);
    order.value = res.data.data;
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat detail pesanan.');
  } finally {
    loading.value = false;
  }
}

async function pollStatus() {
  if (isFinalStatus.value) {
    polling.stop();
    return;
  }
  try {
    const res = await apiClient.get(`/orders/${orderId.value}/status`);
    const data = res.data.data;
    if (order.value) {
      order.value.status = data.status;
      order.value.pickup_code = data.pickup_code;
      order.value.queue_number = data.queue_number;
    }
    if (['selesai', 'dibatalkan'].includes(data.status)) {
      polling.stop();
    }
  } catch {
    // silent fail on poll
  }
}

const polling = usePolling(pollStatus, 4000);

onMounted(async () => {
  await fetchOrder();
  if (!isFinalStatus.value) {
    polling.start();
  }
});
</script>

<template>
  <div class="tracking-view">
    <MobileHeader />

    <main class="main-content">
      <div class="page-title-wrap">
        <button type="button" class="back-btn" @click="router.push('/orders')" aria-label="Go back">
          <Icon icon="bx:arrow-back" width="24" height="24" />
        </button>
        <h1 class="page-title">Order Details</h1>
      </div>

      <div v-if="loading" class="loading-state">
        <p>Loading…</p>
      </div>

      <p v-else-if="error" class="tracking-error" role="alert">{{ error }}</p>

      <template v-else-if="order">
        <!-- Pickup Info Card -->
        <section class="pickup-card">
          <div class="status-heading">
            <div>
              <span class="section-kicker">ORDER STATUS</span>
              <h2>Pesanan {{ order.id ? `#${order.id}` : '' }}</h2>
            </div>
            <StatusBadge :status="order.status" />
          </div>
          <div class="pickup-main">
            <div class="pickup-block">
              <span class="pickup-label">Queue Number</span>
              <span class="pickup-big">{{ order.queue_number }}</span>
            </div>
            <div class="pickup-divider"></div>
            <div class="pickup-block">
              <span class="pickup-label">Pickup Code</span>
              <span class="pickup-big pickup-code">{{ order.pickup_code }}</span>
            </div>
          </div>
          <p v-if="!isFinalStatus" class="polling-hint">
            <Icon icon="mdi:loading" width="14" height="14" class="spin" />
            Status diperbarui otomatis
          </p>
        </section>

        <!-- Order Items -->
        <section class="items-card">
          <div class="store-heading">
            <div class="store-icon"><Icon icon="mdi:storefront-outline" width="20" height="20" /></div>
            <div>
              <span class="section-kicker">ORDER FROM</span>
              <h2 class="card-title">{{ storeDisplayName }}</h2>
            </div>
          </div>
          <div class="item-list">
            <div v-for="item in orderItems" :key="item.id" class="item-row">
              <div class="item-thumb" v-if="item.image">
                <img :src="item.image" :alt="item.name" loading="lazy" />
              </div>
              <div class="item-meta">
                <p class="item-name">{{ item.name }}</p>
                <p class="item-qty">x{{ item.quantity }} — {{ formatRupiah(item.price * item.quantity) }}</p>
              </div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="total-row">
            <span>Payment Total</span>
            <span>{{ formatRupiah(order.total) }}</span>
          </div>
        </section>

        <!-- Seller Note -->
        <section v-if="order.seller_note" class="note-card">
          <div class="note-header">
            <Icon icon="mdi:note-text-outline" width="18" height="18" />
            <span class="note-title">Note for Seller</span>
          </div>
          <p class="note-body">{{ order.seller_note }}</p>
        </section>
      </template>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.tracking-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 85px;
  background: #fff;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 12px;
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
  transition: background-color 160ms ease, color 160ms ease;
}

.back-btn:hover,
.back-btn:focus-visible {
  background: rgba(30, 144, 255, 0.1);
  color: var(--color-primary);
}

.page-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 24px;
  color: var(--color-text);
}

.status-heading,
.store-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-heading h2 {
  margin: 4px 0 0;
  font-family: var(--font-family-brand);
  font-size: 20px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.section-kicker {
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.loading-state {
  text-align: center;
  padding: var(--space-3) 0;
  color: var(--color-text-muted);
}

.tracking-error {
  color: #b42318;
  font-size: var(--font-size-sm);
  text-align: center;
}

.pickup-card {
  background-color: var(--color-surface);
  border-radius: 14px;
  box-shadow: 0 6px 22px rgba(15, 23, 42, 0.1);
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pickup-main {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  padding: 14px 10px;
  border-radius: 10px;
  background: rgba(30, 144, 255, 0.06);
}

.pickup-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pickup-label {
  font-family: var(--font-family-brand);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.pickup-big {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-bold);
  font-size: 42px;
  color: var(--color-primary);
  line-height: 1;
}

.pickup-code {
  letter-spacing: 2px;
}

.pickup-divider {
  width: 1px;
  height: 56px;
  background-color: rgba(30, 144, 255, 0.2);
}

.polling-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

.items-card {
  background-color: var(--color-surface);
  border-radius: 14px;
  box-shadow: 0 6px 22px rgba(15, 23, 42, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.store-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: var(--color-primary);
  background: rgba(30, 144, 255, 0.1);
}

.card-title {
  margin: 4px 0 0;
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-bold);
  font-size: 18px;
  color: var(--color-text);
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.item-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f3f4f6;
  flex-shrink: 0;
}

.item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.item-qty {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.divider {
  height: 1px;
  background-color: #e5e7eb;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.total-row span:last-child {
  color: var(--color-primary);
  font-size: 20px;
}

.note-card {
  background-color: var(--color-surface);
  border-radius: 14px;
  box-shadow: 0 6px 22px rgba(15, 23, 42, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
}

.note-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 16px;
  color: var(--color-text);
}

.note-body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: 1.5;
  background-color: #f9fafb;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(30, 144, 255, 0.16);
}
</style>
