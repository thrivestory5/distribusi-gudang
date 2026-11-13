/**
 * Vercel Serverless Function Handler
 * Route: /api/*
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Gunakan /tmp di lingkungan serverless Vercel
const DB_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'warehouse.db');
let db;

function getDB() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA foreign_keys = ON;');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, description TEXT);
    CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, unit TEXT NOT NULL DEFAULT 'Pcs', stock INTEGER NOT NULL DEFAULT 0, min_stock INTEGER NOT NULL DEFAULT 5, location TEXT, unit_price REAL DEFAULT 0, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS vehicles (id INTEGER PRIMARY KEY AUTOINCREMENT, plate_number TEXT UNIQUE NOT NULL, vehicle_type TEXT NOT NULL, brand_model TEXT, driver_default TEXT, capacity TEXT, status TEXT DEFAULT 'Tersedia');
    CREATE TABLE IF NOT EXISTS officers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Driver', phone TEXT, status TEXT DEFAULT 'Aktif');
    CREATE TABLE IF NOT EXISTS destinations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT NOT NULL, city TEXT, contact_person TEXT, phone TEXT);
    CREATE TABLE IF NOT EXISTS distributions (id INTEGER PRIMARY KEY AUTOINCREMENT, dist_code TEXT UNIQUE NOT NULL, dist_date TEXT NOT NULL, destination_name TEXT NOT NULL, destination_address TEXT, destination_phone TEXT, vehicle_plate TEXT NOT NULL, officer_name TEXT NOT NULL, officer_phone TEXT, status TEXT NOT NULL DEFAULT 'Siap Kirim', notes TEXT, total_items INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS distribution_items (id INTEGER PRIMARY KEY AUTOINCREMENT, distribution_id INTEGER NOT NULL, item_id INTEGER NOT NULL, item_sku TEXT NOT NULL, item_name TEXT NOT NULL, unit TEXT NOT NULL, quantity INTEGER NOT NULL, notes TEXT, FOREIGN KEY (distribution_id) REFERENCES distributions(id) ON DELETE CASCADE, FOREIGN KEY (item_id) REFERENCES items(id));
    CREATE TABLE IF NOT EXISTS stock_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, item_id INTEGER NOT NULL, item_name TEXT NOT NULL, type TEXT NOT NULL, quantity INTEGER NOT NULL, previous_stock INTEGER NOT NULL, current_stock INTEGER NOT NULL, reference_code TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (item_id) REFERENCES items(id));
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM items').get().count;
  if (count === 0) {
    seedData();
  }
}

function seedData() {
  const catStmt = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
  catStmt.run('Elektronik & Kelistrikan', 'Komponen kelistrikan');
  catStmt.run('Bahan Bangunan & Perkakas', 'Material konstruksi');
  catStmt.run('Sembako & Konsumsi', 'Bahan pokok');
  catStmt.run('Perlengkapan Kantor & ATK', 'Alat kantor');
  catStmt.run('Kemasan & Logistik', 'Perlengkapan packing');

  const vehStmt = db.prepare('INSERT OR IGNORE INTO vehicles (plate_number, vehicle_type, brand_model, driver_default, capacity, status) VALUES (?, ?, ?, ?, ?, ?)');
  vehStmt.run('B 9482 SXZ', 'Truk Box CDD (Colt Diesel)', 'Mitsubishi Canter', 'Ahmad Fauzi', '4 Ton', 'Tersedia');
  vehStmt.run('B 8122 PQR', 'Blind Van', 'Daihatsu Gran Max', 'Rudi Hermawan', '1.2 Ton', 'Tersedia');

  const offStmt = db.prepare('INSERT OR IGNORE INTO officers (name, role, phone, status) VALUES (?, ?, ?, ?)');
  offStmt.run('Ahmad Fauzi', 'Driver', '0812-3456-7890', 'Aktif');
  offStmt.run('Rudi Hermawan', 'Driver', '0813-8877-6655', 'Aktif');

  const destStmt = db.prepare('INSERT OR IGNORE INTO destinations (name, address, city, contact_person, phone) VALUES (?, ?, ?, ?, ?)');
  destStmt.run('Gudang Cabang Bandung Barat', 'Jl. Soekarno Hatta No. 412, Buahbatu', 'Bandung', 'Pak Irawan', '0821-1234-5678');
  destStmt.run('Pusat Distribusi Tangerang', 'Kawasan Industri Jatake Blok C No. 5', 'Tangerang', 'Ibu Maya', '0815-9988-2233');

  const itemStmt = db.prepare('INSERT INTO items (sku, name, category, unit, stock, min_stock, location, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  itemStmt.run('BRG-ELK-001', 'Kabel Tembaga NYM 2x1.5mm (50m)', 'Elektronik & Kelistrikan', 'Roll', 85, 15, 'Rak A-01', 275000, 'SNI');
  itemStmt.run('BRG-BGN-001', 'Semen Tiga Roda 50kg', 'Bahan Bangunan & Perkakas', 'Sak', 240, 50, 'Pallet B-01', 68000, 'Tempat kering');
  itemStmt.run('BRG-SMB-001', 'Minyak Goreng Sawit 2 Liter', 'Sembako & Konsumsi', 'Karton', 160, 30, 'Rak C-01', 34000, 'Isi 6 pouch');
}

function parseBody(req) {
  if (req.body) return Promise.resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); }
    });
  });
}

module.exports = async (req, res) => {
  const database = getDB();
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  try {
    if (pathname.endsWith('/stats') && method === 'GET') {
      const totalItems = database.prepare('SELECT COUNT(*) as count, COALESCE(SUM(stock), 0) as total_stock, COALESCE(SUM(stock * unit_price), 0) as total_value FROM items').get();
      const lowStock = database.prepare('SELECT COUNT(*) as count FROM items WHERE stock <= min_stock AND stock > 0').get();
      const outOfStock = database.prepare('SELECT COUNT(*) as count FROM items WHERE stock = 0').get();
      const totalDist = database.prepare('SELECT COUNT(*) as count FROM distributions').get();
      const distStatus = database.prepare('SELECT status, COUNT(*) as count FROM distributions GROUP BY status').all();
      const categoryStats = database.prepare('SELECT category, COUNT(*) as item_count, SUM(stock) as total_stock FROM items GROUP BY category').all();
      const recentDist = database.prepare('SELECT * FROM distributions ORDER BY id DESC LIMIT 5').all();
      const recentLogs = database.prepare('SELECT * FROM stock_logs ORDER BY id DESC LIMIT 8').all();
      const vehiclesCount = database.prepare('SELECT COUNT(*) as count FROM vehicles').get();
      const officersCount = database.prepare('SELECT COUNT(*) as count FROM officers').get();

      return res.end(JSON.stringify({
        success: true,
        data: {
          items_count: totalItems.count,
          physical_stock: totalItems.total_stock,
          inventory_value: totalItems.total_value,
          low_stock_count: lowStock.count,
          out_of_stock_count: outOfStock.count,
          distribution_total: totalDist.count,
          distribution_status: distStatus,
          category_stats: categoryStats,
          recent_distributions: recentDist,
          recent_logs: recentLogs,
          vehicles_count: vehiclesCount.count,
          officers_count: officersCount.count
        }
      }));
    }

    if (pathname.endsWith('/items') && method === 'GET') {
      const search = parsedUrl.searchParams.get('q') || '';
      let query = 'SELECT * FROM items WHERE 1=1';
      const params = [];
      if (search) {
        query += ' AND (sku LIKE ? OR name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      query += ' ORDER BY id DESC';
      const items = database.prepare(query).all(...params);
      return res.end(JSON.stringify({ success: true, data: items }));
    }

    if (pathname.endsWith('/items') && method === 'POST') {
      const body = await parseBody(req);
      const sku = body.sku || `BRG-${Date.now().toString().slice(-4)}`;
      database.prepare('INSERT INTO items (sku, name, category, unit, stock, min_stock, location, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(sku, body.name, body.category || 'Umum', body.unit || 'Pcs', parseInt(body.stock)||0, parseInt(body.min_stock)||5, body.location||'', parseFloat(body.unit_price)||0, body.notes||'');
      return res.end(JSON.stringify({ success: true, message: 'Barang berhasil disimpan' }));
    }

    if (pathname.endsWith('/distributions') && method === 'GET') {
      const dists = database.prepare('SELECT * FROM distributions ORDER BY id DESC').all();
      return res.end(JSON.stringify({ success: true, data: dists }));
    }

    if (pathname.endsWith('/distributions') && method === 'POST') {
      const body = await parseBody(req);
      const code = `DST-${Date.now().toString().slice(-6)}`;
      const result = database.prepare('INSERT INTO distributions (dist_code, dist_date, destination_name, destination_address, destination_phone, vehicle_plate, officer_name, status, notes, total_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(code, body.dist_date || new Date().toISOString().replace('T', ' ').substring(0, 16), body.destination_name, body.destination_address||'', body.destination_phone||'', body.vehicle_plate, body.officer_name, body.status||'Siap Kirim', body.notes||'', (body.items||[]).length);
      
      const distId = Number(result.lastInsertRowid);
      if (body.items) {
        for (const itm of body.items) {
          database.prepare('INSERT INTO distribution_items (distribution_id, item_id, item_sku, item_name, unit, quantity) VALUES (?, ?, ?, ?, ?, ?)')
            .run(distId, itm.item_id, 'ITEM', 'Barang', 'Pcs', itm.quantity);
          database.prepare('UPDATE items SET stock = stock - ? WHERE id = ?').run(itm.quantity, itm.item_id);
        }
      }
      return res.end(JSON.stringify({ success: true, message: 'Distribusi berhasil dibuat', data: { id: distId, dist_code: code } }));
    }

    if (pathname.endsWith('/vehicles') && method === 'GET') {
      const veh = database.prepare('SELECT * FROM vehicles ORDER BY id DESC').all();
      return res.end(JSON.stringify({ success: true, data: veh }));
    }

    if (pathname.endsWith('/officers') && method === 'GET') {
      const off = database.prepare('SELECT * FROM officers ORDER BY id DESC').all();
      return res.end(JSON.stringify({ success: true, data: off }));
    }

    if (pathname.endsWith('/destinations') && method === 'GET') {
      const dest = database.prepare('SELECT * FROM destinations ORDER BY id DESC').all();
      return res.end(JSON.stringify({ success: true, data: dest }));
    }

    if (pathname.endsWith('/categories') && method === 'GET') {
      const cat = database.prepare('SELECT * FROM categories ORDER BY name ASC').all();
      return res.end(JSON.stringify({ success: true, data: cat }));
    }

    return res.end(JSON.stringify({ success: true, message: 'API Vercel Ready' }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, message: err.message }));
  }
};
