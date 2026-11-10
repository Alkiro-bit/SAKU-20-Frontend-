<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  store: {
    type: Object,
    default: null,
  },
  admins: {
    type: Array,
    default: () => [],
  },
  adminsLoading: {
    type: Boolean,
    default: false,
  },
  adminsError: {
    type: String,
    default: '',
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  submitError: {
    type: String,
    default: '',
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['close', 'submit', 'retry-admins']);

const dialog = ref(null);
const nameInput = ref(null);
const form = reactive({
  name: '',
  store_type: 'siswa',
  is_open: true,
  owner_user_id: '',
});
let previousBodyOverflow = '';
let previouslyFocusedElement = null;

const isEditing = computed(() => Boolean(props.store));
const title = computed(() => (isEditing.value ? 'Edit Store' : 'Add Store'));
const submitLabel = computed(() => (isEditing.value ? 'Save Changes' : 'Create Store'));
const selectedOwnerMissing = computed(() => {
  const ownerId = String(form.owner_user_id);
  return Boolean(ownerId && !props.admins.some((admin) => String(admin.id) === ownerId));
});

function fieldError(field) {
  const value = props.fieldErrors[field];
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
}

function resetForm() {
  form.name = props.store?.name || '';
  form.store_type = props.store?.store_type || 'siswa';
  form.is_open = props.store?.is_open ?? true;
  form.owner_user_id = String(props.store?.owner?.id ?? props.store?.owner_user_id ?? '');
}

function requestClose() {
  if (!props.submitting) emit('close');
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    requestClose();
    return;
  }
  if (event.key !== 'Tab' || !dialog.value) return;

  const focusable = [...dialog.value.querySelectorAll(
    'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
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

function submitForm() {
  emit('submit', {
    name: form.name.trim(),
    store_type: form.store_type,
    is_open: form.is_open,
    owner_user_id: form.owner_user_id === '' ? null : Number(form.owner_user_id),
  });
}

resetForm();

onMounted(async () => {
  previouslyFocusedElement = document.activeElement;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handleKeydown);
  await nextTick();
  nameInput.value?.focus();
});

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow;
  document.removeEventListener('keydown', handleKeydown);
  if (previouslyFocusedElement?.isConnected) previouslyFocusedElement.focus();
});
</script>

<template>
  <div class="store-modal-backdrop" @click.self="requestClose">
    <section
      ref="dialog"
      class="store-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-modal-title"
      tabindex="-1"
    >
      <header class="store-modal-heading">
        <div>
          <h2 id="store-modal-title">{{ title }}</h2>
          <p>Manage the store details and its admin owner.</p>
        </div>
        <button
          type="button"
          class="icon-close-button"
          aria-label="Close dialog"
          :disabled="submitting"
          @click="requestClose"
        >
          <Icon icon="mdi:close" width="20" height="20" aria-hidden="true" />
        </button>
      </header>

      <form class="store-form" @submit.prevent="submitForm">
        <label class="form-field">
          <span>Store name <span class="required-mark" aria-hidden="true">*</span></span>
          <input
            ref="nameInput"
            v-model="form.name"
            type="text"
            name="name"
            autocomplete="organization"
            required
            maxlength="255"
            :aria-invalid="Boolean(fieldError('name'))"
            :aria-describedby="fieldError('name') ? 'store-name-error' : undefined"
            :disabled="submitting"
          />
          <span v-if="fieldError('name')" id="store-name-error" class="field-error" role="alert">
            {{ fieldError('name') }}
          </span>
        </label>

        <label class="form-field">
          <span>Store type <span class="required-mark" aria-hidden="true">*</span></span>
          <select
            v-model="form.store_type"
            name="store_type"
            required
            :aria-invalid="Boolean(fieldError('store_type'))"
            :aria-describedby="fieldError('store_type') ? 'store-type-error' : undefined"
            :disabled="submitting"
          >
            <option value="siswa">Siswa</option>
            <option value="tefa">TEFA</option>
          </select>
          <span v-if="fieldError('store_type')" id="store-type-error" class="field-error" role="alert">
            {{ fieldError('store_type') }}
          </span>
        </label>

        <label class="form-field">
          <span>Admin owner</span>
          <select
            v-model="form.owner_user_id"
            name="owner_user_id"
            :aria-invalid="Boolean(fieldError('owner_user_id'))"
            :aria-describedby="fieldError('owner_user_id') ? 'store-owner-error' : 'store-owner-hint'"
            :disabled="submitting || adminsLoading"
          >
            <option value="">No owner</option>
            <option
              v-if="selectedOwnerMissing"
              :value="form.owner_user_id"
            >
              {{ store.owner?.name || `Admin #${form.owner_user_id}` }} (current owner)
            </option>
            <option v-for="admin in admins" :key="admin.id" :value="String(admin.id)">
              {{ admin.name }}{{ admin.nis_nip ? ` - ${admin.nis_nip}` : '' }}
            </option>
          </select>
          <span v-if="fieldError('owner_user_id')" id="store-owner-error" class="field-error" role="alert">
            {{ fieldError('owner_user_id') }}
          </span>
          <span v-else id="store-owner-hint" class="field-hint">
            Each admin can own one store. Choose "No owner" to unassign the current admin.
            Admins assigned on this page are omitted; the server checks all stores.
          </span>
          <span v-if="adminsError" class="field-error" role="alert">
            {{ adminsError }}
            <button type="button" class="inline-retry-button" @click="emit('retry-admins')">
              Retry
            </button>
          </span>
          <span v-else-if="adminsLoading" class="field-hint">Loading admin accounts...</span>
        </label>

        <label class="store-open-toggle">
          <input
            v-model="form.is_open"
            type="checkbox"
            name="is_open"
            :aria-invalid="Boolean(fieldError('is_open'))"
            :aria-describedby="fieldError('is_open') ? 'store-open-error' : undefined"
            :disabled="submitting"
          />
          <span>
            <strong>Store is open</strong>
            <small>Customers can place orders while the store is open.</small>
            <small v-if="fieldError('is_open')" id="store-open-error" class="field-error" role="alert">
              {{ fieldError('is_open') }}
            </small>
          </span>
        </label>

        <p v-if="submitError" class="submit-error" role="alert">
          <Icon icon="mdi:alert-circle-outline" width="18" height="18" aria-hidden="true" />
          <span>{{ submitError }}</span>
        </p>

        <div class="store-modal-actions">
          <button type="button" class="secondary-button" :disabled="submitting" @click="requestClose">
            Cancel
          </button>
          <button type="submit" class="primary-button" :disabled="submitting || !form.name.trim()">
            <Icon
              v-if="submitting"
              icon="mdi:loading"
              width="17"
              height="17"
              class="spin-icon"
              aria-hidden="true"
            />
            {{ submitting ? 'Saving...' : submitLabel }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.store-modal-backdrop {
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

.store-modal {
  width: min(520px, 100%);
  max-height: min(90vh, 760px);
  overflow-y: auto;
  padding: 24px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  background-color: var(--color-surface, #fff);
  box-shadow: 0 16px 48px rgb(16 24 40 / 20%);
}

.store-modal-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.store-modal-heading h2 {
  color: var(--color-text);
  font-family: var(--font-family-brand);
  font-size: 20px;
  font-weight: 600;
}

.store-modal-heading p {
  margin-top: 5px;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.icon-close-button {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.icon-close-button:hover:not(:disabled) {
  background: #f3f4f6;
  color: var(--color-text);
}

.store-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.form-field input,
.form-field select {
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  color: var(--color-text);
  font: inherit;
  font-weight: var(--font-weight-regular);
}

.form-field input:focus,
.form-field select:focus {
  border-color: var(--color-primary);
  outline: 3px solid rgb(0 149 255 / 18%);
}

.form-field [aria-invalid='true'] {
  border-color: var(--color-danger, #b42318);
}

.required-mark,
.field-error {
  color: var(--color-danger-dark, #b42318);
}

.field-error,
.field-hint {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-regular);
  line-height: 1.4;
}

.field-hint {
  color: var(--color-text-muted);
}

.inline-retry-button {
  margin-left: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.store-open-toggle {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #f9fafb;
  color: var(--color-text);
  font-family: var(--font-family-base);
  cursor: pointer;
}

.store-open-toggle input {
  width: 17px;
  height: 17px;
  margin: 2px 0 0;
  accent-color: var(--color-primary);
}

.store-open-toggle span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.store-open-toggle strong {
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.store-open-toggle small {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}

.submit-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef3f2;
  color: var(--color-danger-dark, #b42318);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.submit-error svg {
  flex: 0 0 auto;
}

.store-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.secondary-button,
.primary-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 8px;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

.secondary-button {
  border: 1px solid #d0d5dd;
  background: #fff;
  color: var(--color-text);
}

.primary-button {
  border: 1px solid var(--color-primary-hover, #007acc);
  background: var(--color-primary-hover, #007acc);
  color: #fff;
}

.secondary-button:hover:not(:disabled) {
  background: #f9fafb;
}

.primary-button:hover:not(:disabled) {
  border-color: #005fa3;
  background: #005fa3;
}

.secondary-button:disabled,
.primary-button:disabled,
.icon-close-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button:focus-visible,
.primary-button:focus-visible,
.icon-close-button:focus-visible,
.inline-retry-button:focus-visible {
  outline: 3px solid rgb(0 149 255 / 45%);
  outline-offset: 2px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 520px) {
  .store-modal {
    padding: 20px 16px;
  }

  .store-modal-actions > button {
    flex: 1;
  }
}
</style>
