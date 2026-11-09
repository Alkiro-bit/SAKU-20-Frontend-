<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import AdminSidebar from '@/components/layout/AdminSidebar.vue';
import AdminHeader from '@/components/layout/AdminHeader.vue';
import { apiClient, getApiErrorMessage } from '@/services/api';
import { usePolling } from '@/composables/usePolling';

const orders = ref([]);
const store = ref(null);
const sales = ref(null);
const loading = ref(true);
const refreshing = ref(false);
const hasLoadedOrders = ref(false);
const ordersError = ref('');
const salesError = ref('');
const storeError = ref('');
const actionError = ref('');
const activeFilter = ref('all');
const searchQuery = ref('');
const updatingOrderIds = ref(new Set());
const orderToCancel = ref(null);
const cancelReason = ref('');
const isSidebarCollapsed = ref(false);
const now = ref(new Date());
let clockTimer = null;

const filters = [
  { key: 'all', label: 'All' },
  { key: 'diproses', label: 'Pending' },
  { key: 'siap_diambil', label: 'Ready' },
  { key: 'selesai', label: 'Completed' },
  { key: 'dibatalkan', label: 'Canceled' },
];

const businessDate = computed(() => getJakartaDateKey(now.value));
const formattedDate = computed(() =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now.value),
);
const latestUpdate = ref(null);
const updatedLabel = computed(() => {
  if (!latestUpdate.value) return 'Auto-refresh active';
  const seconds = Math.max(0, Math.floor((now.value - latestUpdate.value) / 1000));
  return `Updated ${seconds}s ago`;
});

const orderedOrders = computed(() =>
  [...orders.value].sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a)),
);
const counts = computed(() => {
  const result = { all: hasLoadedOrders.value ? orders.value.length : null };
  for (const filter of filters.slice(1)) {
    result[filter.key] = orders.value.filter(
      (order) => normalizeStatus(order.status) === filter.key,
    ).length;
  }
  if (!hasLoadedOrders.value) {
    for (const filter of filters.slice(1)) result[filter.key] = null;
  }
  return result;
});
const visibleOrders = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return orderedOrders.value.filter((order) => {
    if (activeFilter.value !== 'all' && normalizeStatus(order.status) !== activeFilter.value) {
      return false;
    }
    if (!query) return true;

    const searchable = [
      order.id,
      getQueueNumber(order),
      getCustomerName(order),
      ...getOrderItems(order).map((item) => getItemName(item)),
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(' ')
      .toLocaleLowerCase();
    return searchable.includes(query);
  });
});

const newestOrdersCount = computed(() =>
  hasLoadedOrders.value ? counts.value.diproses || 0 : '—',
);
const readyOrdersCount = computed(() =>
  hasLoadedOrders.value ? counts.value.siap_diambil || 0 : '—',
);
const completedOrdersCount = computed(() =>
  hasLoadedOrders.value ? counts.value.selesai || 0 : '—',
);

function getJakartaDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getOrderTimestamp(order) {
  const value = order.created_at || order.createdAt || order.order_time || order.ordered_at;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeStatus(status) {
  const value = String(status || '').toLowerCase();
  const aliases = {
    pending: 'diproses',
    processing: 'diproses',
    ready: 'siap_diambil',
    completed: 'selesai',
    canceled: 'dibatalkan',
    cancelled: 'dibatalkan',
  };
  return aliases[value] || value;
}

function statusLabel(status) {
  const labels = {
    diproses: 'Pending',
    siap_diambil: 'Ready',
    selesai: 'Completed',
    dibatalkan: 'Canceled',
  };
  return labels[normalizeStatus(status)] || 'Unknown';
}

function getCustomerName(order) {
  return (
    order.guest_name ||
    order.customer_name ||
    order.buyer_name ||
    order.user?.name ||
    order.customer?.name ||
    order.buyer?.name ||
    'Walk-in Customer'
  );
}

function getQueueNumber(order) {
  return order.queue_number ?? order.queueNumber ?? order.pickup_code ?? order.id ?? '—';
}

function getOrderItems(order) {
  const items = order.items || order.order_items || [];
  return Array.isArray(items) ? items : [];
}

function getItemName(item) {
  return item.name || item.product_name || item.product?.name || item.menu_item?.name || 'Product';
}

function getItemQuantity(item) {
  const quantity = Number(item.quantity ?? item.qty ?? 0);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

function getItemTotal(item) {
  const rawLineTotal = item.subtotal ?? item.line_total;
  if (rawLineTotal !== null && rawLineTotal !== undefined && rawLineTotal !== '') {
    const lineTotal = Number(rawLineTotal);
    if (Number.isFinite(lineTotal)) return lineTotal;
  }
  const itemPrice = item.price ?? item.unit_price ?? item.product?.price;
  if (itemPrice === null || itemPrice === undefined || itemPrice === '') return null;
  const price = Number(itemPrice);
  return Number.isFinite(price) ? price * getItemQuantity(item) : null;
}

function getItemNote(item) {
  return item.note || item.customer_note || item.seller_note || '';
}

function formatRupiah(value) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function getErrorMessage(error, fallback) {
  return error instanceof Error && !error.response
    ? error.message
    : getApiErrorMessage(error, fallback);
}

function formatOrderTime(order) {
  const timestamp = getOrderTimestamp(order);
  if (!timestamp) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(timestamp);
}

function paymentLabel(order) {
  const paymentMethod = order.payment_method || order.payment?.method;
  if (!paymentMethod) return 'Total Bayar (QRIS)';
  return `Total Bayar (${String(paymentMethod).toUpperCase()})`;
}

async function fetchAllOrders(date) {
  const items = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await apiClient.get('/admin/orders', {
      params: { from: date, to: date, page, per_page: 25 },
    });
    const pageItems = response.data?.data;
    if (!Array.isArray(pageItems)) {
      throw new Error('Respons pesanan tidak berisi daftar data yang valid.');
    }
    items.push(...pageItems);

    const meta = response.data?.meta;
    if (Number.isInteger(meta?.current_page) && Number.isInteger(meta?.last_page)) {
      const nextPage = meta.current_page + 1;
      hasNextPage = meta.current_page < meta.last_page;
      if (hasNextPage && nextPage <= page) {
        throw new Error('Pagination pesanan tidak maju ke halaman berikutnya.');
      }
      page = nextPage;
    } else if (response.data?.links && Object.hasOwn(response.data.links, 'next')) {
      hasNextPage = Boolean(response.data.links.next);
      page += 1;
    } else {
      hasNextPage = false;
    }
  }

  return items;
}

async function fetchSales(date) {
  const response = await apiClient.get('/admin/reports/finance', {
    params: { from: date, to: date },
  });
  const gross = Number(response.data?.data?.gross);
  if (!Number.isFinite(gross)) {
    throw new Error('Laporan keuangan tidak memiliki data.gross yang valid.');
  }
  return gross;
}

async function fetchStore() {
  const response = await apiClient.get('/admin/store');
  return response.data?.data || null;
}

async function refreshData() {
  if (refreshing.value || updatingOrderIds.value.size > 0) return;
  refreshing.value = true;
  actionError.value = '';
  const date = businessDate.value;

  const [ordersResult, salesResult, storeResult] = await Promise.allSettled([
    fetchAllOrders(date),
    fetchSales(date),
    fetchStore(),
  ]);

  if (ordersResult.status === 'fulfilled') {
    orders.value = ordersResult.value;
    hasLoadedOrders.value = true;
    ordersError.value = '';
  } else {
    ordersError.value = getErrorMessage(ordersResult.reason, 'Failed to load orders.');
  }

  if (salesResult.status === 'fulfilled') {
    sales.value = salesResult.value;
    salesError.value = '';
  } else {
    salesError.value = getErrorMessage(salesResult.reason, 'Failed to load sales.');
  }

  if (storeResult.status === 'fulfilled') {
    store.value = storeResult.value;
    storeError.value = '';
  } else {
    storeError.value = getErrorMessage(storeResult.reason, 'Failed to load store details.');
  }

  if (ordersResult.status === 'fulfilled' && salesResult.status === 'fulfilled') {
    latestUpdate.value = new Date();
  }
  loading.value = false;
  refreshing.value = false;
}

function setOrderStatusLocally(orderId, status) {
  orders.value = orders.value.map((order) =>
    order.id === orderId ? { ...order, status } : order,
  );
}

async function updateOrderStatus(order, status) {
  if (updatingOrderIds.value.has(order.id)) return;
  const reason = cancelReason.value.trim();
  if (status === 'dibatalkan' && !reason) {
    actionError.value = 'Cancellation reason is required.';
    return;
  }
  if (status === 'dibatalkan' && reason.length > 1000) {
    actionError.value = 'Cancellation reason must not exceed 1000 characters.';
    return;
  }
  updatingOrderIds.value = new Set([...updatingOrderIds.value, order.id]);
  actionError.value = '';

  try {
    const payload = { status };
    if (status === 'dibatalkan') payload.cancel_reason = reason;
    await apiClient.patch(`/admin/orders/${order.id}/status`, payload);
    setOrderStatusLocally(order.id, status);
    orderToCancel.value = null;
    cancelReason.value = '';
    updatingOrderIds.value.delete(order.id);
    updatingOrderIds.value = new Set(updatingOrderIds.value);
    await refreshData();
  } catch (error) {
    actionError.value = getErrorMessage(error, 'Failed to update order status.');
  } finally {
    if (updatingOrderIds.value.has(order.id)) {
      updatingOrderIds.value.delete(order.id);
      updatingOrderIds.value = new Set(updatingOrderIds.value);
    }
  }
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

const polling = usePolling(refreshData, 5000, {
  pauseWhenHidden: true,
  runImmediately: false,
});

onMounted(async () => {
  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 1000);
  await refreshData();
  polling.start();
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <AdminSidebar v-model:collapsed="isSidebarCollapsed" />

    <div class="admin-main">
      <AdminHeader
        :store="store"
        fallback-name="Store"
        :refreshing="refreshing"
        :refresh-disabled="refreshing || updatingOrderIds.size > 0"
        @toggle-sidebar="toggleSidebar"
        @refresh="refreshData"
      />

      <main class="page-content">
        <section class="summary-panel" aria-labelledby="orders-title">
          <div class="summary-heading">
            <div>
              <h1 id="orders-title">Orders</h1>
              <p>{{ formattedDate }}</p>
            </div>
            <span class="updated-label" role="status">{{ updatedLabel }}</span>
          </div>

          <div class="summary-grid" :aria-busy="loading">
            <article class="summary-card summary-card--new">
              <div class="summary-card-title">
                <Icon icon="mdi:bell" aria-hidden="true" />
                <span>Newest Orders</span>
              </div>
              <div class="summary-value">
                <strong>{{ newestOrdersCount }}</strong>
                <span>Orders</span>
              </div>
            </article>
            <article class="summary-card summary-card--ready">
              <div class="summary-card-title">
                <Icon icon="mdi:check" aria-hidden="true" />
                <span>Ready for Pickup</span>
              </div>
              <div class="summary-value">
                <strong>{{ readyOrdersCount }}</strong>
                <span>Orders</span>
              </div>
            </article>
            <article class="summary-card summary-card--completed">
              <div class="summary-card-title">
                <Icon icon="mdi:cart-check" aria-hidden="true" />
                <span>Completed</span>
              </div>
              <div class="summary-value">
                <strong>{{ completedOrdersCount }}</strong>
              </div>
            </article>
            <article class="summary-card summary-card--sales">
              <div class="summary-card-title">
                <Icon icon="mdi:credit-card" aria-hidden="true" />
                <span>Total Sales</span>
              </div>
              <div class="summary-value">
                <strong>{{ formatRupiah(sales) }}</strong>
              </div>
            </article>
          </div>
        </section>

        <section class="orders-panel" aria-labelledby="order-list-title">
          <div class="orders-heading">
            <div>
              <h2 id="order-list-title">Order List</h2>
              <p>Manage orders based on the order in which they are received.</p>
            </div>
            <label class="search-field">
              <Icon icon="mdi:magnify" width="18" height="18" aria-hidden="true" />
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search"
                aria-label="Search orders"
              />
            </label>
          </div>

          <div class="filter-tabs" role="group" aria-label="Filter orders by status">
            <button
              v-for="filter in filters"
              :key="filter.key"
              type="button"
              class="filter-tab"
              :class="{ 'is-active': activeFilter === filter.key }"
              :aria-pressed="activeFilter === filter.key"
              @click="activeFilter = filter.key"
            >
              <span>{{ filter.label }}</span>
              <span class="filter-count" :class="{ 'is-active': activeFilter === filter.key }">
                {{ counts[filter.key] ?? '—' }}
              </span>
            </button>
          </div>

          <div v-if="ordersError || salesError || storeError || actionError" class="error-banner" role="alert">
            <Icon icon="mdi:alert-circle-outline" width="20" height="20" aria-hidden="true" />
            <span>{{ [ordersError, salesError, storeError, actionError].filter(Boolean).join(' ') }}</span>
            <button type="button" @click="refreshData">Retry</button>
          </div>

          <div v-if="loading" class="orders-grid" aria-label="Loading orders">
            <div v-for="index in 3" :key="index" class="order-skeleton"></div>
          </div>
          <div v-else-if="visibleOrders.length" class="orders-grid">
            <article v-for="order in visibleOrders" :key="order.id" class="order-card">
              <header class="order-card-header">
                <span class="queue-number">{{ getQueueNumber(order) }}</span>
                <div class="customer-details">
                  <h3>{{ getCustomerName(order) }}</h3>
                  <p>
                    <Icon icon="mdi:clock-outline" width="12" height="12" aria-hidden="true" />
                    {{ formatOrderTime(order) }}
                  </p>
                </div>
                <StatusBadge
                  class="order-status"
                  :status="order.status"
                  :label="statusLabel(order.status)"
                />
              </header>

              <div class="order-card-body">
                <div v-if="getOrderItems(order).length" class="item-list">
                  <div
                    v-for="(item, index) in getOrderItems(order)"
                    :key="item.id || item.product_id || `${order.id}-${index}`"
                    class="item-row"
                  >
                    <span class="item-quantity">{{ getItemQuantity(item) }}x</span>
                    <div class="item-description">
                      <span class="item-name">{{ getItemName(item) }}</span>
                      <span v-if="getItemNote(item)" class="item-note">“{{ getItemNote(item) }}”</span>
                    </div>
                    <span class="item-price">{{ formatRupiah(getItemTotal(item)) }}</span>
                  </div>
                </div>
                <p v-else class="no-items">Order details unavailable.</p>

                <div class="order-total">
                  <span>{{ paymentLabel(order) }}</span>
                  <strong>{{ formatRupiah(order.total) }}</strong>
                </div>
              </div>

              <footer class="order-card-footer">
                <template v-if="normalizeStatus(order.status) === 'diproses'">
                  <button
                    type="button"
                    class="order-action action-ready"
                    :disabled="updatingOrderIds.has(order.id)"
                    @click="updateOrderStatus(order, 'siap_diambil')"
                  >
                    <Icon icon="mdi:check-circle" width="15" height="15" aria-hidden="true" />
                    Ready for Pickup
                  </button>
                  <button
                    type="button"
                    class="cancel-icon-button"
                    :disabled="updatingOrderIds.has(order.id)"
                    :aria-label="`Cancel order ${getQueueNumber(order)}`"
                    @click="(orderToCancel = order, cancelReason = '', actionError = '')"
                  >
                    <Icon icon="mdi:close-circle" width="16" height="16" />
                  </button>
                </template>
                <button
                  v-else-if="normalizeStatus(order.status) === 'siap_diambil'"
                  type="button"
                  class="order-action action-finish"
                  :disabled="updatingOrderIds.has(order.id)"
                  @click="updateOrderStatus(order, 'selesai')"
                >
                  <Icon icon="mdi:check-circle" width="15" height="15" aria-hidden="true" />
                  Finish Order
                </button>
                <p v-else-if="normalizeStatus(order.status) === 'selesai'" class="final-message">
                  <Icon icon="mdi:check-circle" width="14" height="14" aria-hidden="true" />
                  The order has been picked up.
                </p>
                <p v-else class="final-message canceled-message">
                  <Icon icon="mdi:close-circle" width="14" height="14" aria-hidden="true" />
                  This order was canceled.
                </p>
              </footer>
            </article>
          </div>
          <div v-else-if="ordersError" class="empty-state">
            <Icon icon="mdi:alert-circle-outline" width="32" height="32" aria-hidden="true" />
            <p>Orders could not be loaded.</p>
          </div>
          <div v-else class="empty-state">
            <Icon icon="mdi:clipboard-text-outline" width="36" height="36" aria-hidden="true" />
            <p>{{ searchQuery ? 'No orders match your search.' : 'No orders found.' }}</p>
          </div>
        </section>
      </main>
    </div>

    <div
      v-if="orderToCancel"
      class="dialog-backdrop"
      @click.self="(orderToCancel = null, cancelReason = '', actionError = '')"
    >
      <section
        class="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <div class="dialog-icon">
          <Icon icon="mdi:alert-circle-outline" width="26" height="26" aria-hidden="true" />
        </div>
        <h2 id="cancel-dialog-title">Cancel this order?</h2>
        <p id="cancel-dialog-description">
          Order #{{ getQueueNumber(orderToCancel) }} will be marked as canceled.
        </p>
        <label class="cancel-reason-field">
          Cancellation reason
          <textarea
            v-model="cancelReason"
            maxlength="1000"
            rows="3"
            placeholder="Enter the reason for cancellation"
          />
        </label>
        <div class="dialog-actions">
          <button
            type="button"
            class="dialog-keep"
            @click="(orderToCancel = null, cancelReason = '', actionError = '')"
          >
            Keep Order
          </button>
          <button
            type="button"
            class="dialog-cancel"
            :disabled="updatingOrderIds.has(orderToCancel.id) || !cancelReason.trim() || cancelReason.length > 1000"
            @click="updateOrderStatus(orderToCancel, 'dibatalkan')"
          >
            {{ updatingOrderIds.has(orderToCancel.id) ? 'Canceling…' : 'Cancel Order' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f0f0f0;
}

.admin-main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}

.page-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 24px 32px;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 24px;
  border-radius: 5px;
  background: linear-gradient(105deg, #003a6a 0%, #008cff 100%);
  box-shadow: 0 3px 7px rgba(0, 0, 0, 0.25);
}

.summary-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.summary-heading h1 {
  color: #fff;
  font-family: var(--font-family-base);
  font-size: 34px;
  font-weight: 600;
  line-height: 1.15;
}

.summary-heading p {
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
}

.updated-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.summary-card {
  display: flex;
  min-height: 68px;
  flex-direction: column;
  gap: 6px;
  padding: 9px 10px;
  border-radius: 5px;
  background: #fff;
}

.summary-card-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #008cff;
  font-size: 13px;
  white-space: nowrap;
}

.summary-card-title :deep(svg) {
  flex: 0 0 auto;
}

.summary-card--new .summary-card-title { color: #f0c400; }
.summary-card--ready .summary-card-title { color: #00c51b; }
.summary-card--completed .summary-card-title { color: #008cff; }
.summary-card--sales .summary-card-title { color: #182bff; }

.summary-value {
  display: flex;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.summary-value strong {
  font-size: 20px;
  font-weight: 600;
}

.summary-value span {
  color: #999;
  font-size: 9px;
}

.summary-card--sales .summary-value strong {
  font-size: 18px;
}

.orders-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 440px;
  padding: 16px;
  border-radius: 5px;
  background: #fff;
}

.orders-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 12px;
}

.orders-heading h2 {
  font-family: var(--font-family-base);
  font-size: 22px;
  font-weight: 500;
}

.orders-heading p {
  color: #999;
  font-size: 10px;
}

.search-field {
  display: flex;
  width: min(300px, 42%);
  min-height: 36px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid #aaa;
  border-radius: 9px;
  color: #aaa;
}

.search-field input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: var(--color-text);
  background: transparent;
  font: inherit;
  font-size: 13px;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 3px;
  border-bottom: 2px solid transparent;
  color: #777;
  font-size: 11px;
  white-space: nowrap;
}

.filter-tab.is-active {
  border-bottom-color: #008cff;
  color: #008cff;
}

.filter-count {
  display: inline-flex;
  min-width: 17px;
  height: 17px;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-radius: 50%;
  background: #777;
  color: #fff;
  font-size: 9px;
}

.filter-count.is-active {
  background: #008cff;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-content: start;
  gap: 8px;
  padding-bottom: 4px;
}

.order-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #d1d1d1;
  border-radius: 5px;
  background: #f5f5f5;
}

.order-card-header {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border-bottom: 1px solid #d7d7d7;
  background: #f1f1f1;
}

.queue-number {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: #d7edff;
  color: #008cff;
  font-weight: 600;
}

.customer-details {
  min-width: 0;
  flex: 1;
}

.customer-details h3 {
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-details p {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #999;
  font-size: 8px;
}

.order-status {
  flex: 0 0 auto;
}

.order-status :deep(.status-badge) {
  padding: 3px 8px;
  border-radius: 9px;
  font-size: 8px;
}

.order-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 7px 8px 0;
}

.item-list {
  display: flex;
  flex-direction: column;
}

.item-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  border-bottom: 1px solid #d8d8d8;
}

.item-quantity {
  display: inline-flex;
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: #e5e5e5;
  color: #333;
  font-size: 9px;
}

.item-description {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.item-name {
  overflow: hidden;
  font-size: 10px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-note {
  overflow: hidden;
  color: #777;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  flex: 0 0 auto;
  color: #777;
  font-size: 9px;
}

.no-items {
  padding: 10px 0;
  color: #888;
  font-size: 10px;
}

.order-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 36px;
  margin-top: auto;
  padding: 0 8px;
  border-top: 1px solid #d8d8d8;
  color: #777;
  font-size: 9px;
}

.order-total strong {
  color: #333;
  font-size: 10px;
}

.order-card-footer {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 7px;
  padding: 6px 7px;
  border-top: 1px solid #d0d0d0;
}

.order-action {
  display: flex;
  min-width: 0;
  min-height: 27px;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid;
  border-radius: 5px;
  font-family: var(--font-family-brand);
  font-size: 10px;
  font-weight: 600;
}

.order-action:disabled,
.cancel-icon-button:disabled,
.dialog-actions button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.action-ready {
  border-color: #7ce183;
  background: rgba(0, 215, 7, 0.18);
  color: #00b91a;
}

.action-finish {
  border-color: #78bfff;
  background: rgba(0, 140, 255, 0.14);
  color: #008cff;
}

.cancel-icon-button {
  display: flex;
  width: 27px;
  height: 27px;
  flex: 0 0 27px;
  align-items: center;
  justify-content: center;
  border: 1px solid #ff7b7b;
  border-radius: 5px;
  background: rgba(255, 0, 0, 0.1);
  color: #f00;
}

.final-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  color: #888;
  font-size: 10px;
}

.canceled-message {
  color: #b42318;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  padding: 10px 12px;
  border: 1px solid #fee4e2;
  border-radius: 6px;
  background: #fef3f2;
  color: #b42318;
  font-size: 12px;
}

.error-banner span {
  flex: 1;
}

.error-banner button {
  color: #b42318;
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
}

.empty-state {
  display: flex;
  flex: 1;
  min-height: 180px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #999;
  font-size: 13px;
}

.order-skeleton {
  height: 170px;
  border-radius: 5px;
  background: linear-gradient(90deg, #eee 25%, #f8f8f8 50%, #eee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.confirm-dialog {
  width: min(100%, 380px);
  padding: 24px;
  border-radius: 10px;
  background: #fff;
  box-shadow: var(--shadow-md);
}

.dialog-icon {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  border-radius: 50%;
  background: #fff1f0;
  color: #b42318;
}

.confirm-dialog h2 {
  margin-bottom: 7px;
  font-size: 18px;
}

.confirm-dialog p {
  color: #777;
  font-size: 13px;
  line-height: 1.5;
}

.cancel-reason-field {
  display: grid;
  gap: 6px;
  margin-top: 16px;
  color: #444;
  font-size: 12px;
  font-weight: 600;
}

.cancel-reason-field textarea {
  width: 100%;
  min-height: 78px;
  padding: 9px;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: vertical;
  font: inherit;
  font-weight: 400;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
}

.dialog-actions button {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
}

.dialog-keep {
  border: 1px solid #ccc;
}

.dialog-cancel {
  background: #e53935;
  color: #fff;
}

@media (max-width: 1100px) {
  .page-content {
    padding: 20px;
  }

  .summary-grid {
    gap: 12px;
  }

  .orders-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-content {
    gap: 10px;
    padding: 14px 12px;
  }

  .summary-panel {
    padding: 18px 14px;
  }

  .summary-heading h1 {
    font-size: 28px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .summary-card {
    min-height: 64px;
  }

  .summary-card-title {
    font-size: 11px;
  }

  .summary-value strong {
    font-size: 18px;
  }

  .orders-panel {
    min-height: 0;
    padding: 12px;
  }

  .orders-heading {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .orders-heading h2 {
    font-size: 20px;
  }

  .search-field {
    width: 100%;
  }

  .filter-tabs {
    gap: 8px 12px;
  }

  .orders-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 380px) {
  .admin-sidebar {
    flex-basis: 48px;
    width: 48px;
  }

  .topbar {
    padding: 8px 10px;
  }

  .refresh-button span {
    display: none;
  }

  .summary-card-title {
    font-size: 10px;
  }
}
</style>
