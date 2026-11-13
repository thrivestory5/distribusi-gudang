/**
 * DATABASE INITIALIZATION & SCHEMA
 * Menggunakan SQLite bawaan Node.js 22+ (node:sqlite)
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'warehouse.db');
const db = new DatabaseSync(DB_PATH);

// Aktifkan foreign key & WAL mode untuk performa optimal
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initDatabase() {
  db.exec(`
    -- Tabel Kategori
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    -- Tabel Master Barang / Stok
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Pcs',
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 5,
      location TEXT,
      unit_price REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabel Master Kendaraan
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT UNIQUE NOT NULL,
      vehicle_type TEXT NOT NULL,
      brand_model TEXT,
      driver_default TEXT,
      capacity TEXT,
      status TEXT DEFAULT 'Tersedia' -- Tersedia, Beroperasi, Perbaikan
    );

    -- Tabel Master Petugas / Supir / Tim Distribusi
    CREATE TABLE IF NOT EXISTS officers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Driver', -- Driver, Kurir, Petugas Gudang, Koordinator
      phone TEXT,
      status TEXT DEFAULT 'Aktif' -- Aktif, Libur, Bertugas
    );

    -- Tabel Master Tujuan / Klien / Cabang
    CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT,
      contact_person TEXT,
      phone TEXT
    );

    -- Tabel Transaksi Distribusi
    CREATE TABLE IF NOT EXISTS distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dist_code TEXT UNIQUE NOT NULL,
      dist_date TEXT NOT NULL,
      destination_name TEXT NOT NULL,
      destination_address TEXT,
      destination_phone TEXT,
      vehicle_plate TEXT NOT NULL,
      officer_name TEXT NOT NULL,
      officer_phone TEXT,
      status TEXT NOT NULL DEFAULT 'Siap Kirim', -- Siap Kirim, Dalam Pengiriman, Selesai, Dibatalkan
      notes TEXT,
      total_items INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabel Item Distribusi (Detail Barang yang Didistribusikan)
    CREATE TABLE IF NOT EXISTS distribution_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distribution_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      item_sku TEXT NOT NULL,
      item_name TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY (distribution_id) REFERENCES distributions(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    -- Tabel Log Mutasi Stok (Stok Masuk, Stok Keluar, Penyesuaian)
    CREATE TABLE IF NOT EXISTS stock_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      type TEXT NOT NULL, -- IN (Masuk), OUT (Distribusi), ADJUST (Koreksi)
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      current_stock INTEGER NOT NULL,
      reference_code TEXT, -- Misal No. Surat Jalan / No PO
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
  `);

  // Masukkan data awal (seed) jika masih kosong
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM items');
  const count = countStmt.get().count;

  if (count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  console.log('Menyiapkan sample data awal untuk gudang...');

  // Categories
  const categories = [
    ['Elektronik & Kelistrikan', 'Komponen, kabel, perangkat elektronik'],
    ['Bahan Bangunan & Perkakas', 'Semen, cat, baut, peralatan tukang'],
    ['Sembako & Konsumsi', 'Beras, minyak, gula, makanan kering'],
    ['Perlengkapan Kantor & ATK', 'Kertas, map, printer, alat tulis'],
    ['Kemasan & Logistik', 'Kardus packing, bubble wrap, lakban']
  ];
  const catStmt = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
  for (const c of categories) catStmt.run(...c);

  // Vehicles
  const vehicles = [
    ['B 9482 SXZ', 'Truk Box CDD (Colt Diesel)', 'Mitsubishi Canter', 'Ahmad Fauzi', '4 Ton', 'Tersedia'],
    ['B 8122 PQR', 'Blind Van', 'Daihatsu Gran Max', 'Rudi Hermawan', '1.2 Ton', 'Tersedia'],
    ['B 7301 KLM', 'Pickup Bak Terbuka', 'Suzuki Carry', 'Bambang Supriyanto', '1.5 Ton', 'Tersedia'],
    ['B 9920 TUV', 'Truk Engkel CDE', 'Isuzu Elf', 'Dedi Kurniawan', '2.5 Ton', 'Tersedia']
  ];
  const vehStmt = db.prepare('INSERT OR IGNORE INTO vehicles (plate_number, vehicle_type, brand_model, driver_default, capacity, status) VALUES (?, ?, ?, ?, ?, ?)');
  for (const v of vehicles) vehStmt.run(...v);

  // Officers
  const officers = [
    ['Ahmad Fauzi', 'Driver', '0812-3456-7890', 'Aktif'],
    ['Rudi Hermawan', 'Driver', '0813-8877-6655', 'Aktif'],
    ['Bambang Supriyanto', 'Driver', '0857-1122-3344', 'Aktif'],
    ['Dedi Kurniawan', 'Driver', '0878-9900-1122', 'Aktif'],
    ['Wahyu Prasetyo', 'Petugas Gudang', '0819-4455-6677', 'Aktif'],
    ['Hendra Setiawan', 'Koordinator Logistik', '0812-9988-7766', 'Aktif']
  ];
  const offStmt = db.prepare('INSERT OR IGNORE INTO officers (name, role, phone, status) VALUES (?, ?, ?, ?)');
  for (const o of officers) offStmt.run(...o);

  // Destinations
  const destinations = [
    ['Gudang Cabang Bandung Barat', 'Jl. Soekarno Hatta No. 412, Buahbatu', 'Bandung', 'Pak Irawan', '0821-1234-5678'],
    ['Pusat Distribusi Tangerang', 'Kawasan Industri Jatake Blok C No. 5', 'Tangerang', 'Ibu Maya', '0815-9988-2233'],
    ['Depo Logistik Bekasi', 'Jl. Sultan Agung No. 88, Medan Satria', 'Bekasi', 'Pak Hendro', '0813-4433-2211'],
    ['Toko Mitra Sejahtera Cikarang', 'Jl. Cibarusah Raya KM 12', 'Cikarang', 'Ko Acung', '0856-7788-9900'],
    ['Outlet Retail Mall Kelapa Gading', 'Boulevard Kelapa Gading Blok M', 'Jakarta Utara', 'Sdr. Kevin', '0818-0808-1212']
  ];
  const destStmt = db.prepare('INSERT OR IGNORE INTO destinations (name, address, city, contact_person, phone) VALUES (?, ?, ?, ?, ?)');
  for (const d of destinations) destStmt.run(...d);

  // Items
  const items = [
    ['BRG-ELK-001', 'Kabel Tembaga NYM 2x1.5mm (50m)', 'Elektronik & Kelistrikan', 'Roll', 85, 15, 'Rak A-01', 275000, 'Standar SNI'],
    ['BRG-ELK-002', 'Lampu LED Industrial 40 Watt', 'Elektronik & Kelistrikan', 'Pcs', 120, 20, 'Rak A-02', 45000, 'Garansi 1 tahun'],
    ['BRG-BGN-001', 'Semen Tiga Roda 50kg', 'Bahan Bangunan & Perkakas', 'Sak', 240, 50, 'Pallet B-01', 68000, 'Simpan di tempat kering'],
    ['BRG-BGN-002', 'Cat Tembok Putih Dulux 20L', 'Bahan Bangunan & Perkakas', 'Pail', 35, 10, 'Pallet B-03', 620000, 'Kemasan drum pail'],
    ['BRG-SMB-001', 'Minyak Goreng Sawit 2 Liter', 'Sembako & Konsumsi', 'Karton', 160, 30, 'Rak C-01', 34000, 'Isi 6 pouch per karton'],
    ['BRG-SMB-002', 'Beras Premium Ramos 10kg', 'Sembako & Konsumsi', 'Karung', 95, 25, 'Pallet C-02', 145000, 'Beras pulen'],
    ['BRG-SMB-003', 'Gula Pasir Kristal Putih 1kg', 'Sembako & Konsumsi', 'Dus', 110, 20, 'Rak C-03', 320000, 'Isi 24 pack per dus'],
    ['BRG-ATK-001', 'Kertas HVS A4 80gr PaperOne', 'Perlengkapan Kantor & ATK', 'Rim', 180, 25, 'Rak D-01', 48500, 'Box isi 5 rim'],
    ['BRG-LOG-001', 'Kardus Packing Double Wall 40x30x30', 'Kemasan & Logistik', 'Pcs', 450, 100, 'Rak E-01', 8500, 'Tebal 6mm'],
    ['BRG-LOG-002', 'Lakban Coklat Daimaru 48mm x 90y', 'Kemasan & Logistik', 'Roll', 310, 50, 'Rak E-02', 12500, 'Daya rekat kuat']
  ];

  const itemStmt = db.prepare('INSERT INTO items (sku, name, category, unit, stock, min_stock, location, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const logStmt = db.prepare('INSERT INTO stock_logs (item_id, item_name, type, quantity, previous_stock, current_stock, reference_code, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  items.forEach((item, index) => {
    itemStmt.run(...item);
    const itemId = index + 1;
    logStmt.run(itemId, item[1], 'IN', item[4], 0, item[4], 'INIT-STOCK', 'Saldo awal stok gudang');
  });

  // Sample Distribution 1: Selesai
  const dist1 = db.prepare(`
    INSERT INTO distributions (dist_code, dist_date, destination_name, destination_address, destination_phone, vehicle_plate, officer_name, officer_phone, status, notes, total_items)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'DST-202611-0001',
    '2026-11-10 09:30',
    'Gudang Cabang Bandung Barat',
    'Jl. Soekarno Hatta No. 412, Buahbatu, Bandung',
    '0821-1234-5678',
    'B 9482 SXZ',
    'Ahmad Fauzi',
    '0812-3456-7890',
    'Selesai',
    'Pengiriman rutin logistik cabang Bandung, barang diterima dengan baik.',
    2
  );

  const d1Id = Number(dist1.lastInsertRowid);
  db.prepare(`
    INSERT INTO distribution_items (distribution_id, item_id, item_sku, item_name, unit, quantity, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(d1Id, 1, 'BRG-ELK-001', 'Kabel Tembaga NYM 2x1.5mm (50m)', 'Roll', 10, 'Dus 1-2');
  db.prepare(`
    INSERT INTO distribution_items (distribution_id, item_id, item_sku, item_name, unit, quantity, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(d1Id, 3, 'BRG-BGN-001', 'Semen Tiga Roda 50kg', 'Sak', 30, 'Muat di bak depan');

  // Sample Distribution 2: Dalam Pengiriman
  const dist2 = db.prepare(`
    INSERT INTO distributions (dist_code, dist_date, destination_name, destination_address, destination_phone, vehicle_plate, officer_name, officer_phone, status, notes, total_items)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'DST-202611-0002',
    '2026-11-12 14:15',
    'Pusat Distribusi Tangerang',
    'Kawasan Industri Jatake Blok C No. 5, Tangerang',
    '0815-9988-2233',
    'B 8122 PQR',
    'Rudi Hermawan',
    '0813-8877-6655',
    'Dalam Pengiriman',
    'Driver telah berangkat pukul 14:30 WIB estimasi tiba sore.',
    2
  );

  const d2Id = Number(dist2.lastInsertRowid);
  db.prepare(`
    INSERT INTO distribution_items (distribution_id, item_id, item_sku, item_name, unit, quantity, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(d2Id, 5, 'BRG-SMB-001', 'Minyak Goreng Sawit 2 Liter', 'Karton', 25, 'Fragile - jangan ditumpuk lebih dari 4');
  db.prepare(`
    INSERT INTO distribution_items (distribution_id, item_id, item_sku, item_name, unit, quantity, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(d2Id, 8, 'BRG-ATK-001', 'Kertas HVS A4 80gr PaperOne', 'Rim', 20, 'Kebutuhan kantor cabang');

  console.log('Sample data berhasil diinisialisasi.');
}

module.exports = {
  db,
  initDatabase
};
