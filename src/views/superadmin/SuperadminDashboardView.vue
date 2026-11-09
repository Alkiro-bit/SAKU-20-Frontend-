<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient, getApiErrorMessage } from '@/services/api';

const stores = ref([]);
const users = ref([]);
const categories = ref([]);
const loading = ref(true);
const error = ref('');
const activeTab = ref('stores');

async function fetchStores() {
  try {
    const res = await apiClient.get('/superadmin/stores');
    stores.value = res.data?.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Failed to load store data.');
  }
}

async function fetchUsers() {
  try {
    const res = await apiClient.get('/superadmin/users');
    users.value = res.data?.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Failed to load user data.');
  }
}

async function fetchCategories() {
  try {
    const res = await apiClient.get('/superadmin/categories');
    categories.value = res.data?.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Failed to load categories.');
  }
}

async function toggleUserStatus(user) {
  try {
    await apiClient.patch(`/superadmin/users/${user.id}/status`, { is_active: !user.is_active });
    user.is_active = !user.is_active;
  } catch (e) {
    error.value = getApiErrorMessage(e);
  }
}

async function refreshAll() {
  loading.value = true;
  error.value = '';
  await Promise.allSettled([fetchStores(), fetchUsers(), fetchCategories()]);
  loading.value = false;
}

const activeUsersCount = computed(() => users.value.filter((u) => u.is_active).length);
const openStoresCount = computed(() => stores.value.filter((s) => s.is_open).length);

onMounted(() => {
  refreshAll();
});
</script>

<template>
  <div class="dashboard-page">
    <div class="page-heading">
      <div>
        <h1 class="page-title">Superadmin Dashboard</h1>
        <p class="page-subtitle">Operational overview of the entire SAKU 20 platform</p>
      </div>
      <button type="button" class="action-btn" title="Refresh data" :disabled="loading" @click="refreshAll">
        <Icon icon="mdi:refresh" width="18" height="18" :class="{ 'spin-icon': loading }" />
        <span>Refresh</span>
      </button>
    </div>

    <div v-if="error" class="error-banner" role="alert">
      <Icon icon="mdi:alert-circle-outline" width="20" height="20" />
      <span>{{ error }}</span>
    </div>

    <!-- Quick Stats Cards -->
    <div class="stats-grid">
      <router-link to="/superadmin/stores" class="stat-card">
        <div class="stat-icon-wrapper stores">
          <Icon icon="entypo:shop" width="24" height="24" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Total Stores</span>
          <span class="stat-value">{{ stores.length }}</span>
          <span class="stat-hint">{{ openStoresCount }} open stores</span>
        </div>
      </router-link>

      <router-link to="/superadmin/users" class="stat-card">
        <div class="stat-icon-wrapper users">
          <Icon icon="mdi:account-group" width="24" height="24" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Total Users</span>
          <span class="stat-value">{{ users.length }}</span>
          <span class="stat-hint">{{ activeUsersCount }} active accounts</span>
        </div>
      </router-link>

      <router-link to="/superadmin/categories" class="stat-card">
        <div class="stat-icon-wrapper categories">
          <Icon icon="mdi:shape-outline" width="24" height="24" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Total Categories</span>
          <span class="stat-value">{{ categories.length }}</span>
          <span class="stat-hint">Active product categories</span>
        </div>
      </router-link>
    </div>

    <!-- Overview Panel with Tabs -->
    <section class="overview-section">
      <nav class="tab-nav">
        <button
          v-for="tab in ['stores', 'users', 'categories']"
          :key="tab"
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab === 'stores' ? 'Stores Preview' : tab === 'users' ? 'Users Preview' : 'Categories Preview' }}
        </button>
      </nav>

      <div class="tab-content">
        <div v-if="loading" class="loading-state">Loading data...</div>

        <template v-else>
          <!-- Stores Tab -->
          <div v-if="activeTab === 'stores'" class="panel-list">
            <div v-if="stores.length === 0" class="empty">No registered stores yet.</div>
            <div v-for="s in stores" :key="s.id" class="list-item">
              <div class="item-info">
                <span class="item-name">{{ s.name }}</span>
                <span class="item-sub">{{ s.store_type || s.type }} — {{ s.is_open ? 'Open' : 'Closed' }}</span>
              </div>
              <router-link to="/superadmin/stores" class="link-btn">View all &rarr;</router-link>
            </div>
          </div>

          <!-- Users Tab -->
          <div v-if="activeTab === 'users'" class="panel-list">
            <div v-if="users.length === 0" class="empty">No users found.</div>
            <div v-for="u in users" :key="u.id" class="list-item">
              <div class="item-info">
                <span class="item-name">{{ u.name }}</span>
                <span class="item-sub">{{ u.role }} <span v-if="u.nis_nip">({{ u.nis_nip }})</span></span>
              </div>
              <button
                type="button"
                class="status-toggle"
                :class="{ active: u.is_active }"
                @click="toggleUserStatus(u)"
              >
                {{ u.is_active ? 'Active' : 'Inactive' }}
              </button>
            </div>
          </div>

          <!-- Categories Tab -->
          <div v-if="activeTab === 'categories'" class="panel-list">
            <div v-if="categories.length === 0" class="empty">No categories found.</div>
            <div v-for="c in categories" :key="c.id" class="list-item">
              <span class="item-name">{{ c.name }}</span>
              <router-link to="/superadmin/categories" class="link-btn">Details &rarr;</router-link>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-family: var(--font-family-brand);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text, #000);
}

.page-subtitle {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted, #969696);
  margin-top: 4px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: var(--radius-md);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fef3f2;
  border: 1px solid #fee4e2;
  border-radius: var(--radius-md);
  color: var(--color-danger-dark, #b42318);
  font-size: var(--font-size-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: inherit;
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrapper.stores {
  background: rgba(0, 149, 255, 0.12);
  color: var(--color-primary);
}

.stat-icon-wrapper.users {
  background: rgba(109, 40, 217, 0.12);
  color: #6d28d9;
}

.stat-icon-wrapper.categories {
  background: rgba(0, 215, 7, 0.12);
  color: var(--color-success-dark);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}

.stat-value {
  font-family: var(--font-family-brand);
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.stat-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.overview-section {
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  flex: 1;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: var(--font-family-brand);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-content {
  padding: 16px;
}

.panel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.item-info {
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

.item-sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.link-btn {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
  text-decoration: none;
}

.link-btn:hover {
  text-decoration: underline;
}

.status-toggle {
  padding: 6px 14px;
  border-radius: 6px;
  border: 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: white;
  background-color: #b42318;
  cursor: pointer;
}

.status-toggle.active {
  background-color: #00a63e;
}

.loading-state, .empty {
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

