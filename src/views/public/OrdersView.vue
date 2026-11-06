<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { apiClient, getApiErrorMessage, resolveImageUrl } from '@/services/api';

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
    error.value = getApiErrorMessage(e, 'Failed to load orders.');
  } finally {
    loading.value = false;
  }
}

function viewOrder(order) {
  router.push(`/orders/${order.id}`);
}

function getStoreName(order) {
  return order.store_name || order.store?.name || 'Toko';
}

function getOrderItems(order) {
  return Array.isArray(order.items) ? order.items : [];
}

function getItemImage(item) {
  return resolveImageUrl(item?.image || null);
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
        <p>Loading orders…</p>
      </div>

      <div v-else-if="orders.length === 0" class="orders-empty">
        <p>No orders found.</p>
      </div>

      <div v-else class="orders-list">
        <div
          v-for="order in orders"
          :key="'order-' + order.id"
          class="order-card"
          @click="viewOrder(order)"
        >
          <div class="order-header">
            <span class="store-name">{{ getStoreName(order) }}</span>
            <StatusBadge :status="order.status" />
          </div>

          <div class="order-body">
            <div class="product-list">
              <div
                v-for="(item, idx) in getOrderItems(order)"
                :key="'order-' + order.id + '-item-' + (item.id || item.product_id || idx)"
                class="product-row"
              >
                <div class="product-thumb">
                  <img
                    :src="getItemImage(item)"
                    :alt="item.name || 'Produk'"
                    loading="lazy"
                  />
                </div>
                <div class="product-meta">
                  <p class="product-name">{{ item.name || 'Produk' }}</p>
                  <p class="product-qty">{{ item.quantity ? `${item.quantity}x` : '' }}</p>
                </div>
              </div>

              <div v-if="getOrderItems(order).length === 0" class="product-row">
                <div class="product-thumb">
                  <img :src="getItemImage(null)" alt="Produk" loading="lazy" />
                </div>
                <div class="product-meta">
                  <p class="product-name">Produk</p>
                </div>
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

          <div v-if="order.seller_note" class="order-note-row">
            <Icon icon="mdi:note-text-outline" width="14" height="14" class="note-icon" />
            <span class="note-text">Catatan: {{ order.seller_note }}</span>
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
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.product-thumb {
  width: 56px;
  height: 56px;
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

.order-note-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 14px;
  background-color: #f9fafb;
  border-top: 0.5px solid #e5e7eb;
}

.note-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-primary);
}

.note-text {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  color: #4b5563;
  line-height: 1.4;
  word-break: break-word;
}
</style>
