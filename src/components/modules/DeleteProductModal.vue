<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  product: {
    type: Object,
    default: null,
  },
  deleting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'confirm']);

const cancelButton = ref(null);
const dialog = ref(null);
let previousBodyOverflow = '';
let previouslyFocusedElement = null;

function handleKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    if (!props.deleting) emit('close');
    return;
  }
  if (event.key !== 'Tab' || !dialog.value) return;

  const focusable = [...dialog.value.querySelectorAll(
    'button:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )];
  if (!focusable.length) {
    event.preventDefault();
    dialog.value.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(async () => {
  previouslyFocusedElement = document.activeElement;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handleKeydown);
  await nextTick();
  cancelButton.value?.focus();
});

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow;
  document.removeEventListener('keydown', handleKeydown);
  previouslyFocusedElement?.focus?.();
});
</script>

<template>
  <div class="delete-modal-backdrop" @click.self="!deleting && emit('close')">
    <section
      ref="dialog"
      class="delete-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
      tabindex="-1"
    >
      <div class="warning-icon-wrapper" aria-hidden="true">
        <Icon icon="mdi:alert-circle-outline" width="34" height="34" />
      </div>

      <header class="modal-heading">
        <h2 id="delete-modal-title">Delete Product</h2>
        <p id="delete-modal-description">
          Are you sure you want to permanently delete
          <strong class="target-name">{{ product?.name || 'this product' }}</strong>?
        </p>
      </header>

      <p class="modal-explanation">
        This action permanently removes the product. Products referenced by past orders cannot be deleted.
      </p>

      <p v-if="errorMessage" class="error-banner" role="alert">
        <Icon icon="mdi:alert-outline" width="16" height="16" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </p>

      <div class="modal-actions">
        <button
          ref="cancelButton"
          type="button"
          class="cancel-button"
          :disabled="deleting"
          @click="emit('close')"
        >
          <Icon icon="mdi:close" width="16" height="16" aria-hidden="true" />
          <span>Cancel</span>
        </button>

        <button
          type="button"
          class="confirm-button"
          :disabled="deleting"
          @click="emit('confirm')"
        >
          <Icon
            :icon="deleting ? 'mdi:loading' : 'mdi:delete-outline'"
            :class="{ 'spin-icon': deleting }"
            width="17"
            height="17"
            aria-hidden="true"
          />
          <span>{{ deleting ? 'Deleting...' : 'Delete Product' }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.delete-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
  background-color: rgb(0 0 0 / 20%);
}

.delete-modal {
  display: flex;
  width: min(440px, 100%);
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 28px 24px;
  border-radius: 8px;
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
  text-align: center;
}

.warning-icon-wrapper {
  display: grid;
  width: 60px;
  height: 60px;
  place-items: center;
  color: var(--color-danger);
  border-radius: 50%;
  background-color: #fff1f1;
}

.modal-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-heading h2 {
  color: var(--color-text);
  font-family: var(--font-family-brand);
  font-size: 20px;
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
}

.modal-heading p {
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  line-height: 1.45;
}

.target-name {
  font-weight: var(--font-weight-semibold);
  word-break: break-word;
}

.modal-explanation {
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: 11px;
  line-height: 1.45;
  margin: -4px 0 0;
}

.error-banner {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  color: var(--color-danger-dark);
  border-radius: 4px;
  background-color: #fff1f1;
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  line-height: 1.4;
  text-align: left;
}

.modal-actions {
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

.cancel-button,
.confirm-button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 4px;
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.cancel-button {
  color: var(--color-text);
  border: 1px solid #c9c9c9;
  background-color: transparent;
}

.cancel-button:hover:not(:disabled) {
  background-color: #f7f7f7;
}

.confirm-button {
  color: var(--color-text-on-accent);
  border: 1px solid var(--color-danger);
  background-color: var(--color-danger);
}

.confirm-button:hover:not(:disabled) {
  opacity: 0.9;
}

.cancel-button:disabled,
.confirm-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-button:focus-visible,
.confirm-button:focus-visible {
  outline: 3px solid rgb(0 149 255 / 45%);
  outline-offset: 2px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
