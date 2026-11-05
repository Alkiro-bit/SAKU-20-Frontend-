# Pembagian & Delegasi Tugas — SAKU 20

Dokumen kerja internal untuk Uji Sertifikasi Kemahiran (USK) Skema Pengembang Web Pratama.
Versi: 2.1 — Refactor Auth-Only (Tanpa Guest Checkout).

---

## 1. Prinsip Utama (Perubahan Terkini)
- **Tanpa Guest Token**: Tidak ada cart, checkout, atau polling status pesanan untuk tamu.
- **Akses Tamu (Guest)**: Hanya membaca daftar toko (`/stores`), kategori (`/categories`), dan katalog ringkas toko (`/stores/{id}/products`).
- **Wajib Login**: Membuka card produk (`/products/{id}`), cart, checkout, tracking pesanan, dan dashboard toko/superadmin.

---

## 2. Matriks Pembagian Tanggung Jawab

| Komponen | Penanggung Jawab | Deskripsi Singkat |
|---|---|---|
| **Backend API Core** | Backend Dev | Validasi data, otorisasi Sanctum, row locking stok, hitung komisi, migrasi database. |
| **Frontend UI/UX** | Frontend Dev | Tampilan responsive, state management Pinia, route guard autentikasi, polling order status. |
| **Database & Seeder** | Fullstack / Backend | Skema MySQL, seeder dummy data toko & NIS valid untuk demo presentasi USK. |

---

## 3. Rincian Delegasi Tugas Backend

### Task BE-1: Autentikasi & Otorisasi (Selesai)
- [x] Register pembeli via pencocokan NIS/NIP pada tabel `VALID_NIS`.
- [x] Login multi-role (pembeli, admin, superadmin) dengan token Sanctum.
- [x] Middleware `active`, `admin`, `superadmin`.
- [x] Endpoint `POST /auth/logout` dan `GET /auth/me`.

### Task BE-2: Katalog & Browsing Publik (Selesai)
- [x] `GET /stores` (filter tipe `siswa` / `tefa`).
- [x] `GET /stores/{id}` (cek status `is_open`).
- [x] `GET /categories` (kategori dinamis).
- [x] `GET /stores/{id}/products` (paginasi & filter kategori).
- [x] `GET /products/{id}` (diproteksi `auth:sanctum` agar tamu tidak bisa buka detail).

### Task BE-3: Keranjang & Checkout Transaksional (Selesai)
- [x] Proteksi penuh `auth:sanctum` + `active`.
- [x] Cart multi-toko (1 user bisa punya cart per toko).
- [x] Checkout dalam 1 `DB::transaction`:
  - `lockForUpdate` pada baris produk & cek stok.
  - Generate kode pickup unik & nomor antrian urut per hari per toko.
  - Potong stok produk & hapus cart.
  - Catat komisi BMS Rp1.000 / item.
  - Tolak double-submit (`409 Conflict`).

### Task BE-4: Modul Admin Toko / Penjual (Siap Uji)
- [ ] Toggle buka/tutup toko (`PATCH /admin/store`).
- [ ] CRUD produk toko sendiri (`/admin/products`).
- [ ] Upload gambar produk auto-convert WebP (`ImageUploadService`).
- [ ] Update status pesanan (`diproses` → `siap_diambil` → `selesai` / `dibatalkan`).
- [ ] Restore stok otomatis saat pesanan dibatalkan.
- [ ] Laporan keuangan toko (`gross`, `commission`, `net`).

### Task BE-5: Modul Superadmin (Siap Uji)
- [ ] CRUD toko (`siswa` / `tefa`) & assign pemilik (admin).
- [ ] Manajemen user (assign role & aktif/nonaktifkan status akun).
- [ ] CRUD kategori produk.
- [ ] Input master data NIS valid (single / bulk).
- [ ] Laporan keuangan agregat seluruh kantin.

---

## 4. Rincian Delegasi Tugas Frontend (Vue 3 + Pinia)

### Task FE-1: Setup Dasar & Autentikasi
- [ ] Axios interceptor: auto-attach token `Authorization: Bearer <token>`.
- [ ] Interceptor penanganan `401 Unauthorized` → redirect otomatis ke `/login`.
- [ ] Auth Store (`stores/auth.js`): simpan token dan data user di `localStorage`.
- [ ] Form Login (NIS/NIP & Password) dengan pesan error sesuai API.
- [ ] Form Register Pembeli dengan validasi konfirmasi password.

### Task FE-2: Navigasi & Route Guard
- [ ] Route Guard global:
  - Halaman Publik: Home, Shop, TEFA.
  - Halaman Protected Pembeli: Product Detail, Cart, Checkout, Order Status, History.
  - Halaman Protected Admin: Dashboard Toko, Produk Toko, Pesanan Toko, Laporan Keuangan Toko.
  - Halaman Protected Superadmin: Dashboard Superadmin, Kelola Toko, User, Kategori, NIS.
- [ ] Proteksi Card Produk: jika tamu klik card produk di halaman Shop/TEFA → arahkan ke `/login`.

### Task FE-3: Alur Transaksi Pembeli
- [ ] Halaman Katalog Toko: card produk menampilkan foto, harga, stok, badge toko.
- [ ] Halaman Cart: daftar item per toko, tombol atur kuantitas, tombol hapus item.
- [ ] Halaman Checkout: ringkasan belanja, biaya komisi BMS, modal simulasi QRIS (*Simulate Paid*).
- [ ] Halaman Status Pesanan:
  - Tampilan nomor antrian & kode pickup besar.
  - Polling berkala `GET /orders/{id}/status` tiap 3-5 detik.
  - Berhenti polling saat status `selesai` atau `dibatalkan`.
- [ ] Halaman Riwayat Pesanan: list order yang pernah dibuat pembeli.

### Task FE-4: Dashboard Admin & Superadmin
- [ ] Admin: tombol switch switch status toko (Buka / Tutup).
- [ ] Admin: form modal tambah/edit produk + preview gambar.
- [ ] Admin: board antrian pesanan dengan tombol cepat ubah status (`Siap Diambil`, `Selesai`, `Batalkan`).
- [ ] Superadmin: data table toko, form assign admin toko, kelola NIS.

---

## 5. Checklist Validasi Demo USK

1. [ ] **Skenario Tamu**: Masuk web → lihat toko → klik produk → dipaksa login.
2. [ ] **Skenario Pembeli**: Register NIS terdaftar → login → masukkan produk ke cart → checkout simulasi QRIS → dapat nomor antrian & kode pickup.
3. [ ] **Skenario Penjual (Admin)**: Login admin → ubah status pesanan jadi `siap_diambil` → ubah jadi `selesai` → cek laporan keuangan bertambah.
4. [ ] **Skenario Stok Habis**: Checkout barang melebihi stok menghasilkan pesan error jelas (`409`).