<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient, getApiErrorMessage } from '@/services/api';

const stores = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const selectedType = ref('all');

async function fetchStores() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiClient.get('/superadmin/stores');
    stores.value = res.data?.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Failed to load store data.');
  } finally {
    loading.value = false;
  }
}

const filteredStores = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return stores.value.filter((s) => {
    const matchName = !q || (s.name && s.name.toLowerCase().includes(q));
    const matchType = selectedType.value === 'all' || s.type === selectedType.value || s.store_type === selectedType.value;
    return matchName && matchType;
  });
});

onMounted(() => {
  fetchStores();
});
</script>

<template>
  <div class="superadmin-page">
    <div class="page-heading">
      <div>
        <h1 class="page-title">Stores Management</h1>
        <p class="page-subtitle">List of all registered stores in SAKU 20</p>
      </div>
      <button type="button" class="action-btn" title="Refresh data" :disabled="loading" @click="fetchStores">
        <Icon icon="mdi:refresh" width="18" height="18" :class="{ 'spin-icon': loading }" />
        <span>Refresh</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="search-box">
        <Icon icon="mdi:magnify" width="20" height="20" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search stores by name..."
          class="search-input"
        />
      </div>

      <div class="type-filters">
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedType === 'all' }"
          @click="selectedType = 'all'"
        >
          All ({{ stores.length }})
        </button>
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedType === 'siswa' }"
          @click="selectedType = 'siswa'"
        >
          Student
        </button>
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedType === 'tefa' }"
          @click="selectedType = 'tefa'"
        >
          TEFA
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner" role="alert">
      <Icon icon="mdi:alert-circle-outline" width="20" height="20" />
      <span>{{ error }}</span>
      <button type="button" class="retry-btn" @click="fetchStores">Try Again</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 4" :key="i" class="card-skeleton"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredStores.length === 0" class="empty-state">
      <Icon icon="entypo:shop" width="48" height="48" class="empty-icon" />
      <p class="empty-text">No stores match the search.</p>
    </div>

    <!-- Stores Grid -->
    <div v-else class="stores-grid">
      <article v-for="s in filteredStores" :key="s.id" class="store-card">
        <div class="store-header">
          <div class="store-icon-wrapper">
            <Icon icon="entypo:shop" width="24" height="24" />
          </div>
          <div class="store-meta">
            <h2 class="store-name">{{ s.name }}</h2>
            <div class="store-badges">
              <span class="badge badge-type">{{ s.store_type || s.type || 'siswa' }}</span>
              <span class="badge" :class="s.is_open ? 'badge-open' : 'badge-closed'">
                {{ s.is_open ? 'Open' : 'Closed' }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.superadmin-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted, #969696);
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #e0e0e0;
  border-radius: var(--radius-md);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  background: #fff;
  outline: none;
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  border-color: var(--color-primary);
}

.type-filters {
  display: flex;
  gap: 8px;
}

.filter-pill {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid #e0e0e0;
  background: #fff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-pill.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
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

.retry-btn {
  margin-left: auto;
  padding: 4px 10px;
  background: #fff;
  border: 1px solid var(--color-danger-dark);
  border-radius: 4px;
  color: var(--color-danger-dark);
  font-size: var(--font-size-xs);
  cursor: pointer;
}

.loading-state, .stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.card-skeleton {
  height: 100px;
  background: #e2e8f0;
  border-radius: var(--radius-md);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  background: #fff;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 12px;
}

.empty-text {
  font-size: var(--font-size-sm);
}

.store-card {
  padding: 16px;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: box-shadow var(--transition-fast);
}

.store-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.store-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.store-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(0, 149, 255, 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.store-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.store-name {
  font-family: var(--font-family-brand);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.store-badges {
  display: flex;
  gap: 6px;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
}

.badge-type {
  background: #f1f5f9;
  color: #475569;
}

.badge-open {
  background: rgba(0, 215, 7, 0.15);
  color: var(--color-success-dark, #007904);
}

.badge-closed {
  background: rgba(150, 150, 150, 0.15);
  color: var(--color-text-muted, #969696);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
