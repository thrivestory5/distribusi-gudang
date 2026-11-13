/**
 * WAREHOUSE & DISTRIBUTION MANAGEMENT SYSTEM (SISTEM GUDANG & DISTRIBUSI)
 * Pure Node.js Server (Zero External Dependencies)
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { db, initDatabase } = require('./db');

// Inisialisasi Database
initDatabase();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types untuk static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// Helper: Response JSON
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Helper: Parse JSON Body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // limit 5MB
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper: Format tanggal YYYY-MM-DD HH:mm
function getCurrentDateTime() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const YYYY = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const DD = pad(now.getDate());
  const HH = pad(now.getHours());
  const mm = pad(now.getMinutes());
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}`;
}

// Helper: Generate No. Distribusi
function generateDistCode() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `DST-${yearMonth}-`;
  
  const stmt = db.prepare(`SELECT dist_code FROM distributions WHERE dist_code LIKE ? ORDER BY id DESC LIMIT 1`);
  const last = stmt.get(`${prefix}%`);
  
  if (!last || !last.dist_code) {
    return `${prefix}0001`;
  }
  
  const parts = last.dist_code.split('-');
  const seq = parseInt(parts[2], 10) || 0;
  return `${prefix}${String(seq + 1).padStart(4, '0')}`;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // ==========================================
    // API ROUTES
    // ==========================================
    if (pathname.startsWith('/api/')) {

      // 1. STATS / DASHBOARD
      if (pathname === '/api/stats' && method === 'GET') {
        const totalItems = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(stock), 0) as total_stock, COALESCE(SUM(stock * unit_price), 0) as total_value FROM items').get();
        const lowStock = db.prepare('SELECT COUNT(*) as count FROM items WHERE stock <= min_stock AND stock > 0').get();
        const outOfStock = db.prepare('SELECT COUNT(*) as count FROM items WHERE stock = 0').get();
        const totalDist = db.prepare('SELECT COUNT(*) as count FROM distributions').get();
        const distStatus = db.prepare('SELECT status, COUNT(*) as count FROM distributions GROUP BY status').all();
        const categoryStats = db.prepare('SELECT category, COUNT(*) as item_count, SUM(stock) as total_stock FROM items GROUP BY category').all();
        const recentDist = db.prepare('SELECT * FROM distributions ORDER BY id DESC LIMIT 5').all();
        const recentLogs = db.prepare('SELECT * FROM stock_logs ORDER BY id DESC LIMIT 8').all();
        const vehiclesCount = db.prepare('SELECT COUNT(*) as count FROM vehicles').get();
        const officersCount = db.prepare('SELECT COUNT(*) as count FROM officers').get();

        return sendJSON(res, 200, {
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
        });
      }

      // 2. MASTER BARANG (ITEMS)
      if (pathname === '/api/items' && method === 'GET') {
        const search = parsedUrl.searchParams.get('q') || '';
        const category = parsedUrl.searchParams.get('category') || '';
        const status = parsedUrl.searchParams.get('status') || '';

        let query = 'SELECT * FROM items WHERE 1=1';
        const params = [];

        if (search) {
          query += ' AND (sku LIKE ? OR name LIKE ? OR location LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (category) {
          query += ' AND category = ?';
          params.push(category);
        }

        if (status === 'habis') {
          query += ' AND stock = 0';
        } else if (status === 'menipis') {
          query += ' AND stock <= min_stock AND stock > 0';
        } else if (status === 'aman') {
          query += ' AND stock > min_stock';
        }

        query += ' ORDER BY id DESC';

        const items = db.prepare(query).all(...params);
        return sendJSON(res, 200, { success: true, data: items });
      }

      // Tambah Barang Baru
      if (pathname === '/api/items' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.category) {
          return sendJSON(res, 400, { success: false, message: 'Nama barang dan kategori wajib diisi!' });
        }

        // Generate SKU jika kosong
        let sku = body.sku ? body.sku.trim().toUpperCase() : '';
        if (!sku) {
          const catPrefix = body.category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || 'BRG';
          const countRow = db.prepare('SELECT COUNT(*) as count FROM items').get();
          sku = `BRG-${catPrefix}-${String(countRow.count + 1).padStart(3, '0')}`;
        }

        const existing = db.prepare('SELECT id FROM items WHERE sku = ?').get(sku);
        if (existing) {
          return sendJSON(res, 400, { success: false, message: `SKU '${sku}' sudah digunakan oleh barang lain!` });
        }

        const stock = parseInt(body.stock, 10) || 0;
        const minStock = parseInt(body.min_stock, 10) || 5;
        const unitPrice = parseFloat(body.unit_price) || 0;

        const insert = db.prepare(`
          INSERT INTO items (sku, name, category, unit, stock, min_stock, location, unit_price, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          sku,
          body.name.trim(),
          body.category,
          body.unit || 'Pcs',
          stock,
          minStock,
          body.location || 'Gudang Utama',
          unitPrice,
          body.notes || ''
        );

        const newItemId = Number(insert.lastInsertRowid);

        // Catat di log jika ada stok awal
        if (stock > 0) {
          db.prepare(`
            INSERT INTO stock_logs (item_id, item_name, type, quantity, previous_stock, current_stock, reference_code, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(newItemId, body.name.trim(), 'IN', stock, 0, stock, 'INIT-NEW', 'Saldo awal penambahan barang baru');
        }

        return sendJSON(res, 201, {
          success: true,
          message: 'Barang berhasil ditambahkan',
          data: { id: newItemId, sku }
        });
      }

      // Update Detail Barang
      if (pathname.match(/^\/api\/items\/(\d+)$/) && method === 'PUT') {
        const id = parseInt(pathname.split('/')[3], 10);
        const body = await parseBody(req);

        const current = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        if (!current) {
          return sendJSON(res, 404, { success: false, message: 'Barang tidak ditemukan' });
        }

        const sku = body.sku ? body.sku.trim().toUpperCase() : current.sku;
        // Check uniqueness if sku changed
        if (sku !== current.sku) {
          const duplicate = db.prepare('SELECT id FROM items WHERE sku = ? AND id != ?').get(sku, id);
          if (duplicate) {
            return sendJSON(res, 400, { success: false, message: `SKU '${sku}' sudah digunakan barang lain!` });
          }
        }

        db.prepare(`
          UPDATE items 
          SET sku = ?, name = ?, category = ?, unit = ?, min_stock = ?, location = ?, unit_price = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          sku,
          body.name ? body.name.trim() : current.name,
          body.category || current.category,
          body.unit || current.unit,
          parseInt(body.min_stock, 10) || current.min_stock,
          body.location || current.location,
          parseFloat(body.unit_price) || current.unit_price,
          body.notes !== undefined ? body.notes : current.notes,
          id
        );

        return sendJSON(res, 200, { success: true, message: 'Data barang berhasil diperbarui' });
      }

      // Hapus Barang
      if (pathname.match(/^\/api\/items\/(\d+)$/) && method === 'DELETE') {
        const id = parseInt(pathname.split('/')[3], 10);
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        if (!item) {
          return sendJSON(res, 404, { success: false, message: 'Barang tidak ditemukan' });
        }

        // Cek apakah pernah ada dalam distribusi
        const usedInDist = db.prepare('SELECT COUNT(*) as count FROM distribution_items WHERE item_id = ?').get(id);
        if (usedInDist.count > 0) {
          return sendJSON(res, 400, {
            success: false,
            message: `Barang '${item.name}' tidak dapat dihapus karena sudah memiliki riwayat distribusi (${usedInDist.count} transaksi). Anda dapat mengosongkan stok atau mengganti status.`
          });
        }

        // Hapus log dan barang
        db.prepare('DELETE FROM stock_logs WHERE item_id = ?').run(id);
        db.prepare('DELETE FROM items WHERE id = ?').run(id);

        return sendJSON(res, 200, { success: true, message: 'Barang berhasil dihapus' });
      }

      // Restock (Stok Masuk)
      if (pathname.match(/^\/api\/items\/(\d+)\/restock$/) && method === 'POST') {
        const id = parseInt(pathname.split('/')[3], 10);
        const body = await parseBody(req);
        const qty = parseInt(body.quantity, 10);

        if (!qty || qty <= 0) {
          return sendJSON(res, 400, { success: false, message: 'Jumlah stok masuk harus lebih dari 0!' });
        }

        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        if (!item) {
          return sendJSON(res, 404, { success: false, message: 'Barang tidak ditemukan' });
        }

        const prevStock = item.stock;
        const newStock = prevStock + qty;

        db.prepare('UPDATE items SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, id);
        db.prepare(`
          INSERT INTO stock_logs (item_id, item_name, type, quantity, previous_stock, current_stock, reference_code, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          item.name,
          'IN',
          qty,
          prevStock,
          newStock,
          body.reference || 'RESTOCK-MANUAL',
          body.notes || 'Penerimaan stok barang masuk ke gudang'
        );

        return sendJSON(res, 200, {
          success: true,
          message: `Berhasil menambahkan ${qty} ${item.unit} ke barang '${item.name}'`,
          data: { id, previous_stock: prevStock, current_stock: newStock }
        });
      }

      // Adjust Stock (Stok Opname / Penyesuaian Fisik)
      if (pathname.match(/^\/api\/items\/(\d+)\/adjust$/) && method === 'POST') {
        const id = parseInt(pathname.split('/')[3], 10);
        const body = await parseBody(req);
        const actualStock = parseInt(body.actual_stock, 10);

        if (isNaN(actualStock) || actualStock < 0) {
          return sendJSON(res, 400, { success: false, message: 'Stok fisik hasil opname harus bernilai 0 atau positif!' });
        }

        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        if (!item) {
          return sendJSON(res, 404, { success: false, message: 'Barang tidak ditemukan' });
        }

        const prevStock = item.stock;
        const diff = actualStock - prevStock;

        db.prepare('UPDATE items SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(actualStock, id);
        db.prepare(`
          INSERT INTO stock_logs (item_id, item_name, type, quantity, previous_stock, current_stock, reference_code, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          item.name,
          diff >= 0 ? 'ADJUST-IN' : 'ADJUST-OUT',
          Math.abs(diff),
          prevStock,
          actualStock,
          'OPNAME',
          body.notes || `Penyesuaian stok fisik (Selisih: ${diff >= 0 ? '+' : ''}${diff} ${item.unit})`
        );

        return sendJSON(res, 200, {
          success: true,
          message: `Stok barang '${item.name}' disesuaikan menjadi ${actualStock} ${item.unit}`,
          data: { id, previous_stock: prevStock, current_stock: actualStock }
        });
      }

      // Riwayat Log Per Barang
      if (pathname.match(/^\/api\/items\/(\d+)\/logs$/) && method === 'GET') {
        const id = parseInt(pathname.split('/')[3], 10);
        const logs = db.prepare('SELECT * FROM stock_logs WHERE item_id = ? ORDER BY id DESC').all(id);
        return sendJSON(res, 200, { success: true, data: logs });
      }

      // 3. DATA DISTRIBUSI (DISTRIBUTIONS)
      if (pathname === '/api/distributions' && method === 'GET') {
        const search = parsedUrl.searchParams.get('q') || '';
        const status = parsedUrl.searchParams.get('status') || '';
        const dateFrom = parsedUrl.searchParams.get('date_from') || '';
        const dateTo = parsedUrl.searchParams.get('date_to') || '';

        let query = 'SELECT * FROM distributions WHERE 1=1';
        const params = [];

        if (search) {
          query += ' AND (dist_code LIKE ? OR destination_name LIKE ? OR vehicle_plate LIKE ? OR officer_name LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status) {
          query += ' AND status = ?';
          params.push(status);
        }

        if (dateFrom) {
          query += ' AND dist_date >= ?';
          params.push(dateFrom);
        }

        if (dateTo) {
          query += ' AND dist_date <= ?';
          params.push(dateTo + ' 23:59:59');
        }

        query += ' ORDER BY id DESC';

        const distributions = db.prepare(query).all(...params);
        return sendJSON(res, 200, { success: true, data: distributions });
      }

      // Ambil Detail 1 Distribusi Beserta Item-Itemnya (Untuk Surat Jalan / Modal Detail)
      if (pathname.match(/^\/api\/distributions\/(\d+)$/) && method === 'GET') {
        const id = parseInt(pathname.split('/')[3], 10);
        const dist = db.prepare('SELECT * FROM distributions WHERE id = ?').get(id);
        if (!dist) {
          return sendJSON(res, 404, { success: false, message: 'Data distribusi tidak ditemukan' });
        }

        const items = db.prepare('SELECT * FROM distribution_items WHERE distribution_id = ?').all(id);
        return sendJSON(res, 200, {
          success: true,
          data: {
            ...dist,
            items
          }
        });
      }

      // Buat Distribusi Baru (Dengan Validasi & Pengurangan Stok Otomatis)
      if (pathname === '/api/distributions' && method === 'POST') {
        const body = await parseBody(req);
        
        // Validasi Field Utama
        if (!body.destination_name || !body.destination_name.trim()) {
          return sendJSON(res, 400, { success: false, message: 'Tujuan distribusi wajib diisi!' });
        }
        if (!body.vehicle_plate || !body.vehicle_plate.trim()) {
          return sendJSON(res, 400, { success: false, message: 'Nomer kendaraan wajib diisi!' });
        }
        if (!body.officer_name || !body.officer_name.trim()) {
          return sendJSON(res, 400, { success: false, message: 'Petugas / supir pengirim wajib diisi!' });
        }
        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
          return sendJSON(res, 400, { success: false, message: 'Daftar barang yang didistribusikan tidak boleh kosong!' });
        }

        // Validasi Item & Stok Cukup
        const preparedItems = [];
        for (const itm of body.items) {
          const itemId = parseInt(itm.item_id, 10);
          const qty = parseInt(itm.quantity, 10);
          if (!itemId || !qty || qty <= 0) {
            return sendJSON(res, 400, { success: false, message: 'Jumlah barang harus lebih dari 0!' });
          }

          const dbItem = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
          if (!dbItem) {
            return sendJSON(res, 404, { success: false, message: `Barang dengan ID ${itemId} tidak ditemukan!` });
          }

          if (dbItem.stock < qty) {
            return sendJSON(res, 400, {
              success: false,
              message: `Stok tidak mencukupi untuk '${dbItem.name}'. Stok tersedia: ${dbItem.stock} ${dbItem.unit}, diminta: ${qty} ${dbItem.unit}.`
            });
          }

          preparedItems.push({
            item: dbItem,
            quantity: qty,
            notes: itm.notes || ''
          });
        }

        const distCode = generateDistCode();
        const distDate = body.dist_date || getCurrentDateTime();
        const status = body.status || 'Siap Kirim';

        // Lakukan Penyimpanan dengan Transaksi Database
        db.exec('BEGIN TRANSACTION;');
        try {
          // 1. Insert ke distributions
          const distInsert = db.prepare(`
            INSERT INTO distributions (
              dist_code, dist_date, destination_name, destination_address, destination_phone,
              vehicle_plate, officer_name, officer_phone, status, notes, total_items
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            distCode,
            distDate,
            body.destination_name.trim(),
            body.destination_address ? body.destination_address.trim() : '',
            body.destination_phone ? body.destination_phone.trim() : '',
            body.vehicle_plate.trim().toUpperCase(),
            body.officer_name.trim(),
            body.officer_phone ? body.officer_phone.trim() : '',
            status,
            body.notes || '',
            preparedItems.length
          );

          const distId = Number(distInsert.lastInsertRowid);

          // 2. Insert items & potong stok
          const itemInsertStmt = db.prepare(`
            INSERT INTO distribution_items (distribution_id, item_id, item_sku, item_name, unit, quantity, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          const updateStockStmt = db.prepare('UPDATE items SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
          const logStmt = db.prepare(`
            INSERT INTO stock_logs (item_id, item_name, type, quantity, previous_stock, current_stock, reference_code, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const entry of preparedItems) {
            const { item, quantity, notes } = entry;
            // Masukkan ke detail
            itemInsertStmt.run(distId, item.id, item.sku, item.name, item.unit, quantity, notes);

            // Kurangi stok di master barang
            updateStockStmt.run(quantity, item.id);

            // Catat ke kartu stok / log mutasi
            const currentStock = item.stock - quantity;
            logStmt.run(
              item.id,
              item.name,
              'OUT',
              quantity,
              item.stock,
              currentStock,
              distCode,
              `Distribusi ke ${body.destination_name.trim()} (No. Kendaraan: ${body.vehicle_plate.trim().toUpperCase()}, Petugas: ${body.officer_name.trim()})`
            );
          }

          db.exec('COMMIT;');

          return sendJSON(res, 201, {
            success: true,
            message: `Distribusi ${distCode} berhasil dibuat dan stok telah diperbarui.`,
            data: { id: distId, dist_code: distCode }
          });
        } catch (trxErr) {
          db.exec('ROLLBACK;');
          console.error('Error saat proses transaksi distribusi:', trxErr);
          return sendJSON(res, 500, { success: false, message: 'Gagal memproses distribusi: ' + trxErr.message });
        }
      }

      // Update Status Distribusi
      if (pathname.match(/^\/api\/distributions\/(\d+)\/status$/) && method === 'PUT') {
        const id = parseInt(pathname.split('/')[3], 10);
        const body = await parseBody(req);
        const newStatus = body.status;

        const allowedStatus = ['Siap Kirim', 'Dalam Pengiriman', 'Selesai', 'Dibatalkan'];
        if (!allowedStatus.includes(newStatus)) {
          return sendJSON(res, 400, { success: false, message: 'Status tidak valid! Pilihan: ' + allowedStatus.join(', ') });
        }

        const dist = db.prepare('SELECT * FROM distributions WHERE id = ?').get(id);
        if (!dist) {
          return sendJSON(res, 404, { success: false, message: 'Distribusi tidak ditemukan' });
        }

        // Jika dibatalkan dan status sebelumnya BUKAN Dibatalkan -> Kembalikan stok!
        if (newStatus === 'Dibatalkan' && dist.status !== 'Dibatalkan') {
          db.exec('BEGIN TRANSACTION;');
          try {
            const distItems = db.prepare('SELECT * FROM distribution_items WHERE distribution_id = ?').all(id);
            for (const itm of distItems) {
              const currentItem = db.prepare('SELECT stock FROM items WHERE id = ?').get(itm.item_id);
              if (currentItem) {
                const prev = currentItem.stock;
                const updated = prev + itm.quantity;
                db.prepare('UPDATE items SET stock = ? WHERE id = ?').run(updated, itm.item_id);
                db.prepare(`
                  INSERT INTO stock_logs (item_id, item_name, type, quantity, previous_stock, current_stock, reference_code, notes)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  itm.item_id,
                  itm.item_name,
                  'IN',
                  itm.quantity,
                  prev,
                  updated,
                  dist.dist_code,
                  `Pengembalian stok: Distribusi dibatalkan`
                );
              }
            }

            db.prepare('UPDATE distributions SET status = ? WHERE id = ?').run(newStatus, id);
            db.exec('COMMIT;');
            return sendJSON(res, 200, { success: true, message: `Status diubah menjadi Dibatalkan. Stok barang telah dikembalikan ke gudang.` });
          } catch (err) {
            db.exec('ROLLBACK;');
            return sendJSON(res, 500, { success: false, message: 'Gagal membatalkan distribusi: ' + err.message });
          }
        }

        // Update status normal
        db.prepare('UPDATE distributions SET status = ? WHERE id = ?').run(newStatus, id);
        return sendJSON(res, 200, { success: true, message: `Status distribusi berhasil diperbarui menjadi '${newStatus}'` });
      }

      // Hapus Distribusi
      if (pathname.match(/^\/api\/distributions\/(\d+)$/) && method === 'DELETE') {
        const id = parseInt(pathname.split('/')[3], 10);
        const dist = db.prepare('SELECT * FROM distributions WHERE id = ?').get(id);
        if (!dist) {
          return sendJSON(res, 404, { success: false, message: 'Data distribusi tidak ditemukan' });
        }

        // Jika belum dibatalkan, kembalikan stok dulu agar inventori tidak selisih
        if (dist.status !== 'Dibatalkan') {
          db.exec('BEGIN TRANSACTION;');
          try {
            const distItems = db.prepare('SELECT * FROM distribution_items WHERE distribution_id = ?').all(id);
            for (const itm of distItems) {
              const currentItem = db.prepare('SELECT stock FROM items WHERE id = ?').get(itm.item_id);
              if (currentItem) {
                const prev = currentItem.stock;
                const updated = prev + itm.quantity;
                db.prepare('UPDATE items SET stock = ? WHERE id = ?').run(updated, itm.item_id);
                db.prepare(`
                  INSERT INTO stock_logs (item_id, item_name, type, quantity, previous_stock, current_stock, reference_code, notes)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  itm.item_id,
                  itm.item_name,
                  'IN',
                  itm.quantity,
                  prev,
                  updated,
                  dist.dist_code,
                  `Pengembalian stok: Data distribusi dihapus`
                );
              }
            }
            db.prepare('DELETE FROM distribution_items WHERE distribution_id = ?').run(id);
            db.prepare('DELETE FROM distributions WHERE id = ?').run(id);
            db.exec('COMMIT;');
          } catch (e) {
            db.exec('ROLLBACK;');
            return sendJSON(res, 500, { success: false, message: 'Gagal menghapus distribusi: ' + e.message });
          }
        } else {
          db.prepare('DELETE FROM distribution_items WHERE distribution_id = ?').run(id);
          db.prepare('DELETE FROM distributions WHERE id = ?').run(id);
        }

        return sendJSON(res, 200, { success: true, message: 'Data distribusi berhasil dihapus' });
      }

      // 4. MASTER KENDARAAN (VEHICLES)
      if (pathname === '/api/vehicles' && method === 'GET') {
        const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY id DESC').all();
        return sendJSON(res, 200, { success: true, data: vehicles });
      }

      if (pathname === '/api/vehicles' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.plate_number || !body.vehicle_type) {
          return sendJSON(res, 400, { success: false, message: 'Nomor plat dan tipe kendaraan wajib diisi!' });
        }
        const plate = body.plate_number.trim().toUpperCase();
        const existing = db.prepare('SELECT id FROM vehicles WHERE plate_number = ?').get(plate);
        if (existing) {
          return sendJSON(res, 400, { success: false, message: `Nomor kendaraan '${plate}' sudah terdaftar!` });
        }

        const insert = db.prepare(`
          INSERT INTO vehicles (plate_number, vehicle_type, brand_model, driver_default, capacity, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          plate,
          body.vehicle_type.trim(),
          body.brand_model || '',
          body.driver_default || '',
          body.capacity || '',
          body.status || 'Tersedia'
        );

        return sendJSON(res, 201, { success: true, message: 'Kendaraan berhasil didaftarkan', data: { id: Number(insert.lastInsertRowid) } });
      }

      if (pathname.match(/^\/api\/vehicles\/(\d+)$/) && method === 'DELETE') {
        const id = parseInt(pathname.split('/')[3], 10);
        db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
        return sendJSON(res, 200, { success: true, message: 'Kendaraan berhasil dihapus' });
      }

      // 5. MASTER PETUGAS / DRIVER (OFFICERS)
      if (pathname === '/api/officers' && method === 'GET') {
        const officers = db.prepare('SELECT * FROM officers ORDER BY id DESC').all();
        return sendJSON(res, 200, { success: true, data: officers });
      }

      if (pathname === '/api/officers' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.name) {
          return sendJSON(res, 400, { success: false, message: 'Nama petugas wajib diisi!' });
        }
        const insert = db.prepare(`
          INSERT INTO officers (name, role, phone, status)
          VALUES (?, ?, ?, ?)
        `).run(
          body.name.trim(),
          body.role || 'Driver',
          body.phone || '',
          body.status || 'Aktif'
        );
        return sendJSON(res, 201, { success: true, message: 'Petugas berhasil ditambahkan', data: { id: Number(insert.lastInsertRowid) } });
      }

      if (pathname.match(/^\/api\/officers\/(\d+)$/) && method === 'DELETE') {
        const id = parseInt(pathname.split('/')[3], 10);
        db.prepare('DELETE FROM officers WHERE id = ?').run(id);
        return sendJSON(res, 200, { success: true, message: 'Petugas berhasil dihapus' });
      }

      // 6. MASTER TUJUAN (DESTINATIONS)
      if (pathname === '/api/destinations' && method === 'GET') {
        const destinations = db.prepare('SELECT * FROM destinations ORDER BY id DESC').all();
        return sendJSON(res, 200, { success: true, data: destinations });
      }

      if (pathname === '/api/destinations' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.address) {
          return sendJSON(res, 400, { success: false, message: 'Nama tujuan dan alamat lengkap wajib diisi!' });
        }
        const insert = db.prepare(`
          INSERT INTO destinations (name, address, city, contact_person, phone)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          body.name.trim(),
          body.address.trim(),
          body.city || '',
          body.contact_person || '',
          body.phone || ''
        );
        return sendJSON(res, 201, { success: true, message: 'Tujuan berhasil disimpan', data: { id: Number(insert.lastInsertRowid) } });
      }

      if (pathname.match(/^\/api\/destinations\/(\d+)$/) && method === 'DELETE') {
        const id = parseInt(pathname.split('/')[3], 10);
        db.prepare('DELETE FROM destinations WHERE id = ?').run(id);
        return sendJSON(res, 200, { success: true, message: 'Tujuan berhasil dihapus' });
      }

      // 7. KATEGORI (CATEGORIES)
      if (pathname === '/api/categories' && method === 'GET') {
        const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
        return sendJSON(res, 200, { success: true, data: categories });
      }

      if (pathname === '/api/categories' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.name) {
          return sendJSON(res, 400, { success: false, message: 'Nama kategori wajib diisi!' });
        }
        try {
          const insert = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(body.name.trim(), body.description || '');
          return sendJSON(res, 201, { success: true, message: 'Kategori berhasil ditambahkan', data: { id: Number(insert.lastInsertRowid) } });
        } catch (e) {
          return sendJSON(res, 400, { success: false, message: 'Kategori sudah ada!' });
        }
      }

      // 8. LOGS MUTASI STOK GLOBAL
      if (pathname === '/api/stock-logs' && method === 'GET') {
        const logs = db.prepare('SELECT * FROM stock_logs ORDER BY id DESC LIMIT 200').all();
        return sendJSON(res, 200, { success: true, data: logs });
      }

      // 9. EXPORT KE CSV (DOWNLOADABLE)
      if (pathname === '/api/export/items' && method === 'GET') {
        const items = db.prepare('SELECT * FROM items ORDER BY id ASC').all();
        let csv = 'ID,SKU,Nama Barang,Kategori,Satuan,Stok Fisik,Stok Min,Lokasi Rak,Harga Satuan,Estimasi Nilai,Keterangan\n';
        for (const itm of items) {
          const clean = str => `"${String(str || '').replace(/"/g, '""')}"`;
          csv += [
            itm.id,
            clean(itm.sku),
            clean(itm.name),
            clean(itm.category),
            clean(itm.unit),
            itm.stock,
            itm.min_stock,
            clean(itm.location),
            itm.unit_price,
            itm.stock * itm.unit_price,
            clean(itm.notes)
          ].join(',') + '\n';
        }

        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="data_stok_barang.csv"'
        });
        return res.end(csv);
      }

      if (pathname === '/api/export/distributions' && method === 'GET') {
        const dists = db.prepare('SELECT * FROM distributions ORDER BY id DESC').all();
        let csv = 'No Distribusi,Tanggal,Tujuan,Alamat Tujuan,No Kendaraan,Petugas Driver,Kontak Petugas,Status,Jml Item,Keterangan\n';
        for (const d of dists) {
          const clean = str => `"${String(str || '').replace(/"/g, '""')}"`;
          csv += [
            clean(d.dist_code),
            clean(d.dist_date),
            clean(d.destination_name),
            clean(d.destination_address),
            clean(d.vehicle_plate),
            clean(d.officer_name),
            clean(d.officer_phone),
            clean(d.status),
            d.total_items,
            clean(d.notes)
          ].join(',') + '\n';
        }

        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="data_distribusi_gudang.csv"'
        });
        return res.end(csv);
      }

      // API route not found
      return sendJSON(res, 404, { success: false, message: 'API endpoint not found' });
    }

    // ==========================================
    // STATIC FILE SERVING
    // ==========================================
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA if not found
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('File not found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          return res.end('Internal Server Error');
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });

  } catch (err) {
    console.error('Unhandled Server Error:', err);
    sendJSON(res, 500, { success: false, message: 'Internal server error: ' + err.message });
  }
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` APLIKASI MANAJEMEN GUDANG & DISTRIBUSI BERJALAN`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Waktu Mulai: ${new Date().toLocaleString()}`);
  console.log(`====================================================`);
});
