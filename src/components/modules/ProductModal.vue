<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { resolveImageUrl } from '@/services/api';

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value),
  },
  initialProduct: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  categoriesLoading: {
    type: Boolean,
    default: false,
  },
  categoriesError: {
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

const emit = defineEmits(['close', 'submit', 'retry-categories']);

const form = ref({
  name: '',
  price: '',
  categoryId: '',
  stock: 0,
  description: '',
});
const selectedImage = ref(null);
const imagePreviewUrl = ref('');
const imageError = ref('');
const fileInput = ref(null);
const nameInput = ref(null);
const dialog = ref(null);
let previousBodyOverflow = '';
let previouslyFocusedElement = null;

const imagePreview = computed(() => {
  if (imagePreviewUrl.value) return imagePreviewUrl.value;
  const image = props.initialProduct?.image_url || props.initialProduct?.image;
  return image ? resolveImageUrl(image) : '';
});
const title = computed(() => (props.mode === 'edit' ? 'Edit Product' : 'Add Product'));
const description = computed(() =>
  props.mode === 'edit'
    ? 'Update product information and stock.'
    : 'Add product information and stock.',
);
const submitLabel = computed(() => (props.mode === 'edit' ? 'Save Changes' : 'Add Product'));
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const maximumImageSize = 5 * 1024 * 1024;

function resetForm(product) {
  form.value = {
    name: product?.name || '',
    price: product?.price ?? '',
    categoryId: String(product?.category_id ?? ''),
    stock: product?.stock ?? 0,
    description: product?.description || '',
  };
  selectedImage.value = null;
  imageError.value = '';
  clearImagePreview();
  if (fileInput.value) fileInput.value.value = '';
}

function clearImagePreview() {
  if (imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
  imagePreviewUrl.value = '';
}

watch(
  () => props.initialProduct,
  (product) => resetForm(product),
  { immediate: true },
);

function fieldError(field) {
  const value = props.fieldErrors[field];
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
}

function chooseImage(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  if (!allowedImageTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
    imageError.value = 'Pilih gambar JPG, PNG, WebP, atau GIF.';
    event.target.value = '';
    return;
  }
  if (file.size > maximumImageSize) {
    imageError.value = 'Ukuran gambar maksimal 5 MB.';
    event.target.value = '';
    return;
  }

  imageError.value = '';
  selectedImage.value = file;
  clearImagePreview();
  imagePreviewUrl.value = URL.createObjectURL(file);
}

function adjustStock(amount) {
  form.value.stock = Math.max(0, Number(form.value.stock || 0) + amount);
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
    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
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
    name: form.value.name.trim(),
    price: form.value.price,
    category_id: form.value.categoryId,
    stock: Number(form.value.stock),
    description: form.value.description,
    image: selectedImage.value,
  });
}

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
  clearImagePreview();
  previouslyFocusedElement?.focus?.();
});
</script>

<template>
  <div class="product-modal-backdrop" @click.self="requestClose">
    <section
      ref="dialog"
      class="product-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      aria-describedby="product-modal-description"
      tabindex="-1"
    >
      <header class="modal-heading">
        <h2 id="product-modal-title">{{ title }}</h2>
        <p id="product-modal-description">{{ description }}</p>
      </header>

      <form class="product-form" @submit.prevent="submitForm">
        <label class="photo-upload" :class="{ 'has-preview': imagePreview }">
          <input
            ref="fileInput"
            class="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            :disabled="submitting"
            @change="chooseImage"
          />
          <img v-if="imagePreview" :src="imagePreview" alt="Product image preview" />
          <template v-else>
            <Icon icon="mdi:image-outline" width="26" height="26" aria-hidden="true" />
            <span class="photo-title">Add Product Photo</span>
            <span class="photo-help">Drop an image or browse<br />it from your computer</span>
          </template>
          <span v-if="imagePreview" class="photo-change">Change photo</span>
        </label>

        <div class="form-fields">
          <div class="field">
            <label for="product-name">Product Name</label>
            <input
              id="product-name"
              ref="nameInput"
              v-model="form.name"
              type="text"
              maxlength="255"
              placeholder="Insert"
              required
              :disabled="submitting"
              :aria-invalid="Boolean(fieldError('name'))"
              :aria-describedby="fieldError('name') ? 'product-name-error' : undefined"
            />
            <p v-if="fieldError('name')" id="product-name-error" class="field-error">
              {{ fieldError('name') }}
            </p>
          </div>

          <div class="price-category-row">
            <div class="field">
              <label for="product-price">Price</label>
              <input
                id="product-price"
                v-model="form.price"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                placeholder="Rp ..."
                required
                :disabled="submitting"
                :aria-invalid="Boolean(fieldError('price'))"
                :aria-describedby="fieldError('price') ? 'product-price-error' : undefined"
              />
              <p v-if="fieldError('price')" id="product-price-error" class="field-error">
                {{ fieldError('price') }}
              </p>
            </div>

            <div class="field">
              <label for="product-category">Categories</label>
              <select
                id="product-category"
                v-model="form.categoryId"
                required
                :disabled="submitting || categoriesLoading || Boolean(categoriesError)"
                :aria-invalid="Boolean(fieldError('category_id'))"
                :aria-describedby="
                  fieldError('category_id') ? 'product-category-error' : undefined
                "
              >
                <option value="" disabled>
                  {{ categoriesLoading ? 'Loading...' : 'Select category' }}
                </option>
                <option v-for="category in categories" :key="category.id" :value="String(category.id)">
                  {{ category.name }}
                </option>
              </select>
              <p v-if="fieldError('category_id')" id="product-category-error" class="field-error">
                {{ fieldError('category_id') }}
              </p>
              <div v-if="categoriesError" class="category-error">
                <p>{{ categoriesError }}</p>
                <button type="button" class="retry-categories" @click="emit('retry-categories')">
                  Try again
                </button>
              </div>
            </div>
          </div>

          <div class="stock-field field">
            <label for="product-stock">Stock</label>
            <div class="stock-control">
              <button
                type="button"
                aria-label="Decrease stock"
                :disabled="submitting || Number(form.stock) <= 0"
                @click="adjustStock(-1)"
              >
                <Icon icon="mdi:minus" width="14" height="14" aria-hidden="true" />
              </button>
              <input
                id="product-stock"
                v-model.number="form.stock"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                required
                :disabled="submitting"
                :aria-invalid="Boolean(fieldError('stock'))"
                :aria-describedby="fieldError('stock') ? 'product-stock-error' : undefined"
              />
              <button
                type="button"
                aria-label="Increase stock"
                :disabled="submitting"
                @click="adjustStock(1)"
              >
                <Icon icon="mdi:plus" width="14" height="14" aria-hidden="true" />
              </button>
            </div>
            <p v-if="fieldError('stock')" id="product-stock-error" class="field-error">
              {{ fieldError('stock') }}
            </p>
          </div>

          <div class="field description-field">
            <label for="product-description">Description (Optional)</label>
            <textarea
              id="product-description"
              v-model="form.description"
              placeholder="Describe your product..."
              :disabled="submitting"
              :aria-invalid="Boolean(fieldError('description'))"
              :aria-describedby="
                fieldError('description') ? 'product-description-error' : undefined
              "
            ></textarea>
            <p v-if="fieldError('description')" id="product-description-error" class="field-error">
              {{ fieldError('description') }}
            </p>
          </div>

          <p v-if="imageError || fieldError('image')" class="field-error" role="alert">
            {{ imageError || fieldError('image') }}
          </p>
          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

          <div class="modal-actions">
            <button
              type="button"
              class="cancel-button"
              :disabled="submitting"
              @click="requestClose"
            >
              Cancel
            </button>
            <button type="submit" class="submit-button" :disabled="submitting">
              <Icon
                :icon="mode === 'edit' ? 'mdi:content-save-outline' : 'mdi:plus'"
                width="18"
                height="18"
                aria-hidden="true"
              />
              <span>{{ submitting ? 'Saving...' : submitLabel }}</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.product-modal-backdrop {
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

.product-modal {
  display: flex;
  width: min(1174px, 100%);
  max-height: calc(100dvh - 48px);
  flex-direction: column;
  gap: 18px;
  padding: clamp(20px, 3vw, 36px);
  overflow-y: auto;
  border-radius: 8px;
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.modal-heading h2 {
  color: var(--color-text);
  font-family: var(--font-family-brand);
  font-size: clamp(22px, 2.4vw, 30px);
  font-weight: var(--font-weight-bold);
  line-height: 1.15;
}

.modal-heading p {
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}

.product-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
  align-items: stretch;
  gap: 24px;
  min-height: 0;
}

.photo-upload {
  position: relative;
  display: flex;
  min-height: 320px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  color: #777777;
  border: 1px dashed #c7c7c7;
  border-radius: 4px;
  background-color: #d9d9d9;
  cursor: pointer;
  text-align: center;
}

.photo-upload img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.photo-title {
  color: #686868;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.photo-help {
  color: #686868;
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}

.photo-change {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1;
  padding: 6px 10px;
  color: var(--color-text-on-accent);
  border-radius: var(--radius-md);
  background-color: rgb(0 0 0 / 65%);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
}

.photo-upload:focus-within {
  outline: 3px solid rgb(0 149 255 / 45%);
  outline-offset: 2px;
}

.form-fields {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.field > label {
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-width: 0;
  padding: 9px 10px;
  color: var(--color-text);
  border: 1px solid #c9c9c9;
  border-radius: 4px;
  background-color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
}

.field input,
.field select {
  min-height: 40px;
}

.field textarea {
  min-height: 150px;
  flex: 1;
  resize: vertical;
}

.field input::placeholder,
.field textarea::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--color-primary);
  outline: 2px solid rgb(0 149 255 / 20%);
  outline-offset: 1px;
}

.field input[aria-invalid='true'],
.field select[aria-invalid='true'],
.field textarea[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.field input:disabled,
.field select:disabled,
.field textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.price-category-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 12px;
}

.stock-field {
  align-self: flex-start;
  width: min(220px, 100%);
}

.stock-control {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 38px;
  min-height: 40px;
  align-items: center;
  border: 1px solid #c9c9c9;
  border-radius: 4px;
  background-color: var(--color-surface);
}

.stock-control:focus-within {
  border-color: var(--color-primary);
  outline: 2px solid rgb(0 149 255 / 20%);
  outline-offset: 1px;
}

.stock-control button {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--color-text);
}

.stock-control button:disabled {
  color: #a6a6a6;
  cursor: not-allowed;
}

.stock-control input {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 4px;
  border: 0;
  outline: 0;
  background: transparent;
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  text-align: center;
  appearance: textfield;
}

.stock-control input::-webkit-inner-spin-button,
.stock-control input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.description-field {
  flex: 1;
}

.field-error,
.submit-error,
.category-error {
  color: var(--color-danger-dark);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}

.category-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.retry-categories {
  color: var(--color-primary-hover);
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: auto;
  padding-top: 4px;
}

.modal-actions button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 5px;
  font-family: var(--font-family-brand);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.cancel-button {
  color: #737373;
  border-color: #c9c9c9 !important;
  background-color: var(--color-surface);
}

.cancel-button:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.submit-button {
  color: var(--color-text-on-accent);
  background-color: var(--color-primary);
}

.submit-button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.modal-actions button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.modal-actions button:focus-visible,
.retry-categories:focus-visible {
  outline: 3px solid rgb(0 149 255 / 45%);
  outline-offset: 2px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 700px) {
  .product-modal-backdrop {
    align-items: flex-start;
    padding: 12px;
  }

  .product-modal {
    max-height: calc(100dvh - 24px);
    gap: 16px;
    padding: 18px;
  }

  .product-form {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .photo-upload {
    min-height: 220px;
    max-height: 34dvh;
  }

  .field textarea {
    min-height: 110px;
  }
}

@media (max-width: 420px) {
  .price-category-row {
    grid-template-columns: 1fr;
  }

  .stock-field {
    width: 100%;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-actions button {
    transition: none;
  }
}
</style>
