<script setup>
defineProps({
  store: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['select']);
</script>

<template>
  <button
    type="button"
    class="store-card"
    :class="{ 'is-active': active, 'is-closed': store.is_open === false }"
    @click="$emit('select', store)"
  >
    <span class="store-name">{{ store.name }}</span>
    <span v-if="store.is_open === false" class="closed-badge">Closed</span>
  </button>
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  text-align: center;
  font: inherit;
  cursor: pointer;
  gap: 4px;
  transition: transform var(--transition-fast), border-color var(--transition-fast), opacity var(--transition-fast);
}

.store-card:active {
  transform: scale(0.96);
}

.store-card.is-active {
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-color: var(--color-primary);
}

.store-card.is-active .store-name {
  color: var(--color-primary);
}

.store-card.is-closed {
  background-color: #fafafa;
  border-color: #d1d5db;
}

.closed-badge {
  font-family: var(--font-family-base);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  background-color: var(--color-store-closed-soft, rgba(150, 150, 150, 0.2));
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.1;
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
