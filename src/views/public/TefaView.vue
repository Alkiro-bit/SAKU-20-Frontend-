<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Icon } from '@iconify/vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import ProductCard from '@/components/modules/ProductCard.vue';
import ClosedStoreEmptyState from '@/components/common/ClosedStoreEmptyState.vue';
import { getStores, getStoreProductsPage } from '@/services/api';

const searchQuery = ref('');
const selectedCategory = ref('All');
const apiProducts = ref([]);
const loadingMore = ref(false);
const hasMore = ref(false);
const loadMoreTarget = ref(null);
const tefaStore = ref(null);
let tefaStoreId = null;
let nextPage = 1;
let observer;

const DEFAULT_CATEGORIES = ['All', 'Makanan', 'Minuman', 'Bahan Masakan', 'Kesehatan & Kebersihan'];

const categories = computed(() => {
  const dynamic = new Set();
  apiProducts.value.forEach((p) => {
    if (p.category?.name) dynamic.add(p.category.name);
    else if (p.category) dynamic.add(p.category);
  });
  if (dynamic.size === 0) return DEFAULT_CATEGORIES;
  return ['All', ...Array.from(dynamic)];
});

const isTefaClosed = computed(() => tefaStore.value && tefaStore.value.is_open === false);

const allProducts = computed(() => (isTefaClosed.value ? [] : apiProducts.value));
const newestTefaProducts = computed(() => (isTefaClosed.value ? [] : apiProducts.value.slice(0, 5)));

const filteredProducts = computed(() => {
  if (isTefaClosed.value) return [];
  return allProducts.value.filter((p) => {
    const catName = p.category?.name || p.category;
    const matchCategory =
      selectedCategory.value === 'All' || catName === selectedCategory.value;
    const matchQuery =
      !searchQuery.value.trim() ||
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchCategory && matchQuery;
  });
});

async function loadProducts(append = false) {
  if (!tefaStoreId || loadingMore.value) return;
  loadingMore.value = true;
  try {
    const { items, meta } = await getStoreProductsPage(tefaStoreId, { page: nextPage });
    apiProducts.value = append ? [...apiProducts.value, ...items] : items;
    nextPage += 1;
    hasMore.value = nextPage <= (meta?.last_page ?? 1);
  } catch {
    hasMore.value = false;
  } finally {
    loadingMore.value = false;
  }
}

function handleLoadMore(entries) {
  if (entries[0]?.isIntersecting && hasMore.value) loadProducts(true);
}

onMounted(async () => {
  try {
    const tefaStores = await getStores({ type: 'tefa' });
    const found = tefaStores.find((s) => s.store_type === 'tefa') || tefaStores[0];
    tefaStore.value = found || null;
    tefaStoreId = found?.id || null;
    if (tefaStore.value && tefaStore.value.is_open !== false) {
      await loadProducts();
    }
  } catch {
    apiProducts.value = [];
  }
  observer = new IntersectionObserver(handleLoadMore, { rootMargin: '320px' });
  if (loadMoreTarget.value) observer.observe(loadMoreTarget.value);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="tefa-view">
    <MobileHeader />

    <main class="main-content">
      <!-- Search & Category Filters -->
      <section class="search-filter-section">
        <div class="search-box">
          <Icon icon="akar-icons:search" width="22" height="22" class="search-icon" />
          <input
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="Search in SAKU 20"
          />
        </div>

        <div class="filter-track">
          <button
            v-for="cat in categories"
            :key="cat"
            class="filter-pill"
            :class="{ 'is-active': selectedCategory === cat }"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </section>

      <!-- Closed Store Empty State -->
      <ClosedStoreEmptyState
        v-if="isTefaClosed"
        title="TEFA is Closed"
        message="The food never stops, come back again when it opens."
      />

      <template v-else>
        <!-- Newest Section -->
        <section v-if="newestTefaProducts.length > 0" class="section">
          <div class="section-header">
            <h2 class="section-title">Newest</h2>
          </div>
          <div class="carousel-track">
            <ProductCard
              v-for="item in newestTefaProducts"
              :key="'tefa-new-' + item.id"
              :product="item"
              compact
            />
          </div>
        </section>

        <!-- Products Section -->
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Products</h2>
          </div>
          <div v-if="filteredProducts.length > 0" class="product-grid">
            <ProductCard
              v-for="item in filteredProducts"
              :key="'tefa-' + item.id"
              :product="item"
            />
          </div>
          <ClosedStoreEmptyState
            v-else-if="!loadingMore && apiProducts.length === 0"
            title="TEFA is Closed"
            message="The food never stops, come back again when it opens."
          />
          <p v-if="loadingMore" class="load-status" aria-live="polite">Memuat produk...</p>
          <div ref="loadMoreTarget" class="load-more-target" aria-hidden="true" />
        </section>
      </template>


    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.tefa-view {
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

.search-filter-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.filter-track {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.filter-track::-webkit-scrollbar {
  display: none;
}

.filter-pill {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 0.5px solid var(--color-border);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  background-color: var(--color-surface);
  transition: all var(--transition-fast);
}

/* Aksen Merah TEFA sesuai token */
.filter-pill.is-active {
  border-color: var(--color-tefa-accent);
  color: var(--color-tefa-accent);
  font-weight: var(--font-weight-bold);
  background-color: rgba(255, 0, 0, 0.05);
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

.load-more-target {
  height: 1px;
}
</style>
