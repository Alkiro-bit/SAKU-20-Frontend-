<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';
import AdminSidebar from '@/components/layout/AdminSidebar.vue';
import AdminHeader from '@/components/layout/AdminHeader.vue';
import { apiClient, getApiErrorMessage } from '@/services/api';
import { usePolling } from '@/composables/usePolling';

const store = ref(null);
const orders = ref([]);
const todaySales = ref(0);
const activeProductsCount = ref(0);
const loading = ref(true);
const storeError = ref('');
const storeToggleError = ref('');
const productsError = ref('');
const ordersError = ref('');
const financeError = ref('');
const error = computed(() =>
  [storeError.value, storeToggleError.value, productsError.value, ordersError.value, financeError.value]
    .filter(Boolean)
    .join(' '),
);
const togglingStore = ref(false);
const refreshingLiveData = ref(false);
const lastUpdatedAt = ref(null);
const currentTime = ref(new Date());
const isSidebarCollapsed = ref(false);
const dashboardDate = computed(() =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentTime.value),
);
const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return 'Auto-refresh aktif';
  const seconds = Math.max(0, Math.floor((currentTime.value - lastUpdatedAt.value) / 1000));
  return `Auto-refresh · updated ${seconds}s ago`;
});
function getOrderTimestamp(order) {
  const timestamp = new Date(order.created_at).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

const displayedOrders = computed(() =>
  [...orders.value]
    .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a))
    .slice(0, 8)
    .map((order) => {
      const status = String(order.status || '').toLowerCase();
      const statusLabels = {
        diproses: 'Pending',
        siap_diambil: 'Ready',
        selesai: 'Completed',
        dibatalkan: 'Cancelled',
      };

      return {
        id: order.id,
        queueNumber: order.queue_number ?? '—',
        name: order.customer_name ?? '—',
        time: formatOrderTime(order.created_at),
        price:
          order.total === undefined || order.total === null ? '—' : formatRupiah(order.total),
        status: statusLabels[status] || 'Unknown',
      };
    }),
);

// Format Rupiah
function formatRupiah(val) {
  const amount = Number(val);
  if (!Number.isFinite(amount)) return 'Rp 0';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

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

function formatOrderTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

// Stats calculation
const totalOrdersCount = computed(
  () => orders.value.filter((order) => order.status !== 'dibatalkan').length,
);

const completedOrdersCount = computed(
  () => orders.value.filter((order) => order.status === 'selesai').length,
);

// Fetch Store Details
async function fetchStore() {
  const res = await apiClient.get('/admin/store');
  const storeData = res.data?.data;
  if (!storeData || typeof storeData.is_open !== 'boolean') {
    throw new Error('Respons status toko tidak valid.');
  }
  store.value = storeData;
}

async function toggleStore() {
  if (!store.value || togglingStore.value) return;

  togglingStore.value = true;
  storeToggleError.value = '';
  const nextState = !store.value.is_open;

  try {
    const res = await apiClient.patch('/admin/store', { is_open: nextState });
    const updatedStore = res.data?.data;
    store.value = {
      ...store.value,
      is_open: typeof updatedStore?.is_open === 'boolean' ? updatedStore.is_open : nextState,
    };
  } catch (e) {
    storeToggleError.value = getApiErrorMessage(e, 'Gagal memperbarui status toko.');
  } finally {
    togglingStore.value = false;
  }
}

async function fetchAllPages(endpoint, params = {}) {
  const items = [];
  let page = 1;
  let firstMeta = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const res = await apiClient.get(endpoint, {
      params: { ...params, page, per_page: params.per_page || 25 },
    });
    const pageItems = res.data?.data;
    if (!Array.isArray(pageItems)) {
      throw new Error(`Respons ${endpoint} tidak berisi daftar data yang valid.`);
    }

    items.push(...pageItems);
    const meta = res.data?.meta;
    if (page === 1) firstMeta = meta || null;

    if (Number.isInteger(meta?.current_page) && Number.isInteger(meta?.last_page)) {
      hasNextPage = meta.current_page < meta.last_page;
      const nextPage = meta.current_page + 1;
      if (hasNextPage && nextPage <= page) {
        throw new Error(`Pagination ${endpoint} tidak maju ke halaman berikutnya.`);
      }
      page = nextPage;
    } else if (res.data?.links && Object.hasOwn(res.data.links, 'next')) {
      hasNextPage = Boolean(res.data.links.next);
      page += 1;
    } else {
      hasNextPage = false;
    }
  }

  return { items, meta: firstMeta };
}

async function fetchOrdersForDate(date) {
  const { items } = await fetchAllPages('/admin/orders', {
    from: date,
    to: date,
    per_page: 25,
  });
  return items;
}

async function fetchSalesForDate(date) {
  const res = await apiClient.get('/admin/reports/finance', {
    params: { from: date, to: date },
  });
  const gross = Number(res.data?.data?.gross);
  if (!Number.isFinite(gross)) {
    throw new Error('Respons laporan keuangan tidak memiliki data.gross yang valid.');
  }
  return gross;
}

async function fetchActiveProductsCount() {
  let filtered = null;
  try {
    filtered = await fetchAllPages('/admin/products', {
      is_active: true,
      per_page: 100,
    });
  } catch (e) {
    const status = e?.response?.status;
    if (![400, 422].includes(status)) throw e;
  }

  if (filtered && filtered.items.every((product) => product.is_active === true)) {
    const rawTotal = filtered.meta?.total;
    const total = Number(rawTotal);
    if (rawTotal !== undefined && rawTotal !== null && rawTotal !== '' && Number.isFinite(total)) {
      return total;
    }
  }

  const allProducts = await fetchAllPages('/admin/products', { per_page: 100 });
  return allProducts.items.filter((product) => product.is_active === true).length;
}

function errorMessage(reason, fallback) {
  return reason instanceof Error && !reason.response
    ? reason.message
    : getApiErrorMessage(reason, fallback);
}

async function refreshLiveData() {
  if (refreshingLiveData.value) return;
  refreshingLiveData.value = true;
  const date = getJakartaDateKey(currentTime.value);
  const [ordersResult, salesResult] = await Promise.allSettled([
    fetchOrdersForDate(date),
    fetchSalesForDate(date),
  ]);
  const messages = [];

  if (ordersResult.status === 'fulfilled') {
    orders.value = ordersResult.value;
    ordersError.value = '';
  } else {
    ordersError.value = errorMessage(ordersResult.reason, 'Gagal memuat pesanan.');
    messages.push(ordersError.value);
  }

  if (salesResult.status === 'fulfilled') {
    todaySales.value = salesResult.value;
    financeError.value = '';
  } else {
    financeError.value = errorMessage(salesResult.reason, 'Gagal memuat penjualan hari ini.');
    messages.push(financeError.value);
  }

  if (messages.length === 0) lastUpdatedAt.value = new Date();
  refreshingLiveData.value = false;
}

async function refreshData() {
  if ((loading.value && store.value) || refreshingLiveData.value) return;
  loading.value = true;
  storeError.value = '';
  productsError.value = '';
  const [storeResult, productsResult] = await Promise.allSettled([
    fetchStore(),
    fetchActiveProductsCount(),
  ]);

  if (storeResult.status === 'rejected') {
    storeError.value = errorMessage(storeResult.reason, 'Gagal memuat status toko.');
  }
  if (productsResult.status === 'fulfilled') {
    activeProductsCount.value = productsResult.value;
    productsError.value = '';
  } else {
    productsError.value = errorMessage(productsResult.reason, 'Gagal memuat produk aktif.');
  }

  await refreshLiveData();
  loading.value = false;
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

const polling = usePolling(refreshLiveData, 5000, {
  pauseWhenHidden: true,
  runImmediately: false,
});

let clockTimer = null;

onMounted(async () => {
  clockTimer = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
  await refreshData();
  polling.start();
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <AdminSidebar v-model:collapsed="isSidebarCollapsed" />

    <!-- Main Screen -->
    <div class="admin-main">
      <!-- Header -->
      <AdminHeader
        :store="store"
        fallback-name="Store"
        :refreshing="loading || refreshingLiveData"
        :refresh-disabled="loading || refreshingLiveData || togglingStore"
        @toggle-sidebar="toggleSidebar"
        @refresh="refreshData"
      />
      <!-- Main Content -->
      <main class="dashboard-content">
        <div v-if="error" class="error-banner" role="alert">
          <Icon icon="mdi:alert-circle-outline" width="20" height="20" />
          <span>{{ error }}</span>
          <button type="button" class="retry-btn" @click="refreshData">Coba Lagi</button>
        </div>

        <section class="dashboard-summary" aria-labelledby="dashboard-title" :aria-busy="loading">
          <div class="summary-heading">
            <h1 id="dashboard-title" class="summary-title">Dashboard</h1>
            <p class="summary-date">{{ dashboardDate }}</p>
          </div>

          <div v-if="loading" class="summary-stats summary-stats-loading" aria-hidden="true">
            <div v-for="index in 4" :key="index" class="summary-skeleton"></div>
          </div>

          <div v-else class="summary-stats" role="group" aria-label="Ringkasan toko">
            <article class="summary-stat-card">
              <div class="summary-stat-header">
                <Icon icon="ant-design:wallet-filled" width="16" height="16" aria-hidden="true" />
                <span>Sales Today:</span>
              </div>
              <div class="summary-stat-value">
                <span class="summary-stat-number">{{ formatRupiah(todaySales) }}</span>
              </div>
            </article>

            <article class="summary-stat-card">
              <div class="summary-stat-header">
                <Icon icon="fontisto:checkbox-active" width="18" height="16" aria-hidden="true" />
                <span>Active Products:</span>
              </div>
              <div class="summary-stat-value">
                <span class="summary-stat-number">{{ activeProductsCount }}</span>
                <span class="summary-stat-caption">Products</span>
              </div>
            </article>

            <article class="summary-stat-card">
              <div class="summary-stat-header">
                <Icon icon="bi:bag-fill" width="16" height="16" aria-hidden="true" />
                <span>Orders:</span>
              </div>
              <div class="summary-stat-value">
                <span class="summary-stat-number">{{ totalOrdersCount }}</span>
                <span class="summary-stat-caption">Orders</span>
              </div>
            </article>

            <article class="summary-stat-card">
              <div class="summary-stat-header">
                <Icon icon="bi:cart-check-fill" width="16" height="16" aria-hidden="true" />
                <span>Completed</span>
              </div>
              <div class="summary-stat-value">
                <span class="summary-stat-number">{{ completedOrdersCount }}</span>
              </div>
            </article>
          </div>
        </section>

        <div class="dashboard-lower-grid">
          <section class="orders-section" aria-labelledby="current-orders-title">
            <div class="section-header">
              <div class="title-meta">
                <h2 id="current-orders-title" class="section-title">Current Orders</h2>
                <p class="section-subtitle">Orders that need to be processed immediately</p>
                <p class="last-updated" role="status">{{ lastUpdatedLabel }}</p>
              </div>
              <router-link to="/admin/orders" class="see-all-link">
                <span>See All</span>
                <Icon icon="akar-icons:arrow-up-right" width="20" height="20" aria-hidden="true" />
              </router-link>
            </div>

            <div class="table-container">
              <table class="orders-table">
                <thead>
                  <tr>
                    <th scope="col">Queue Number</th>
                    <th scope="col">Name</th>
                    <th scope="col">Time of Order</th>
                    <th scope="col">Order Price</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="5" class="orders-table-message">Loading orders...</td>
                  </tr>
                  <tr v-else-if="displayedOrders.length === 0">
                    <td colspan="5" class="orders-table-message">No orders today.</td>
                  </tr>
                  <tr v-for="order in displayedOrders" :key="order.id">
                    <td class="queue-number">{{ order.queueNumber }}</td>
                    <td>{{ order.name }}</td>
                    <td>{{ order.time }}</td>
                    <td>{{ order.price }}</td>
                    <td>
                      <span
                        class="order-status"
                        :class="`order-status--${order.status.toLowerCase()}`"
                      >
                        {{ order.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="store-status-section" aria-labelledby="store-status-title">
            <div class="store-status-main">
              <div class="store-status-header">
                <div class="title-meta">
                  <h2 id="store-status-title" class="section-title">Store Status</h2>
                  <p class="section-subtitle">Today’s operations</p>
                </div>
                <button
                  type="button"
                  class="switch-control"
                  :class="store?.is_open ? 'is-active' : 'is-inactive'"
                  :disabled="!store || togglingStore || loading"
                  :aria-checked="store?.is_open === true"
                  :aria-label="
                    store
                      ? store.is_open
                        ? 'Close store'
                        : 'Open store'
                      : loading
                        ? 'Loading store status'
                        : 'Store status unavailable'
                  "
                  :aria-busy="togglingStore"
                  role="switch"
                  @click="toggleStore"
                >
                  <span class="switch-handle"></span>
                </button>
              </div>

              <div
                class="status-banner"
                :class="
                  store
                    ? store.is_open
                      ? 'banner-open'
                      : 'banner-closed'
                    : loading
                      ? 'banner-loading'
                      : 'banner-unavailable'
                "
                role="status"
                aria-live="polite"
              >
                <div class="banner-text">
                  <h3 class="banner-title">
                    {{
                      store
                        ? store.is_open
                          ? 'Open'
                          : 'Closed'
                        : loading
                          ? 'Loading...'
                          : 'Unavailable'
                    }}
                  </h3>
                  <p class="banner-desc">
                    {{
                      store
                        ? store.is_open
                          ? 'Your store is currently accepting orders'
                          : 'Your store is currently closed for orders'
                        : loading
                          ? 'Loading store status...'
                          : 'Store status could not be loaded'
                    }}
                  </p>
                </div>
                <Icon
                  icon="entypo:shop"
                  width="30"
                  height="30"
                  class="banner-icon"
                  aria-hidden="true"
                />
              </div>

              <div class="store-info-list">
                <div class="info-row">
                  <span class="info-label">Operating Hours</span>
                  <span class="info-value">07:00 - 15:00 WIB</span>
                </div>
                <div class="info-row">
                  <span class="info-label">New Orders</span>
                  <span
                    class="status-indicator-badge"
                    :class="
                      store
                        ? store.is_open
                          ? 'badge-enabled'
                          : 'badge-disabled'
                        : 'badge-unavailable'
                    "
                  >
                    {{
                      store
                        ? store.is_open
                          ? 'Enabled'
                          : 'Disabled'
                        : loading
                          ? 'Loading'
                          : 'Unavailable'
                    }}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="store-action-btn"
              :class="
                store
                  ? store.is_open
                    ? 'btn-close-store'
                    : 'btn-open-store'
                  : 'btn-store-unavailable'
              "
              :disabled="!store || togglingStore || loading"
              @click="toggleStore"
              :aria-busy="togglingStore"
            >
              <span v-if="togglingStore">Memproses...</span>
              <span v-else>{{
                store
                  ? store.is_open
                    ? 'Close Store'
                    : 'Open Store'
                  : loading
                    ? 'Memuat status toko...'
                    : 'Status toko tidak tersedia'
              }}</span>
            </button>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Layout Root */
.admin-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #efefef;
  font-family: var(--font-family-base);
}

/* Main Content Area */
.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Dashboard Content */
.dashboard-content {
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fef3f2;
  border: 1px solid #fee4e2;
  color: #b42318;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: var(--font-size-sm);
}

.retry-btn {
  margin-left: auto;
  font-weight: 600;
  color: #b42318;
  text-decoration: underline;
}

.dashboard-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 30px;
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, #003a6a 0%, #008cff 100%);
  box-shadow: 0 4px 5px rgba(0, 0, 0, 0.25);
}

.summary-heading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
}

.summary-title {
  color: var(--color-text-on-accent);
  font-family: var(--font-family-base);
  font-size: 40px;
  font-weight: 600;
  line-height: normal;
}

.summary-date {
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  line-height: normal;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 30px;
  width: 100%;
  padding: 10px 0;
}

.summary-stat-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.summary-stat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #008cff;
  font-family: var(--font-family-brand);
  font-size: 16px;
  line-height: normal;
  white-space: nowrap;
}

.summary-stat-header :deep(svg) {
  flex: 0 0 auto;
}

.summary-stat-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 0 10px;
}

.summary-stat-number {
  color: var(--color-text);
  font-family: var(--font-family-brand);
  font-size: 24px;
  font-weight: var(--font-weight-medium);
  line-height: normal;
  white-space: nowrap;
}

.summary-stat-caption {
  color: var(--color-text-muted);
  font-family: var(--font-family-brand);
  font-size: 10px;
  line-height: normal;
  white-space: nowrap;
}

.summary-stats-loading {
  align-items: stretch;
}

.summary-skeleton {
  min-height: 76px;
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, #e5e5e5 25%, #f0f0f0 50%, #e5e5e5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Content Grid (2 Columns) */
.dashboard-lower-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 350px);
  gap: 20px;
  width: 100%;
  align-items: start;
}

/* Orders Section */
.orders-section {
  min-width: 0;
  background-color: #ffffff;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
}

.title-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-title {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: 26px;
  color: #000000;
  line-height: 1.2;
}

.section-subtitle {
  font-family: var(--font-family-base);
  font-size: 12px;
  color: #969696;
}

.last-updated {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: 10px;
}

.see-all-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #008cff;
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background-color var(--transition-fast);
}

.see-all-link:hover {
  background-color: rgba(0, 140, 255, 0.08);
}

/* Table */
.table-container {
  width: 100%;
  overflow-x: auto;
}

.orders-table {
  --orders-grid-columns: minmax(80px, 0.85fr) minmax(120px, 1.25fr) minmax(120px, 1.15fr) minmax(110px, 1.15fr) minmax(90px, 0.9fr);
  display: grid;
  grid-template-columns: var(--orders-grid-columns);
  align-content: start;
  width: 100%;
  min-width: 670px;
  min-height: 300px;
  text-align: center;
}

.orders-table thead,
.orders-table tbody {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: var(--orders-grid-columns);
}

.orders-table tbody {
  align-content: start;
}

.orders-table tr {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: var(--orders-grid-columns);
  align-items: center;
  width: 100%;
}

.orders-table th {
  border-bottom: 0.5px solid #969696;
  padding: 4px 8px;
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: 10px;
  color: #969696;
  white-space: nowrap;
}

.orders-table thead {
  height: 30px;
}

.orders-table td {
  padding: 4px 8px;
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: 12px;
  color: #000000;
  vertical-align: middle;
}

.orders-table-message {
  grid-column: 1 / -1;
  color: var(--color-text-muted) !important;
}

.orders-table tbody tr {
  height: 54px;
}

.orders-table .queue-number {
  color: #008cff;
}

.order-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  padding: 4px 10px;
  border: 1px solid currentColor;
  border-radius: 10px;
  font-family: var(--font-family-brand);
  font-size: 8px;
  font-weight: var(--font-weight-medium);
  line-height: normal;
  white-space: nowrap;
}

.order-status--pending {
  color: #ffd900;
  background-color: rgba(255, 217, 0, 0.2);
}

.order-status--ready {
  color: #00d707;
  background-color: rgba(0, 215, 7, 0.2);
}

.order-status--completed {
  color: #969696;
  background-color: rgba(150, 150, 150, 0.2);
}

.order-status--cancelled {
  color: var(--color-status-dibatalkan);
  background-color: rgba(255, 0, 0, 0.2);
}

.order-status--unknown {
  color: var(--color-text-muted);
  background-color: var(--color-admin-bg);
}

.name-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.seller-note-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #f4c300;
  background-color: rgba(244, 195, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.queue-pill {
  font-weight: 600;
}

.actions-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.action-btn {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: var(--font-family-brand);
  font-weight: 500;
  transition: opacity var(--transition-fast);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ready {
  background-color: rgba(0, 215, 7, 0.15);
  color: #007904;
  border: 1px solid #00d707;
}

.btn-ready:hover:not(:disabled) {
  background-color: #00d707;
  color: #ffffff;
}

.btn-cancel {
  background-color: rgba(255, 0, 0, 0.1);
  color: #b42318;
  border: 1px solid #ff4d4f;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #ff4d4f;
  color: #ffffff;
}

.btn-done {
  background-color: rgba(0, 140, 255, 0.15);
  color: #008cff;
  border: 1px solid #008cff;
}

.btn-done:hover:not(:disabled) {
  background-color: #008cff;
  color: #ffffff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 0;
  color: #969696;
}

.empty-icon {
  color: #c4c4c4;
}

.empty-text {
  font-size: var(--font-size-sm);
}

.store-status-section {
  min-width: 0;
  background-color: #ffffff;
  border-radius: var(--radius-md);
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 30px;
}

.store-status-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.store-status-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.switch-control {
  display: flex;
  align-items: center;
  width: 42px;
  height: 22px;
  flex: 0 0 auto;
  padding: 1px;
  background-color: var(--color-store-closed);
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.switch-control.is-active {
  background-color: var(--color-store-open);
}

.switch-control.is-inactive {
  background-color: var(--color-store-closed);
}

.switch-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-control:focus-visible,
.store-action-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

.switch-handle {
  display: block;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform var(--transition-fast);
}

.switch-control.is-active .switch-handle {
  transform: translateX(20px);
}

.status-banner {
  padding: 20px;
  min-height: 83px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
}

.banner-open {
  background: linear-gradient(
    90deg,
    var(--color-store-open-dark) 0%,
    var(--color-store-open-gradient-end) 100%
  );
}

.banner-closed {
  background-color: var(--color-store-closed);
}

.banner-unavailable {
  background-color: var(--color-admin-bg);
  color: var(--color-text);
}

.banner-loading {
  background-color: var(--color-admin-bg);
  color: var(--color-text-muted);
}

.banner-text {
  display: flex;
  flex-direction: column;
}

.banner-title {
  font-family: var(--font-family-base);
  font-weight: 700;
  font-size: 24px;
  line-height: 1.2;
}

.banner-desc {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: 10px;
  opacity: 0.95;
  white-space: normal;
}

.banner-icon {
  color: #ffffff;
  flex-shrink: 0;
}

/* Info list */
.store-info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  gap: 8px;
  padding: 0 10px;
}

.info-label {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-regular);
  color: #000000;
}

.info-value {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  color: #000000;
}

.status-indicator-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 10px;
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 8px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.badge-enabled {
  background-color: var(--color-store-open-soft);
  border-color: var(--color-store-open);
  color: var(--color-store-open-dark);
}

.badge-disabled {
  background-color: var(--color-store-closed-soft);
  border-color: var(--color-store-closed);
  color: var(--color-store-closed);
}

.badge-unavailable {
  background-color: var(--color-admin-bg);
  border-color: var(--color-card-border);
  color: var(--color-text-muted);
}

.store-action-btn {
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-md);
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 14px;
  text-align: center;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.store-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-close-store {
  background-color: var(--color-store-close-action-soft);
  border: 1px solid var(--color-store-close-action);
  color: var(--color-store-close-action);
}

.btn-close-store:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-store-close-action) 30%, transparent);
}

.btn-open-store {
  background-color: var(--color-store-open-action-soft);
  border: 1px solid var(--color-store-open-action);
  color: var(--color-store-open-dark);
}

.btn-open-store:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-store-open-action) 30%, transparent);
}

.btn-store-unavailable {
  background-color: var(--color-admin-bg);
  border: 1px solid var(--color-card-border);
  color: var(--color-text-muted);
}

/* Skeleton Loading State */
.skeleton-grid {
  display: flex;
  gap: 30px;
  width: 100%;
}

.skeleton-card {
  height: 90px;
  flex: 1;
  background: linear-gradient(90deg, #e5e5e5 25%, #f0f0f0 50%, #e5e5e5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}

.skeleton-card.large {
  flex: 1;
  height: 380px;
}

.skeleton-card.side {
  width: 350px;
  flex-shrink: 0;
  height: 380px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Responsive: Tablet Breakpoints (<= 1024px) */
@media (max-width: 1024px) {
  .dashboard-lower-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .summary-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .dashboard-content {
    padding: 20px 24px;
  }

  .orders-section {
    padding: 20px 24px;
  }
}

/* Responsive: Small Tablet / Mobile fallback (<= 768px) */
@media (max-width: 768px) {
  .admin-layout {
    position: relative;
  }

  .dashboard-summary {
    padding: 20px;
  }

  .summary-stats {
    gap: 14px;
  }

  .stats-grid {
    flex-direction: column;
    gap: 14px;
  }

  .dashboard-content {
    padding: 16px;
  }

  .orders-section {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .summary-title {
    font-size: 32px;
  }

  .summary-stats {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
