<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  showRefresh: { type: Boolean, default: false },
  refreshing: { type: Boolean, default: false },
  refreshDisabled: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle-sidebar', 'refresh']);
const authStore = useAuthStore();
const displayName = computed(() => authStore.user?.name || 'Superadmin');
</script>

<template>
  <header class="superadmin-topbar">
    <div class="topbar-left">
      <button
        type="button"
        class="header-toggle-btn"
        title="Toggle Sidebar"
        aria-label="Toggle Sidebar"
        @click="emit('toggle-sidebar')"
      >
        <Icon icon="mdi:menu" width="24" height="24" />
      </button>
      <div class="page-title">
        <Icon icon="mdi:shield-account" width="28" height="28" />
        <span>Superadmin</span>
      </div>
    </div>
    <div class="topbar-right">
      <button
        v-if="showRefresh"
        type="button"
        class="refresh-btn"
        title="Refresh Data"
        :disabled="refreshDisabled || refreshing"
        @click="emit('refresh')"
      >
        <Icon icon="mdi:refresh" width="20" height="20" :class="{ 'spin-icon': refreshing }" />
        <span>Refresh</span>
      </button>
      <span class="user-greeting">Hi, {{ displayName }}</span>
    </div>
  </header>
</template>

<style scoped>
.superadmin-topbar {
  height: 100px;
  padding: 10px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 10px 0 10px rgba(0, 0, 0, 0.25);
  z-index: 10;
}
.topbar-left, .topbar-right, .page-title, .refresh-btn {
  display: flex;
  align-items: center;
}
.topbar-left, .topbar-right {
  gap: 16px;
}
.page-title {
  gap: 10px;
  font: var(--font-weight-medium) 24px var(--font-family-brand);
  color: #000;
}
.header-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: transparent;
  color: #000;
  border: 0;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}
.header-toggle-btn:hover {
  background-color: rgba(0, 140, 255, 0.1);
}
.refresh-btn {
  border: 0;
  cursor: pointer;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f5f5f5;
  color: #000;
}
.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.user-greeting {
  font: var(--font-weight-medium) var(--font-size-sm) var(--font-family-base);
  color: #000;
}
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@media (max-width: 1024px) {
  .superadmin-topbar {
    padding: 10px 24px;
  }
}
@media (max-width: 768px) {
  .superadmin-topbar {
    height: 80px;
    padding: 10px 16px;
  }
  .refresh-btn span {
    display: none;
  }
}
</style>
