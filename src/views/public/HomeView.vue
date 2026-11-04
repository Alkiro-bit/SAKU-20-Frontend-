<script setup>
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import ProductCard from '@/components/modules/ProductCard.vue';
import { bestSellers, newestProducts } from '@/data/products';
</script>

<template>
  <div class="home-view">
    <MobileHeader />

    <main class="main-content">
      <!-- Hero Banner -->
      <section class="hero-banner">
        <div class="hero-card">
          <p class="hero-text">Bagian ini akan diisi hero banner.</p>
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
  height: 180px;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--color-primary);
}

.hero-text {
  font-size: var(--font-size-xs);
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
