<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useCartStore } from '@/stores/cart';
import { getApiErrorMessage } from '@/services/api';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';

const router = useRouter();
const cartStore = useCartStore();
const error = ref('');
const updatingItem = ref(null);
const isSubmitting = ref(false);
const showStoreSelectModal = ref(false);

function formatRupiah(value) {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

async function handleIncrement(item) {
  updatingItem.value = item.id;
  try {
    await cartStore.updateQuantity(item.id, item.quantity + 1, item.store_id);
  } catch (e) {
    error.value = getApiErrorMessage(e);
  } finally {
    updatingItem.value = null;
  }
}

async function handleDecrement(item) {
  if (item.quantity <= 1) return;
  updatingItem.value = item.id;
  try {
    await cartStore.updateQuantity(item.id, item.quantity - 1, item.store_id);
  } catch (e) {
    error.value = getApiErrorMessage(e);
  } finally {
    updatingItem.value = null;
  }
}

async function handleRemove(item) {
  updatingItem.value = item.id;
  try {
    await cartStore.removeItem(item.id, item.store_id);
  } catch (e) {
    error.value = getApiErrorMessage(e);
  } finally {
    updatingItem.value = null;
  }
}

async function processCheckout(cartId) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  error.value = '';

  try {
    const order = await cartStore.checkout(cartId);
    if (order?.id) {
      router.replace({ path: `/orders/${order.id}`, query: { new: '1' } });
    } else {
      router.replace('/orders');
    }
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Checkout failed. Try again.');
  } finally {
    isSubmitting.value = false;
  }
}

async function handleCheckout() {
  error.value = '';
  if (cartStore.isEmpty) {
    error.value = 'Cart is empty. Cannot proceed to checkout.';
    return;
  }

  const groups = cartStore.cartGroups;
  if (groups.length === 1) {
    await processCheckout(groups[0].cart_id);
  } else if (groups.length > 1) {
    showStoreSelectModal.value = true;
  }
}

async function handleSelectStore(cartId) {
  showStoreSelectModal.value = false;
  await processCheckout(cartId);
}

onMounted(async () => {
  try {
    await cartStore.fetchAllCarts();
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Failed to load cart.');
  }
});
</script>

<template>
  <div class="cart-view">
    <MobileHeader />

    <main class="main-content">
      <div class="page-title-wrap">
        <h1 class="page-title">My Cart</h1>
      </div>

      <p v-if="error" class="cart-error" role="alert">{{ error }}</p>

      <div v-if="cartStore.loading" class="cart-empty">
        <p>Loading cart…</p>
      </div>

      <div v-else-if="cartStore.isEmpty" class="cart-empty">
        <Icon icon="mdi:cart-off" width="48" height="48" />
        <p>Cart is empty</p>
      </div>

      <div v-else class="cart-list">
        <div
          v-for="group in cartStore.cartGroups"
          :key="'store-cart-' + group.store_id"
          class="cart-card"
        >
          <div class="store-header">
            <div class="store-info">
              <Icon icon="mdi:store" width="20" height="20" />
              <span class="store-name">{{ group.store_name }}</span>
            </div>
            <span class="store-subtotal">{{ formatRupiah(group.subtotal) }}</span>
          </div>

          <div class="product-list">
            <div
              v-for="item in group.items"
              :key="'item-' + item.id"
              class="product-row"
            >
              <div class="product-left">
                <div class="product-thumb">
                  <img :src="item.image" :alt="item.name" loading="lazy" />
                </div>
                <div class="product-meta">
                  <p class="product-name">{{ item.name }}</p>
                  <p class="product-price">{{ formatRupiah(item.price) }}</p>
                </div>
              </div>

              <div class="product-right">
                <button
                  type="button"
                  class="remove-btn"
                  :disabled="updatingItem === item.id"
                  @click="handleRemove(item)"
                  aria-label="Hapus Item"
                >
                  <Icon icon="mdi:trash-can-outline" width="18" height="18" />
                </button>

                <div class="quantity-control">
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="item.quantity <= 1 || updatingItem === item.id"
                    @click="handleDecrement(item)"
                    aria-label="Kurangi Jumlah"
                  >
                    <Icon icon="akar-icons:minus" width="14" height="14" />
                  </button>
                  <span class="qty-num">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="updatingItem === item.id"
                    @click="handleIncrement(item)"
                    aria-label="Tambah Jumlah"
                  >
                    <Icon icon="akar-icons:plus" width="14" height="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="cart-seller-note">
            <div class="note-header">
              <span class="note-label">
                <Icon icon="mdi:note-text-outline" width="16" height="16" />
                Catatan untuk Penjual
              </span>
              <span class="char-count">{{ (cartStore.getSellerNote(group.store_id) || '').length }}/500</span>
            </div>
            <textarea
              class="cart-note-input"
              maxlength="500"
              :value="cartStore.getSellerNote(group.store_id)"
              @input="cartStore.setSellerNote(group.store_id, $event.target.value)"
              placeholder="Contoh: Tidak pedas, saus dipisah"
              rows="2"
            />
          </div>
        </div>
      </div>
    </main>

    <div v-if="!cartStore.isEmpty" class="checkout-bar">
      <div class="total-info">
        <span class="total-label">Total:</span>
        <span class="total-value">{{ formatRupiah(cartStore.totalPrice) }}</span>
      </div>
      <button
        type="button"
        class="checkout-btn"
        :disabled="cartStore.isEmpty || isSubmitting"
        @click="handleCheckout"
      >
        {{ isSubmitting ? 'Processing…' : 'Checkout' }}
      </button>
    </div>

    <!-- Store Selection Modal for Multi-store Checkout -->
    <div
      v-if="showStoreSelectModal"
      class="modal-backdrop"
      @click.self="showStoreSelectModal = false"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h2 id="modal-title" class="modal-title">Pilih Toko untuk Checkout</h2>
          <button
            type="button"
            class="modal-close-btn"
            @click="showStoreSelectModal = false"
            aria-label="Tutup dialog"
          >
            <Icon icon="akar-icons:cross" width="16" height="16" />
          </button>
        </div>

        <p class="modal-warning">
          Checkout hanya dapat dilakukan untuk satu toko. Pilih toko yang ingin diproses.
        </p>

        <div class="modal-store-list">
          <button
            v-for="group in cartStore.cartGroups"
            :key="'modal-store-' + group.store_id"
            type="button"
            class="modal-store-item"
            :disabled="isSubmitting"
            @click="handleSelectStore(group.cart_id)"
          >
            <div class="modal-store-left">
              <span class="modal-store-name">{{ group.store_name }}</span>
              <span class="modal-store-detail">{{ group.total_quantity }} item • {{ formatRupiah(group.subtotal) }}</span>
            </div>
            <span class="modal-select-tag">Pilih</span>
          </button>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="modal-cancel-btn"
            @click="showStoreSelectModal = false"
          >
            Batal
          </button>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<style scoped>
.cart-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 155px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0 var(--space-2);
}

.page-title-wrap {
  padding: var(--space-2) 0 var(--space-1);
  text-align: center;
}

.page-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 24px;
  color: var(--color-text);
}

.cart-error {
  color: #b42318;
  font-size: var(--font-size-sm);
  text-align: center;
  padding: 8px;
}

.cart-empty {
  font-family: var(--font-family-base);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: var(--space-3) 0;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.cart-card {
  background-color: var(--color-surface);
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.store-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 0.5px solid #d1d5db;
  background-color: #fafbfc;
}

.store-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.store-subtotal {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

.store-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.product-list {
  display: flex;
  flex-direction: column;
}

.product-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 0.5px solid #f3f4f6;
  gap: 8px;
}

.product-row:last-child {
  border-bottom: none;
}

.product-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.product-thumb {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f3f4f6;
  flex-shrink: 0;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.product-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.product-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #b42318;
  border-radius: 4px;
}

.remove-btn:hover {
  background-color: rgba(180, 35, 24, 0.08);
}

.quantity-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 96px;
  height: 34px;
  border: 0.5px solid var(--color-border);
  border-radius: 10px;
  padding: 0 8px;
  background-color: var(--color-background);
  flex-shrink: 0;
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-text);
}

.qty-btn:disabled {
  opacity: 0.3;
}

.qty-num {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.checkout-bar {
  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background-color: var(--color-background);
  border-top: 1px solid #e5e7eb;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0px -4px 10px rgba(0, 0, 0, 0.05);
  z-index: 45;
}

.total-info {
  display: flex;
  flex-direction: column;
}

.total-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.total-value {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: 20px;
  color: var(--color-text);
}

.checkout-btn {
  background-color: var(--color-primary);
  color: var(--color-text-on-accent);
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 16px;
  padding: 10px 24px;
  border-radius: 10px;
  transition: opacity var(--transition-fast);
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
}

.modal-card {
  background-color: var(--color-surface);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 18px;
  color: var(--color-text);
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--color-text-muted);
}

.modal-warning {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: #b42318;
  background-color: #fef3f2;
  border: 1px solid #fee4e2;
  border-radius: 8px;
  padding: 10px 12px;
  line-height: 1.4;
}

.modal-store-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.modal-store-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.modal-store-item:hover:not(:disabled) {
  border-color: var(--color-primary);
  background-color: rgba(30, 144, 255, 0.04);
}

.modal-store-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-store-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.modal-store-detail {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.modal-select-tag {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  padding: 4px 10px;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.modal-cancel-btn {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  padding: 8px 16px;
  border-radius: 6px;
  color: var(--color-text-muted);
}

.cart-seller-note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background-color: #fafafa;
  border-top: 1px dashed #e5e7eb;
}

.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.note-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.char-count {
  font-family: var(--font-family-base);
  font-size: 10px;
  color: var(--color-text-muted);
}

.cart-note-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  color: var(--color-text);
  background-color: var(--color-surface);
  resize: vertical;
}

.cart-note-input:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
