/**
 * Vercel Serverless Function Handler (Resilient & Universal)
 * Route: /api/*
 */

const path = require('node:path');
const fs = require('node:fs');

// Cek ketersediaan node:sqlite (Node 22+)
let DatabaseSync = null;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  DatabaseSync = null;
}

// Fallback JSON Store jika runtime Vercel menggunakan Node < 22 atau SQLite tidak tersedia
const TMP_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
if (!fs.existsSync(TMP_DIR)) {
  try { fs.mkdirSync(TMP_DIR, { recursive: true }); } catch (e) {}
}

const JSON_STORE_PATH = path.join(TMP_DIR, 'warehouse_data.json');

function getDefaultData() {
  return {
    categories: [
      { id: 1, name: 'Elektronik & Kelistrikan', description: 'Komponen, kabel, perangkat elektronik' },
      { id: 2, name: 'Bahan Bangunan & Perkakas', description: 'Semen, cat, baut, peralatan tukang' },
      { id: 3, name: 'Sembako & Konsumsi', description: 'Beras, minyak, gula, makanan kering' },
      { id: 4, name: 'Perlengkapan Kantor & ATK', description: 'Kertas, map, printer, alat tulis' },
      { id: 5, name: 'Kemasan & Logistik', description: 'Kardus packing, bubble wrap, lakban' }
    ],
    vehicles: [
      { id: 1, plate_number: 'B 9482 SXZ', vehicle_type: 'Truk Box CDD (Colt Diesel)', brand_model: 'Mitsubishi Canter', driver_default: 'Ahmad Fauzi', capacity: '4 Ton', status: 'Tersedia' },
      { id: 2, plate_number: 'B 8122 PQR', vehicle_type: 'Blind Van', brand_model: 'Daihatsu Gran Max', driver_default: 'Rudi Hermawan', capacity: '1.2 Ton', status: 'Tersedia' },
      { id: 3, plate_number: 'B 7301 KLM', vehicle_type: 'Pickup Bak Terbuka', brand_model: 'Suzuki Carry', driver_default: 'Bambang Supriyanto', capacity: '1.5 Ton', status: 'Tersedia' }
    ],
    officers: [
      { id: 1, name: 'Ahmad Fauzi', role: 'Driver', phone: '0812-3456-7890', status: 'Aktif' },
      { id: 2, name: 'Rudi Hermawan', role: 'Driver', phone: '0813-8877-6655', status: 'Aktif' },
      { id: 3, name: 'Bambang Supriyanto', role: 'Driver', phone: '0857-1122-3344', status: 'Aktif' },
      { id: 4, name: 'Wahyu Prasetyo', role: 'Petugas Gudang', phone: '0819-4455-6677', status: 'Aktif' }
    ],
    destinations: [
      { id: 1, name: 'Gudang Cabang Bandung Barat', address: 'Jl. Soekarno Hatta No. 412, Buahbatu', city: 'Bandung', contact_person: 'Pak Irawan', phone: '0821-1234-5678' },
      { id: 2, name: 'Pusat Distribusi Tangerang', address: 'Kawasan Industri Jatake Blok C No. 5', city: 'Tangerang', contact_person: 'Ibu Maya', phone: '0815-9988-2233' },
      { id: 3, name: 'Depo Logistik Bekasi', address: 'Jl. Sultan Agung No. 88, Medan Satria', city: 'Bekasi', contact_person: 'Pak Hendro', phone: '0813-4433-2211' }
    ],
    items: [
      { id: 1, sku: 'BRG-ELK-001', name: 'Kabel Tembaga NYM 2x1.5mm (50m)', category: 'Elektronik & Kelistrikan', unit: 'Roll', stock: 85, min_stock: 15, location: 'Rak A-01', unit_price: 275000, notes: 'Standar SNI' },
      { id: 2, sku: 'BRG-ELK-002', name: 'Lampu LED Industrial 40 Watt', category: 'Elektronik & Kelistrikan', unit: 'Pcs', stock: 120, min_stock: 20, location: 'Rak A-02', unit_price: 45000, notes: 'Garansi 1 tahun' },
      { id: 3, sku: 'BRG-BGN-001', name: 'Semen Tiga Roda 50kg', category: 'Bahan Bangunan & Perkakas', unit: 'Sak', stock: 240, min_stock: 50, location: 'Pallet B-01', unit_price: 68000, notes: 'Simpan di tempat kering' },
      { id: 4, sku: 'BRG-SMB-001', name: 'Minyak Goreng Sawit 2 Liter', category: 'Sembako & Konsumsi', unit: 'Karton', stock: 160, min_stock: 30, location: 'Rak C-01', unit_price: 34000, notes: 'Isi 6 pouch' },
      { id: 5, sku: 'BRG-ATK-001', name: 'Kertas HVS A4 80gr PaperOne', category: 'Perlengkapan Kantor & ATK', unit: 'Rim', stock: 180, min_stock: 25, location: 'Rak D-01', unit_price: 48500, notes: 'Box isi 5 rim' }
    ],
    distributions: [
      {
        id: 1,
        dist_code: 'DST-202611-0001',
        dist_date: '2026-11-10 09:30',
        destination_name: 'Gudang Cabang Bandung Barat',
        destination_address: 'Jl. Soekarno Hatta No. 412, Buahbatu, Bandung',
        destination_phone: '0821-1234-5678',
        vehicle_plate: 'B 9482 SXZ',
        officer_name: 'Ahmad Fauzi',
        officer_phone: '0812-3456-7890',
        status: 'Selesai',
        notes: 'Pengiriman rutin logistik cabang Bandung',
        total_items: 2,
        items: [
          { item_id: 1, item_sku: 'BRG-ELK-001', item_name: 'Kabel Tembaga NYM 2x1.5mm (50m)', unit: 'Roll', quantity: 10, notes: 'Dus 1-2' },
          { item_id: 3, item_sku: 'BRG-BGN-001', item_name: 'Semen Tiga Roda 50kg', unit: 'Sak', quantity: 30, notes: 'Pallet depan' }
        ]
      },
      {
        id: 2,
        dist_code: 'DST-202611-0002',
        dist_date: '2026-11-12 14:15',
        destination_name: 'Pusat Distribusi Tangerang',
        destination_address: 'Kawasan Industri Jatake Blok C No. 5, Tangerang',
        destination_phone: '0815-9988-2233',
        vehicle_plate: 'B 8122 PQR',
        officer_name: 'Rudi Hermawan',
        officer_phone: '0813-8877-6655',
        status: 'Dalam Pengiriman',
        notes: 'Estimasi tiba sore hari',
        total_items: 2,
        items: [
          { item_id: 4, item_sku: 'BRG-SMB-001', item_name: 'Minyak Goreng Sawit 2 Liter', unit: 'Karton', quantity: 25, notes: 'Fragile' },
          { item_id: 5, item_sku: 'BRG-ATK-001', item_name: 'Kertas HVS A4 80gr PaperOne', unit: 'Rim', quantity: 20, notes: 'Kebutuhan cabang' }
        ]
      }
    ],
    stock_logs: [
      { id: 1, item_name: 'Kabel Tembaga NYM 2x1.5mm (50m)', type: 'IN', quantity: 95, previous_stock: 0, current_stock: 95, reference_code: 'INIT', notes: 'Saldo awal', created_at: '2026-11-01 08:00' },
      { id: 2, item_name: 'Kabel Tembaga NYM 2x1.5mm (50m)', type: 'OUT', quantity: 10, previous_stock: 95, current_stock: 85, reference_code: 'DST-202611-0001', notes: 'Distribusi ke Bandung', created_at: '2026-11-10 09:30' }
    ]
  };
}

function loadData() {
  try {
    if (fs.existsSync(JSON_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(JSON_STORE_PATH, 'utf-8'));
    }
  } catch (e) {}
  const def = getDefaultData();
  saveData(def);
  return def;
}

function saveData(data) {
  try {
    fs.writeFileSync(JSON_STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
}

function parseBody(req) {
  if (req.body) {
    return Promise.resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); }
    });
  });
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    const data = loadData();

    // 1. STATS
    if (pathname.endsWith('/stats') && method === 'GET') {
      const itemsCount = data.items.length;
      const physicalStock = data.items.reduce((sum, i) => sum + (i.stock || 0), 0);
      const inventoryVal = data.items.reduce((sum, i) => sum + ((i.stock || 0) * (i.unit_price || 0)), 0);
      const lowStock = data.items.filter(i => i.stock <= i.min_stock && i.stock > 0).length;
      const outStock = data.items.filter(i => i.stock === 0).length;
      const distTotal = data.distributions.length;

      const distStatusMap = {};
      data.distributions.forEach(d => {
        distStatusMap[d.status] = (distStatusMap[d.status] || 0) + 1;
      });
      const distStatus = Object.keys(distStatusMap).map(k => ({ status: k, count: distStatusMap[k] }));

      const catMap = {};
      data.items.forEach(i => {
        catMap[i.category] = (catMap[i.category] || 0) + i.stock;
      });
      const catStats = Object.keys(catMap).map(k => ({ category: k, total_stock: catMap[k] }));

      return res.end(JSON.stringify({
        success: true,
        data: {
          items_count: itemsCount,
          physical_stock: physicalStock,
          inventory_value: inventoryVal,
          low_stock_count: lowStock,
          out_of_stock_count: outStock,
          distribution_total: distTotal,
          distribution_status: distStatus,
          category_stats: catStats,
          recent_distributions: data.distributions.slice(-5).reverse(),
          recent_logs: data.stock_logs.slice(-8).reverse(),
          vehicles_count: data.vehicles.length,
          officers_count: data.officers.length
        }
      }));
    }

    // 2. ITEMS
    if (pathname.endsWith('/items') && method === 'GET') {
      const q = (parsedUrl.searchParams.get('q') || '').toLowerCase();
      const cat = parsedUrl.searchParams.get('category') || '';
      const status = parsedUrl.searchParams.get('status') || '';

      let filtered = data.items;
      if (q) {
        filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
      }
      if (cat) {
        filtered = filtered.filter(i => i.category === cat);
      }
      if (status === 'aman') {
        filtered = filtered.filter(i => i.stock > i.min_stock);
      } else if (status === 'menipis') {
        filtered = filtered.filter(i => i.stock <= i.min_stock && i.stock > 0);
      } else if (status === 'habis') {
        filtered = filtered.filter(i => i.stock === 0);
      }

      return res.end(JSON.stringify({ success: true, data: filtered }));
    }

    if (pathname.endsWith('/items') && method === 'POST') {
      const body = await parseBody(req);
      const newId = Date.now();
      const sku = body.sku ? body.sku.toUpperCase() : `BRG-${String(newId).slice(-4)}`;
      const newItem = {
        id: newId,
        sku: sku,
        name: body.name,
        category: body.category || 'Umum',
        unit: body.unit || 'Pcs',
        stock: parseInt(body.stock, 10) || 0,
        min_stock: parseInt(body.min_stock, 10) || 5,
        location: body.location || '',
        unit_price: parseFloat(body.unit_price) || 0,
        notes: body.notes || ''
      };
      data.items.unshift(newItem);
      saveData(data);
      return res.end(JSON.stringify({ success: true, message: 'Barang berhasil disimpan', data: newItem }));
    }

    // RESTOCK
    if (pathname.match(/\/items\/(\d+)\/restock$/) && method === 'POST') {
      const id = parseInt(pathname.split('/').slice(-2)[0], 10);
      const body = await parseBody(req);
      const item = data.items.find(i => i.id === id);
      if (item) {
        const qty = parseInt(body.quantity, 10) || 0;
        const prev = item.stock;
        item.stock += qty;
        data.stock_logs.unshift({
          id: Date.now(),
          item_name: item.name,
          type: 'IN',
          quantity: qty,
          previous_stock: prev,
          current_stock: item.stock,
          reference_code: body.reference || 'RESTOCK',
          notes: body.notes || 'Restock masuk',
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
        saveData(data);
        return res.end(JSON.stringify({ success: true, message: 'Stok berhasil ditambahkan' }));
      }
    }

    // 3. DISTRIBUTIONS
    if (pathname.endsWith('/distributions') && method === 'GET') {
      return res.end(JSON.stringify({ success: true, data: data.distributions }));
    }

    if (pathname.match(/\/distributions\/(\d+)$/) && method === 'GET') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const dist = data.distributions.find(d => d.id === id);
      if (dist) {
        return res.end(JSON.stringify({ success: true, data: dist }));
      }
      res.statusCode = 404;
      return res.end(JSON.stringify({ success: false, message: 'Distribusi tidak ditemukan' }));
    }

    if (pathname.endsWith('/distributions') && method === 'POST') {
      const body = await parseBody(req);
      const newId = Date.now();
      const distCode = `DST-${new Date().toISOString().slice(0,7).replace('-','')}-${String(newId).slice(-4)}`;

      // Potong stok
      const itemsDetail = [];
      if (body.items && Array.isArray(body.items)) {
        for (const itm of body.items) {
          const matched = data.items.find(i => i.id === parseInt(itm.item_id, 10));
          if (matched) {
            const qty = parseInt(itm.quantity, 10);
            matched.stock = Math.max(0, matched.stock - qty);
            itemsDetail.push({
              item_id: matched.id,
              item_sku: matched.sku,
              item_name: matched.name,
              unit: matched.unit,
              quantity: qty,
              notes: itm.notes || ''
            });
          }
        }
      }

      const newDist = {
        id: newId,
        dist_code: distCode,
        dist_date: body.dist_date || new Date().toISOString().replace('T', ' ').substring(0, 16),
        destination_name: body.destination_name,
        destination_address: body.destination_address || '',
        destination_phone: body.destination_phone || '',
        vehicle_plate: body.vehicle_plate,
        officer_name: body.officer_name,
        officer_phone: body.officer_phone || '',
        status: body.status || 'Siap Kirim',
        notes: body.notes || '',
        total_items: itemsDetail.length,
        items: itemsDetail
      };

      data.distributions.unshift(newDist);
      saveData(data);
      return res.end(JSON.stringify({ success: true, message: 'Distribusi berhasil dibuat', data: newDist }));
    }

    if (pathname.match(/\/distributions\/(\d+)\/status$/) && method === 'PUT') {
      const id = parseInt(pathname.split('/').slice(-2)[0], 10);
      const body = await parseBody(req);
      const dist = data.distributions.find(d => d.id === id);
      if (dist) {
        dist.status = body.status;
        saveData(data);
        return res.end(JSON.stringify({ success: true, message: 'Status berhasil diperbarui' }));
      }
    }

    // 4. VEHICLES, OFFICERS, DESTINATIONS, CATEGORIES
    if (pathname.endsWith('/vehicles') && method === 'GET') {
      return res.end(JSON.stringify({ success: true, data: data.vehicles }));
    }
    if (pathname.endsWith('/vehicles') && method === 'POST') {
      const body = await parseBody(req);
      const newV = { id: Date.now(), ...body };
      data.vehicles.push(newV);
      saveData(data);
      return res.end(JSON.stringify({ success: true, message: 'Kendaraan berhasil disimpan', data: newV }));
    }

    if (pathname.endsWith('/officers') && method === 'GET') {
      return res.end(JSON.stringify({ success: true, data: data.officers }));
    }
    if (pathname.endsWith('/officers') && method === 'POST') {
      const body = await parseBody(req);
      const newO = { id: Date.now(), ...body };
      data.officers.push(newO);
      saveData(data);
      return res.end(JSON.stringify({ success: true, message: 'Petugas berhasil disimpan', data: newO }));
    }

    if (pathname.endsWith('/destinations') && method === 'GET') {
      return res.end(JSON.stringify({ success: true, data: data.destinations }));
    }
    if (pathname.endsWith('/destinations') && method === 'POST') {
      const body = await parseBody(req);
      const newD = { id: Date.now(), ...body };
      data.destinations.push(newD);
      saveData(data);
      return res.end(JSON.stringify({ success: true, message: 'Tujuan berhasil disimpan', data: newD }));
    }

    if (pathname.endsWith('/categories') && method === 'GET') {
      return res.end(JSON.stringify({ success: true, data: data.categories }));
    }

    if (pathname.endsWith('/stock-logs') && method === 'GET') {
      return res.end(JSON.stringify({ success: true, data: data.stock_logs }));
    }

    // Fallback status OK
    return res.end(JSON.stringify({ success: true, status: 'Online', engine: DatabaseSync ? 'SQLite' : 'JSON' }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, message: 'Internal Server Error: ' + err.message }));
  }
};
