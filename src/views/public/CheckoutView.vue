<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { getApiErrorMessage } from '@/services/api';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const isSubmitting = ref(false);
const error = ref('');
const remainingSeconds = ref(10 * 60);
let timerId;

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60).toString().padStart(2, '0');
  const seconds = (remainingSeconds.value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
});

onMounted(() => {
  timerId = window.setInterval(() => {
    if (remainingSeconds.value > 0) remainingSeconds.value -= 1;
  }, 1000);
});

onUnmounted(() => window.clearInterval(timerId));

function getSelectedItemIds() {
  try {
    const stored = sessionStorage.getItem('cart_selected_item_ids');
    return stored ? JSON.parse(stored).map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

const activeGroup = computed(() => {
  const routeCartId = route.query.cart_id;
  if (routeCartId) {
    const routeGroup = cartStore.cartGroups.find(
      (group) => String(group.cart_id) === String(routeCartId)
    );
    if (routeGroup) return routeGroup;
  }
  return cartStore.cartGroups[0] || null;
});

const subtotal = computed(() => activeGroup.value?.subtotal || 0);

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

async function handleSimulatePaid() {
  if (isSubmitting.value) return;
  if (!activeGroup.value?.cart_id) {
    error.value = 'Keranjang kosong. Tidak bisa checkout.';
    return;
  }
  isSubmitting.value = true;
  error.value = '';

  try {
    const selectedItemIds = getSelectedItemIds();
    const order = await cartStore.checkout(
      activeGroup.value.cart_id,
      undefined,
      selectedItemIds.length > 0 ? selectedItemIds : null
    );
    sessionStorage.removeItem('cart_selected_item_ids');
    if (order?.id) {
      router.replace({ path: `/orders/${order.id}`, query: { new: '1' } });
    } else {
      router.replace('/orders');
    }
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Checkout gagal. Coba lagi.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="checkout-view">
    <MobileHeader />

    <main class="main-content">
      <div v-if="cartStore.isEmpty" class="empty-state">
        <p>Keranjang kosong. Tidak bisa checkout.</p>
        <button type="button" class="back-link" @click="router.push('/stores')">
          Belanja sekarang
        </button>
      </div>

      <template v-else>
        <section class="payment-timer" aria-label="Batas waktu pembayaran">
          <p>Complete payment in</p>
          <strong>{{ formattedTime }}</strong>
        </section>

        <section class="qris-card" aria-label="Pembayaran QRIS">
          <img src="/assets/qris1.png" alt="QRIS payment code" class="qris-image" />
          <div class="payment-total">
            <p>Payment Total</p>
            <strong>{{ formatRupiah(subtotal) }}</strong>
          </div>
        </section>

        <p v-if="error" class="checkout-error" role="alert">{{ error }}</p>

        <div class="action-bar">
          <button type="button" class="cancel-btn" @click="router.back()">Cancel</button>
          <button
            type="button"
            class="pay-btn"
            :disabled="isSubmitting || remainingSeconds === 0"
            @click="handleSimulatePaid"
          >
            {{ isSubmitting ? 'Processing…' : remainingSeconds === 0 ? 'Payment Expired' : 'Check Payment' }}
          </button>
        </div>
      </template>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.checkout-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 80px;
  background: #fff;
}

.main-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
}

.payment-timer,
.qris-card {
  width: 100%;
  border-radius: 10px;
  background: #fff;
  text-align: center;
}

.payment-timer {
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
}

.payment-timer p,
.payment-total p {
  margin: 0;
  color: #000;
  font-family: var(--font-family-brand);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

.payment-timer strong {
  display: block;
  color: #000;
  font-family: var(--font-family-brand);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
}

.qris-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.25);
}

.qris-image {
  display: block;
  width: 253px;
  height: 220px;
  object-fit: cover;
}

.payment-total {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.payment-total strong {
  color: #000;
  font-family: var(--font-family-base);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: var(--space-3) 0;
  color: var(--color-text-muted);
}

.back-link {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.store-selector,
.summary-card,
.note-card {
  display: none;
}

.checkout-error {
  color: #b42318;
  font-size: var(--font-size-sm);
  text-align: center;
}

.action-bar {
  display: flex;
  gap: 10px;
  padding: 10px 0;
}

.cancel-btn,
.pay-btn {
  min-height: 50px;
  border-radius: 10px;
  font-family: var(--font-family-brand);
  font-size: 18px;
  font-weight: 600;
}

.cancel-btn {
  width: 150px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #000;
}

.pay-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  padding: var(--space-1);
  background-color: var(--color-primary);
  color: var(--color-text-on-accent);
  transition: background-color var(--transition-fast);
}

.pay-btn:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.pay-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.note-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 16px;
  color: var(--color-text);
}

.char-count {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.note-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  resize: vertical;
}

.note-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
