<script setup>
import { ref, computed, onMounted } from 'vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import ProductCard from '@/components/modules/ProductCard.vue';
import { getStores, getStoreProducts } from '@/services/api';

const apiProducts = ref([]);

const bestSellers = computed(() => apiProducts.value.slice(0, 5));
const newestProducts = computed(() => apiProducts.value.slice().reverse());

onMounted(async () => {
  try {
    const stores = await getStores({ type: 'siswa' });
    if (stores && stores.length) {
      const openStores = stores.filter((s) => s.is_open !== false);
      const results = await Promise.allSettled(openStores.map((s) => getStoreProducts(s.id)));
      const items = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          items.push(...res.value);
        }
      });
      apiProducts.value = items;
    }
  } catch {
    apiProducts.value = [];
  }
});
</script>

<template>
  <div class="home-view">
    <MobileHeader />

    <main class="main-content">
      <!-- Hero Banner -->
      <section class="hero-banner">
        <div class="hero-card">
          <img
            class="hero-image"
            src="/assets/SAKU%2020%20Food%20Delivery%20Banner.webp"
            alt="Banner SAKU 20 Food Delivery"
          />
        </div>
      </section>

      <!-- Best Sellers Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Best Sellers</h2>
        </div>
        <div class="carousel-track">
          <ProductCard
            v-for="item in bestSellers"
            :key="'best-' + item.id"
            :product="item"
            compact
          />
        </div>
      </section>

      <!-- Newest Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Newest</h2>
        </div>
        <div class="product-grid">
          <ProductCard
            v-for="item in newestProducts"
            :key="'new-' + item.id"
            :product="item"
          />
        </div>
      </section>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 85px; /* Spacing agar konten tidak tertutup bottom nav */
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.hero-banner {
  padding: var(--space-1) var(--space-2);
}

.hero-card {
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 2px 8px rgb(15 23 42 / 12%);
}

.hero-image {
  display: block;
  width: 100%;
  height: auto;
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

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-1);
  padding: 0 var(--space-2) var(--space-2);
}
</style>
