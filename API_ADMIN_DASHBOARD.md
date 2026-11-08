# Endpoint Dashboard Admin Toko

## 1. Detail dan Status Toko

```http
GET /api/v1/admin/store
```

Mengambil data toko milik Admin yang sedang login.

Data yang digunakan: `name`, `store_type`, `is_open`.

### Contoh response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "JungleFood",
    "store_type": "siswa",
    "is_open": true
  }
}
```

## 2. Buka atau Tutup Toko

```http
PATCH /api/v1/admin/store
```

### Request membuka toko

```json
{
  "is_open": true
}
```

### Request menutup toko

```json
{
  "is_open": false
}
```

### Catatan implementasi

- Gunakan toggle atau switch pada dashboard.
- Tombol `Open Store` digunakan saat toko tertutup.
- Tombol `Close Store` digunakan saat toko terbuka.
- Setelah berhasil, perbarui status toko di UI.
- Jika gagal, kembalikan state sebelumnya dan tampilkan pesan error.

## 3. Mengambil Produk Admin

```http
GET /api/v1/admin/products
```

Mengambil produk milik toko Admin untuk menghitung jumlah produk aktif.

Data yang digunakan: `is_active`, `stock`, `name`, `image_url`.

### Perhitungan Active Products

```text
Active Products = jumlah produk dengan is_active = true
```

### Catatan implementasi

- Jika backend mendukung filter:

```http
GET /api/v1/admin/products?is_active=true
```

- Jika backend belum mendukung filter `is_active`, ambil seluruh produk lalu filter di frontend:

```javascript
products.filter((product) => product.is_active).length
```

- Jika endpoint produk dipaginasi, ambil seluruh halaman menggunakan metadata/tautan pagination yang dikembalikan backend.
- Jika filter `is_active=true` diterapkan dan response berisi `meta.total`, gunakan nilai itu sebagai jumlah produk aktif.
- Jika filter tidak didukung, tidak menghasilkan metadata total, atau response mengandung produk nonaktif, ambil seluruh halaman tanpa filter lalu hitung `is_active === true`.
- Produk yang dinonaktifkan tetap ada di database, tetapi tidak dihitung sebagai produk aktif.

## 4. Mengambil Order pada Hari Tersebut

```http
GET /api/v1/admin/orders?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&per_page=25
```

### Contoh

```http
GET /api/v1/admin/orders?from=2026-11-08&to=2026-11-08&page=1&per_page=25
```

Endpoint ini digunakan untuk:

- Orders
- Completed Orders
- Tabel order dashboard

Endpoint mengembalikan satu halaman setiap request. Gunakan `meta.current_page`, `meta.last_page`, dan/atau `links.next` untuk mengambil seluruh halaman. Contoh metadata:

```json
{
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  },
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 25,
    "total": 60
  }
}
```

Jangan menganggap `per_page=100` menjamin semua order termuat. Ambil halaman berikutnya sampai `current_page === last_page` atau `links.next` tidak tersedia.

Data yang digunakan:

- `id`
- `queue_number`
- `guest_name`
- `user.name`
- `created_at`
- `total`
- `status`

## 5. Sales Today

Sales Today bersumber dari laporan keuangan, bukan agregasi data order:

```http
GET /api/v1/admin/reports/finance?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Contoh response:

```json
{
  "success": true,
  "data": {
    "gross": "30000.00",
    "commission": "3000.00",
    "net": "27000.00"
  }
}
```

Gunakan `data.gross` untuk KPI Sales Today. Jangan fallback ke agregasi orders jika request gagal atau response tidak valid.

Tanggal `from` dan `to` harus menggunakan zona waktu operasional `Asia/Jakarta`.

## 6. Total Orders

`Orders` adalah seluruh pesanan pada tanggal tersebut, kecuali pesanan yang dibatalkan.

```text
Orders = diproses + siap_diambil + selesai
```

```javascript
const totalOrders = orders.filter(
  (order) => order.status !== 'dibatalkan',
).length;
```

- Order `diproses`, `siap_diambil`, dan `selesai` tetap dihitung.
- Order `dibatalkan` tidak dihitung.
- Hanya order pada tanggal yang dipilih yang dihitung.
- Ambil seluruh halaman hasil filter tanggal sebelum menghitung jumlah.

## 7. Completed Orders

`Completed Orders` adalah order pada tanggal tersebut dengan status `selesai`.

```javascript
const completedOrders = orders.filter(
  (order) => order.status === 'selesai',
).length;
```

## 8. Tabel Order Dashboard

Data tabel diambil dari endpoint order harian:

```http
GET /api/v1/admin/orders?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&per_page=25
```

| Kolom UI | Field API | Keterangan |
|---|---|---|
| Queue Number | `queue_number` | Nomor antrean pembeli |
| Name | `guest_name` atau `user.name` | Fallback: `Walk-in Customer` |
| Time of Order | `created_at` | Format `HH:mm` dalam zona waktu `Asia/Jakarta` |
| Order Price | `total` | Ditampilkan sebagai Rupiah |
| Status | `status` | Gunakan mapping status di bagian berikut |

Field kanonis di atas tetap menjadi kontrak utama. Untuk perbedaan format serializer, dashboard juga menerima `queueNumber`, nama dari `customer_name`, `buyer_name`, `customer.name`, atau `buyer.name`, serta waktu dari `createdAt`, `order_time`, atau `ordered_at`. Jika backend tidak mengirim field tersebut dalam bentuk kanonis maupun alias ini, dashboard menampilkan placeholder untuk nilai yang memang tidak tersedia.

### Fallback nama pembeli

```javascript
const customerName =
  order.guest_name ||
  order.user?.name ||
  'Walk-in Customer';
```

Tabel dashboard menampilkan maksimal 8 order terbaru, diurutkan berdasarkan `created_at` menurun. Data KPI tetap menggunakan semua order pada hari itu.

Contoh harga: `Rp 18.000`.

## 9. Mapping Status Order

| Status API | Label UI |
|---|---|
| `diproses` | `Pending` |
| `siap_diambil` | `Ready` |
| `selesai` | `Completed` |
| `dibatalkan` | `Cancelled` |



## 10. Autentikasi

Seluruh endpoint Admin membutuhkan:

```http
Authorization: Bearer {token}
Accept: application/json
```

Admin hanya dapat melihat store, product, dan order milik store yang terkait dengan akun tersebut. Pembatasan akses tetap wajib dilakukan backend, bukan hanya disembunyikan pada frontend.

## 11. Polling Dashboard

Dashboard memperbarui data order dan laporan finance setiap 5 detik:

```text
GET /api/v1/admin/orders?from=DATE&to=DATE&page=N&per_page=25
GET /api/v1/admin/reports/finance?from=DATE&to=DATE
```

### Catatan

- Gunakan composable `usePolling`.
- Hentikan polling saat halaman dilepas.
- Hentikan sementara saat tab browser tidak aktif.
- Tampilkan indikator `Auto-refresh · updated 2s ago`.
- Tombol `Refresh` manual tetap dapat disediakan sebagai alternatif.
- Jangan memulai request polling baru jika request sebelumnya masih berjalan.

## 12. Daftar Endpoint Final

```text
GET   /api/v1/admin/store
PATCH /api/v1/admin/store

GET   /api/v1/admin/products
GET   /api/v1/admin/products?is_active=true

GET   /api/v1/admin/reports/finance?from=YYYY-MM-DD&to=YYYY-MM-DD
GET   /api/v1/admin/orders?from=YYYY-MM-DD&to=YYYY-MM-DD&page=N&per_page=25
PATCH /api/v1/admin/orders/{orderId}/status
```

Tidak diperlukan endpoint dashboard baru untuk kebutuhan ini.