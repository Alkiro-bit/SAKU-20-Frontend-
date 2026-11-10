# Panduan Integrasi Frontend Vue.js — SAKU 20

Dokumen panduan arsitektur, integrasi API, state management, dan alur aplikasi frontend Vue 3 untuk SAKU 20.

**v1.2** — direvisi: icon diganti ke Iconify (`@iconify/vue`), penambahan integrasi desain Figma via MCP Server, adopsi Mobile-First Responsive, dan standarisasi struktur direktori project. (Sebelumnya v1.1: styling Plain CSS, penyesuaian `tokens.css`, perbaikan memory-leak polling, proteksi double-submit).

---

## 1. Arsitektur & Tech Stack

- **Framework**: Vue 3 (Composition API + `<script setup>`)
- **Build Tool**: Vite
- **Router**: Vue Router 4 (HTML5 History mode)
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Styling**: Plain CSS + CSS Custom Properties (`src/styles/tokens.css` — lihat file terpisah, sudah final)
- **Icons**: Iconify (`@iconify/vue`)
- **Design Source**: Figma via MCP Server (inspeksi node, layout, spacing, dan asset)
- **Layout Approach**: Mobile-First Responsive (dioptimalkan untuk mobile viewport, container terpusat pada desktop)

---

## 2. Struktur Direktori Project

Rekomendasi struktur folder modular berbasis fitur:

```text
src/
├── assets/             # Aset statis lokal (logo, gambar dummy, ilustrasi)
├── components/         # Komponen UI modular & reusable
│   ├── common/         # Elemen dasar (AppButton, AppInput, AppModal, StatusBadge, dll.)
│   ├── layout/         # Shell navigasi (MobileHeader, BottomNav, AdminSidebar)
│   └── modules/        # Komponen spesifik domain (cart, order, product, store)
├── composables/        # Shared composable logic (usePolling, useCart, dll.)
├── router/             # Konfigurasi Vue Router & navigation guards
├── services/           # Axios instance & mapping API endpoints
├── stores/             # Pinia stores (auth, cart)
├── styles/             # Global styles (tokens.css, base.css, reset.css)
├── views/              # Halaman / route level views
│   ├── public/         # HomeView, StoreDetailView, ProductDetailView, CartView, CheckoutView, OrderTrackingView
│   ├── auth/           # LoginView, RegisterView
│   ├── admin/          # AdminDashboardView, AdminProductsView, AdminOrdersView, AdminReportsView
│   └── superadmin/     # SuperadminStoresView, SuperadminUsersView, dll.
├── App.vue             # Root component (Mobile container wrapper)
└── main.js             # Entrypoint aplikasi (mount Pinia, Router)
```

---

## 3. Konfigurasi Environment & Network

File `.env` di repo frontend:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STORAGE_BASE_URL=http://localhost:8000/storage
```

> **Catatan CORS & Assets:**
> - **Cek langsung `config/cors.php` di backend sebelum development** — jangan asumsikan origin frontend sudah di-whitelist. Per laporan audit terakhir, `allowed_origins` masih `['*']` (wildcard) dan belum diubah, menunggu keputusan domain final. Untuk dev lokal pastikan origin Vite (`http://localhost:5173` atau sesuai port) bisa diakses.
> - Gambar produk yang dikembalikan berupa URL lengkap atau relatif path. Jika path relatif (`products/...`), gabungkan dengan `VITE_STORAGE_BASE_URL`.

---

## 4. Autentikasi & Header Pengenal

Aplikasi memiliki 4 jenis pengguna:
1. **Tamu (Guest)**: Belanja tanpa akun. Identitas berupa UUID v4 yang disimpan di `localStorage` sebagai `guest_token`, dikirim via header `X-Guest-Token`.
2. **Pembeli Login (Siswa/Guru/Staff)**: Login utama via email; akun lama tetap mendukung NIS/NIP. Token disimpan di `localStorage`, dikirim via header `Authorization: Bearer <token>`.
3. **Admin (Penjual)**: Mengelola toko miliknya sendiri.
4. **Superadmin**: Mengelola seluruh toko, user, kategori, dan whitelist NIS/NIP.

### Axios Instance Template (`src/services/api.js`)
```javascript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Helper UUID untuk Guest Token
function getOrCreateGuestToken() {
  let token = localStorage.getItem('guest_token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('guest_token', token);
  }
  return token;
}

// Request Interceptor: Pasang Bearer atau X-Guest-Token
apiClient.interceptors.request.use((config) => {
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  } else {
    config.headers['X-Guest-Token'] = getOrCreateGuestToken();
  }
  return config;
});

// Response Interceptor: Tangani 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 5. Matriks Routing & Role Guard

| Path | Akses | Deskripsi Halaman |
|---|---|---|
| `/` | Publik | Beranda: Tab Toko Siswa & TEFA, daftar kategori |
| `/stores/:id` | Publik | Detail toko & katalog produk toko |
| `/products/:id` | Publik | Detail produk + tombol tambah keranjang |
| `/cart` | Publik (Guest/User) | Keranjang aktif toko terkait |
| `/checkout` | Publik (Guest/User) | Review pesanan, input nama (guest), tombol "Simulate Paid" |
| `/orders/:id` | Publik (Guest/User) | Live tracking pesanan (nomor antrian & pickup code), via polling |
| `/history` | Pembeli Login | Riwayat pesanan akun |
| `/login` | Guest Only | Form login email (fallback NIS/NIP akun lama) |
| `/register` | Guest Only | Form register dengan email |
| `/admin/dashboard` | Admin | Kelola buka/tutup toko, ringkasan pesanan & finansial |
| `/admin/products` | Admin | CRUD produk toko sendiri (upload WebP) |
| `/admin/orders` | Admin | Pesanan masuk (polling berkala) & update status |
| `/admin/reports` | Admin | Laporan keuangan toko |
| `/superadmin/stores` | Superadmin | CRUD toko & assign pemilik toko (admin) |
| `/superadmin/users` | Superadmin | List user, ubah role, aktif/nonaktifkan status |
| `/superadmin/valid-nis` | Superadmin | Pre-load whitelist NIS/NIP |
| `/superadmin/categories` | Superadmin | CRUD kategori produk |
| `/superadmin/reports` | Superadmin | Laporan keuangan agregat seluruh kantin |

> Catatan: `/admin/orders` sebelumnya tertulis "real-time" — ini keliru. Sesuai `ARCHITECTURE_SAKU20.md`, sistem tidak pakai WebSocket. Halaman ini perlu polling berkala atau tombol refresh manual, bukan push real-time.

### Vue Router Navigation Guard (`src/router/index.js`)
```javascript
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  // ...daftarkan rute sesuai tabel di atas
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
```

---

## 6. Ringkasan API Endpoint Lengkap

Format respons backend konsisten:
```json
// Sukses
{ "success": true, "data": { ... }, "message": "Opsional" }

// Gagal
{ "success": false, "message": "Pesan error", "errors": { "field": ["detail"] } }
```

### 5.1 Autentikasi (`/auth`)
- `POST /auth/register` — Body: `{ email, name, password, password_confirmation }`
- `POST /auth/login` — Body utama: `{ email, password }`; akun lama: `{ nis_nip, password }`. Respons: `{ success: true, data: { user, token } }`
- `POST /auth/logout` — Header: `Authorization: Bearer <token>`
- `GET /auth/me` — Profil user `{ id, email, nis_nip, name, role, is_active }`

### 5.2 Publik & Katalog (`/stores`, `/products`, `/categories`)
- `GET /stores?type=siswa|tefa` → Daftar toko yang sedang buka (`is_open=true`)
- `GET /stores/:id` → Detail 1 toko
- `GET /categories` → Daftar kategori produk
- `GET /stores/:id/products?category_id=&per_page=20&page=1` → Produk toko (dengan pagination `meta`)
- `GET /products/:id` → Detail produk

### 5.3 Keranjang Belanja (`/cart`)
*Catatan: Backend menggunakan keranjang terpisah untuk setiap pasangan (user_id, store_id). Frontend menggabungkan tampilan seluruh cart toko dalam satu halaman `/cart`. Saat checkout, proses dilakukan per-toko.*
- `GET /cart` → Ambil seluruh keranjang aktif milik user yang sedang login (mengembalikan array keranjang per toko)
- `GET /cart?store_id=:store_id` → Ambil isi keranjang pada toko tsb (response menyertakan `id` cart)
- `POST /cart/items` — Body: `{ store_id, product_id, quantity }`
- `PATCH /cart/items/:item_id` — Body: `{ quantity }`
- `DELETE /cart/items/:item_id` → Hapus 1 item
- `DELETE /cart/:id` → Kosongkan keranjang, pakai **cart id** (dari response `GET /cart`), **bukan** `store_id`

### 5.4 Checkout & Pesanan (`/orders`)
- `POST /orders` — Body: `{ cart_id, guest_name }` (`guest_name` wajib jika tidak login)
  - Respons `201`: Order berhasil dibuat (`id, pickup_code, queue_number, status, total, items`)
  - Respons `409 Conflict`: Stok habis, toko tutup, atau cart sudah diproses sebelumnya (proteksi double-submit — lihat Bagian 7.2)
- `GET /orders` → List riwayat pesanan (khusus Pembeli login, berpaginasi)
- `GET /orders/:id` → Rincian lengkap 1 pesanan
- `GET /orders/:id/status` → Endpoint polling ringan `{ id, status, pickup_code, queue_number }`
  - Status order (persis 4 nilai ini, tidak ada nilai lain): `diproses` → `siap_diambil` → `selesai` / `dibatalkan`

### 5.5 Admin Toko Sendiri (`/admin/*`)
- `GET /admin/store` → Detail toko admin login
- `PATCH /admin/store` — Body: `{ is_open: boolean }`
- `GET /admin/products` → Daftar produk toko admin
- `POST /admin/products` → Multipart: `category_id, name, description, price, stock, image`
- `PATCH /admin/products/:id` → Edit produk
- `DELETE /admin/products/:id` → Hapus produk
- `GET /admin/orders?status=&from=&to=&page=` → Daftar pesanan toko
- `PATCH /admin/orders/:id/status` — Body: `{ status, cancel_reason? }` (`cancel_reason` wajib jika `status: "dibatalkan"`)
- `GET /admin/reports/finance?from=&to=` → `{ gross, commission, net }`

### 5.6 Superadmin (`/superadmin/*`)
- `GET /superadmin/stores?page=1&per_page=20` → Daftar toko lintas tipe dengan pagination Laravel (`data`, `links`, `meta`). Field tipe adalah `store_type` (`siswa` atau `tefa`), bukan `type`; `owner` dapat `null` atau tidak tersedia.
- `POST /superadmin/stores` — Body: `{ name, store_type, is_open?, owner_user_id? }`; membuat toko.
- `PATCH /superadmin/stores/:id` — Body hanya field yang berubah: `{ name?, store_type?, is_open?, owner_user_id? }`. Kirim `owner_user_id: null` untuk melepas pemilik.
- `DELETE /superadmin/stores/:id` — Menghapus toko permanen (hard delete); periksa dampak ke produk/pesanan terkait sebelum mengonfirmasi.
- `owner_user_id` hanya dapat menunjuk user ber-role `admin` dan unik untuk satu toko. Pemilik bersifat opsional, termasuk untuk toko yang berstatus terbuka.
- `GET /superadmin/users?role=&is_active=&search=&page=`
- `PATCH /superadmin/users/:id/role` — Body: `{ role }`
- `PATCH /superadmin/users/:id/status` — Body: `{ is_active }`
- `GET /superadmin/valid-nis`, `POST /superadmin/valid-nis` — Body bulk: `{ nis_nip: ["10201", "10202"] }`
- `GET/POST/PATCH/DELETE /superadmin/categories`
- `GET /superadmin/reports/finance?from=&to=`

---

## 7. Contoh State Management Pinia

### 6.1 `src/stores/auth.js`
```javascript
import { defineStore } from 'pinia';
import { apiClient } from '@/services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user_data') || 'null'),
    token: localStorage.getItem('auth_token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role || 'guest',
  },
  actions: {
    async login(email, password) {
      const res = await apiClient.post('/auth/login', { email: email.trim().toLowerCase(), password });
      this.token = res.data.data.token;
      this.user = res.data.data.user;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('user_data', JSON.stringify(this.user));
    },
    async register(payload) {
      const res = await apiClient.post('/auth/register', payload);
      this.token = res.data.data.token;
      this.user = res.data.data.user;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('user_data', JSON.stringify(this.user));
    },
    async logout() {
      try {
        await apiClient.post('/auth/logout');
      } finally {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    },
    async fetchMe() {
      if (!this.token) return;
      const res = await apiClient.get('/auth/me');
      this.user = res.data.data;
      localStorage.setItem('user_data', JSON.stringify(this.user));
    }
  }
});
```

### 6.2 Polling Status Pesanan — pakai composable, bukan interval mentah di store

**Perbaikan penting**: versi sebelumnya menaruh `setInterval` langsung di Pinia store tanpa jaminan `clearInterval` terpanggil saat user pindah halaman — ini bikin polling tetap jalan di background meski halaman sudah ditinggalkan (memory leak + request sia-sia ke server). Gunakan composable `usePolling` (lihat `FRONTEND_OVERVIEW_SAKU20.md` §5) yang otomatis cleanup lewat `onUnmounted`:

```javascript
// src/composables/usePolling.js — lihat FRONTEND_OVERVIEW_SAKU20.md untuk versi lengkap
import { onUnmounted } from 'vue';

export function usePolling(callback, intervalMs = 5000) {
  let timer = null;
  function start() {
    stop();
    callback();
    timer = setInterval(callback, intervalMs);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  onUnmounted(stop);
  return { start, stop };
}
```

Dipakai di halaman `OrderStatus.vue`:
```javascript
import { onMounted } from 'vue';
import { usePolling } from '@/composables/usePolling';
import { apiClient } from '@/services/api';

const order = ref(null);

const { start, stop } = usePolling(async () => {
  const res = await apiClient.get(`/orders/${orderId}/status`);
  order.value = res.data.data;
  if (['selesai', 'dibatalkan'].includes(order.value.status)) {
    stop(); // hentikan polling begitu status final — jangan terus polling order yang sudah kelar
  }
}, 5000); // 5 detik — konsisten di seluruh aplikasi, jangan pakai angka berbeda di halaman lain

onMounted(start);
```

---

## 8. Aturan Bisnis & UI/UX Khusus

1. **Aturan Multi-Toko pada Keranjang & Checkout**:
   - Backend memisahkan cart per `(user_id, store_id)`.
   - Frontend menampilkan semua cart toko dalam satu halaman `/cart` (dikelompokkan per toko).
   - Menambahkan produk dari toko lain tidak menghapus cart toko sebelumnya.
   - Saat checkout:
     - Jika cart kosong, tampilkan pesan error.
     - Jika hanya 1 toko, langsung proses checkout dengan `cart_id` toko tersebut.
     - Jika terdapat lebih dari 1 toko, tampilkan popup modal pemilihan toko dengan pesan:
       *"Checkout hanya dapat dilakukan untuk satu toko. Pilih toko yang ingin diproses."*
     - Hanya 1 request `POST /orders` dengan `{ cart_id: selectedCartId }` yang dikirim.
     - Cart toko lain tetap tersimpan, dan hanya cart toko yang berhasil diproses yang dihapus dari state.

2. **Checkout "Simulate Paid" — wajib ada proteksi double-submit**:
   - Sistem SAKU 20 tidak menggunakan gateway pembayaran pihak ketiga. Begitu klik "Simulate Paid", **disable tombol segera** (sebelum response API datang) untuk mencegah klik ganda mengirim 2 request `POST /orders` untuk cart yang sama. Backend juga sudah punya proteksi serupa (cart dikunci + dicek masih berisi), tapi disable di frontend tetap wajib supaya UX tidak membingungkan (user tidak lihat 2x proses berjalan).
   ```javascript
   const isSubmitting = ref(false);

   async function simulatePaid() {
     if (isSubmitting.value) return;
     isSubmitting.value = true;
     try {
       const res = await apiClient.post('/orders', { cart_id: cart.value.id, guest_name: guestName.value });
       router.push(`/orders/${res.data.data.id}`);
     } catch (err) {
       if (err.response?.status === 409) {
         // tampilkan pesan sesuai err.response.data.message — bisa "stok habis", "toko tutup", dst
       }
       isSubmitting.value = false; // re-enable tombol hanya kalau gagal
     }
   }
   ```

3. **Form Upload Produk Admin**:
   - Gunakan `FormData` untuk upload gambar produk:
   ```javascript
   const formData = new FormData();
   formData.append('name', form.name);
   formData.append('category_id', form.category_id);
   formData.append('price', form.price);
   formData.append('stock', form.stock);
   formData.append('description', form.description);
   if (form.imageFile) {
     formData.append('image', form.imageFile);
   }
   await apiClient.post('/admin/products', formData, {
     headers: { 'Content-Type': 'multipart/form-data' },
   });
   ```

4. **Status Badging** — pakai variable dari `tokens.css`, jangan hardcode hex di komponen:
   - `diproses`: `background: var(--color-status-diproses-bg)`, `color: var(--color-status-diproses-text)` — badge: "Sedang Disiapkan"
   - `siap_diambil`: `var(--color-status-siap_diambil-bg)` / `-text` — badge: "Siap Diambil - Tunjukkan Kode!"
   - `selesai`: `var(--color-status-selesai-bg)` / `-text` — badge: "Pesanan Selesai"
   - `dibatalkan`: `var(--color-status-dibatalkan-bg)` / `-text` — badge: "Dibatalkan"
   - **Catatan**: `--color-tefa-accent` kebetulan sama persis dengan `--color-status-dibatalkan-bg` (`#FF0000`) — kalau badge "Dibatalkan" muncul di halaman TEFA, cek langsung tampilannya tidak membingungkan secara visual dengan elemen navigasi aktif TEFA yang warnanya sama.

5. **Prinsip Layout Mobile-First**:
   - Area publik pembeli difokuskan ke viewport mobile (360px - 480px).
   - Di desktop, bungkus halaman dalam frame mobile terpusat (`max-width: 480px; margin: 0 auto; min-height: 100vh;`), kecuali halaman Admin/Superadmin yang menggunakan dashboard layout adaptif lebar.
   - Ukuran target ketuk (touch target) tombol dan link minimal `44px × 44px`.
   - Action bar krusial (seperti ringkasan keranjang dan tombol checkout) wajib menggunakan bottom bar sticky/fixed.

6. **Penggunaan Iconify (`@iconify/vue`)**:
   - Ganti seluruh ikon SVG statis/Lucide dengan komponen universal Iconify:
   ```vue
   <script setup>
   import { Icon } from '@iconify/vue';
   </script>

   <template>
     <Icon icon="lucide:shopping-cart" width="20" height="20" />
     <Icon icon="lucide:clock" width="16" height="16" />
   </template>
   ```

7. **Alur Kerja Desain via Figma MCP Server**:
   - Saat mengembangkan komponen visual, gunakan tool Figma MCP untuk menginspeksi node komponen terkait pada file desain Figma.
   - Ekstrak nilai auto-layout (gap, padding), border-radius, font style, dan ukuran icon langsung dari node Figma.
   - Petakan setiap warna dan token desain dari Figma langsung ke CSS Custom Properties di `tokens.css`, hindari deklarasi hex warna sembarangan.
