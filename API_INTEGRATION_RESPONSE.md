# Jawaban Kebutuhan Integrasi Frontend - Backend SAKU 20

Dokumen ini merangkum seluruh parameter, format payload, akun testing, dan konfigurasi backend untuk memenuhi `markdown/API_INTEGRATION_CHECKLIST.md`.

---

## 1. Parameter Koneksi & Konfigurasi Lingkungan

- **Base URL API**: `http://localhost:8000/api/v1`
- **Port Backend**: `8000` (via `php artisan serve`)
- **Port Frontend (Dev)**: `5173` (Vite)
- **Base URL Storage Gambar**: `http://localhost:8000/storage`
- **Mekanisme Autentikasi**: Bearer Token (Laravel Sanctum via header `Authorization: Bearer <token>`)

### Konfigurasi `.env` Frontend
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STORAGE_BASE_URL=http://localhost:8000/storage
```

### Konfigurasi CORS Backend
Backend sudah mengizinkan origin development dan method lengkap pada `config/cors.php`:
- **Allowed Origins**: `*` (mencakup `http://localhost:5173`)
- **Allowed Methods**: `*` (`GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`)
- **Allowed Headers**: `*` (`Accept`, `Content-Type`, `Authorization`, `X-Requested-With`)
- **Supports Credentials**: `false`

---

## 2. Kredensial Akun Khusus Testing

| Role | NIS / NIP | Password | Nama | Catatan |
|---|---|---|---|---|
| **Pembeli** | `14146` | `password` | Altaf Azka Aviantara | Akun utama testing pembeli (aktif) |
| **Admin Toko** | `14147` | `password` | Jaris | Pemilik toko *JungleFood* (ID Store: 1) |
| **Superadmin** | `14148` | `password` | Sulistianto | Pemilik toko *TEFA* & akses superadmin |

---

## 3. Data Toko & Produk untuk Testing

- **Toko Aktif**:
  - `id`: `1`, `name`: `JungleFood`, `store_type`: `siswa`, `is_open`: `true`
  - `id`: `2`, `name`: `MeetUp Cafe`, `store_type`: `siswa`, `is_open`: `true`
  - `id`: `9`, `name`: `TEFA`, `store_type`: `tefa`, `is_open`: `true`

- **Contoh Produk Toko 1 (JungleFood)**:
  - `id`: `1` -> Nasi Goreng Spesial (Harga: Rp 12.000, Stok: 15)
  - `id`: `2` -> Rice Bowl Ayam Teriyaki (Harga: Rp 15.000, Stok: 10)
  - `id`: `3` -> Mie Goreng Telur (Harga: Rp 10.000, Stok: 12)
  - `id`: `4` -> Kentang Goreng (Harga: Rp 8.000, Stok: 20)

---

## 4. Spesifikasi Kontrak API & Endpoint Wajib

### A. Autentikasi

#### 1. Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "nis_nip": "14146",
    "password": "password"
  }
  ```
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "nis_nip": "14146",
        "name": "Altaf Azka Aviantara",
        "role": "pembeli",
        "is_active": true
      },
      "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  }
  ```
- **Response Gagal (401 / 403)**:
  ```json
  {
    "success": false,
    "message": "NIS/NIP atau password salah"
  }
  ```

#### 2. Get Profile User
- **Endpoint**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "nis_nip": "14146",
      "name": "Altaf Azka Aviantara",
      "role": "pembeli",
      "is_active": true
    }
  }
  ```

#### 3. Logout
- **Endpoint**: `POST /api/v1/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Berhasil logout",
    "data": null
  }
  ```

---

### B. Browsing Toko & Produk

#### 1. Daftar Toko
- **Endpoint**: `GET /api/v1/stores` (Opsional query: `?type=siswa` atau `?type=tefa`)
- **Headers**: Public (tidak wajib token)
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "JungleFood",
        "store_type": "siswa",
        "is_open": true
      }
    ]
  }
  ```

#### 2. Daftar Produk per Toko
- **Endpoint**: `GET /api/v1/stores/{store_id}/products` (Opsional: `?category_id=1&per_page=20`)
- **Headers**: Public
- **Response Sukses (200 OK - Paginasi)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "store_id": 1,
        "category_id": 1,
        "name": "Nasi Goreng Spesial",
        "description": null,
        "price": 12000,
        "stock": 15,
        "image_url": "http://localhost:8000/storage/products/nasi-goreng-spesial.webp",
        "category": {
          "id": 1,
          "name": "Makanan Pokok & Instan"
        }
      }
    ],
    "links": {
      "first": "http://localhost:8000/api/v1/stores/1/products?page=1",
      "last": "http://localhost:8000/api/v1/stores/1/products?page=1",
      "prev": null,
      "next": null
    },
    "meta": {
      "current_page": 1,
      "from": 1,
      "last_page": 1,
      "path": "http://localhost:8000/api/v1/stores/1/products",
      "per_page": 20,
      "to": 4,
      "total": 4
    },
    "success": true
  }
  ```

#### 3. Detail Produk
- **Endpoint**: `GET /api/v1/products/{id}`
- **Headers**: Public
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "store_id": 1,
      "category_id": 1,
      "name": "Nasi Goreng Spesial",
      "description": null,
      "price": 12000,
      "stock": 15,
      "image_url": "http://localhost:8000/storage/products/nasi-goreng-spesial.webp",
      "category": {
        "id": 1,
        "name": "Makanan Pokok & Instan"
      }
    }
  }
  ```

---

### C. Keranjang Belanja (Cart)

> **Penting**: Keranjang belanja di backend terikat per-toko (`store_id`). Satu cart hanya menampung produk dari satu toko yang sama.

#### 1. Lihat Cart Toko
- **Endpoint**: `GET /api/v1/cart?store_id={id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "store_id": 1,
      "items": [
        {
          "id": 1,
          "product_id": 1,
          "quantity": 2,
          "product": {
            "id": 1,
            "store_id": 1,
            "category_id": 1,
            "name": "Nasi Goreng Spesial",
            "description": null,
            "price": 12000,
            "stock": 15,
            "image_url": "products/nasi-goreng-spesial.webp"
          }
        }
      ]
    }
  }
  ```

#### 2. Tambah Item ke Cart
- **Endpoint**: `POST /api/v1/cart/items`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "store_id": 1,
    "product_id": 1,
    "quantity": 1
  }
  ```
- **Response Sukses (201 Created)**:
  Format respons sama dengan struktur Cart di atas (mengembalikan state cart terbaru beserta items).

#### 3. Ubah Jumlah Item Cart
- **Endpoint**: `PATCH /api/v1/cart/items/{item_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "quantity": 3
  }
  ```
- **Response Sukses (200 OK)**:
  Format respons sama dengan struktur Cart terbaru.

#### 4. Hapus Satu Item Cart
- **Endpoint**: `DELETE /api/v1/cart/items/{item_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response Sukses (200 OK)**:
  Mengembalikan representasi Cart terbaru setelah item dihapus.

#### 5. Bersihkan/Hapus Seluruh Cart
- **Endpoint**: `DELETE /api/v1/cart/{cart_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Cart cleared",
    "data": null
  }
  ```

---

## 5. Cara Menjalankan Backend untuk Dev

1. Pastikan database dan storage symlink siap:
   ```powershell
   php artisan storage:link
   php artisan migrate --seed
   ```
2. Jalankan server:
   ```powershell
   php artisan serve --port=8000
   ```
