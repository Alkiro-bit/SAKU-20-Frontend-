<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  store: {
    type: Object,
    default: null,
  },
  fallbackName: {
    type: String,
    default: 'Store',
  },
  refreshing: {
    type: Boolean,
    default: false,
  },
  refreshDisabled: {
    type: Boolean,
    default: false,
  },
  showRefresh: {
    type: Boolean,
    default: true,
  },
  userName: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(['toggle-sidebar', 'refresh']);

const authStore = useAuthStore();

const displayName = computed(() => {
  if (props.userName !== undefined) return props.userName;
  return authStore.user?.name || 'Admin';
});
</script>

<template>
  <header class="admin-topbar">
    <div class="topbar-left">
      <button
        type="button"
        class="mobile-toggle-btn"
        aria-label="Toggle menu"
        @click="emit('toggle-sidebar')"
      >
        <Icon icon="mdi:menu" width="24" height="24" />
      </button>
      <div class="shop-badge">
        <Icon icon="entypo:shop" width="30" height="30" class="shop-icon" />
        <div class="shop-meta">
          <span class="shop-name">{{ store?.name || fallbackName }}</span>
          <span v-if="store?.store_type" class="store-type-badge">{{ store.store_type }}</span>
        </div>
      </div>
    </div>

    <div class="topbar-right">
      <slot name="actions">
        <button
          v-if="showRefresh"
          type="button"
          class="refresh-btn"
          title="Refresh Data"
          :disabled="refreshDisabled || refreshing"
          @click="emit('refresh')"
        >
          <Icon
            icon="mdi:refresh"
            width="20"
            height="20"
            :class="{ 'spin-icon': refreshing }"
          />
          <span class="refresh-label">Refresh</span>
        </button>
        <div class="user-pill" v-if="displayName">
          <span class="user-greeting">Hi, {{ displayName }}</span>
        </div>
      </slot>
    </div>
  </header>
</template>

<style scoped>
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
  background: transparent;
  border: none;
  cursor: pointer;
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
  border: none;
  cursor: pointer;
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

@media (max-width: 1024px) {
  .admin-topbar {
    padding: 10px 24px;
  }
}

@media (max-width: 768px) {
  .mobile-toggle-btn {
    display: inline-flex;
  }

  .admin-topbar {
    height: 80px;
    padding: 10px 16px;
  }

  .refresh-label {
    display: none;
  }
}
</style>
