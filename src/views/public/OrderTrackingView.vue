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
        <button type="button" class="back-btn" @click="router.push('/orders')" aria-label="Kembali">
          <Icon icon="bx:arrow-back" width="24" height="24" />
        </button>
        <h1 class="page-title">Detail Pesanan</h1>
      </div>

      <div v-if="loading" class="loading-state">
        <p>Memuat…</p>
      </div>

      <p v-else-if="error" class="tracking-error" role="alert">{{ error }}</p>

      <template v-else-if="order">
        <!-- Pickup Info Card -->
        <section class="pickup-card">
          <div class="pickup-main">
            <div class="pickup-block">
              <span class="pickup-label">Nomor Antrian</span>
              <span class="pickup-big">{{ order.queue_number }}</span>
            </div>
            <div class="pickup-divider"></div>
            <div class="pickup-block">
              <span class="pickup-label">Kode Pickup</span>
              <span class="pickup-big pickup-code">{{ order.pickup_code }}</span>
            </div>
          </div>
          <StatusBadge :status="order.status" />
          <p v-if="!isFinalStatus" class="polling-hint">
            <Icon icon="mdi:loading" width="14" height="14" class="spin" />
            Status diperbarui otomatis
          </p>
        </section>

        <!-- Order Items -->
        <section class="items-card">
          <h2 class="card-title">{{ order.store_name }}</h2>
          <div class="item-list">
            <div v-for="item in order.items" :key="item.id" class="item-row">
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
            <span>Total</span>
            <span>{{ formatRupiah(order.total) }}</span>
          </div>
        </section>

        <!-- Seller Note -->
        <section v-if="order.seller_note" class="note-card">
          <div class="note-header">
            <Icon icon="mdi:note-text-outline" width="18" height="18" />
            <span class="note-title">Catatan untuk Penjual</span>
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
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.12);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pickup-main {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  justify-content: center;
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
  height: 50px;
  background-color: #e5e7eb;
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
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.12);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
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
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.note-card {
  background-color: var(--color-surface);
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.12);
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
  border-left: 3px solid var(--color-primary);
}
</style>
