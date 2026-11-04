<script setup>
defineProps({
  product: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

function formatRupiah(value) {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}
</script>

<template>
  <router-link
    :to="`/products/${product.id}`"
    class="product-card"
    :class="{ 'is-compact': compact }"
  >
    <div class="product-photo">
      <img
        :src="product.image || 'https://placehold.co/300x300?text=Produk'"
        :alt="product.name"
        loading="lazy"
      />
    </div>
    <div class="product-info">
      <p class="product-name" :title="product.name">{{ product.name }}</p>
      <p class="product-price">{{ formatRupiah(product.price) }}</p>
    </div>
  </router-link>
</template>

<style scoped>
.product-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-fast);
  flex-shrink: 0;
  width: 100%;
}

.product-card:active {
  transform: scale(0.98);
}

.product-photo {
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  border-top: 0.5px solid #d1d5db;
}

.product-name {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
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

/* Compact style for Horizontal Carousel */
.product-card.is-compact {
  width: 120px;
  border-radius: 4px;
  box-shadow: 0px 3px 7px rgba(0, 0, 0, 0.15);
}

.product-card.is-compact .product-info {
  padding: 4px 6px;
  gap: 2px;
}

.product-card.is-compact .product-name {
  font-size: var(--font-size-xs);
}

.product-card.is-compact .product-price {
  font-size: 10px;
}
</style>
