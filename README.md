# SAKU 20 — Frontend

[![Vue 3](https://img.shields.io/badge/Vue.js-3-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-f7df1e?logo=javascript&logoColor=222)](https://developer.mozilla.org/docs/Web/JavaScript)

Frontend untuk **SAKU 20**, aplikasi pemesanan produk dan pengelolaan toko. Aplikasi menyediakan alur belanja untuk pembeli serta dashboard operasional untuk admin toko dan superadmin.

## Fitur Utama

- Jelajahi toko, produk, kategori, dan halaman detail produk.
- Daftar akun, login, dan sesi pengguna dengan token Bearer.
- Keranjang belanja, checkout, daftar pesanan, dan pelacakan status pesanan.
- Dashboard admin untuk status toko, produk, pesanan, dan ringkasan laporan.
- Dashboard superadmin untuk mengelola toko, pengguna, dan kategori.
- Tampilan responsif dengan navigasi mobile dan desktop.

## Tech Stack

- **Framework:** Vue 3 (Composition API, Single-File Components)
- **Build tool:** Vite 8
- **Bahasa:** JavaScript (ES modules)
- **Routing:** Vue Router 4
- **State management:** Pinia
- **HTTP client:** Axios
- **Ikon:** Iconify
- **Styling:** CSS, termasuk design tokens di `src/styles/`
- **Pengujian:** Node.js test runner

## Prasyarat

- Node.js `^22.18.0` atau `>=24.12.0` (sesuai `engines` di `package.json`).
- npm.
- Backend SAKU 20 tersedia dan dapat diakses dari browser selama pengembangan.

## Instalasi & Setup

```bash
git clone <URL-REPOSITORY>
cd saku20
npm install
```

Jika repository sudah tersedia di komputer, cukup masuk ke folder project dan jalankan `npm install`.

## Konfigurasi Environment

Salin `.env.example` menjadi `.env`, lalu sesuaikan alamat backend dan storage:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STORAGE_BASE_URL=http://localhost:8000/storage
```

`VITE_API_BASE_URL` adalah base URL REST API. `VITE_STORAGE_BASE_URL` digunakan untuk membentuk URL gambar jika API mengembalikan path relatif. Jika variabel tidak disetel, aplikasi menggunakan kedua alamat lokal di atas. Restart server Vite setelah mengubah file environment.

Jangan menyimpan kredensial atau secret di variabel `VITE_*`; nilainya akan ikut terekspos ke browser.

## Menjalankan Aplikasi

Jalankan server backend terlebih dahulu, lalu:

```bash
npm run dev
```

Buka URL yang ditampilkan Vite (default: `http://localhost:5173`). Perintah lain:

```bash
npm test       # tes yang tersedia
npm run build  # build produksi
npm run preview # preview hasil build secara lokal
```

## Struktur Folder

```text
public/                 Aset statis yang disajikan apa adanya
  assets/               Ikon dan gambar publik
src/
  components/           Komponen bersama, layout, dan modul UI
  composables/           Composables Vue, termasuk polling
  layouts/               Layout halaman superadmin
  router/                Definisi rute dan guard autentikasi/role
  services/              Klien Axios dan helper API
  stores/                State Pinia untuk autentikasi dan keranjang
  styles/                CSS dasar dan design tokens
  views/                 Halaman auth, publik, admin, dan superadmin
test/                    Tes dan mock API
index.html               Dokumen HTML utama
vite.config.js           Konfigurasi Vite dan alias @ ke src/
```

## Koneksi ke API (Backend)

Klien HTTP dibuat di `src/services/api.js`. Semua path endpoint di bawah relatif terhadap `VITE_API_BASE_URL`, yang secara default berakhir dengan `/api/v1`. Request terautentikasi otomatis menyertakan header `Authorization` dengan token sesi. Jika backend mengembalikan `401`, sesi lokal dibersihkan dan pengguna diarahkan ke halaman login.

API menggunakan respons JSON; upload produk dikirim sebagai `multipart/form-data`. Endpoint admin dan superadmin memerlukan role yang sesuai. Backend tetap bertanggung jawab memvalidasi role dan akses data.

## Daftar Endpoint API yang Digunakan

Endpoint berikut dirangkum dari pemanggilan API di frontend. `{id}` atau `{item_id}` adalah parameter dinamis; parameter query dikirim sesuai kebutuhan halaman.

| Method | Path (relatif ke base URL) | Kegunaan |
|---|---|---|
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/register` | Registrasi |
| `GET` | `/auth/me` | Memuat profil sesi |
| `POST` | `/auth/logout` | Logout |
| `GET` | `/stores` | Daftar toko, dapat difilter melalui query |
| `GET` | `/stores/{id}` | Detail toko |
| `GET` | `/stores/{id}/products` | Produk toko, mendukung query seperti kategori dan pagination |
| `GET` | `/products/{id}` | Detail produk |
| `GET` | `/categories` | Daftar kategori |
| `GET` | `/cart` | Keranjang; frontend juga dapat mengirim query `store_id` |
| `POST` | `/cart/items` | Tambah item keranjang |
| `PATCH` | `/cart/items/{item_id}` | Ubah jumlah item keranjang |
| `DELETE` | `/cart/items/{item_id}` | Hapus item keranjang |
| `DELETE` | `/cart/{id}` | Kosongkan/hapus keranjang |
| `POST` | `/orders` | Checkout / membuat pesanan |
| `GET` | `/orders` | Daftar pesanan pengguna |
| `GET` | `/orders/{id}` | Detail pesanan |
| `GET` | `/orders/{id}/status` | Status pesanan untuk pelacakan |
| `GET` | `/admin/store` | Data dan status toko admin |
| `PATCH` | `/admin/store` | Ubah status buka/tutup toko |
| `GET` | `/admin/products` | Produk milik toko admin; dashboard dapat mengirim `is_active` dan pagination |
| `POST` | `/admin/products` | Tambah produk (multipart) |
| `PATCH` | `/admin/products/{id}` | Ubah produk (multipart) |
| `DELETE` | `/admin/products/{id}` | Hapus produk |
| `GET` | `/admin/orders` | Daftar pesanan admin, termasuk filter tanggal dan pagination |
| `PATCH` | `/admin/orders/{id}/status` | Ubah status pesanan |
| `GET` | `/admin/reports/finance` | Ringkasan laporan keuangan admin |
| `GET` | `/superadmin/stores` | Daftar toko superadmin |
| `POST` | `/superadmin/stores` | Buat toko |
| `PATCH` | `/superadmin/stores/{id}` | Ubah toko |
| `DELETE` | `/superadmin/stores/{id}` | Hapus toko |
| `GET` | `/superadmin/users` | Daftar pengguna superadmin |
| `PATCH` | `/superadmin/users/{id}/status` | Ubah status pengguna |
| `GET` | `/superadmin/categories` | Daftar kategori superadmin |

Kontrak dan contoh respons integrasi tersedia di [API_INTEGRATION_RESPONSE.md](./API_INTEGRATION_RESPONSE.md), [API_ADMIN_DASHBOARD.md](./API_ADMIN_DASHBOARD.md), dan [API_CONTRACT_ADMIN_PRODUCTS.md](./API_CONTRACT_ADMIN_PRODUCTS.md).

## Screenshots / Demo

Screenshot dan URL demo belum disertakan di repository ini. Tambahkan gambar aplikasi (misalnya ke `public/assets/`) dan tautan demo di bagian ini saat sudah tersedia. Gambar QRIS di aset publik merupakan bagian dari alur checkout, bukan screenshot aplikasi.

## Panduan Penggunaan

1. Buka halaman utama untuk melihat toko, atau gunakan `/stores` dan `/tefa` untuk menjelajah toko.
2. Daftar atau login melalui `/register` atau `/login`.
3. Pilih produk, tambahkan ke keranjang, lalu lanjutkan ke `/cart` dan `/checkout`.
4. Lihat pesanan di `/orders` dan pilih pesanan untuk membuka halaman pelacakan.
5. Pengguna ber-role admin mengelola toko melalui `/admin`; superadmin mengelola data melalui `/superadmin`.

Halaman yang memerlukan autentikasi akan mengarahkan pengguna ke login. Halaman admin dan superadmin dibatasi menurut role akun.

## Build untuk Produksi

```bash
npm run build
npm run preview
```

Hasil build berada di folder `dist/`. Deploy folder tersebut ke static hosting dan arahkan fallback URL aplikasi ke `index.html` agar navigasi Vue Router dengan history mode dapat dimuat langsung. Atur `VITE_API_BASE_URL` dan `VITE_STORAGE_BASE_URL` untuk lingkungan deployment sebelum menjalankan build.

## Lisensi & Info Pembuat

- **Lisensi:** Belum dicantumkan untuk project ini. Pastikan izin penggunaan dengan pemilik repository sebelum mendistribusikan atau menggunakan ulang.
- **Pembuat/pemelihara:** Tim pengembang SAKU 20; nama atau kontak individu belum dicantumkan.
