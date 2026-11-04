<script setup>
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

function handleProfileClick() {
  if (authStore.isAuthenticated) {
    if (authStore.role === 'admin') router.push('/admin/dashboard');
    else if (authStore.role === 'superadmin') router.push('/superadmin/stores');
    else router.push('/history');
  } else {
    router.push('/login');
  }
}
</script>

<template>
  <header class="mobile-header">
    <router-link to="/" class="logo">SAKU 20</router-link>
    <button class="profile-btn" @click="handleProfileClick" aria-label="Profil Akun">
      <Icon icon="ix:user-profile-filled" width="36" height="36" class="profile-icon" />
    </button>
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
}

.profile-icon {
  color: var(--color-text);
}
</style>
