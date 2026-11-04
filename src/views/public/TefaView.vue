<script setup>
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import ProductCard from '@/components/modules/ProductCard.vue';

const searchQuery = ref('');
const selectedCategory = ref('Semua');

const categories = [
  'Semua',
  'Makanan',
  'Minuman',
  'Bahan Masakan',
  'Kesehatan & Kebersihan',
];

const tefaProducts = ref([
  { id: 101, name: 'Es Teh Manis', price: 5000, category: 'Minuman', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300' },
  { id: 102, name: 'Indomie Goreng', price: 7000, category: 'Makanan', image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300' },
  { id: 103, name: 'Cireng', price: 6000, category: 'Makanan', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=300' },
  { id: 104, name: 'Kapal Api', price: 7000, category: 'Minuman', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300' },
]);

const newestTefaProducts = ref([
  { id: 104, name: 'Kapal Api', price: 7000, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300' },
  { id: 101, name: 'Es Teh Manis', price: 5000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300' },
  { id: 103, name: 'Cireng', price: 6000, image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=300' },
]);

const filteredProducts = computed(() => {
  return tefaProducts.value.filter((p) => {
    const matchCategory =
      selectedCategory.value === 'Semua' || p.category === selectedCategory.value;
    const matchQuery =
      !searchQuery.value.trim() ||
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchCategory && matchQuery;
  });
});
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

      <!-- Newest Section -->
      <section class="section">
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
        <div class="product-grid">
          <ProductCard
            v-for="item in filteredProducts"
            :key="'tefa-' + item.id"
            :product="item"
          />
        </div>
      </section>
      
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
</style>
