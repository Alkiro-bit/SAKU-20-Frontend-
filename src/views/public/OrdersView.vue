<script setup>
import { ref } from 'vue';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';

const orders = ref([
  {
    id: 1,
    storeName: 'JungleFood',
    status: 'pending',
    pickupNumber: '168',
    item: {
      name: 'Indomie Goreng',
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300',
    },
  },
  {
    id: 2,
    storeName: 'TEFA',
    status: 'ready',
    pickupNumber: '88',
    item: {
      name: 'Golda',
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300',
    },
  },
  {
    id: 3,
    storeName: 'Meetup Cafe',
    status: 'completed',
    pickupNumber: '9',
    item: {
      name: 'GoodDay',
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=300',
    },
  },
  {
    id: 4,
    storeName: 'Bisnis Digital',
    status: 'canceled',
    pickupNumber: '67',
    item: {
      name: 'Makaroni Kongz',
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300',
    },
  },
]);
</script>

<template>
  <div class="orders-view">
    <MobileHeader />

    <main class="main-content">
      <div class="page-title-wrap">
        <h1 class="page-title">My Orders</h1>
      </div>

      <div class="orders-list">
        <div
          v-for="order in orders"
          :key="'order-' + order.id"
          class="order-card"
        >
          <!-- Card Header: Store Name & Status Badge -->
          <div class="order-header">
            <span class="store-name">{{ order.storeName }}</span>
            <StatusBadge :status="order.status" />
          </div>

          <!-- Card Body: Product info + Pickup Number -->
          <div class="order-body">
            <div class="product-info-col">
              <div class="product-thumb">
                <img :src="order.item.image" :alt="order.item.name" loading="lazy" />
              </div>
              <div class="product-meta">
                <p class="product-name">{{ order.item.name }}</p>
                <p class="product-qty">x {{ order.item.quantity }}</p>
              </div>
            </div>

            <div class="pickup-col">
              <span class="pickup-label">Pickup Number:</span>
              <span
                class="pickup-number"
                :class="{
                  'is-active': ['pending', 'ready'].includes(order.status),
                  'is-muted': ['completed', 'canceled'].includes(order.status),
                }"
              >
                {{ order.pickupNumber }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.orders-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 85px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0 var(--space-2);
}

.page-title-wrap {
  padding: var(--space-2) 0 var(--space-1);
  text-align: center;
}

.page-title {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 26px;
  color: var(--color-text);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.order-card {
  background-color: var(--color-surface);
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 0.5px solid #d1d5db;
}

.store-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 16px;
  color: var(--color-text);
}

.order-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
}

.product-info-col {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.product-thumb {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f3f4f6;
  flex-shrink: 0;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.product-name {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 16px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-qty {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.pickup-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 110px;
  flex-shrink: 0;
  text-align: center;
}

.pickup-label {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 10px;
  color: var(--color-text);
  margin-bottom: 2px;
}

.pickup-number {
  font-family: var(--font-family-brand);
  font-weight: var(--font-weight-medium);
  font-size: 34px;
  line-height: 1;
}

.pickup-number.is-active {
  color: var(--color-primary);
}

.pickup-number.is-muted {
  color: var(--color-text-muted);
}
</style>
