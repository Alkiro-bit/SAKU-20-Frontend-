<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Icon } from '@iconify/vue';
import { getLastMainPath } from '@/router';

const route = useRoute();

const tabs = [
  { name: 'Home', path: '/', icon: 'ant-design:home-filled' },
  { name: 'Shop', path: '/stores', icon: 'material-symbols:menu-book-2' },
  { name: 'TEFA', path: '/tefa', icon: 'entypo:shop', isTefa: true },
  { name: 'Cart', path: '/cart', icon: 'boxicons:cart-filled' },
  { name: 'Orders', path: '/orders', icon: 'boxicons:receipt-filled' },
];

function isActive(tab) {
  const currentPath = route.path.startsWith('/products/') ? getLastMainPath() : route.path;
  const basePath = currentPath.split('?')[0].split('#')[0];
  if (tab.path === '/') return basePath === '/';
  return basePath.startsWith(tab.path);
}
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="tab in tabs"
      :key="tab.name"
      :to="tab.path"
      class="nav-item"
      :class="{
        'is-active': isActive(tab),
        'is-tefa-active': isActive(tab) && tab.isTefa
      }"
    >
      <div class="icon-wrap">
        <Icon :icon="tab.icon" width="28" height="28" />
      </div>
      <span class="label">{{ tab.name }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 70px;
  background-color: var(--color-background);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  box-shadow: 0px -2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 var(--space-1);
  z-index: 50;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
}

.label {
  font-family: var(--font-family-brand);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  margin-top: 2px;
}

.nav-item.is-active {
  color: var(--color-primary);
}

.nav-item.is-tefa-active {
  color: var(--color-tefa-accent);
}
</style>
