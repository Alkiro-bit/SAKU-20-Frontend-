<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import StoreCard from '@/components/modules/StoreCard.vue';
import ProductCard from '@/components/modules/ProductCard.vue';
import { getStores, getStoreProducts, getApiErrorMessage } from '@/services/api';

const searchQuery = ref('');
const selectedStoreId = ref(null);
const loading = ref(false);
const error = ref('');

const storesList = ref([]);
const rawProducts = ref([]);

const storeFilters = computed(() => [{ id: null, name: 'All' }, ...storesList.value]);
const allProducts = computed(() => rawProducts.value);
const newestProducts = computed(() => rawProducts.value.slice(0, 6));

const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return allProducts.value.filter((p) => {
    const storeId = p.store_id ?? p.storeId;
    const matchStore = selectedStoreId.value === null || storeId === selectedStoreId.value;
    const matchQuery = !q || p.name.toLowerCase().includes(q);
    return matchStore && matchQuery;
  });
});

async function loadProducts(storeId = null) {
  loading.value = true;
  error.value = '';
  try {
    if (storeId) {
      const items = await getStoreProducts(storeId);
      rawProducts.value = items;
    } else {
      const results = await Promise.allSettled(storesList.value.map((s) => getStoreProducts(s.id)));
      const combined = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          combined.push(...res.value);
        }
      });
      rawProducts.value = combined;
    }
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Gagal memuat produk dari server.');
  } finally {
    loading.value = false;
  }
}

async function loadInitialData() {
  try {
    const apiStores = await getStores({ type: 'siswa' });
    storesList.value = apiStores || [];
  } catch {
    storesList.value = [];
  }
  await loadProducts(selectedStoreId.value);
}

function toggleStore(store) {
  selectedStoreId.value = selectedStoreId.value === store.id ? null : store.id;
}

watch(selectedStoreId, (newStoreId) => {
  loadProducts(newStoreId);
});

onMounted(loadInitialData);
</script>

<template>
  <div class="shop-view">
    <MobileHeader />

    <main class="main-content">
      <!-- Search Bar -->
      <section class="search-section">
        <div class="search-box">
          <Icon icon="akar-icons:search" width="22" height="22" class="search-icon" />
          <input
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="Search in SAKU 20"
          />
        </div>
      </section>

      <!-- Stores Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Stores</h2>
        </div>
        <div class="stores-track">
          <StoreCard
            v-for="store in storeFilters"
            :key="'store-' + store.id"
            :store="store"
            :active="selectedStoreId === store.id"
            @select="toggleStore"
          />
        </div>
      </section>

      <!-- Newest Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Newest</h2>
        </div>
        <div class="carousel-track">
          <ProductCard
            v-for="item in newestProducts"
            :key="'newest-' + item.id"
            :product="item"
            compact
          />
        </div>
      </section>
      
      <!-- All Products Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">All Products</h2>
        </div>
        <div class="product-grid">
          <ProductCard
            v-for="item in filteredProducts"
            :key="'all-' + item.id"
            :product="item"
          />
        </div>
      </section>

    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.shop-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 85px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.search-section {
  padding: var(--space-2) var(--space-2) 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px 16px;
}

.search-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: transparent;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.section-header {
  padding: 0 var(--space-2);
}

.section-title {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  color: var(--color-text);
}

.stores-track {
  display: flex;
  gap: var(--space-1);
  overflow-x: auto;
  padding: 4px var(--space-2) 8px;
  scrollbar-width: none;
}

.stores-track::-webkit-scrollbar {
  display: none;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-1);
  padding: 0 var(--space-2);
}

.carousel-track {
  display: flex;
  gap: var(--space-1);
  overflow-x: auto;
  padding: 0 var(--space-2) var(--space-1);
  scrollbar-width: none;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}
</style>
