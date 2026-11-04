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
    :class="{ 'is-active': active }"
    @click="$emit('select', store)"
  >
    <span class="store-name">{{ store.name }}</span>
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
  align-items: center;
  justify-content: center;
  padding: 8px;
  text-align: center;
  font: inherit;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
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

.store-name {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: 13px;
  line-height: 1.25;
  color: var(--color-text);
  word-break: break-word;
}
</style>
