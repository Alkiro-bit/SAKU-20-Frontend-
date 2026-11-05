<script setup>
import { ref, onMounted } from 'vue';
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

async function fetchStore() {
  try {
    const res = await apiClient.get('/admin/store');
    store.value = res.data.data;
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat data toko.');
  }
}

async function fetchOrders() {
  try {
    const res = await apiClient.get('/admin/orders', { params: { per_page: 20 } });
    orders.value = res.data.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat pesanan.');
  }
}

async function toggleStore() {
  if (!store.value || togglingStore.value) return;
  togglingStore.value = true;
  try {
    await apiClient.patch('/admin/store', { is_open: !store.value.is_open });
    store.value.is_open = !store.value.is_open;
  } catch (e) {
    error.value = getApiErrorMessage(e);
  } finally {
    togglingStore.value = false;
  }
}

async function updateOrderStatus(order, newStatus) {
  try {
    await apiClient.patch(`/admin/orders/${order.id}/status`, { status: newStatus });
    order.status = newStatus;
  } catch (e) {
    error.value = getApiErrorMessage(e);
  }
}

async function handleLogout() {
  await authStore.logout();
  router.replace('/login');
}

onMounted(async () => {
  await Promise.all([fetchStore(), fetchOrders()]);
  loading.value = false;
});
</script>

<template>
  <div class="admin-view">
    <header class="admin-header">
      <h1 class="header-title">Dashboard Admin</h1>
      <button type="button" class="logout-btn" @click="handleLogout">
        <Icon icon="mdi:logout" width="20" height="20" />
        Logout
      </button>
    </header>

    <main class="admin-content">
      <p v-if="error" class="admin-error" role="alert">{{ error }}</p>

      <div v-if="loading" class="loading">Memuat…</div>

      <template v-else>
        <!-- Store Toggle Card -->
        <section v-if="store" class="card store-card">
          <div class="store-info">
            <h2 class="card-title">{{ store.name }}</h2>
            <span class="store-type">{{ store.type }}</span>
          </div>
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'is-open': store.is_open }"
            :disabled="togglingStore"
            @click="toggleStore"
          >
            {{ store.is_open ? 'Buka' : 'Tutup' }}
          </button>
        </section>

        <!-- Orders Queue -->
        <section class="card">
          <h2 class="card-title">Antrian Pesanan</h2>
          <div v-if="orders.length === 0" class="empty">Belum ada pesanan.</div>
          <div v-else class="order-list">
            <div v-for="order in orders" :key="order.id" class="order-row">
              <div class="order-info">
                <span class="order-queue">#{{ order.queue_number }}</span>
                <StatusBadge :status="order.status" />
              </div>
              <div v-if="order.status === 'diproses'" class="order-actions">
                <button class="action-btn ready" @click="updateOrderStatus(order, 'siap_diambil')">
                  Siap Diambil
                </button>
                <button class="action-btn cancel" @click="updateOrderStatus(order, 'dibatalkan')">
                  Batalkan
                </button>
              </div>
              <div v-else-if="order.status === 'siap_diambil'" class="order-actions">
                <button class="action-btn done" @click="updateOrderStatus(order, 'selesai')">
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.admin-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px var(--space-2);
  background-color: var(--color-primary);
  color: var(--color-text-on-accent);
}

.header-title {
  font-family: var(--font-family-brand);
  font-size: 20px;
  font-weight: 600;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-on-accent);
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
}

.admin-error {
  color: #b42318;
  font-size: var(--font-size-sm);
  text-align: center;
}

.loading {
  text-align: center;
  padding: var(--space-3) 0;
  color: var(--color-text-muted);
}

.card {
  background-color: var(--color-surface);
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 16px;
  color: var(--color-text);
}

.store-card {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.store-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.store-type {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.toggle-btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text-on-accent);
  background-color: #b42318;
  transition: background-color var(--transition-fast);
}

.toggle-btn.is-open {
  background-color: #00a63e;
}

.toggle-btn:disabled {
  opacity: 0.6;
}

.empty {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: 12px 0;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-queue {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-bold);
  font-size: 18px;
  color: var(--color-text);
}

.order-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: white;
}

.action-btn.ready { background-color: var(--color-status-siap_diambil); }
.action-btn.done { background-color: var(--color-primary); }
.action-btn.cancel { background-color: var(--color-status-dibatalkan); }
</style>
