<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { apiClient, getApiErrorMessage } from '@/services/api';
import StatusBadge from '@/components/common/StatusBadge.vue';

const router = useRouter();
const authStore = useAuthStore();

const store = ref(null);
const orders = ref([]);
const loading = ref(true);
const error = ref('');
const togglingStore = ref(false);
const updatingOrderId = ref(null);
const isSidebarCollapsed = ref(false);

// Format Rupiah
function formatRupiah(val) {
  if (!val && val !== 0) return 'Rp 0';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

// Format Order Time (HH:mm)
function formatOrderTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '-';
  }
}

// Customer Name Fallback
function getCustomerName(order) {
  return order.customer_name || order.guest_name || order.user?.name || order.name || 'Pelanggan';
}

// Stats calculation
const todaySales = computed(() => {
  return orders.value
    .filter((o) => o.status !== 'dibatalkan')
    .reduce((sum, o) => sum + Number(o.total_price || o.total_amount || o.total || 0), 0);
});

const activeOrdersCount = computed(() => {
  return orders.value.filter((o) => ['diproses', 'siap_diambil'].includes(o.status)).length;
});

const completedOrdersCount = computed(() => {
  return orders.value.filter((o) => o.status === 'selesai').length;
});

// Fetch Store Details
async function fetchStore() {
  try {
    const res = await apiClient.get('/admin/store');
    store.value = res.data.data;
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat data toko.');
  }
}

// Fetch Orders
async function fetchOrders() {
  try {
    const res = await apiClient.get('/admin/orders', { params: { per_page: 20 } });
    orders.value = res.data.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat pesanan.');
  }
}

// Toggle Store Open / Close
async function toggleStore() {
  if (!store.value || togglingStore.value) return;
  togglingStore.value = true;
  try {
    const nextState = !store.value.is_open;
    await apiClient.patch('/admin/store', { is_open: nextState });
    store.value.is_open = nextState;
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memperbarui status toko.');
  } finally {
    togglingStore.value = false;
  }
}

// Update Order Status
async function updateOrderStatus(order, newStatus) {
  if (updatingOrderId.value) return;
  updatingOrderId.value = order.id;
  try {
    await apiClient.patch(`/admin/orders/${order.id}/status`, { status: newStatus });
    order.status = newStatus;
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memperbarui status pesanan.');
  } finally {
    updatingOrderId.value = null;
  }
}

// Refresh Data
async function refreshData() {
  loading.value = true;
  error.value = '';
  await Promise.all([fetchStore(), fetchOrders()]);
  loading.value = false;
}

// Handle Logout
async function handleLogout() {
  await authStore.logout();
  router.replace('/login');
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

onMounted(async () => {
  await refreshData();
});
</script>

<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <div class="brand-logo">
          <span class="brand-text">SAKU 20</span>
        </div>
        <button
          type="button"
          class="sidebar-toggle-btn"
          title="Toggle Sidebar"
          @click="toggleSidebar"
        >
          <Icon
            :icon="isSidebarCollapsed ? 'mdi:menu' : 'mdi:menu-open'"
            width="20"
            height="20"
          />
        </button>
      </div>

      <nav class="sidebar-nav">
        <!-- Dashboard (Active) -->
        <router-link to="/admin/dashboard" class="nav-item active">
          <Icon icon="bxs:dashboard" class="nav-icon active-icon" width="20" height="20" />
          <span class="nav-label">Dashboard</span>
        </router-link>

        <!-- Orders -->
        <router-link to="/admin/orders" class="nav-item">
          <Icon icon="bi:bag-fill" class="nav-icon" width="18" height="18" />
          <span class="nav-label">Orders</span>
        </router-link>

        <!-- Products & Stock -->
        <router-link to="/admin/products" class="nav-item">
          <Icon icon="bxs:box" class="nav-icon" width="20" height="20" />
          <span class="nav-label">Products &amp; Stock</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="logout-action-btn" @click="handleLogout">
          <Icon icon="mdi:logout" width="18" height="18" />
          <span class="logout-label">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Screen -->
    <div class="admin-main">
      <!-- Header -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <button
            type="button"
            class="mobile-toggle-btn"
            @click="toggleSidebar"
            aria-label="Toggle menu"
          >
            <Icon icon="mdi:menu" width="24" height="24" />
          </button>
          <div class="shop-badge">
            <Icon icon="entypo:shop" width="30" height="30" class="shop-icon" />
            <div class="shop-meta">
              <span class="shop-name">{{ store?.name || 'JungleFood' }}</span>
              <span v-if="store?.type" class="store-type-badge">{{ store.type }}</span>
            </div>
          </div>
        </div>

        <div class="topbar-right">
          <button
            type="button"
            class="refresh-btn"
            title="Refresh Data"
            :disabled="loading"
            @click="refreshData"
          >
            <Icon
              icon="mdi:refresh"
              width="20"
              height="20"
              :class="{ 'spin-icon': loading }"
            />
            <span class="refresh-label">Refresh</span>
          </button>
          <div class="user-pill" v-if="authStore.user">
            <span class="user-greeting">Hi, {{ authStore.user.name || 'Admin' }}</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="dashboard-content">
        <!-- Error Banner -->
        <div v-if="error" class="error-banner" role="alert">
          <Icon icon="mdi:alert-circle-outline" width="20" height="20" />
          <span>{{ error }}</span>
          <button type="button" class="retry-btn" @click="refreshData">Coba Lagi</button>
        </div>

        <!-- Page Title -->
        <div class="page-title-row">
          <h1 class="page-title">Dashboard</h1>
        </div>

        <!-- Loading State Skeleton -->
        <div v-if="loading" class="loading-state">
          <div class="stats-grid skeleton-grid">
            <div class="skeleton-card" v-for="i in 3" :key="i"></div>
          </div>
          <div class="dashboard-grid">
            <div class="skeleton-card large"></div>
            <div class="skeleton-card side"></div>
          </div>
        </div>

        <template v-else>
          <!-- Stats Cards -->
          <section class="stats-grid">
            <!-- Sales Today -->
            <div class="stat-card">
              <div class="stat-card-header">
                <Icon
                  icon="ant-design:wallet-filled"
                  class="stat-icon sales-icon"
                  width="16"
                  height="16"
                />
                <span class="stat-title sales-title">Sales Today:</span>
              </div>
              <div class="stat-card-value">
                <span class="stat-number">{{ formatRupiah(todaySales) }}</span>
              </div>
            </div>

            <!-- Orders -->
            <div class="stat-card">
              <div class="stat-card-header">
                <Icon
                  icon="bi:bag-fill"
                  class="stat-icon orders-icon"
                  width="16"
                  height="16"
                />
                <span class="stat-title orders-title">Orders:</span>
              </div>
              <div class="stat-card-value">
                <span class="stat-number">{{ activeOrdersCount }}</span>
              </div>
            </div>

            <!-- Completed -->
            <div class="stat-card">
              <div class="stat-card-header">
                <Icon
                  icon="bi:cart-check-fill"
                  class="stat-icon completed-icon"
                  width="16"
                  height="16"
                />
                <span class="stat-title completed-title">Completed</span>
              </div>
              <div class="stat-card-value">
                <span class="stat-number">{{ completedOrdersCount }}</span>
              </div>
            </div>
          </section>

          <!-- Content Split: Current Orders & Store Status -->
          <div class="dashboard-grid">
            <!-- Current Orders Column -->
            <section class="orders-section">
              <div class="section-header">
                <div class="title-meta">
                  <h2 class="section-title">Current Orders</h2>
                  <p class="section-subtitle">Orders that need to be processed immediately</p>
                </div>
                <router-link to="/admin/orders" class="see-all-link">
                  <span>See All</span>
                  <Icon icon="akar-icons:arrow-up-right" width="16" height="16" />
                </router-link>
              </div>

              <!-- Table or Empty State -->
              <div v-if="orders.length === 0" class="empty-state">
                <Icon icon="bi:inbox" width="48" height="48" class="empty-icon" />
                <p class="empty-text">Belum ada pesanan saat ini.</p>
              </div>

              <div v-else class="table-container">
                <table class="orders-table">
                  <thead>
                    <tr>
                      <th class="th-name">Name</th>
                      <th class="th-queue">Queue Number</th>
                      <th class="th-time">Time of Order</th>
                      <th class="th-price">Order Price</th>
                      <th class="th-status">Status</th>
                      <th class="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in orders" :key="order.id" class="order-row">
                      <td class="td-name">
                        <div class="name-cell">
                          <span>{{ getCustomerName(order) }}</span>
                          <span
                            v-if="order.seller_note"
                            class="seller-note-badge"
                            :title="order.seller_note"
                          >
                            <Icon icon="mdi:note-text-outline" width="12" height="12" />
                            Note
                          </span>
                        </div>
                      </td>
                      <td class="td-queue">
                        <span class="queue-pill">#{{ order.queue_number }}</span>
                      </td>
                      <td class="td-time">{{ formatOrderTime(order.created_at) }}</td>
                      <td class="td-price">
                        {{ formatRupiah(order.total_price || order.total_amount || order.total) }}
                      </td>
                      <td class="td-status">
                        <StatusBadge :status="order.status" />
                      </td>
                      <td class="td-actions">
                        <div class="actions-group">
                          <button
                            v-if="order.status === 'diproses'"
                            type="button"
                            class="action-btn btn-ready"
                            :disabled="updatingOrderId === order.id"
                            @click="updateOrderStatus(order, 'siap_diambil')"
                          >
                            Siap
                          </button>
                          <button
                            v-if="order.status === 'diproses'"
                            type="button"
                            class="action-btn btn-cancel"
                            :disabled="updatingOrderId === order.id"
                            @click="updateOrderStatus(order, 'dibatalkan')"
                          >
                            Batal
                          </button>
                          <button
                            v-if="order.status === 'siap_diambil'"
                            type="button"
                            class="action-btn btn-done"
                            :disabled="updatingOrderId === order.id"
                            @click="updateOrderStatus(order, 'selesai')"
                          >
                            Selesai
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Store Status Column -->
            <section class="store-status-section">
              <div class="store-status-header">
                <div class="title-meta">
                  <h2 class="section-title">Store Status</h2>
                  <p class="section-subtitle">Today’s operations</p>
                </div>
                <!-- Switch Toggle -->
                <button
                  type="button"
                  class="switch-control"
                  :class="{ 'is-active': store?.is_open }"
                  :disabled="togglingStore"
                  @click="toggleStore"
                  title="Toggle status toko"
                  role="switch"
                  :aria-checked="store?.is_open"
                >
                  <span class="switch-handle"></span>
                </button>
              </div>

              <!-- Status Banner -->
              <div
                class="status-banner"
                :class="store?.is_open ? 'banner-open' : 'banner-closed'"
              >
                <div class="banner-text">
                  <h3 class="banner-title">{{ store?.is_open ? 'Open' : 'Closed' }}</h3>
                  <p class="banner-desc">
                    {{
                      store?.is_open
                        ? 'Your store is currently accepting orders'
                        : 'Your store is currently closed for orders'
                    }}
                  </p>
                </div>
                <Icon icon="entypo:shop" width="30" height="30" class="banner-icon" />
              </div>

              <!-- Content details -->
              <div class="store-info-list">
                <div class="info-row">
                  <span class="info-label">Operating Hours</span>
                  <span class="info-value">07:00 - 15:00 WIB</span>
                </div>
                <div class="info-row">
                  <span class="info-label">New Orders</span>
                  <span
                    class="status-indicator-badge"
                    :class="store?.is_open ? 'badge-enabled' : 'badge-disabled'"
                  >
                    {{ store?.is_open ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
              </div>

              <!-- Toggle CTA Button -->
              <button
                type="button"
                class="store-action-btn"
                :class="store?.is_open ? 'btn-close-store' : 'btn-open-store'"
                :disabled="togglingStore"
                @click="toggleStore"
              >
                <span v-if="togglingStore">Memproses...</span>
                <span v-else>{{ store?.is_open ? 'Close Store' : 'Open Store' }}</span>
              </button>
            </section>
          </div>
        </template>
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

/* Sidebar */
.admin-sidebar {
  width: 250px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
  padding: 14px 10px 14px 20px;
  transition: width var(--transition-fast), padding var(--transition-fast);
  z-index: 20;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  width: 100%;
}

.brand-text {
  font-family: var(--font-family-brand);
  font-weight: 600;
  font-size: 24px;
  color: #008cff;
  letter-spacing: -2.4px;
  user-select: none;
}

.sidebar-toggle-btn {
  color: #008cff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.sidebar-toggle-btn:hover {
  background-color: rgba(0, 140, 255, 0.1);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  text-decoration: none;
  transition: all var(--transition-fast);
  color: #969696;
}

.nav-item:hover {
  background-color: #f7f9fa;
  color: #000000;
}

.nav-item.active {
  background-color: #ffffff;
  filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.25));
  color: #000000;
}

.nav-label {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 18px;
  line-height: 1;
  white-space: nowrap;
}

.nav-icon {
  flex-shrink: 0;
}

.active-icon {
  color: #000000;
}

.sidebar-footer {
  padding-top: 16px;
  border-top: 0.5px solid #e0e0e0;
}

.logout-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  color: #969696;
  width: 100%;
  transition: all var(--transition-fast);
}

.logout-action-btn:hover {
  color: #b42318;
  background-color: rgba(180, 35, 24, 0.08);
}

.logout-label {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 16px;
}

/* Sidebar Collapsed State (Tablet / Desktop toggle) */
.sidebar-collapsed .admin-sidebar {
  width: 72px;
  padding: 14px 10px;
  align-items: center;
}

.sidebar-collapsed .brand-text,
.sidebar-collapsed .nav-label,
.sidebar-collapsed .logout-label {
  display: none;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 10px;
}

.sidebar-collapsed .sidebar-header {
  justify-content: center;
}

/* Main Content Area */
.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Topbar */
.admin-topbar {
  background-color: #ffffff;
  height: 100px;
  padding: 10px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 10px 0px 10px 0px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-toggle-btn {
  display: none;
  color: #000000;
  padding: 6px;
}

.shop-badge {
  display: flex;
  align-items: center;
  gap: 16px;
}

.shop-icon {
  color: #000000;
  flex-shrink: 0;
}

.shop-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shop-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 24px;
  color: #000000;
}

.store-type-badge {
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: #f5f5f5;
  color: #000000;
  font-size: var(--font-size-sm);
  font-family: var(--font-family-base);
  transition: background-color var(--transition-fast);
}

.refresh-btn:hover:not(:disabled) {
  background-color: #e5e5e5;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.user-greeting {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: #000000;
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

.page-title-row {
  display: flex;
  align-items: center;
}

.page-title {
  font-family: var(--font-family-base);
  font-weight: 600;
  font-size: 32px;
  color: #000000;
}

/* Stats Cards Grid */
.stats-grid {
  display: flex;
  gap: 30px;
  width: 100%;
}

.stat-card {
  flex: 1;
  min-width: 0;
  background-color: #ffffff;
  border: 0.5px solid #969696;
  border-radius: 6px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-regular);
  font-size: 16px;
}

.sales-title,
.sales-icon {
  color: #f4c300;
}

.orders-title,
.orders-icon {
  color: #00df07;
}

.completed-title,
.completed-icon {
  color: #008cff;
}

.stat-card-value {
  padding-left: 26px;
}

.stat-number {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 24px;
  color: #000000;
}

/* Content Grid (2 Columns) */
.dashboard-grid {
  display: flex;
  gap: 20px;
  width: 100%;
  align-items: flex-start;
}

/* Orders Section */
.orders-section {
  flex: 1;
  min-width: 0;
  background-color: #ffffff;
  border-radius: 6px;
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

.orders-table th {
  border-bottom: 0.5px solid #969696;
  padding: 8px 12px;
  font-family: var(--font-family-base);
  font-weight: 600;
  font-size: 10px;
  color: #969696;
  white-space: nowrap;
}

.orders-table td {
  padding: 12px;
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: 12px;
  color: #000000;
  vertical-align: middle;
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

/* Store Status Section */
.store-status-section {
  width: 350px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-radius: 6px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.store-status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Switch control */
.switch-control {
  width: 44px;
  height: 24px;
  background-color: #d1d5db;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  padding: 2px;
}

.switch-control.is-active {
  background-color: #00d707;
}

.switch-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-handle {
  display: block;
  width: 20px;
  height: 20px;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform var(--transition-fast);
}

.switch-control.is-active .switch-handle {
  transform: translateX(20px);
}

/* Status Banner */
.status-banner {
  padding: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
}

.banner-open {
  background: linear-gradient(90deg, #007904 0%, #00df07 100%);
}

.banner-closed {
  background: linear-gradient(90deg, #b42318 0%, #ff4d4f 100%);
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
}

.banner-icon {
  color: #ffffff;
  flex-shrink: 0;
}

/* Info list */
.store-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding: 0 4px;
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
  padding: 4px 10px;
  border-radius: 10px;
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 8px;
  border: 1px solid transparent;
}

.badge-enabled {
  background-color: rgba(0, 215, 7, 0.2);
  border-color: #00d707;
  color: #007904;
}

.badge-disabled {
  background-color: rgba(255, 0, 0, 0.2);
  border-color: red;
  color: red;
}

/* Store Action CTA */
.store-action-btn {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 14px;
  text-align: center;
  transition: all var(--transition-fast);
}

.store-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-close-store {
  background-color: rgba(255, 0, 0, 0.15);
  border: 1px solid red;
  color: red;
}

.btn-close-store:hover:not(:disabled) {
  background-color: rgba(255, 0, 0, 0.25);
}

.btn-open-store {
  background-color: rgba(0, 215, 7, 0.15);
  border: 1px solid #00d707;
  color: #007904;
}

.btn-open-store:hover:not(:disabled) {
  background-color: rgba(0, 215, 7, 0.25);
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
  .dashboard-grid {
    flex-direction: column;
  }

  .store-status-section {
    width: 100%;
  }

  .admin-topbar {
    padding: 10px 24px;
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

  .admin-sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  }

  .admin-layout:not(.sidebar-collapsed) .admin-sidebar {
    transform: translateX(0);
  }

  .mobile-toggle-btn {
    display: inline-flex;
  }

  .stats-grid {
    flex-direction: column;
    gap: 14px;
  }

  .refresh-label {
    display: none;
  }

  .admin-topbar {
    height: 80px;
    padding: 10px 16px;
  }

  .dashboard-content {
    padding: 16px;
  }
}
</style>
