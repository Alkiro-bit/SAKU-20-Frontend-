import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/public/HomeView.vue';
import ShopView from '@/views/public/ShopView.vue';
import TefaView from '@/views/public/TefaView.vue';
import CartView from '@/views/public/CartView.vue';
import OrdersView from '@/views/public/OrdersView.vue';
import ProductDetailView from '@/views/public/ProductDetailView.vue';
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/stores', name: 'stores', component: ShopView },
  { path: '/tefa', name: 'tefa', component: TefaView },
  { path: '/products/:id', name: 'product-detail', component: ProductDetailView },
  { path: '/cart', name: 'cart', component: CartView },
  {
    path: '/orders',
    name: 'orders',
    component: OrdersView,
    meta: { requiresAuth: true },
  },
  { path: '/history', redirect: '/orders' },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true },
  },
  {
    // Route admin dipasang di Fase 3 saat view-nya sudah ada.
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('user_data') || 'null');
  } catch {
    return null;
  }
}

let lastMainPath = '/';

export function getLastMainPath() {
  return lastMainPath;
}

router.beforeEach((to, from) => {
  if (from?.fullPath && !from.fullPath.startsWith('/products/')) {
    lastMainPath = from.fullPath;
  }

  const token = localStorage.getItem('auth_token');
  const userRole = currentUser()?.role;

  if (to.meta.requiresAuth && !token) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (to.meta.role && to.meta.role !== userRole) {
    return { path: '/' };
  }

  if (to.meta.guestOnly && token) {
    return { path: '/' };
  }

  return true;
});

export default router;