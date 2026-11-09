<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient, getApiErrorMessage } from '@/services/api';

const categories = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');

async function fetchCategories() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiClient.get('/superadmin/categories');
    categories.value = res.data?.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Failed to load categories.');
  } finally {
    loading.value = false;
  }
}

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return categories.value;
  return categories.value.filter((c) => c.name && c.name.toLowerCase().includes(q));
});

onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <div class="superadmin-page">
    <div class="page-heading">
      <div>
        <h1 class="page-title">Categories Management</h1>
        <p class="page-subtitle">List of product categories in SAKU 20</p>
      </div>
      <button type="button" class="action-btn" title="Refresh data" :disabled="loading" @click="fetchCategories">
        <Icon icon="mdi:refresh" width="18" height="18" :class="{ 'spin-icon': loading }" />
        <span>Refresh</span>
      </button>
    </div>

    <!-- Filter/Search -->
    <div class="filter-bar">
      <div class="search-box">
        <Icon icon="mdi:magnify" width="20" height="20" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search categories..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner" role="alert">
      <Icon icon="mdi:alert-circle-outline" width="20" height="20" />
      <span>{{ error }}</span>
      <button type="button" class="retry-btn" @click="fetchCategories">Try Again</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 6" :key="i" class="card-skeleton"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCategories.length === 0" class="empty-state">
      <Icon icon="mdi:shape-outline" width="48" height="48" class="empty-icon" />
      <p class="empty-text">No categories found.</p>
    </div>

    <!-- Categories Grid -->
    <div v-else class="categories-grid">
      <article v-for="c in filteredCategories" :key="c.id" class="category-card">
        <div class="category-icon-wrapper">
          <Icon icon="mdi:shape-outline" width="24" height="24" />
        </div>
        <div class="category-info">
          <h2 class="category-name">{{ c.name }}</h2>
          <span class="category-id">ID: #{{ c.id }}</span>
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
  align-items: center;
}

.search-box {
  position: relative;
  max-width: 400px;
  width: 100%;
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

.loading-state, .categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.card-skeleton {
  height: 80px;
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

.category-card {
  padding: 16px;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 14px;
  transition: box-shadow var(--transition-fast);
}

.category-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.category-icon-wrapper {
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

.category-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-name {
  font-family: var(--font-family-brand);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.category-id {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
