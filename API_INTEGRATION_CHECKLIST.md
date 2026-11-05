# Checklist Koneksi Backend–Frontend SAKU 20

Target: login akun pembeli, melihat produk, menambahkan produk ke cart.

## 1. Informasi yang Dibutuhkan dari Backend

Kirimkan:

- URL API aktif, contoh: `http://localhost:8000/api/v1`
- Dokumentasi endpoint
- Format autentikasi: Bearer token atau cookie/Sanctum
- Format response login
- Format response produk
- Format response cart
- Akun pembeli khusus testing
- Port backend
- Konfigurasi CORS

Jangan kirim password akun produksi.

## 2. Endpoint Wajib

```text
POST /auth/login
GET  /auth/me
POST /auth/logout

GET  /products/{id}
GET  /stores/{id}/products

GET  /cart?store_id={id}
POST /cart/items
PATCH /cart/items/{item_id}
DELETE /cart/items/{item_id}
DELETE /cart/{cart_id}
```

## 3. Environment Frontend

Buat file `.env` di root project:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STORAGE_BASE_URL=http://localhost:8000/storage
```

Restart Vite setelah mengubah `.env`:

```powershell
npm run dev
```

## 4. Format Login

Request:

```json
{
  "nis_nip": "12345",
  "password": "password-testing"
}
```

Response minimum:

```json
{
  "success": true,
  "data": {
    "token": "TOKEN",
    "user": {
      "id": 1,
      "nis_nip": "12345",
      "name": "Pembeli Testing",
      "role": "pembeli",
      "is_active": true
    }
  }
}
```

Frontend mengirim token pada request berikutnya:

```http
Authorization: Bearer TOKEN
```

## 5. Format Produk

```json
{
  "success": true,
  "data": {
    "id": 3,
    "store_id": 1,
    "store_name": "Kantin SAKU",
    "name": "Nasi Goreng",
    "description": "Nasi goreng spesial",
    "price": 12000,
    "stock": 10,
    "image": "https://example.com/products/nasi-goreng.jpg"
  }
}
```

## 6. Format Cart

Request tambah item:

```json
{
  "store_id": 1,
  "product_id": 3,
  "quantity": 1
}
```

Response cart minimum:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "store_name": "Kantin SAKU",
    "items": [
      {
        "id": 20,
        "product_id": 3,
        "name": "Nasi Goreng",
        "price": 12000,
        "quantity": 1,
        "image": "https://example.com/products/nasi-goreng.jpg"
      }
    ]
  }
}
```

## 7. CORS Backend

Izinkan origin development:

```text
http://localhost:5173
```

Izinkan method:

```text
GET, POST, PATCH, DELETE, OPTIONS
```

Izinkan headers:

```text
Accept, Content-Type, Authorization
```

## 8. Data Testing Backend

Siapkan:

- User aktif dengan role `pembeli`
- Password testing
- Minimal satu toko aktif
- Minimal satu produk aktif
- Stok produk lebih dari 0
- Relasi produk dengan toko valid

## 9. Verifikasi Manual

1. Jalankan backend.
2. Uji endpoint login.
3. Buat `.env` frontend.
4. Jalankan frontend.
5. Login dengan akun pembeli.
6. Periksa `localStorage.auth_token`.
7. Buka detail produk.
8. Klik **Add to Cart**.
9. Periksa request `POST /cart/items`.
10. Periksa request `GET /cart`.
11. Ubah jumlah item.
12. Hapus item.

## 10. Perintah Dasar

Backend harus merespons:

```powershell
curl http://localhost:8000/api/v1
```

Install dan jalankan frontend:

```powershell
npm install
npm run dev
```

Build validasi:

```powershell
npm run build
```

## 11. Catatan Frontend Saat Ini

- Login memakai [`src/stores/auth.js`](./src/stores/auth.js).
- Request API memakai [`src/services/api.js`](./src/services/api.js).
- Cart memakai [`src/stores/cart.js`](./src/stores/cart.js).
- Detail produk sudah memakai API.
- Home dan Shop masih memakai data dummy dari [`src/data/products.js`](./src/data/products.js).
- Route `/products/:id` dan `/cart` memerlukan login.

## 12. Kriteria Selesai

Integrasi dianggap selesai jika:

- Login pembeli berhasil.
- Token dikirim sebagai Bearer token.
- Produk tampil dari backend.
- Detail produk tampil dari backend.
- Produk dapat masuk cart.
- Cart dapat dimuat ulang dari backend.
- Quantity dapat diubah.
- Item dapat dihapus.
- Error API tampil di UI.
- `npm run build` berhasil.
