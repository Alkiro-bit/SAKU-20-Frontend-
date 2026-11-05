<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import { useCartStore } from '@/stores/cart';
import { products, stores } from '@/data/products';
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

const defaultDescriptions = {
  1: 'Es teh manis segar diseduh dari daun teh pilihan dengan manis yang pas.',
  2: 'Indomie goreng legendaris disajikan hangat dengan taburan bawang goreng.',
  3: 'Cireng yang digoreng dengan penuh kenikmatan dan penuh dengan cinta yang menghasilkan harmoni rasa yang sempurna dalam setiap gigitannya.',
  4: 'Kopi hitam mantap khas Kapal Api, aroma kuat dan rasa nikmat.',
  5: 'Keripik jagung renyah dengan bumbu gurih yang khas dan bikin nagih.',
  6: 'Kopi susu instan dalam kemasan botol siap minum dengan rasa mantap.',
  7: 'Kopi instan dengan aroma kopi nikmat dan rasa manis yang pas di lidah.',
  8: 'Makaroni pedas gurih dengan tekstur renyah yang pas untuk camilan santai.',
};

const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.name]));

const product = computed(() => {
  const found = Object.values(products).find((p) => p.id === productId.value);
  const base = found || products.esTeh;
  return {
    ...base,
    storeName: storeMap[base.storeId] || 'Toko SAKU',
    description: defaultDescriptions[base.id] || 'Produk segar berkualitas dari kantin sekolah.',
  };
});

const quantity = ref(1);
const notes = ref('');

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

function handleAddToCart() {
  let store = cartStore.stores.find((s) => s.id === product.value.storeId);
  if (!store) {
    store = {
      id: product.value.storeId,
      name: product.value.storeName,
      items: [],
    };
    cartStore.stores.push(store);
  }

  const existing = store.items.find((i) => i.id === product.value.id);
  if (existing) {
    existing.quantity += quantity.value;
    existing.selected = true;
  } else {
    store.items.push({
      id: product.value.id,
      name: product.value.name,
      price: product.value.price,
      quantity: quantity.value,
      selected: true,
      image: product.value.image,
      notes: notes.value,
    });
  }

  router.push('/cart');
}
</script>

<template>
  <div class="product-detail-view">
    <MobileHeader />

    <main class="main-content">
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

        <button type="button" class="add-to-cart-btn" @click="handleAddToCart">
          Add to Cart
        </button>
      </section>
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

.add-to-cart-btn:active {
  opacity: 0.85;
}
</style>
