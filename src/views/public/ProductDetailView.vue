<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import { useCartStore } from '@/stores/cart';
import { apiClient, getApiErrorMessage, resolveImageUrl } from '@/services/api';
import { getLastMainPath } from '@/router';

function handleBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push(getLastMainPath());
  }
}

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

const productId = computed(() => Number(route.params.id) || 1);

const product = ref(null);
const loading = ref(true);
const error = ref('');
const quantity = ref(1);
const notes = ref('');
const isAdding = ref(false);
const addError = ref('');

async function fetchProduct() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiClient.get(`/products/${productId.value}`);
    const data = res.data.data;
    product.value = data ? { ...data, image: resolveImageUrl(data.image_url || data.image) } : null;
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat detail produk.');
  } finally {
    loading.value = false;
  }
}

function formatRupiah(value) {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function increment() {
  quantity.value++;
}

function decrement() {
  if (quantity.value > 1) {
    quantity.value--;
  }
}

async function handleAddToCart() {
  if (isAdding.value || !product.value) return;
  isAdding.value = true;
  addError.value = '';

  try {
    await cartStore.addItem(product.value.store_id, product.value.id, quantity.value);
    router.push('/cart');
  } catch (e) {
    addError.value = getApiErrorMessage(e, 'Gagal menambahkan ke keranjang.');
    isAdding.value = false;
  }
}

onMounted(fetchProduct);
</script>

<template>
  <div class="product-detail-view">
    <MobileHeader />

    <main class="main-content">
      <div v-if="loading" class="loading-state">
        <button type="button" class="back-btn back-btn-inline" @click="handleBack" aria-label="Kembali">
          <Icon icon="bx:arrow-back" width="22" height="22" />
        </button>
        <p>Memuat produk…</p>
      </div>

      <div v-else-if="error" class="error-state">
        <button type="button" class="back-btn back-btn-inline" @click="handleBack" aria-label="Kembali">
          <Icon icon="bx:arrow-back" width="22" height="22" />
        </button>
        <p class="error-text">{{ error }}</p>
      </div>

      <template v-else-if="product">
        <!-- Product Hero Image -->
        <div class="product-hero">
          <button
            type="button"
            class="back-btn"
            @click="handleBack"
            aria-label="Kembali"
          >
            <Icon icon="bx:arrow-back" width="22" height="22" />
          </button>
          <img :src="product.image" :alt="product.name" class="hero-image" />
        </div>

        <!-- Title & Price -->
        <section class="title-price-section">
          <h1 class="product-title">{{ product.name }}</h1>
          <p class="product-price">{{ formatRupiah(product.price) }}</p>
          <p v-if="product.store_name" class="product-store">{{ product.store_name }}</p>
        </section>

        <!-- Description -->
        <section class="desc-section">
          <h2 class="desc-heading">Description:</h2>
          <p class="desc-text">{{ product.description }}</p>
        </section>

        <!-- Divider -->
        <div class="page-divider" />

        <!-- Form Controls: Quantity & Notes -->
        <section class="action-form-section">
          <div class="amount-row">
            <span class="amount-label">Amount</span>
            <div class="quantity-control">
              <button
                type="button"
                class="qty-btn"
                @click="decrement"
                aria-label="Kurangi Jumlah"
              >
                <Icon icon="akar-icons:minus" width="12" height="12" />
              </button>
              <span class="qty-num">{{ quantity }}</span>
              <button
                type="button"
                class="qty-btn"
                @click="increment"
                aria-label="Tambah Jumlah"
              >
                <Icon icon="akar-icons:plus" width="12" height="12" />
              </button>
            </div>
          </div>

          <div class="notes-block">
            <label for="product-notes" class="notes-label">Notes (Optional)</label>
            <textarea
              id="product-notes"
              v-model="notes"
              class="notes-textarea"
              placeholder="Add your notes to seller..."
              rows="4"
            />
          </div>

          <p v-if="addError" class="error-text" role="alert">{{ addError }}</p>

          <button
            type="button"
            class="add-to-cart-btn"
            :disabled="isAdding"
            @click="handleAddToCart"
          >
            {{ isAdding ? 'Menambahkan…' : 'Add to Cart' }}
          </button>
        </section>
      </template>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.product-detail-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 85px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: var(--space-3) var(--space-2);
  color: var(--color-text-muted);
}

.back-btn-inline {
  align-self: flex-start;
}

.error-text {
  color: #b42318;
  font-size: var(--font-size-sm);
}

.product-store {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.main-content {
  display: flex;
  flex-direction: column;
}

.product-hero {
  position: relative;
  width: 100%;
  height: 240px;
  background-color: #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.back-btn {
  position: absolute;
  top: 14px;
  left: 14px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 10;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.back-btn:active {
  transform: scale(0.92);
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title-price-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 20px 8px;
}

.product-title {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: 32px;
  line-height: 1.15;
  color: var(--color-text);
}

.product-price {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: 20px;
  color: var(--color-text);
  padding-left: 10px;
}

.desc-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 20px 14px;
}

.desc-heading {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: 12px;
  color: var(--color-text);
}

.desc-text {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-regular);
  font-size: 11px;
  line-height: 1.45;
  color: var(--color-text);
  padding-left: 10px;
}

.page-divider {
  width: 100%;
  height: 4px;
  background-color: rgba(138, 138, 138, 0.2);
  margin: 6px 0;
}

.action-form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 20px 20px;
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.amount-label {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  color: var(--color-text);
}

.quantity-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 82px;
  height: 31px;
  border: 0.5px solid var(--color-border);
  border-radius: 8px;
  padding: 0 6px;
  background-color: var(--color-background);
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--color-text);
}

.qty-num {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: 12px;
  color: var(--color-text);
}

.notes-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.notes-label {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  color: var(--color-text);
}

.notes-textarea {
  width: 100%;
  background-color: rgba(150, 150, 150, 0.1);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
  font-family: var(--font-family-base);
  font-size: 11px;
  color: var(--color-text);
  outline: none;
  resize: none;
}

.notes-textarea::placeholder {
  color: var(--color-text-muted);
}

.add-to-cart-btn {
  width: 100%;
  background-color: var(--color-primary);
  color: var(--color-text-on-accent);
  border-radius: 6px;
  padding: 12px;
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: 14px;
  text-align: center;
  transition: opacity var(--transition-fast);
}

.add-to-cart-btn:active:not(:disabled) {
  opacity: 0.85;
}

.add-to-cart-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>
