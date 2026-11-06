<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useCartStore } from '@/stores/cart';
import { getApiErrorMessage } from '@/services/api';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import StoreSelectionWarningModal from '@/components/modules/StoreSelectionWarningModal.vue';

const router = useRouter();
const cartStore = useCartStore();
const error = ref('');
const updatingItem = ref(null);
const isSubmitting = ref(false);
const showSelectionWarning = ref(false);
const selectedItemIds = ref(loadSelectedItemIds());

function loadSelectedItemIds() {
  try {
    const stored = sessionStorage.getItem('cart_selected_item_ids');
    return stored ? JSON.parse(stored).map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveSelectedItemIds() {
  if (selectedItemIds.value.length > 0) {
    sessionStorage.setItem('cart_selected_item_ids', JSON.stringify(selectedItemIds.value));
  } else {
    sessionStorage.removeItem('cart_selected_item_ids');
  }
}

function resetSelection() {
  selectedItemIds.value = [];
  sessionStorage.removeItem('cart_selected_item_ids');
}

function closeSelectionWarning() {
  showSelectionWarning.value = false;
  resetSelection();
}

const selectedItems = computed(() => cartStore.items.filter((item) => selectedItemIds.value.includes(Number(item.id))));
const selectedStoreIds = computed(() => [...new Set(selectedItems.value.map((item) => item.store_id))]);
const selectedTotal = computed(() => selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
const hasSelection = computed(() => selectedItems.value.length > 0);

function isItemSelected(item) {
  return selectedItemIds.value.includes(Number(item.id));
}

function isStoreSelected(group) {
  return group.items.length > 0 && group.items.every(isItemSelected);
}

function isStorePartiallySelected(group) {
  const selectedCount = group.items.filter(isItemSelected).length;
  return selectedCount > 0 && selectedCount < group.items.length;
}

function toggleItem(item, event) {
  const next = selectedItemIds.value.filter((id) => id !== Number(item.id));
  if (!isItemSelected(item)) {
    if (selectedStoreIds.value.length > 0 && !selectedStoreIds.value.includes(item.store_id)) {
      if (event?.target) event.target.checked = false;
      closeSelectionWarning();
      showSelectionWarning.value = true;
      return;
    }
    next.push(Number(item.id));
  }
  selectedItemIds.value = next;
  saveSelectedItemIds();
}

function toggleStore(group, event) {
  if (isStoreSelected(group)) {
    selectedItemIds.value = selectedItemIds.value.filter((id) => !group.items.some((item) => Number(item.id) === id));
  } else {
    if (selectedStoreIds.value.length > 0 && !selectedStoreIds.value.includes(group.store_id)) {
      if (event?.target) event.target.checked = false;
      closeSelectionWarning();
      showSelectionWarning.value = true;
      return;
    }
    const groupIds = group.items.map((item) => Number(item.id));
    selectedItemIds.value = [...new Set([...selectedItemIds.value, ...groupIds])];
  }
  saveSelectedItemIds();
}

watch(error, (val) => {
  if (val) resetSelection();
});

watch(() => cartStore.items.map((item) => Number(item.id)), (ids) => {
  const validIds = new Set(ids);
  const next = selectedItemIds.value.filter((id) => validIds.has(id));
  if (next.length !== selectedItemIds.value.length) {
    selectedItemIds.value = next;
    saveSelectedItemIds();
  }
}, { immediate: true });

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

async function processCheckout(cartId, itemIds = null) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  error.value = '';

  try {
    const order = await cartStore.checkout(cartId, undefined, itemIds);
    resetSelection();
    if (order?.id) {
      router.replace({ path: `/orders/${order.id}`, query: { new: '1' } });
    } else {
      router.replace('/orders');
    }
  } catch (e) {
    resetSelection();
    error.value = getApiErrorMessage(e, 'Checkout failed. Try again.');
  } finally {
    isSubmitting.value = false;
  }
}

async function handleCheckout() {
  error.value = '';
  if (!hasSelection.value) {
    error.value = 'Select at least one item to check out.';
    return;
  }
  if (selectedStoreIds.value.length > 1) {
    resetSelection();
    showSelectionWarning.value = true;
    return;
  }

  const storeId = selectedStoreIds.value[0];
  const group = cartStore.cartGroups.find((item) => item.store_id === storeId);
  await processCheckout(group?.cart_id, selectedItemIds.value);
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
            <label class="selection-control store-selection">
              <input
                type="checkbox"
                :checked="isStoreSelected(group)"
                :ref="(element) => { if (element) element.indeterminate = isStorePartiallySelected(group); }"
                @change="toggleStore(group, $event)"
                :aria-label="`Select all items from ${group.store_name}`"
              />
              <Icon icon="mdi:store" width="20" height="20" />
            </label>
            <div class="store-info">
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
                <label class="selection-control">
                  <input
                    type="checkbox"
                    :checked="isItemSelected(item)"
                    @change="toggleItem(item, $event)"
                    :aria-label="`Select ${item.name}`"
                  />
                </label>
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
                  aria-label="Remove item"
                >
                  <Icon icon="mdi:trash-can-outline" width="18" height="18" />
                </button>

                <div class="quantity-control">
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="item.quantity <= 1 || updatingItem === item.id"
                    @click="handleDecrement(item)"
                    aria-label="Decrease quantity"
                  >
                    <Icon icon="akar-icons:minus" width="14" height="14" />
                  </button>
                  <span class="qty-num">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="updatingItem === item.id"
                    @click="handleIncrement(item)"
                    aria-label="Increase quantity"
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
                Note for the seller
              </span>
              <span class="char-count">{{ (cartStore.getSellerNote(group.store_id) || '').length }}/500</span>
            </div>
            <textarea
              class="cart-note-input"
              maxlength="500"
              :value="cartStore.getSellerNote(group.store_id)"
              @input="cartStore.setSellerNote(group.store_id, $event.target.value)"
              placeholder="e.g., Not spicy, sauce on the side"
              rows="2"
            />
          </div>
        </div>
      </div>
    </main>

    <div v-if="!cartStore.isEmpty" class="checkout-bar">
      <div class="total-info">
        <span class="total-label">Total:</span>
        <span class="total-value">{{ formatRupiah(selectedTotal) }}</span>
      </div>
      <button
        type="button"
        class="checkout-btn"
        :disabled="!hasSelection || isSubmitting"
        @click="handleCheckout"
      >
        {{ isSubmitting ? 'Processing…' : `Checkout (${selectedItems.length})` }}
      </button>
    </div>

    <StoreSelectionWarningModal v-if="showSelectionWarning" @close="closeSelectionWarning" />

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

.selection-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.selection-control input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.store-selection {
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
