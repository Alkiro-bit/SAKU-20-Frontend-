<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isFullWidth = computed(() => {
  return (
    route.meta?.layout === 'full' ||
    route.path.startsWith('/admin') ||
    route.path.startsWith('/superadmin')
  );
});
</script>

<template>
  <div :class="isFullWidth ? 'full-container' : 'mobile-container'">
    <router-view />
  </div>
</template>

<style scoped>
</style>

