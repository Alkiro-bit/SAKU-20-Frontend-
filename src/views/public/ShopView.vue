<script setup>
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import StoreCard from '@/components/modules/StoreCard.vue';
import ProductCard from '@/components/modules/ProductCard.vue';

const searchQuery = ref('');

const stores = ref([
  { id: 1, name: 'JungleFood' },
  { id: 2, name: 'MeetUp Cafe' },
  { id: 3, name: 'Bisnis Digital' },
  { id: 4, name: 'Layanan Perbankan Syariah' },
]);

const allProducts = ref([
  { id: 1, name: 'Es Teh Manis', price: 5000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300' },
  { id: 4, name: 'Indomie Goreng', price: 7000, image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300' },
  { id: 2, name: 'Cireng', price: 6000, image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=300' },
  { id: 3, name: 'Kapal Api', price: 7000, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300' },
]);

const newestProducts = ref([
  { id: 1, name: 'Es Teh Manis', price: 5000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300' },
  { id: 2, name: 'Cireng', price: 6000, image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=300' },
  { id: 4, name: 'Indomie Goreng', price: 7000, image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300' },
]);

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return allProducts.value;
  return allProducts.value.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});
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
            v-for="store in stores"
            :key="'store-' + store.id"
            :store="store"
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
