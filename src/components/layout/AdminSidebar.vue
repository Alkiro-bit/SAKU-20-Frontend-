<script setup>
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:collapsed']);

const router = useRouter();
const authStore = useAuthStore();

function handleToggle() {
  emit('update:collapsed', !props.collapsed);
}

async function handleLogout() {
  try {
    await authStore.logout();
  } finally {
    await router.replace('/');
  }
}
</script>

<template>
  <aside class="admin-sidebar" :class="{ 'is-collapsed': collapsed }">
    <div class="sidebar-header">
      <div class="brand-logo">
        <span class="brand-text">SAKU 20</span>
      </div>
      <button
        type="button"
        class="sidebar-toggle-btn"
        :title="collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        :aria-label="collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        @click="handleToggle"
      >
        <Icon
          :icon="collapsed ? 'mdi:menu' : 'mdi:menu-open'"
          width="20"
          height="20"
        />
      </button>
    </div>

    <nav class="sidebar-nav" aria-label="Admin navigation">
      <router-link to="/admin/dashboard" class="nav-item" active-class="active">
        <Icon icon="bxs:dashboard" class="nav-icon" width="20" height="20" />
        <span class="nav-label">Dashboard</span>
      </router-link>

      <router-link to="/admin/orders" class="nav-item" active-class="active">
        <Icon icon="bi:bag-fill" class="nav-icon" width="18" height="18" />
        <span class="nav-label">Orders</span>
      </router-link>

      <router-link to="/admin/products" class="nav-item" active-class="active">
        <Icon icon="bxs:box" class="nav-icon" width="20" height="20" />
        <span class="nav-label">Products &amp; Stock</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button
        type="button"
        class="logout-action-btn"
        title="Logout"
        aria-label="Logout"
        @click="handleLogout"
      >
        <Icon icon="mdi:logout" width="18" height="18" />
        <span class="logout-label">Logout</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  width: 250px;
  height: 100vh;
  position: sticky;
  top: 0;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
  padding: 14px 10px 14px 20px;
  transition: width var(--transition-fast), padding var(--transition-fast), transform var(--transition-fast);
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
  color: #969696;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  cursor: pointer;
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

.nav-item.active .nav-icon {
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
  border: none;
  background: transparent;
  cursor: pointer;
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

/* Sidebar Collapsed State */
.admin-sidebar.is-collapsed {
  width: 72px;
  padding: 14px 10px;
  align-items: center;
}

.admin-sidebar.is-collapsed .brand-text,
.admin-sidebar.is-collapsed .nav-label,
.admin-sidebar.is-collapsed .logout-label {
  display: none;
}

.admin-sidebar.is-collapsed .nav-item {
  justify-content: center;
  padding: 10px;
  width: 100%;
}

.admin-sidebar.is-collapsed .sidebar-header {
  justify-content: center;
}

.admin-sidebar.is-collapsed .logout-action-btn {
  justify-content: center;
}

/* Responsive: Mobile fallback (<= 768px) */
@media (max-width: 768px) {
  .admin-sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(0);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
    z-index: 50;
  }

  .admin-sidebar.is-collapsed {
    transform: translateX(-100%);
  }
}
</style>
