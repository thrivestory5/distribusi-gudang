# 📦 Sistem Manajemen Stok Gudang & Distribusi Logistik (WMS)

Aplikasi web modern, cepat, dan mandiri (zero external dependencies) yang dirancang khusus untuk operasional gudang dan distribusi logistik. Dilengkapi dengan pengelolaan stok barang fisik, pencatatan distribusi pengiriman dengan tujuan lengkap, armada kendaraan (nomor polisi), petugas pengirim (driver/kurir), serta cetak dokumen Surat Jalan resmi.

---

## 🌟 Fitur Utama Aplikasi

### 1. 📊 Dashboard Gudang & Visual Analytics
- **Kartu Statistik Utama**: Total jenis barang, total unit stok fisik, total transaksi distribusi, peringatan stok kritis/habis, serta jumlah armada & supir.
- **Grafik Komposisi Stok**: Visualisasi stok barang per kategori secara real-time (*doughnut chart*).
- **Grafik Status Distribusi**: Status pengiriman aktif, siap kirim, selesai, dan dibatalkan (*bar chart*).
- **Tabel Peringatan Stok Kritis**: Notifikasi otomatis untuk barang yang sudah mencapai atau di bawah batas minimum (*Safety Stock*).
- **Tabel Pengiriman Terbaru**: Memantau langsung pengiriman terkini beserta status dan tombol akses cepat Surat Jalan.

### 2. 📦 Data Stok Barang & Inventori
- **Katalog Barang**: Kode SKU unik (otomatis/manual), nama barang, kategori, satuan (Pcs, Box, Sak, Roll, Karton, Kg), lokasi rak gudang, harga satuan, dan status ketersediaan.
- **Status Stok Otomatis**:
  - 🟢 **Aman**: Stok di atas batas minimum.
  - 🟡 **Menipis**: Stok $\le$ batas minimum yang ditentukan.
  - 🔴 **Habis**: Stok bernilai 0.
- **Stok Masuk (Restock)**: Fitur penerimaan barang masuk dari supplier atau produksi dengan pencatatan nomor PO/referensi.
- **Stok Opname / Penyesuaian Fisik**: Fitur penghitungan stok riil berkala dengan kalkulasi selisih otomatis (+/-) dan pencatatan alasan audit.
- **Ekspor Data**: Download seluruh data stok barang langsung ke format CSV / Excel.

### 3. 🚚 Data Distribusi & Pengiriman Barang
- **Pencatatan Surat Jalan**: Penomoran otomatis format standar logistik (contoh: `DST-202611-0001`).
- **Tujuan Pengiriman Lengkap**: Nama toko/cabang/customer, alamat lengkap tujuan, kota, serta kontak penerima di lokasi.
- **Armada & Nomer Kendaraan**: Pemilihan armada kendaraan terdaftar (nomor polisi / plat kendaraan) serta tipe kendaraan (Pickup, Blind Van, Truk CDD, CDE, Wingbox).
- **Petugas Pengirim**: Petugas driver/supir atau kurir yang bertanggung jawab mendistribusikan barang beserta nomor kontak aktif.
- **Multi-Item Per Pengiriman**: Mendukung pengiriman banyak jenis barang sekaligus dalam satu transaksi distribusi.
- **Validasi Stok Real-Time**: Sistem secara otomatis memvalidasi ketersediaan stok fisik di gudang. Transaksi ditolak jika jumlah pengiriman melebihi stok yang ada.
- **Pemotongan Stok Otomatis**: Saat transaksi distribusi disimpan, sistem langsung memotong stok barang terkait di database secara atomik.
- **Manajemen Status Pengiriman**:
  - `Siap Kirim` $\rightarrow$ `Dalam Pengiriman` $\rightarrow$ `Selesai`
  - Jika transaksi `Dibatalkan` atau dihapus, stok barang akan otomatis dikembalikan ke gudang secara aman.

### 4. 📄 Dokumen Cetak Surat Jalan Resmi (Delivery Order)
- Format cetak siap pakai (*Print-Ready* & *Save as PDF*) yang terstandarisasi untuk kebutuhan jalan supir dan serah terima:
  - Kop Surat Gudang Distribusi Pusat
  - Nomor Surat Jalan, Tanggal, Jam Pengiriman
  - Nomor Kendaraan (Plat Polisi) & Nama Supir / Petugas Pengirim
  - Nama Penerima, Alamat Lengkap & Nomor Kontak Tujuan
  - Tabel Rincian Barang (No, Kode/SKU, Nama Barang, Jumlah, Satuan, Keterangan)
  - Kolom Tanda Tangan 3 Pihak: **Petugas Gudang (Pengirim)**, **Pengemudi/Supir**, dan **Penerima Barang**.

### 5. 🚛 Master Armada Kendaraan & Petugas Pengirim
- **Daftar Kendaraan**: Plat nomor polisi, tipe kendaraan, merek/model, kapasitas angkut, dan supir default.
- **Daftar Petugas**: Nama lengkap, peran (Driver, Kurir, Petugas Gudang, Koordinator Logistik), nomor telepon/WhatsApp, dan status aktif.
- **Daftar Lokasi Tujuan**: Master toko/cabang/klien langganan untuk pengisian formulir distribusi dalam 1 klik.

### 6. 📝 Riwayat Mutasi Stok (Audit Trail)
- Log lengkap dan transparan dari setiap pergerakan barang di gudang:
  - Jenis Mutasi: `+ Masuk` (Restock / Saldo Awal), `- Keluar` (Distribusi), dan `Penyesuaian` (Stok Opname).
  - Waktu pencatatan, kuantitas, stok awal, stok akhir, dan nomor referensi transaksi.

---

## 🚀 Cara Menjalankan Aplikasi

### Cara 1: Menggunakan File Batch (Paling Mudah)
Cukup klik ganda (**double click**) file `start.bat` di folder project ini:
```
d:\hoza\website\gudang distribusi\start.bat
```
Browser akan otomatis terbuka menampilkan aplikasi di alamat `http://localhost:3000`.

### Cara 2: Menjalankan Lewat Command Prompt / PowerShell
Buka terminal di folder project ini, lalu jalankan:
```bash
node server.js
```
*(Atau menggunakan `agy-node server.js` jika dijalankan di environment Antigravity)*.

Buka browser favorit Anda dan akses:
👉 **http://localhost:3000**

---

## 📁 Struktur Direktori Project

```
d:\hoza\website\gudang distribusi\
│
├── server.js              # Server HTTP & REST API Backend (Node.js murni)
├── db.js                  # Modul SQLite database & skema tabel
├── package.json           # Konfigurasi project
├── start.bat              # Script starter 1-klik untuk Windows
├── test_api.js            # Automated test suite untuk backend & logika stok
├── run_tests.js           # Test runner otomatis
├── README.md              # Dokumentasi lengkap sistem
│
├── data\
│   └── warehouse.db       # Database SQLite persisten
│
└── public\
    ├── index.html         # Tampilan antarmuka Dashboard & SPA
    ├── styles.css         # Styling modern, responsif, dan layout cetak
    └── app.js             # Logika interaktif frontend & controller API
```

---

## 💡 Teknologi yang Digunakan
- **Backend**: Node.js Native HTTP Server & Native SQLite (`node:sqlite`) — *Sangat ringan, instan dijalankan tanpa perlu `npm install` ratusan modul eksternal*.
- **Database**: SQLite dengan *Foreign Keys* & mode transaksi atomic (WAL enabled).
- **Frontend**: Vanilla JavaScript (ES6+), Modern Semantic HTML5, CSS3 Variables & Print Media Query, Chart.js CDN.
