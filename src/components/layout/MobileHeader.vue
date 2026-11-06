<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const profileMenuOpen = ref(false);
const profileMenuRef = ref(null);
const profileButtonRef = ref(null);

function handleProfileClick() {
  profileMenuOpen.value = !profileMenuOpen.value;
}

async function handleLogout() {
  profileMenuOpen.value = false;
  await authStore.logout();
  await router.replace('/login');
}

function handleDocumentClick(event) {
  if (!profileMenuRef.value?.contains(event.target)) {
    profileMenuOpen.value = false;
  }
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape' && profileMenuOpen.value) {
    profileMenuOpen.value = false;
    profileButtonRef.value?.focus();
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleDocumentKeydown);
});
</script>

<template>
  <header class="mobile-header">
    <router-link to="/" class="logo">SAKU 20</router-link>
    <router-link v-if="!authStore.isAuthenticated" to="/login" class="login-cta">
      Login
    </router-link>
    <div v-else ref="profileMenuRef" class="profile-menu">
      <button
        ref="profileButtonRef"
        type="button"
        class="profile-btn"
        aria-label="Menu profil"
        :aria-expanded="profileMenuOpen"
        aria-controls="profile-menu-options"
        @click="handleProfileClick"
      >
        <Icon icon="ix:user-profile-filled" width="36" height="36" class="profile-icon" />
      </button>
      <div
        v-if="profileMenuOpen"
        id="profile-menu-options"
        class="profile-dropdown"
      >
        <button type="button" class="dropdown-item logout-item" @click="handleLogout">
          <Icon icon="mdi:logout" width="20" height="20" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.mobile-header {
  height: 60px;
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-2);
  box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  box-sizing: border-box;
}

.logo {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-bold);
  font-size: 20px;
  color: var(--color-primary);
  letter-spacing: -2px;
}

.profile-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--color-text);
  border-radius: 50%;
  cursor: pointer;
}

.profile-menu {
  position: relative;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 1;
  min-width: 180px;
  padding: 6px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 0 10px;
  border-radius: 4px;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.logout-item {
  color: #b42318;
}

.dropdown-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.profile-icon {
  color: var(--color-text);
}

.login-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 29px;
  padding: 6px 30px;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-text-on-accent);
  font-family: var(--font-family-brand);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: normal;
  transition: background-color var(--transition-fast);
}

.login-cta:hover {
  background-color: var(--color-primary-hover);
}

.login-cta:focus-visible,
.profile-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .login-cta,
  .dropdown-item {
    transition: none;
  }
}
</style>
