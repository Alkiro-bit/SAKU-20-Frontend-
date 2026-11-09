<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import AdminSidebar from '@/components/layout/AdminSidebar.vue';
import AdminHeader from '@/components/layout/AdminHeader.vue';

const router = useRouter();
const isSidebarCollapsed = ref(false);

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar v-model:collapsed="isSidebarCollapsed" />

    <div class="admin-main">
      <AdminHeader
        :show-refresh="false"
        @toggle-sidebar="toggleSidebar"
      />

      <main class="page-content">
        <div class="placeholder-card">
          <Icon icon="bxs:box" width="48" height="48" class="placeholder-icon" />
          <h1 class="placeholder-title">Products &amp; Stock</h1>
          <p class="placeholder-desc">This page is under development.</p>
          <button type="button" class="back-btn" @click="router.push('/admin/dashboard')">
            <Icon icon="mdi:arrow-left" width="18" height="18" />
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #efefef;
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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
  border: none;
}
</style>
