<script setup>
import { ref } from 'vue';
import SuperadminSidebar from '@/components/layout/SuperadminSidebar.vue';
import SuperadminHeader from '@/components/layout/SuperadminHeader.vue';

const collapsed = ref(false);
function toggleSidebar() {
  collapsed.value = !collapsed.value;
}
</script>

<template>
  <div class="superadmin-layout" :class="{ 'sidebar-collapsed': collapsed }">
    <SuperadminSidebar v-model:collapsed="collapsed" />
    <div class="main-content" :class="{ 'collapsed': collapsed }">
      <SuperadminHeader @toggle-sidebar="toggleSidebar" />
      <main class="page-content">
        <slot>
          <router-view />
        </slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.superadmin-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--color-admin-bg, #efefef);
}

.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

@media (max-width: 768px) {
  .page-content {
    padding: 16px;
  }
}
</style>

