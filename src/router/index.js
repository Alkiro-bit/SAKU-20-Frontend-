import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/public/HomeView.vue';
import ShopView from '@/views/public/ShopView.vue';
import TefaView from '@/views/public/TefaView.vue';
import CartView from '@/views/public/CartView.vue';
import OrdersView from '@/views/public/OrdersView.vue';
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/stores',
    name: 'stores',
    component: ShopView,
  },
  {
    path: '/tefa',
    name: 'tefa',
    component: TefaView,
  },
  {
    path: '/cart',
    name: 'cart',
    component: CartView,
  },
  {
    path: '/orders',
    name: 'orders',
    component: OrdersView,
  },
  {
    path: '/history',
    redirect: '/orders',
  },
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('user_data') || 'null');
  const userRole = user?.role;

  if (to.meta.requiresAuth && !token) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  if (to.meta.role && to.meta.role !== userRole) {
    return next({ path: '/' });
  }

  if (to.meta.guestOnly && token) {
    return next({ path: '/' });
  }

  next();
});

export default router;
