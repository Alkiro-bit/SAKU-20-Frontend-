# API Contract — Admin Products (Development)

Base URL: `/api/v1`  
Format: REST + JSON  
Auth: `Authorization: Bearer <token>` (Laravel Sanctum), middleware `admin` required  
Scope: Hanya produk milik toko admin yang login (`stores.owner_user_id = auth user`)

---

## 1. Endpoint Ringkasan

| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| GET | `/admin/products` | — | Daftar produk toko sendiri |
| POST | `/admin/products` | `multipart/form-data` | Tambah produk baru |
| PATCH | `/admin/products/{id}` | `multipart/form-data` | Update sebagian/seluruh field |
| DELETE | `/admin/products/{id}` | — | Hard delete produk |

---

## 2. GET /admin/products

**Middleware:** `auth:sanctum`, `active`, `admin`  
**Scope:** Produk hanya dari toko milik admin yang login.

### Request
Tanpa body. Query parameter opsional untuk pagination bawaan Laravel: `?page=1&per_page=20`.

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "store_id": 4,
      "category_id": 2,
      "name": "Indomie Goreng",
      "description": "Mie instan rasa ayam bawang",
      "price": 4000.00,
      "stock": 50,
      "image_url": "https://.../storage/products/indomie-goreng.webp",
      "is_active": true,
      "created_at": "2026-11-09T10:00:00Z",
      "updated_at": "2026-11-09T10:00:00Z"
    }
  ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 3, "per_page": 20, "total": 52 }
}
```

---

## 3. POST /admin/products (Create)

**Middleware:** `auth:sanctum`, `active`, `admin`  
**Content-Type:** `multipart/form-data`  
**Store assignment:** `store_id` di-set otomatis dari toko milik user yang login (tidak dikirim dari frontend).

### Request Body

| Field | Tipe | Wajib | Aturan Validasi | Catatan |
|-------|------|-------|-----------------|---------|
| `category_id` | integer | **Ya** (semua admin) | `required\|integer\|exists:categories,id` | **Tidak ada pengecualian untuk non-TEFA.** Wajib untuk semua store_type. |
| `name` | string | Ya | `required\|string\|max:255` | Nama produk |
| `description` | string | Tidak | `nullable\|string` | Deskripsi produk |
| `price` | numeric | Ya | `required\|numeric\|min:0` | Harga, minimal 0 |
| `stock` | integer | Ya | `required\|integer\|min:0` | Jumlah stok, minimal 0 |
| `image` | file | Tidak | `nullable\|file\|image\|mimes:jpeg,png,jpg,webp,gif\|max:5120` | Max 5 MB. Dikonversi ke WebP di backend. |
| `is_active` | boolean | Tidak | `sometimes\|boolean` | Default `true` jika tidak dikirim |

### Contoh Request (FormData)
```
category_id: 2
name: Indomie Goreng
description: Mie instan rasa ayam bawang
price: 4000
stock: 50
image: [File]
is_active: true
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 123,
    "store_id": 4,
    "category_id": 2,
    "name": "Indomie Goreng",
    "description": "Mie instan rasa ayam bawang",
    "price": 4000.00,
    "stock": 50,
    "image_url": "https://.../storage/products/indomie-goreng.webp",
    "is_active": true
  },
  "message": "Produk berhasil ditambahkan"
}
```

### Error (422 Validation)
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "category_id": ["The category id field is required."],
    "price": ["The price field is required."],
    "image": ["The image must be a file of type: jpeg, png, jpg, webp, gif."]
  }
}
```

---

## 4. PATCH /admin/products/{id} (Update)

**Middleware:** `auth:sanctum`, `active`, `admin`  
**Content-Type:** `multipart/form-data`  
**Scope:** Hanya produk milik toko admin yang login.

### Request Body
Semua field bersifat `sometimes` (opsional). Hanya kirim field yang ingin diubah.

| Field | Tipe | Wajib | Aturan Validasi |
|-------|------|-------|-----------------|
| `category_id` | integer | Tidak | `sometimes\|integer\|exists:categories,id` |
| `name` | string | Tidak | `sometimes\|string\|max:255` |
| `description` | string | Tidak | `sometimes\|nullable\|string` |
| `price` | numeric | Tidak | `sometimes\|numeric\|min:0` |
| `stock` | integer | Tidak | `sometimes\|integer\|min:0` |
| `image` | file | Tidak | `sometimes\|nullable\|file\|image\|mimes:jpeg,png,jpg,webp,gif\|max:5120` |
| `is_active` | boolean | Tidak | `sometimes\|boolean` |

### Response (200 OK)
Sama dengan response create, berisi produk ter-update.

---

## 5. DELETE /admin/products/{id} (Hard Delete)

**Middleware:** `auth:sanctum`, `active`, `admin`  
**Scope:** Hanya produk milik toko admin yang login.

### Perilaku
Menghapus produk secara permanen. Produk yang sudah direferensikan oleh `ORDER_ITEMS` tidak dapat dihapus.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Produk berhasil dihapus"
}
```

### Error
- `404 Not Found`: Produk tidak ditemukan atau bukan milik toko admin yang login.
- `409 Conflict`: Produk tidak dapat dihapus karena sudah tercatat dalam riwayat pesanan.

---

## 6. GET /api/v1/categories (Daftar Kategori)

**Middleware:** Publik (tidak perlu auth)  
**Deskripsi:** Mengembalikan semua kategori secara global. **Tidak ada filtering berdasarkan `store_type` / TEFA.**

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Makanan Pokok & Instan", "created_at": "...", "updated_at": "..." },
    { "id": 2, "name": "Minuman", "created_at": "...", "updated_at": "..." },
    { "id": 3, "name": "Camilan & Roti", "created_at": "...", "updated_at": "..." },
    { "id": 4, "name": "Produk Segar & Beku", "created_at": "...", "updated_at": "..." },
    { "id": 5, "name": "Perawatan Diri", "created_at": "...", "updated_at": "..." },
    { "id": 6, "name": "Pembersih Rumah", "created_at": "...", "updated_at": "..." },
    { "id": 7, "name": "Alat Tulis", "created_at": "...", "updated_at": "..." }
  ]
}
```

### Catatan untuk Frontend
- Ambil daftar kategori dari endpoint ini sebelum render form Add Product.
- Tampilkan sebagai select/dropdown dengan `id` sebagai value dan `name` sebagai label.
- Tidak ada endpoint khusus "kategori TEFA". Semua kategori dikembalikan untuk semua toko.
- `category_id` wajib dipilih saat create produk, terlepas dari store_type (TEFA atau siswa).

---

## 7. File Upload (Gambar Produk)

| Atribut | Nilai |
|---------|-------|
| Field name | `image` |
| Format yang diizinkan | jpeg, png, jpg, webp, gif |
| Ukuran maksimal | 5 MB (5120 KB) |
| Proses backend | Dikonversi ke WebP sebelum disimpan |
| Respons `image_url` | Full asset URL (diawali dengan domain/storage) |
| Nullable | Ya (produk bisa tanpa gambar) |

---

## 8. Validasi Ringkasan (Create vs Update)

| Aturan | POST (Create) | PATCH (Update) |
|--------|---------------|----------------|
| `category_id` | `required` | `sometimes` |
| `name` | `required` | `sometimes` |
| `description` | `nullable` | `sometimes` |
| `price` | `required` | `sometimes` |
| `stock` | `required` | `sometimes` |
| `image` | `nullable` | `sometimes` |
| `is_active` | `sometimes` | `sometimes` |

---

## 9. Keterbatasan Penting (Jangan Tebak)

1. **`category_id` wajib untuk semua admin**, bukan hanya TEFA. Non-TEFA (siswa) juga harus memilih kategori saat create produk.
2. **Tidak ada filter kategori per store_type.** `GET /api/v1/categories` mengembalikan semua kategori global.
3. **`store_id` tidak dikirim dari frontend.** Backend otomatis mengaitkan produk ke toko milik admin yang login.
4. **Hard delete.** DELETE menghapus produk dari database secara permanen dan ditolak bila produk sudah ada di `ORDER_ITEMS`.
5. **Gambar dikonversi ke WebP** di backend. Frontend hanya perlu mengirim file asli via multipart.

---

## 10. Status Code

| Code | Artekst |
|------|---------|
| `200` | OK (GET, PATCH, DELETE) |
| `201` | Created (POST) |
| `401` | Unauthenticated (token tidak valid / kadaluarsa) |
| `403` | Forbidden (bukan role `admin`, atau bukan pemilik toko) |
| `404` | Not Found (produk tidak ditemukan atau bukan milik toko login) |
| `422` | Validation Error |

---

(End of file)