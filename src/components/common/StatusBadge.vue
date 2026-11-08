<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const statusConfig = {
  diproses: { label: 'Processing', color: 'var(--color-status-diproses)' },
  processing: { label: 'Processing', color: 'var(--color-status-diproses)' },
  pending: { label: 'Processing', color: 'var(--color-status-diproses)' },
  siap_diambil: { label: 'Ready for Pickup', color: 'var(--color-status-siap_diambil)' },
  ready: { label: 'Ready for Pickup', color: 'var(--color-status-siap_diambil)' },
  selesai: { label: 'Completed', color: 'var(--color-status-selesai)' },
  completed: { label: 'Completed', color: 'var(--color-status-selesai)' },
  dibatalkan: { label: 'Cancelled', color: 'var(--color-status-dibatalkan)' },
  cancelled: { label: 'Cancelled', color: 'var(--color-status-dibatalkan)' },
  canceled: { label: 'Cancelled', color: 'var(--color-status-dibatalkan)' },
};

const current = computed(() => {
  const key = props.status?.toLowerCase();
  return statusConfig[key] || { label: props.status, color: 'var(--color-text-muted)' };
});
</script>

<template>
  <span
    class="status-badge"
    :style="{
      backgroundColor: `color-mix(in srgb, ${current.color} 20%, transparent)`,
      color: current.color,
      borderColor: current.color,
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
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-xs);
  line-height: normal;
  white-space: nowrap;
}
</style>
