<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient, getApiErrorMessage } from '@/services/api';

const users = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const selectedRole = ref('all');
const togglingUserId = ref(null);

async function fetchUsers() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiClient.get('/superadmin/users');
    users.value = res.data?.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat data pengguna.');
  } finally {
    loading.value = false;
  }
}

async function toggleUserStatus(user) {
  if (togglingUserId.value === user.id) return;
  togglingUserId.value = user.id;
  try {
    const nextStatus = !user.is_active;
    await apiClient.patch(`/superadmin/users/${user.id}/status`, { is_active: nextStatus });
    user.is_active = nextStatus;
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal mengubah status pengguna.');
  } finally {
    togglingUserId.value = null;
  }
}

const filteredUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return users.value.filter((u) => {
    const matchName = !q || (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || (u.nis_nip && String(u.nis_nip).toLowerCase().includes(q));
    const matchRole = selectedRole.value === 'all' || u.role === selectedRole.value;
    return matchName && matchRole;
  });
});

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="superadmin-page">
    <div class="page-heading">
      <div>
        <h1 class="page-title">Users Management</h1>
        <p class="page-subtitle">Daftar semua pengguna terdaftar dan kelola akses akun</p>
      </div>
      <button type="button" class="action-btn" title="Refresh data" :disabled="loading" @click="fetchUsers">
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
          placeholder="Cari user berdasarkan nama, email, atau NIS/NIP..."
          class="search-input"
        />
      </div>

      <div class="role-filters">
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedRole === 'all' }"
          @click="selectedRole = 'all'"
        >
          Semua ({{ users.length }})
        </button>
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedRole === 'pembeli' }"
          @click="selectedRole = 'pembeli'"
        >
          Pembeli
        </button>
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedRole === 'admin' }"
          @click="selectedRole = 'admin'"
        >
          Admin
        </button>
        <button
          type="button"
          class="filter-pill"
          :class="{ active: selectedRole === 'superadmin' }"
          @click="selectedRole = 'superadmin'"
        >
          Superadmin
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner" role="alert">
      <Icon icon="mdi:alert-circle-outline" width="20" height="20" />
      <span>{{ error }}</span>
      <button type="button" class="retry-btn" @click="fetchUsers">Coba Lagi</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 5" :key="i" class="row-skeleton"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <Icon icon="mdi:account-group" width="48" height="48" class="empty-icon" />
      <p class="empty-text">Tidak ada pengguna yang sesuai dengan pencarian.</p>
    </div>

    <!-- Users Table/List -->
    <div v-else class="users-list">
      <article v-for="u in filteredUsers" :key="u.id" class="user-item">
        <div class="user-info">
          <div class="user-avatar">
            <Icon icon="mdi:account" width="22" height="22" />
          </div>
          <div class="user-details">
            <div class="user-main-line">
              <span class="user-name">{{ u.name }}</span>
              <span class="badge" :class="`badge-${u.role}`">{{ u.role }}</span>
            </div>
            <div class="user-sub-line">
              <span v-if="u.email">{{ u.email }}</span>
              <span v-if="u.email && u.nis_nip">·</span>
              <span v-if="u.nis_nip">NIS/NIP: {{ u.nis_nip }}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="status-toggle-btn"
          :class="{ active: u.is_active }"
          :disabled="togglingUserId === u.id"
          @click="toggleUserStatus(u)"
        >
          <Icon
            v-if="togglingUserId === u.id"
            icon="mdi:loading"
            width="16"
            height="16"
            class="spin-icon"
          />
          <Icon
            v-else
            :icon="u.is_active ? 'mdi:check-circle' : 'mdi:close-circle'"
            width="16"
            height="16"
          />
          <span>{{ u.is_active ? 'Aktif' : 'Nonaktif' }}</span>
        </button>
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

.role-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.loading-state, .users-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row-skeleton {
  height: 64px;
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

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-main-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-family: var(--font-family-brand);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
}

.badge-pembeli {
  background: #e0f2fe;
  color: #0369a1;
}

.badge-admin {
  background: #fef3c7;
  color: #b45309;
}

.badge-superadmin {
  background: #ede9fe;
  color: #6d28d9;
}

.user-sub-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.status-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  background-color: #fee4e2;
  color: #b42318;
  transition: all var(--transition-fast);
}

.status-toggle-btn.active {
  background-color: #dcfce7;
  color: #15803d;
}

.status-toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
