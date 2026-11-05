<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { apiClient, getApiErrorMessage } from '@/services/api';

const router = useRouter();
const orders = ref([]);
const loading = ref(true);
const error = ref('');

async function fetchOrders() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiClient.get('/orders');
    orders.value = res.data.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat riwayat pesanan.');
  } finally {
    loading.value = false;
  }
}

function viewOrder(order) {
  router.push(`/orders/${order.id}`);
}

// ponytail: status mapping uses backend enum values (diproses, siap_diambil, selesai, dibatalkan)
function isActiveStatus(status) {
  return ['diproses', 'siap_diambil'].includes(status);
}

onMounted(fetchOrders);
</script>

<template>
  <div class="orders-view">
    <MobileHeader />

    <main class="main-content">
      <div class="page-title-wrap">
        <h1 class="page-title">My Orders</h1>
      </div>

      <p v-if="error" class="orders-error" role="alert">{{ error }}</p>

      <div v-if="loading" class="orders-empty">
        <p>Memuat pesanan…</p>
      </div>

      <div v-else-if="orders.length === 0" class="orders-empty">
        <p>Belum ada pesanan.</p>
      </div>

      <div v-else class="orders-list">
        <div
          v-for="order in orders"
          :key="'order-' + order.id"
          class="order-card"
          @click="viewOrder(order)"
        >
          <div class="order-header">
            <span class="store-name">{{ order.store_name }}</span>
            <StatusBadge :status="order.status" />
          </div>

          <div class="order-body">
            <div class="product-info-col">
              <div v-if="order.items && order.items[0]" class="product-thumb">
                <img :src="order.items[0].image" :alt="order.items[0].name" loading="lazy" />
              </div>
              <div class="product-meta">
                <p class="product-name">{{ order.items?.[0]?.name || 'Produk' }}</p>
                <p v-if="order.items && order.items.length > 1" class="product-qty">
                  +{{ order.items.length - 1 }} produk lainnya
                </p>
              </div>
            </div>

            <div class="pickup-col">
              <span class="pickup-label">Pickup Number:</span>
              <span
                class="pickup-number"
                :class="{
                  'is-active': isActiveStatus(order.status),
                  'is-muted': !isActiveStatus(order.status),
                }"
              >
                {{ order.queue_number }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.orders-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 85px;
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
  font-size: 26px;
  color: var(--color-text);
}

.orders-error {
  color: #b42318;
  font-size: var(--font-size-sm);
  text-align: center;
  padding: 8px;
}

.orders-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: var(--space-3) 0;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.order-card {
  background-color: var(--color-surface);
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
}

.order-card:hover {
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.18);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 0.5px solid #d1d5db;
}

.store-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 16px;
  color: var(--color-text);
}

.order-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
}

.product-info-col {
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
  font-size: 16px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-qty {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.pickup-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 110px;
  flex-shrink: 0;
  text-align: center;
}

.pickup-label {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 10px;
  color: var(--color-text);
  margin-bottom: 2px;
}

.pickup-number {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 34px;
  line-height: 1;
}

.pickup-number.is-active {
  color: var(--color-primary);
}

.pickup-number.is-muted {
  color: var(--color-text-muted);
}
</style>
