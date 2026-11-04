<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const statusConfig = {
  diproses: { label: 'Pending', bg: 'var(--color-status-diproses-bg)', text: 'var(--color-status-diproses-text)', border: '#ffd900' },
  pending: { label: 'Pending', bg: 'var(--color-status-diproses-bg)', text: 'var(--color-status-diproses-text)', border: '#ffd900' },
  siap_diambil: { label: 'Ready', bg: 'var(--color-status-siap_diambil-bg)', text: 'var(--color-status-siap_diambil-text)', border: '#00d707' },
  ready: { label: 'Ready', bg: 'var(--color-status-siap_diambil-bg)', text: 'var(--color-status-siap_diambil-text)', border: '#00d707' },
  selesai: { label: 'Completed', bg: 'var(--color-status-selesai-bg)', text: 'var(--color-status-selesai-text)', border: '#969696' },
  completed: { label: 'Completed', bg: 'var(--color-status-selesai-bg)', text: 'var(--color-status-selesai-text)', border: '#969696' },
  dibatalkan: { label: 'Canceled', bg: 'var(--color-status-dibatalkan-bg)', text: 'var(--color-status-dibatalkan-text)', border: '#ff0000' },
  canceled: { label: 'Canceled', bg: 'var(--color-status-dibatalkan-bg)', text: 'var(--color-status-dibatalkan-text)', border: '#ff0000' },
};

const current = computed(() => {
  const key = props.status?.toLowerCase();
  return statusConfig[key] || { label: props.status, bg: '#e5e7eb', text: '#374151', border: '#9ca3af' };
});
</script>

<template>
  <span
    class="status-badge"
    :style="{
      backgroundColor: current.bg,
      color: current.text,
      borderColor: current.border,
    }"
  >
    {{ current.label }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-xs);
  line-height: 1.2;
  white-space: nowrap;
}
</style>
