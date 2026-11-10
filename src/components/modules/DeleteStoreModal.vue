<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  store: {
    type: Object,
    required: true,
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
const dialog = ref(null);
const cancelButton = ref(null);
let previousBodyOverflow = '';
let previouslyFocusedElement = null;

function requestClose() {
  if (!props.deleting) emit('close');
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    requestClose();
    return;
  }
  if (event.key !== 'Tab' || !dialog.value) return;

  const focusable = [...dialog.value.querySelectorAll('button:not(:disabled)')];
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
  if (previouslyFocusedElement?.isConnected) previouslyFocusedElement.focus();
});
</script>

<template>
  <div class="delete-store-backdrop" @click.self="requestClose">
    <section
      ref="dialog"
      class="delete-store-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-store-title"
      aria-describedby="delete-store-description"
      tabindex="-1"
    >
      <div class="warning-icon" aria-hidden="true">
        <Icon icon="mdi:alert-circle-outline" width="32" height="32" />
      </div>

      <header class="delete-store-heading">
        <h2 id="delete-store-title">Permanently delete store?</h2>
        <p id="delete-store-description">
          This will permanently delete <strong>{{ store.name }}</strong>. This action cannot be undone.
        </p>
      </header>

      <p class="delete-store-warning">
        Related products or orders may become orphaned, or prevent deletion because of database constraints.
      </p>

      <p v-if="errorMessage" class="delete-store-error" role="alert">
        <Icon icon="mdi:alert-outline" width="17" height="17" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </p>

      <div class="delete-store-actions">
        <button
          ref="cancelButton"
          type="button"
          class="cancel-button"
          :disabled="deleting"
          @click="requestClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="delete-button"
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
          {{ deleting ? 'Deleting...' : 'Delete Store' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.delete-store-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
  background-color: rgb(0 0 0 / 35%);
}

.delete-store-dialog {
  display: flex;
  width: min(440px, 100%);
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 26px 24px;
  border-radius: 12px;
  background-color: var(--color-surface, #fff);
  box-shadow: 0 16px 48px rgb(16 24 40 / 20%);
  text-align: center;
}

.warning-icon {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border-radius: 50%;
  background: #fff1f1;
  color: var(--color-danger, #d92d20);
}

.delete-store-heading h2 {
  color: var(--color-text);
  font-family: var(--font-family-brand);
  font-size: 19px;
  font-weight: 600;
  line-height: 1.25;
}

.delete-store-heading p,
.delete-store-warning {
  margin-top: 7px;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.delete-store-heading strong {
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.delete-store-warning {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fffaeb;
  color: #7a2e0e;
  text-align: left;
}

.delete-store-error {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 7px;
  color: var(--color-danger-dark, #b42318);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: 1.4;
  text-align: left;
}

.delete-store-error svg {
  flex: 0 0 auto;
}

.delete-store-actions {
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 2px;
}

.cancel-button,
.delete-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 15px;
  border-radius: 8px;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #d0d5dd;
  background: #fff;
  color: var(--color-text);
}

.delete-button {
  border: 1px solid var(--color-danger-dark, #b42318);
  background: var(--color-danger-dark, #b42318);
  color: #fff;
}

.cancel-button:hover:not(:disabled) {
  background: #f9fafb;
}

.delete-button:hover:not(:disabled) {
  border-color: #8f1d14;
  background: #8f1d14;
}

.cancel-button:disabled,
.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-button:focus-visible,
.delete-button:focus-visible {
  outline: 3px solid rgb(0 149 255 / 45%);
  outline-offset: 2px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 440px) {
  .delete-store-actions > button {
    flex: 1;
  }
}
</style>
