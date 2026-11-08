import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/public/HomeView.vue';
import ShopView from '@/views/public/ShopView.vue';
import TefaView from '@/views/public/TefaView.vue';
import CartView from '@/views/public/CartView.vue';
import OrdersView from '@/views/public/OrdersView.vue';
import ProductDetailView from '@/views/public/ProductDetailView.vue';
import CheckoutView from '@/views/public/CheckoutView.vue';
import OrderTrackingView from '@/views/public/OrderTrackingView.vue';
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue';
import AdminOrdersView from '@/views/admin/AdminOrdersView.vue';
import AdminProductsView from '@/views/admin/AdminProductsView.vue';
import AdminReportsView from '@/views/admin/AdminReportsView.vue';
import SuperadminDashboardView from '@/views/superadmin/SuperadminDashboardView.vue';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/stores', name: 'stores', component: ShopView },
  { path: '/tefa', name: 'tefa', component: TefaView },
  {
    path: '/products/:id',
    name: 'product-detail',
    component: ProductDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/cart',
    name: 'cart',
    component: CartView,
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'orders',
    component: OrdersView,
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/:id',
    name: 'order-tracking',
    component: OrderTrackingView,
    meta: { requiresAuth: true },
  },
  { path: '/history', redirect: '/orders' },
  {
    path: '/checkout',
    name: 'checkout',
    component: CheckoutView,
    meta: { requiresAuth: true },
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
  {
    path: '/admin',
    redirect: '/admin/dashboard',
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/admin/orders',
    name: 'admin-orders',
    component: AdminOrdersView,
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/admin/products',
    name: 'admin-products',
    component: AdminProductsView,
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: AdminReportsView,
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/superadmin',
    redirect: '/superadmin/dashboard',
  },
  {
    path: '/superadmin/dashboard',
    name: 'superadmin-dashboard',
    component: SuperadminDashboardView,
    meta: { requiresAuth: true, role: 'superadmin' },
  },
  {
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