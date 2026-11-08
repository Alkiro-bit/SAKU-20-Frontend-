<script setup>
import { Icon } from '@iconify/vue';

defineProps({
  title: {
    type: String,
    default: 'Store is Closed',
  },
  message: {
    type: String,
    default: 'The food never stops, come back again when it opens.',
  },
});
</script>

<template>
  <div class="closed-store-empty" role="status">
    <div class="icon-wrapper">
      <Icon icon="mdi:store-clock-outline" width="46" height="46" class="closed-icon" />
    </div>
    <h3 class="closed-title">{{ title }}</h3>
    <p class="closed-message">{{ message }}</p>
  </div>
</template>

<style scoped>
.closed-store-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-4) var(--space-2);
  gap: var(--space-1);
}

.icon-wrapper {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background-color: var(--color-store-closed-soft, rgba(150, 150, 150, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.closed-icon {
  color: var(--color-text-muted);
}

.closed-title {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  color: var(--color-text);
  margin: 0;
}

.closed-message {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  max-width: 270px;
  line-height: 1.4;
  margin: 0;
}
</style>
