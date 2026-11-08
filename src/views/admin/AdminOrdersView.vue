<script setup>
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

const router = useRouter();
</script>

<template>
  <div class="admin-placeholder-page">
    <div class="placeholder-card">
      <Icon icon="bi:bag-fill" width="48" height="48" class="placeholder-icon" />
      <h1 class="placeholder-title">Orders Management</h1>
      <p class="placeholder-desc">This page is under development.</p>
      <button type="button" class="back-btn" @click="router.push('/admin/dashboard')">
        <Icon icon="mdi:arrow-left" width="18" height="18" />
        Back to Dashboard
      </button>
    </div>
  </div>
</template>

<style scoped>
.admin-placeholder-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-admin-bg);
  padding: 20px;
}

.placeholder-card {
  background: var(--color-surface);
  padding: 40px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 400px;
  width: 100%;
}

.placeholder-icon {
  color: var(--color-primary);
}

.placeholder-title {
  font-family: var(--font-family-brand);
  font-size: 20px;
  color: var(--color-text);
}

.placeholder-desc {
  font-family: var(--font-family-base);
  font-size: 14px;
  color: var(--color-text-muted);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-text-on-accent);
  font-family: var(--font-family-brand);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}
</style>
