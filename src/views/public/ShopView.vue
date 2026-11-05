<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { Icon } from '@iconify/vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import StoreCard from '@/components/modules/StoreCard.vue';
import ProductCard from '@/components/modules/ProductCard.vue';
import { getStores, getStoreProductsPage, getApiErrorMessage } from '@/services/api';

const searchQuery = ref('');
const selectedStoreId = ref(null);
const loading = ref(false);
const error = ref('');

const storesList = ref([]);
const rawProducts = ref([]);
const loadingMore = ref(false);
const hasMore = ref(false);
const loadMoreTarget = ref(null);
let observer;

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

let requestId = 0;
let nextPage = 1;

async function loadProducts(storeId = null, append = false) {
  if (loadingMore.value) return;
  const currentRequest = ++requestId;
  loading.value = !append;
  loadingMore.value = append;
  error.value = '';
  try {
    const stores = storeId ? [{ id: storeId }] : storesList.value;
    const results = await Promise.allSettled(
      stores.map((store) => getStoreProductsPage(store.id, { page: append ? nextPage : 1 })),
    );
    if (currentRequest !== requestId) return;
    const combined = results.flatMap((res) => (res.status === 'fulfilled' ? res.value.items : []));
    rawProducts.value = append ? [...rawProducts.value, ...combined] : combined;
    const pages = results
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value.meta?.last_page ?? 1);
    hasMore.value = pages.length > 0 && nextPage < Math.max(...pages);
    nextPage += 1;
  } catch (e) {
    if (currentRequest === requestId) error.value = getApiErrorMessage(e, 'Gagal memuat produk dari server.');
  } finally {
    if (currentRequest === requestId) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

function resetAndLoad(storeId = null) {
  requestId += 1;
  nextPage = 1;
  hasMore.value = false;
  loadingMore.value = false;
  rawProducts.value = [];
  loadProducts(storeId);
}

function handleLoadMore(entries) {
  if (entries[0]?.isIntersecting && hasMore.value) loadProducts(selectedStoreId.value, true);
}

async function loadInitialData() {
  try {
    const apiStores = await getStores({ type: 'siswa' });
    storesList.value = apiStores || [];
  } catch {
    storesList.value = [];
  }
  resetAndLoad(selectedStoreId.value);
}

function toggleStore(store) {
  selectedStoreId.value = selectedStoreId.value === store.id ? null : store.id;
}

watch(selectedStoreId, (newStoreId) => {
  resetAndLoad(newStoreId);
});

onMounted(loadInitialData);

onMounted(() => {
  observer = new IntersectionObserver(handleLoadMore, { rootMargin: '320px' });
  if (loadMoreTarget.value) observer.observe(loadMoreTarget.value);
});

onBeforeUnmount(() => observer?.disconnect());
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
        <p v-if="loadingMore" class="load-status" aria-live="polite">Memuat produk...</p>
        <p v-else-if="error" class="load-status error" role="alert">{{ error }}</p>
        <div ref="loadMoreTarget" class="load-more-target" aria-hidden="true" />
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

.load-status {
  padding: 8px var(--space-2);
  color: var(--color-text-muted);
  text-align: center;
  font-size: var(--font-size-sm);
}

.load-status.error {
  color: var(--color-primary);
}

.load-more-target {
  height: 1px;
}
</style>
