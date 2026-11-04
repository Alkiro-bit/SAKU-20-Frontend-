<script setup>
defineProps({
  store: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <router-link :to="`/stores/${store.id}`" class="store-card">
    <span class="store-name">{{ store.name }}</span>
  </router-link>
</template>

<style scoped>
.store-card {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  background-color: var(--color-surface);
  border: 0.5px solid #b3b3b3;
  border-radius: 10px;
  box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  text-align: center;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.store-card:active {
  transform: scale(0.96);
}

.store-name {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: 13px;
  line-height: 1.25;
  color: var(--color-text);
  word-break: break-word;
}
</style>
