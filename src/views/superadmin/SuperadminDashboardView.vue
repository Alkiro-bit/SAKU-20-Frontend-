<script setup>
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { apiClient, getApiErrorMessage } from '@/services/api';

const router = useRouter();
const authStore = useAuthStore();

const stores = ref([]);
const users = ref([]);
const categories = ref([]);
const loading = ref(true);
const error = ref('');
const activeTab = ref('stores');

async function fetchStores() {
  try {
    const res = await apiClient.get('/superadmin/stores');
    stores.value = res.data.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat data toko.');
  }
}

async function fetchUsers() {
  try {
    const res = await apiClient.get('/superadmin/users');
    users.value = res.data.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat data user.');
  }
}

async function fetchCategories() {
  try {
    const res = await apiClient.get('/superadmin/categories');
    categories.value = res.data.data || [];
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat kategori.');
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

async function handleLogout() {
  await authStore.logout();
  router.replace('/login');
}

onMounted(async () => {
  await Promise.all([fetchStores(), fetchUsers(), fetchCategories()]);
  loading.value = false;
});
</script>

<template>
  <div class="sa-view">
    <header class="sa-header">
      <h1 class="header-title">Superadmin</h1>
      <button type="button" class="logout-btn" @click="handleLogout">
        <Icon icon="mdi:logout" width="20" height="20" />
      </button>
    </header>

    <!-- Tab Nav -->
    <nav class="tab-nav">
      <button
        v-for="tab in ['stores', 'users', 'categories']"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab === 'stores' ? 'Toko' : tab === 'users' ? 'User' : 'Kategori' }}
      </button>
    </nav>

    <main class="sa-content">
      <p v-if="error" class="sa-error" role="alert">{{ error }}</p>

      <div v-if="loading" class="loading">Memuat…</div>

      <template v-else>
        <!-- Stores Tab -->
        <div v-if="activeTab === 'stores'" class="tab-panel">
          <div v-if="stores.length === 0" class="empty">Belum ada toko.</div>
          <div v-for="s in stores" :key="s.id" class="list-item">
            <div class="item-info">
              <span class="item-name">{{ s.name }}</span>
              <span class="item-sub">{{ s.type }} — {{ s.is_open ? 'Buka' : 'Tutup' }}</span>
            </div>
          </div>
        </div>

        <!-- Users Tab -->
        <div v-if="activeTab === 'users'" class="tab-panel">
          <div v-if="users.length === 0" class="empty">Belum ada user.</div>
          <div v-for="u in users" :key="u.id" class="list-item">
            <div class="item-info">
              <span class="item-name">{{ u.name }}</span>
              <span class="item-sub">{{ u.role }} — {{ u.nis_nip }}</span>
            </div>
            <button
              class="status-toggle"
              :class="{ active: u.is_active }"
              @click="toggleUserStatus(u)"
            >
              {{ u.is_active ? 'Aktif' : 'Nonaktif' }}
            </button>
          </div>
        </div>

        <!-- Categories Tab -->
        <div v-if="activeTab === 'categories'" class="tab-panel">
          <div v-if="categories.length === 0" class="empty">Belum ada kategori.</div>
          <div v-for="c in categories" :key="c.id" class="list-item">
            <span class="item-name">{{ c.name }}</span>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.sa-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.sa-header {
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
  color: var(--color-text-on-accent);
  opacity: 0.9;
}

.tab-nav {
  display: flex;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  font-family: var(--font-family-brand);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-align: center;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.sa-content {
  padding: var(--space-2);
}

.sa-error {
  color: #b42318;
  font-size: var(--font-size-sm);
  text-align: center;
  margin-bottom: 12px;
}

.loading {
  text-align: center;
  padding: var(--space-3) 0;
  color: var(--color-text-muted);
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: var(--space-3) 0;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

.status-toggle {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: white;
  background-color: #b42318;
}

.status-toggle.active {
  background-color: #00a63e;
}
</style>
