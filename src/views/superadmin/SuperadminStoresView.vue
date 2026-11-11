<script setup>
import { ref, computed, onMounted } from 'vue';

onMounted(() => {
  fetchStores();
  fetchAdmins();
});
import { Icon } from '@iconify/vue';
import { apiClient, getApiErrorMessage, getApiValidationErrors } from '@/services/api';
import DeleteStoreModal from '@/components/modules/DeleteStoreModal.vue';
import StoreModal from '@/components/modules/StoreModal.vue';

const PAGE_SIZE = 20;

const stores = ref([]);
const admins = ref([]);
const loading = ref(true);
const loadingAdmins = ref(false);
const savingStore = ref(false);
const deletingStore = ref(false);
const error = ref('');
const adminError = ref('');
const storeSubmitError = ref('');
const storeFieldErrors = ref({});
const deleteError = ref('');
const searchQuery = ref('');
const selectedType = ref('all');
const currentPage = ref(1);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: PAGE_SIZE,
  total: 0,
});
const storeModalOpen = ref(false);
const editingStore = ref(null);
const deletingStoreTarget = ref(null);
let adminsLoaded = false;

const availableAdmins = computed(() => {
  const editingStoreId = editingStore.value?.id;
  const assignedOwnerIds = new Set(
    stores.value
      .filter((store) => String(store.id) !== String(editingStoreId))
      .map((store) => store.owner?.id ?? store.owner_user_id)
      .filter((ownerId) => ownerId !== null && ownerId !== undefined)
      .map(String),
  );
  return admins.value.filter((admin) => !assignedOwnerIds.has(String(admin.id)));
});

async function fetchStores(page = currentPage.value) {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiClient.get('/superadmin/stores', {
      params: { page, per_page: PAGE_SIZE },
    });
    const responseData = res.data || {};
    const rawStores = Array.isArray(responseData.data) ? responseData.data : [];
    // Resolve owner object from admins list if available
    const enrichedStores = rawStores.map((store) => {
      const ownerId = store.owner?.id ?? store.owner_user_id;
      const ownerObj = admins.value.find((admin) => admin.id === ownerId);
      return { ...store, owner: ownerObj || store.owner };
    });
    stores.value = enrichedStores;
    const meta = responseData.meta || {};
    currentPage.value = Number(meta.current_page) || page;
    pagination.value = {
      current_page: currentPage.value,
      last_page: Math.max(1, Number(meta.last_page) || 1),
      per_page: Number(meta.per_page) || PAGE_SIZE,
      total: Number(meta.total) || 0,
    };
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Failed to load store data.');
  } finally {
    loading.value = false;
  }
}

async function fetchAdmins() {
  if (loadingAdmins.value) return;
  loadingAdmins.value = true;
  adminError.value = '';
  try {
    const fetchedAdmins = [];
    let requestPage = 1;
    let lastPage = 1;

    do {
      const res = await apiClient.get('/superadmin/users', {
          params: { role: 'admin', page: requestPage, per_page: 100 },
      });
      const responseData = res.data || {};
      if (Array.isArray(responseData.data)) fetchedAdmins.push(...responseData.data);

      const reportedLastPage = Number(responseData.meta?.last_page);
      if (Number.isFinite(reportedLastPage) && reportedLastPage > 0) {
        lastPage = reportedLastPage;
      } else {
        break;
      }
      requestPage += 1;
    } while (requestPage <= lastPage);

    admins.value = [...new Map(fetchedAdmins.map((admin) => [admin.id, admin])).values()];
    adminsLoaded = true;
  } catch (e) {
    adminError.value = getApiErrorMessage(e, 'Failed to load admin accounts.');
  } finally {
    loadingAdmins.value = false;
  }
}

function openStoreModal(store = null) {
  editingStore.value = store;
  storeSubmitError.value = '';
  storeFieldErrors.value = {};
  storeModalOpen.value = true;
  if (!adminsLoaded) fetchAdmins();
}

function closeStoreModal(force = false) {
  if (savingStore.value && !force) return;
  storeModalOpen.value = false;
  editingStore.value = null;
  storeSubmitError.value = '';
  storeFieldErrors.value = {};
}

async function saveStore(formData) {
  if (savingStore.value) return;
  savingStore.value = true;
  storeSubmitError.value = '';
  storeFieldErrors.value = {};

  const store = editingStore.value;
  const payload = {};
  if (store) {
    if (formData.name !== store.name) payload.name = formData.name;
    if (formData.store_type !== store.store_type) payload.store_type = formData.store_type;
    if (formData.is_open !== store.is_open) payload.is_open = formData.is_open;
    const currentOwnerId = store.owner?.id ?? store.owner_user_id ?? null;
    if (formData.owner_user_id !== currentOwnerId) payload.owner_user_id = formData.owner_user_id;
    if (Object.keys(payload).length === 0) {
      savingStore.value = false;
      closeStoreModal(true);
      return;
    }
  } else {
    Object.assign(payload, formData);
  }

  try {
    if (store) {
      await apiClient.patch(`/superadmin/stores/${store.id}`, payload);
    } else {
      await apiClient.post('/superadmin/stores', payload);
    }
    const pageToRefresh = store ? currentPage.value : 1;
    closeStoreModal(true);
    await fetchStores(pageToRefresh);
  } catch (e) {
    const validationErrors = getApiValidationErrors(e);
    storeFieldErrors.value = validationErrors;
    storeSubmitError.value = Object.keys(validationErrors).length
      ? ''
      : getApiErrorMessage(e, store ? 'Failed to update store.' : 'Failed to create store.');
  } finally {
    savingStore.value = false;
  }
}

function openDeleteModal(store) {
  deletingStoreTarget.value = store;
  deleteError.value = '';
}

function closeDeleteModal() {
  if (deletingStore.value) return;
  deletingStoreTarget.value = null;
  deleteError.value = '';
}

async function confirmDeleteStore() {
  const store = deletingStoreTarget.value;
  if (!store || deletingStore.value) return;

  deletingStore.value = true;
  deleteError.value = '';
  try {
    await apiClient.delete(`/superadmin/stores/${store.id}`);
    const nextPage = stores.value.length === 1 && currentPage.value > 1
      ? currentPage.value - 1
      : currentPage.value;
    await fetchStores(nextPage);
    deletingStoreTarget.value = null;
  } catch (e) {
    deleteError.value = getApiErrorMessage(e, 'Failed to delete store.');
  } finally {
    deletingStore.value = false;
  }
}

const filteredStores = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return stores.value.filter((store) => {
    const matchName = !q || (store.name && store.name.toLowerCase().includes(q));
    const matchType = selectedType.value === 'all' || store.store_type === selectedType.value;
    return matchName && matchType;
  });
});

const isFirstPage = computed(() => currentPage.value <= 1);
const isLastPage = computed(() => currentPage.value >= pagination.value.last_page);

onMounted(() => {
  fetchStores(1);
});
</script>

<template>
  <div class="superadmin-page">
    <div class="page-heading">
      <div>
        <h1 class="page-title">Stores Management</h1>
        <p class="page-subtitle">List of all registered stores in SAKU 20</p>
      </div>
      <div class="heading-actions">
        <button type="button" class="action-btn" title="Refresh data" :disabled="loading" @click="fetchStores()">
          <Icon icon="mdi:refresh" width="18" height="18" :class="{ 'spin-icon': loading }" />
          <span>Refresh</span>
        </button>
        <button type="button" class="add-store-btn" @click="openStoreModal()">
          <Icon icon="mdi:plus" width="19" height="19" aria-hidden="true" />
          <span>Add Store</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="search-box">
        <Icon icon="mdi:magnify" width="20" height="20" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          aria-label="Search stores on this page by name"
          placeholder="Search stores on this page..."
          class="search-input"
        />
      </div>

      <div class="type-filters">
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedType === 'all' }"
          :aria-pressed="selectedType === 'all'"
          @click="selectedType = 'all'"
        >
          All ({{ pagination.total }})
        </button>
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedType === 'siswa' }"
          :aria-pressed="selectedType === 'siswa'"
          @click="selectedType = 'siswa'"
        >
          Student
        </button>
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedType === 'tefa' }"
          :aria-pressed="selectedType === 'tefa'"
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
      <button type="button" class="retry-btn" @click="fetchStores()">Try Again</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 4" :key="i" class="card-skeleton"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredStores.length === 0" class="empty-state">
      <Icon icon="entypo:shop" width="48" height="48" class="empty-icon" />
      <p class="empty-text">
        {{ stores.length === 0 ? 'No stores have been added yet.' : 'No stores match the current search or filter.' }}
      </p>
      <button v-if="stores.length === 0" type="button" class="add-store-btn" @click="openStoreModal()">
        <Icon icon="mdi:plus" width="19" height="19" aria-hidden="true" />
        <span>Add the first store</span>
      </button>
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
              <span class="badge badge-type">{{ s.store_type }}</span>
              <span class="badge" :class="s.is_open ? 'badge-open' : 'badge-closed'">
                {{ s.is_open ? 'Open' : 'Closed' }}
              </span>
            </div>
          </div>
        </div>
        <div class="store-owner">
          <Icon icon="mdi:account-outline" width="17" height="17" aria-hidden="true" />
          <span v-if="s.owner">
            {{ s.owner.name }}
            <small v-if="s.owner.nis_nip">NIS/NIP: {{ s.owner.nis_nip }}</small>
          </span>
          <span v-else class="no-owner">No owner assigned</span>
        </div>
        <div class="store-actions">
          <button
            type="button"
            class="card-action edit-action"
            :aria-label="`Edit ${s.name}`"
            @click="openStoreModal(s)"
          >
            <Icon icon="mdi:pencil-outline" width="17" height="17" aria-hidden="true" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            class="card-action delete-action"
            :aria-label="`Delete ${s.name}`"
            :disabled="deletingStore && deletingStoreTarget?.id === s.id"
            @click="openDeleteModal(s)"
          >
            <Icon icon="mdi:delete-outline" width="17" height="17" aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      </article>
    </div>

    <nav v-if="!loading" class="pagination" aria-label="Store list pages">
      <span class="pagination-summary">
        Page {{ currentPage }} of {{ pagination.last_page }} | {{ pagination.total }} stores
      </span>
      <div class="pagination-actions">
        <button
          type="button"
          class="pagination-button"
          :disabled="loading || isFirstPage"
          @click="fetchStores(currentPage - 1)"
        >
          <Icon icon="mdi:chevron-left" width="18" height="18" aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          class="pagination-button"
          :disabled="loading || isLastPage"
          @click="fetchStores(currentPage + 1)"
        >
          Next
          <Icon icon="mdi:chevron-right" width="18" height="18" aria-hidden="true" />
        </button>
      </div>
    </nav>

    <StoreModal
      v-if="storeModalOpen"
      :store="editingStore"
      :admins="availableAdmins"
      :admins-loading="loadingAdmins"
      :admins-error="adminError"
      :submitting="savingStore"
      :submit-error="storeSubmitError"
      :field-errors="storeFieldErrors"
      @close="closeStoreModal"
      @submit="saveStore"
      @retry-admins="fetchAdmins"
    />

    <DeleteStoreModal
      v-if="deletingStoreTarget"
      :store="deletingStoreTarget"
      :deleting="deletingStore"
      :error-message="deleteError"
      @close="closeDeleteModal"
      @confirm="confirmDeleteStore"
    />
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
  gap: 16px;
}

.heading-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
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

.add-store-btn {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px 14px;
  border: 1px solid var(--color-primary-hover, #007acc);
  border-radius: var(--radius-md);
  background: var(--color-primary-hover, #007acc);
  color: #fff;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.add-store-btn:hover {
  border-color: #005fa3;
  background: #005fa3;
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

.search-input::placeholder {
  color: #667085;
  opacity: 1;
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
  background: var(--color-primary-hover, #007acc);
  border-color: var(--color-primary-hover, #007acc);
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
  gap: 12px;
  padding: 48px 16px;
  background: #fff;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.empty-icon {
  color: #cbd5e1;
}

.empty-text {
  font-size: var(--font-size-sm);
}

.store-card {
  min-width: 0;
  gap: 16px;
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
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.store-name {
  font-family: var(--font-family-brand);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  overflow-wrap: anywhere;
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

.store-owner {
  display: flex;
  min-height: 38px;
  align-items: flex-start;
  gap: 8px;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.store-owner > svg {
  flex: 0 0 auto;
  color: var(--color-text-muted);
}

.store-owner > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.store-owner small {
  display: block;
  margin-top: 2px;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.store-owner .no-owner {
  color: var(--color-text-muted);
}

.store-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #eaecf0;
}

.card-action {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: #fff;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.card-action:hover:not(:disabled) {
  background: #f9fafb;
}

.card-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-action {
  border-color: #fecdca;
  color: var(--color-danger-dark, #b42318);
}

.delete-action:hover:not(:disabled) {
  border-color: #fda29b;
  background: #fff5f4;
}

.card-action:focus-visible,
.add-store-btn:focus-visible,
.action-btn:focus-visible,
.filter-pill:focus-visible,
.pagination-button:focus-visible,
.retry-btn:focus-visible {
  outline: 3px solid rgb(0 149 255 / 45%);
  outline-offset: 2px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 4px;
}

.pagination-summary {
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
}

.pagination-actions {
  display: flex;
  gap: 8px;
}

.pagination-button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid #d0d5dd;
  border-radius: var(--radius-md);
  background: #fff;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.pagination-button:hover:not(:disabled) {
  background: #f9fafb;
}

.pagination-button:disabled {
  color: #98a2b3;
  cursor: not-allowed;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .heading-actions {
    width: 100%;
  }

  .heading-actions > button {
    flex: 1;
  }

  .search-box {
    min-width: 100%;
  }

  .pagination {
    align-items: flex-start;
    flex-direction: column;
  }

  .pagination-actions,
  .pagination-actions > button {
    width: 100%;
  }
}
</style>
