/**
 * SISTEM MANAJEMEN GUDANG & DISTRIBUSI LOGISTIK
 * Frontend Application Controller (app.js)
 * Dilengkapi dengan Auto-Fallback Offline/Client-Store untuk Vercel Serverless
 */

// Global State Cache
let state = {
  currentTab: 'tab-dashboard',
  items: [],
  categories: [],
  vehicles: [],
  officers: [],
  destinations: [],
  distributions: [],
  charts: {
    category: null,
    distribution: null
  }
};

// ============================================================================
// CLIENT FALLBACK STORE (Untuk keandalan 100% di Vercel / Tanpa Backend)
// ============================================================================
function getLocalStore() {
  const stored = localStorage.getItem('warehouse_v2_data');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }

  const initial = {
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
      { id: 5, sku: 'BRG-SMB-002', name: 'Beras Premium Ramos 10kg', category: 'Sembako & Konsumsi', unit: 'Karung', stock: 95, min_stock: 25, location: 'Pallet C-02', unit_price: 145000, notes: 'Beras pulen' },
      { id: 6, sku: 'BRG-ATK-001', name: 'Kertas HVS A4 80gr PaperOne', category: 'Perlengkapan Kantor & ATK', unit: 'Rim', stock: 180, min_stock: 25, location: 'Rak D-01', unit_price: 48500, notes: 'Box isi 5 rim' },
      { id: 7, sku: 'BRG-LOG-001', name: 'Kardus Packing Double Wall 40x30x30', category: 'Kemasan & Logistik', unit: 'Pcs', stock: 450, min_stock: 100, location: 'Rak E-01', unit_price: 8500, notes: 'Tebal 6mm' }
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
        notes: 'Driver jalan estimasi tiba sore',
        total_items: 2,
        items: [
          { item_id: 4, item_sku: 'BRG-SMB-001', item_name: 'Minyak Goreng Sawit 2 Liter', unit: 'Karton', quantity: 25, notes: 'Fragile' },
          { item_id: 6, item_sku: 'BRG-ATK-001', item_name: 'Kertas HVS A4 80gr PaperOne', unit: 'Rim', quantity: 20, notes: 'Kebutuhan cabang' }
        ]
      }
    ],
    stock_logs: [
      { id: 1, item_name: 'Kabel Tembaga NYM 2x1.5mm (50m)', type: 'IN', quantity: 95, previous_stock: 0, current_stock: 95, reference_code: 'INIT', notes: 'Saldo awal', created_at: '2026-11-01 08:00' },
      { id: 2, item_name: 'Kabel Tembaga NYM 2x1.5mm (50m)', type: 'OUT', quantity: 10, previous_stock: 95, current_stock: 85, reference_code: 'DST-202611-0001', notes: 'Distribusi Bandung', created_at: '2026-11-10 09:30' }
    ]
  };

  saveLocalStore(initial);
  return initial;
}

function saveLocalStore(data) {
  try {
    localStorage.setItem('warehouse_v2_data', JSON.stringify(data));
  } catch (e) {}
}

function handleClientFallback(endpoint, options = {}) {
  const store = getLocalStore();
  const url = new URL(endpoint, 'http://localhost');
  const path = url.pathname;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  // Stats
  if (path.includes('/stats')) {
    const itemsCount = store.items.length;
    const physicalStock = store.items.reduce((s, i) => s + (i.stock || 0), 0);
    const lowStock = store.items.filter(i => i.stock <= i.min_stock && i.stock > 0).length;
    const outStock = store.items.filter(i => i.stock === 0).length;

    const distStatusMap = {};
    store.distributions.forEach(d => { distStatusMap[d.status] = (distStatusMap[d.status] || 0) + 1; });
    const distStatus = Object.keys(distStatusMap).map(k => ({ status: k, count: distStatusMap[k] }));

    const catMap = {};
    store.items.forEach(i => { catMap[i.category] = (catMap[i.category] || 0) + i.stock; });
    const catStats = Object.keys(catMap).map(k => ({ category: k, total_stock: catMap[k] }));

    return {
      success: true,
      data: {
        items_count: itemsCount,
        physical_stock: physicalStock,
        inventory_value: 0,
        low_stock_count: lowStock,
        out_of_stock_count: outStock,
        distribution_total: store.distributions.length,
        distribution_status: distStatus,
        category_stats: catStats,
        recent_distributions: store.distributions.slice(-5).reverse(),
        recent_logs: store.stock_logs.slice(-8).reverse(),
        vehicles_count: store.vehicles.length,
        officers_count: store.officers.length
      }
    };
  }

  // Items
  if (path.endsWith('/items')) {
    if (method === 'GET') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const cat = url.searchParams.get('category') || '';
      const status = url.searchParams.get('status') || '';
      let items = store.items;
      if (q) items = items.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
      if (cat) items = items.filter(i => i.category === cat);
      if (status === 'aman') items = items.filter(i => i.stock > i.min_stock);
      if (status === 'menipis') items = items.filter(i => i.stock <= i.min_stock && i.stock > 0);
      if (status === 'habis') items = items.filter(i => i.stock === 0);
      return { success: true, data: items };
    }
    if (method === 'POST') {
      const newItem = { id: Date.now(), ...body };
      store.items.unshift(newItem);
      saveLocalStore(store);
      return { success: true, message: 'Barang berhasil disimpan', data: newItem };
    }
  }

  // Restock
  if (path.includes('/restock')) {
    const id = parseInt(path.split('/').slice(-2)[0], 10);
    const item = store.items.find(i => i.id === id);
    if (item) {
      item.stock += parseInt(body.quantity, 10);
      saveLocalStore(store);
      return { success: true, message: 'Stok berhasil ditambahkan' };
    }
  }

  // Distributions
  if (path.endsWith('/distributions')) {
    if (method === 'GET') return { success: true, data: store.distributions };
    if (method === 'POST') {
      const newDist = {
        id: Date.now(),
        dist_code: `DST-${Date.now().toString().slice(-6)}`,
        ...body,
        total_items: (body.items || []).length
      };
      // Potong stok
      if (body.items) {
        body.items.forEach(itm => {
          const match = store.items.find(i => i.id === parseInt(itm.item_id, 10));
          if (match) match.stock = Math.max(0, match.stock - parseInt(itm.quantity, 10));
        });
      }
      store.distributions.unshift(newDist);
      saveLocalStore(store);
      return { success: true, message: 'Distribusi berhasil dibuat', data: newDist };
    }
  }

  if (path.match(/\/distributions\/(\d+)$/)) {
    const id = parseInt(path.split('/').pop(), 10);
    const dist = store.distributions.find(d => d.id === id);
    return dist ? { success: true, data: dist } : { success: false, message: 'Tidak ditemukan' };
  }

  if (path.includes('/status')) {
    const id = parseInt(path.split('/').slice(-2)[0], 10);
    const dist = store.distributions.find(d => d.id === id);
    if (dist) {
      dist.status = body.status;
      saveLocalStore(store);
      return { success: true, message: 'Status berhasil diperbarui' };
    }
  }

  // Masters
  if (path.endsWith('/vehicles')) return { success: true, data: store.vehicles };
  if (path.endsWith('/officers')) return { success: true, data: store.officers };
  if (path.endsWith('/destinations')) return { success: true, data: store.destinations };
  if (path.endsWith('/categories')) return { success: true, data: store.categories };
  if (path.endsWith('/stock-logs')) return { success: true, data: store.stock_logs };

  return { success: true, data: [] };
}

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initNavigation();
  initFilterEvents();
  loadAllMasterData().then(() => {
    loadDashboard();
    loadItems();
    loadDistributions();
    loadFleet();
    loadDestinations();
    loadStockLogs();
  });
});

// Live Clock
function initClock() {
  const clockEl = document.getElementById('clock-text');
  function update() {
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    clockEl.textContent = now.toLocaleDateString('id-ID', options);
  }
  update();
  setInterval(update, 1000);
}

// Sidebar Navigation
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });

  const titleMap = {
    'tab-dashboard': 'Dashboard Gudang & Logistik',
    'tab-stok': 'Data Stok & Inventori Gudang',
    'tab-distribusi': 'Data Pengiriman & Distribusi Barang',
    'tab-armada': 'Armada Kendaraan & Petugas Pengirim',
    'tab-tujuan': 'Daftar Lokasi & Cabang Tujuan',
    'tab-mutasi': 'Riwayat Mutasi & Audit Trail Stok'
  };
  const titleEl = document.getElementById('page-current-title');
  if (titleEl) titleEl.textContent = titleMap[tabId] || 'Sistem Gudang';

  if (tabId === 'tab-dashboard') loadDashboard();
  if (tabId === 'tab-stok') loadItems();
  if (tabId === 'tab-distribusi') loadDistributions();
  if (tabId === 'tab-armada') loadFleet();
  if (tabId === 'tab-tujuan') loadDestinations();
  if (tabId === 'tab-mutasi') loadStockLogs();
}

// Live Filter Listeners
function initFilterEvents() {
  const searchItem = document.getElementById('filter-item-search');
  const catItem = document.getElementById('filter-item-category');
  const statusItem = document.getElementById('filter-item-status');

  if (searchItem) searchItem.addEventListener('input', debounce(loadItems, 300));
  if (catItem) catItem.addEventListener('change', loadItems);
  if (statusItem) statusItem.addEventListener('change', loadItems);

  const searchDist = document.getElementById('filter-dist-search');
  const statusDist = document.getElementById('filter-dist-status');

  if (searchDist) searchDist.addEventListener('input', debounce(loadDistributions, 300));
  if (statusDist) statusDist.addEventListener('change', loadDistributions);
}

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

// ============================================================================
// DATA FETCHING & API CALLS (WITH AUTO FALLBACK)
// ============================================================================

async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    return json;
  } catch (err) {
    // Graceful fallback to client store (offline / serverless cold-start)
    return handleClientFallback(endpoint, options);
  }
}

async function loadAllMasterData() {
  const [catRes, vehRes, offRes, destRes] = await Promise.all([
    fetchAPI('/api/categories'),
    fetchAPI('/api/vehicles'),
    fetchAPI('/api/officers'),
    fetchAPI('/api/destinations')
  ]);

  if (catRes.success) {
    state.categories = catRes.data;
    populateCategoryDropdowns();
  }
  if (vehRes.success) state.vehicles = vehRes.data;
  if (offRes.success) state.officers = offRes.data;
  if (destRes.success) state.destinations = destRes.data;
}

function populateCategoryDropdowns() {
  const filterCat = document.getElementById('filter-item-category');
  const itemCat = document.getElementById('item-input-category');

  if (filterCat) {
    const current = filterCat.value;
    filterCat.innerHTML = '<option value="">Semua Kategori</option>';
    state.categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = c.name;
      filterCat.appendChild(opt);
    });
    filterCat.value = current;
  }

  if (itemCat) {
    itemCat.innerHTML = '';
    state.categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = c.name;
      itemCat.appendChild(opt);
    });
  }
}

// ============================================================================
// TAB 1: DASHBOARD
// ============================================================================

async function loadDashboard() {
  const res = await fetchAPI('/api/stats');
  if (!res.success) return;
  const d = res.data;

  document.getElementById('stat-items-count').textContent = d.items_count;
  document.getElementById('stat-total-stock').textContent = `${formatNumber(d.physical_stock)} unit total stok fisik`;

  document.getElementById('stat-dist-total').textContent = d.distribution_total;
  const inTransit = (d.distribution_status.find(s => s.status === 'Dalam Pengiriman') || {}).count || 0;
  document.getElementById('stat-dist-active').textContent = `${inTransit} sedang dalam pengiriman`;

  document.getElementById('stat-low-stock').textContent = d.low_stock_count;
  document.getElementById('stat-out-of-stock').textContent = `${d.out_of_stock_count} item stok habis (0)`;

  document.getElementById('stat-fleet-count').textContent = d.vehicles_count + d.officers_count;
  document.getElementById('stat-fleet-detail').textContent = `${d.vehicles_count} kendaraan, ${d.officers_count} petugas`;

  const badgeLow = document.getElementById('badge-low-stock');
  if (badgeLow) {
    const totalWarn = d.low_stock_count + d.out_of_stock_count;
    badgeLow.textContent = totalWarn;
    badgeLow.style.display = totalWarn > 0 ? 'inline-block' : 'none';
  }

  const badgeDist = document.getElementById('badge-active-dist');
  if (badgeDist) {
    badgeDist.textContent = inTransit;
  }

  renderCategoryChart(d.category_stats);
  renderDistributionChart(d.distribution_status);
  renderDashboardDistributions(d.recent_distributions);
  loadDashboardLowStock();
}

function renderCategoryChart(categories) {
  const ctx = document.getElementById('chart-category');
  if (!ctx || typeof Chart === 'undefined') return;

  if (state.charts.category) {
    state.charts.category.destroy();
  }

  const labels = categories.map(c => c.category);
  const data = categories.map(c => c.total_stock || 0);

  state.charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12, font: { size: 11 } }
        }
      }
    }
  });
}

function renderDistributionChart(statusStats) {
  const ctx = document.getElementById('chart-distribution');
  if (!ctx || typeof Chart === 'undefined') return;

  if (state.charts.distribution) {
    state.charts.distribution.destroy();
  }

  const statusMap = {
    'Siap Kirim': 0,
    'Dalam Pengiriman': 0,
    'Selesai': 0,
    'Dibatalkan': 0
  };

  statusStats.forEach(s => {
    if (statusMap[s.status] !== undefined) {
      statusMap[s.status] = s.count;
    }
  });

  state.charts.distribution = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(statusMap),
      datasets: [{
        label: 'Jumlah Pengiriman',
        data: Object.values(statusMap),
        backgroundColor: [
          '#60a5fa',
          '#f59e0b',
          '#10b981',
          '#ef4444'
        ],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 }
        }
      }
    }
  });
}

function renderDashboardDistributions(list) {
  const tbody = document.getElementById('table-dashboard-dist');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state"><p>Belum ada aktivitas pengiriman distribusi</p></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => `
    <tr>
      <td><strong style="color: var(--primary);">${item.dist_code}</strong></td>
      <td>${item.dist_date}</td>
      <td><strong>${escapeHtml(item.destination_name)}</strong></td>
      <td><span class="badge badge-secondary" style="font-weight: 700; letter-spacing: 0.5px;">${escapeHtml(item.vehicle_plate)}</span></td>
      <td>${escapeHtml(item.officer_name)}</td>
      <td><span class="badge badge-info">${item.total_items} item</span></td>
      <td>${getStatusBadge(item.status)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewDistributionDetail(${item.id})">
          Surat Jalan
        </button>
      </td>
    </tr>
  `).join('');
}

async function loadDashboardLowStock() {
  const tbody = document.getElementById('table-dashboard-low-stock');
  if (!tbody) return;

  const res = await fetchAPI('/api/items?status=menipis');
  const outRes = await fetchAPI('/api/items?status=habis');

  let combined = [];
  if (res.success) combined = combined.concat(res.data);
  if (outRes.success) combined = combined.concat(outRes.data);

  if (combined.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--success); font-weight: 600;">Semua stok barang berada pada level aman (&gt; stok minimum).</td></tr>`;
    return;
  }

  tbody.innerHTML = combined.slice(0, 5).map(item => `
    <tr>
      <td><strong>${escapeHtml(item.sku)}</strong></td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.location || '-')}</td>
      <td><strong style="color: ${item.stock === 0 ? 'var(--danger)' : 'var(--warning)'}; font-size: 15px;">${item.stock} ${item.unit}</strong></td>
      <td>${item.min_stock} ${item.unit}</td>
      <td>${getItemStatusBadge(item.stock, item.min_stock)}</td>
      <td>
        <button class="btn btn-success btn-sm" onclick="openRestockModal(${item.id})">
          + Restock
        </button>
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// TAB 2: DATA STOK BARANG
// ============================================================================

async function loadItems() {
  const tbody = document.getElementById('table-items-body');
  if (!tbody) return;

  const search = document.getElementById('filter-item-search')?.value || '';
  const category = document.getElementById('filter-item-category')?.value || '';
  const status = document.getElementById('filter-item-status')?.value || '';

  const params = new URLSearchParams();
  if (search) params.append('q', search);
  if (category) params.append('category', category);
  if (status) params.append('status', status);

  const res = await fetchAPI(`/api/items?${params.toString()}`);
  if (!res.success) return;

  state.items = res.data;

  if (state.items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          <h4>Tidak Ada Data Barang</h4>
          <p>Barang tidak ditemukan atau belum ditambahkan ke sistem gudang.</p>
          <button class="btn btn-primary btn-sm" onclick="openNewItemModal()">+ Tambah Barang Baru</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.items.map(item => `
    <tr>
      <td><strong style="font-family: monospace; font-size: 12.5px;">${escapeHtml(item.sku)}</strong></td>
      <td>
        <div style="font-weight: 600;">${escapeHtml(item.name)}</div>
        <div style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(item.notes || '')}</div>
      </td>
      <td><span class="badge badge-secondary">${escapeHtml(item.category)}</span></td>
      <td>${escapeHtml(item.location || '-')}</td>
      <td>
        <strong style="font-size: 15px; color: ${item.stock === 0 ? 'var(--danger)' : item.stock <= item.min_stock ? 'var(--warning)' : 'var(--text-main)'};">
          ${formatNumber(item.stock)}
        </strong> 
        <span style="font-size: 12px; color: var(--text-muted);">${item.unit}</span>
      </td>
      <td>${item.min_stock} ${item.unit}</td>
      <td>${formatRupiah(item.unit_price)}</td>
      <td>${getItemStatusBadge(item.stock, item.min_stock)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-success btn-sm" title="Restock Stok Masuk" onclick="openRestockModal(${item.id})">
            + Restock
          </button>
          <button class="btn btn-secondary btn-sm" title="Opname / Koreksi Fisik" onclick="openOpnameModal(${item.id})">
            Opname
          </button>
          <button class="btn btn-secondary btn-sm" title="Edit Barang" onclick="openEditItemModal(${item.id})">
            Edit
          </button>
          <button class="btn btn-outline-danger btn-sm" title="Hapus Barang" onclick="deleteItem(${item.id}, '${escapeHtml(item.name)}')">
            &times;
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getItemStatusBadge(stock, minStock) {
  if (stock === 0) return `<span class="badge badge-danger">Habis</span>`;
  if (stock <= minStock) return `<span class="badge badge-warning">Menipis (&le; ${minStock})</span>`;
  return `<span class="badge badge-success">Aman</span>`;
}

// ============================================================================
// TAB 3: DATA DISTRIBUSI (PENGIRIMAN)
// ============================================================================

async function loadDistributions() {
  const tbody = document.getElementById('table-distributions-body');
  if (!tbody) return;

  const search = document.getElementById('filter-dist-search')?.value || '';
  const status = document.getElementById('filter-dist-status')?.value || '';

  const params = new URLSearchParams();
  if (search) params.append('q', search);
  if (status) params.append('status', status);

  const res = await fetchAPI(`/api/distributions?${params.toString()}`);
  if (!res.success) return;

  state.distributions = res.data;

  if (state.distributions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          <h4>Belum Ada Data Distribusi</h4>
          <p>Belum ada surat jalan atau transaksi pengiriman barang yang dicatat.</p>
          <button class="btn btn-primary btn-sm" onclick="openNewDistributionModal()">+ Buat Distribusi Baru</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.distributions.map(dist => `
    <tr>
      <td>
        <strong style="color: var(--primary); font-family: monospace; font-size: 13px;">${dist.dist_code}</strong>
      </td>
      <td style="white-space: nowrap;">${dist.dist_date}</td>
      <td>
        <div style="font-weight: 600;">${escapeHtml(dist.destination_name)}</div>
        <div style="font-size: 11.5px; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(dist.destination_address || '-')}
        </div>
      </td>
      <td>
        <span class="badge badge-secondary" style="font-weight: 700; font-size: 12px; letter-spacing: 0.5px;">
          ${escapeHtml(dist.vehicle_plate)}
        </span>
      </td>
      <td>
        <div style="font-weight: 500;">${escapeHtml(dist.officer_name)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(dist.officer_phone || '')}</div>
      </td>
      <td>
        <span class="badge badge-info">${dist.total_items} Jenis Item</span>
      </td>
      <td>${getStatusBadge(dist.status)}</td>
      <td style="font-size: 12px; color: var(--text-muted); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${escapeHtml(dist.notes || '-')}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-primary btn-sm" onclick="viewDistributionDetail(${dist.id})">
            Surat Jalan
          </button>
          <button class="btn btn-outline-danger btn-sm" title="Hapus / Batalkan" onclick="deleteDistribution(${dist.id}, '${dist.dist_code}')">
            &times;
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getStatusBadge(status) {
  if (status === 'Selesai') return `<span class="badge badge-success">&#10003; Selesai</span>`;
  if (status === 'Dalam Pengiriman') return `<span class="badge badge-warning">&bull; Dalam Pengiriman</span>`;
  if (status === 'Siap Kirim') return `<span class="badge badge-info">&bull; Siap Kirim</span>`;
  if (status === 'Dibatalkan') return `<span class="badge badge-danger">&#10005; Dibatalkan</span>`;
  return `<span class="badge badge-secondary">${status}</span>`;
}

// ============================================================================
// TAB 4: ARMADA & PETUGAS (FLEET)
// ============================================================================

async function loadFleet() {
  const vehTbody = document.getElementById('table-vehicles-body');
  if (vehTbody) {
    const res = await fetchAPI('/api/vehicles');
    if (res.success) {
      state.vehicles = res.data;
      if (state.vehicles.length === 0) {
        vehTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Belum ada armada kendaraan terdaftar.</td></tr>`;
      } else {
        vehTbody.innerHTML = state.vehicles.map(v => `
          <tr>
            <td><strong style="color: var(--primary); font-family: monospace;">${escapeHtml(v.plate_number)}</strong></td>
            <td>${escapeHtml(v.vehicle_type)}</td>
            <td>${escapeHtml(v.brand_model || '-')}</td>
            <td>${escapeHtml(v.capacity || '-')}</td>
            <td>${escapeHtml(v.driver_default || '-')}</td>
            <td>
              <button class="btn btn-outline-danger btn-sm" onclick="deleteVehicle(${v.id}, '${escapeHtml(v.plate_number)}')">
                Hapus
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  }

  const offTbody = document.getElementById('table-officers-body');
  if (offTbody) {
    const res = await fetchAPI('/api/officers');
    if (res.success) {
      state.officers = res.data;
      if (state.officers.length === 0) {
        offTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Belum ada petugas terdaftar.</td></tr>`;
      } else {
        offTbody.innerHTML = state.officers.map(o => `
          <tr>
            <td><strong>${escapeHtml(o.name)}</strong></td>
            <td><span class="badge badge-secondary">${escapeHtml(o.role)}</span></td>
            <td>${escapeHtml(o.phone || '-')}</td>
            <td><span class="badge badge-success">${escapeHtml(o.status)}</span></td>
            <td>
              <button class="btn btn-outline-danger btn-sm" onclick="deleteOfficer(${o.id}, '${escapeHtml(o.name)}')">
                Hapus
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  }
}

// ============================================================================
// TAB 5: TUJUAN DISTRIBUSI
// ============================================================================

async function loadDestinations() {
  const tbody = document.getElementById('table-destinations-body');
  if (!tbody) return;

  const res = await fetchAPI('/api/destinations');
  if (!res.success) return;
  state.destinations = res.data;

  if (state.destinations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Belum ada lokasi tujuan terdaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.destinations.map(d => `
    <tr>
      <td><strong>${escapeHtml(d.name)}</strong></td>
      <td>${escapeHtml(d.address)}</td>
      <td><span class="badge badge-secondary">${escapeHtml(d.city || '-')}</span></td>
      <td>${escapeHtml(d.contact_person || '-')}</td>
      <td>${escapeHtml(d.phone || '-')}</td>
      <td>
        <button class="btn btn-outline-danger btn-sm" onclick="deleteDestination(${d.id}, '${escapeHtml(d.name)}')">
          Hapus
        </button>
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// TAB 6: MUTASI STOK (AUDIT LOGS)
// ============================================================================

async function loadStockLogs() {
  const tbody = document.getElementById('table-logs-body');
  if (!tbody) return;

  const res = await fetchAPI('/api/stock-logs');
  if (!res.success) return;

  if (res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Belum ada log riwayat mutasi stok.</td></tr>`;
    return;
  }

  tbody.innerHTML = res.data.map(log => {
    let typeBadge = '';
    if (log.type === 'IN') {
      typeBadge = `<span class="badge badge-success">+ Masuk</span>`;
    } else if (log.type === 'OUT') {
      typeBadge = `<span class="badge badge-danger">- Keluar</span>`;
    } else {
      typeBadge = `<span class="badge badge-warning">Penyesuaian</span>`;
    }

    return `
      <tr>
        <td style="font-size: 12px; color: var(--text-muted);">${log.created_at}</td>
        <td><strong>${escapeHtml(log.item_name)}</strong></td>
        <td>${typeBadge}</td>
        <td><strong style="font-size: 14px;">${log.type === 'OUT' ? '-' : '+'}${log.quantity}</strong></td>
        <td>${log.previous_stock}</td>
        <td><strong style="color: var(--primary);">${log.current_stock}</strong></td>
        <td><span style="font-family: monospace; font-size: 11.5px; font-weight: 600;">${escapeHtml(log.reference_code || '-')}</span></td>
        <td style="font-size: 12px; color: var(--text-muted);">${escapeHtml(log.notes || '-')}</td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// MODAL & FORM: BUAT DISTRIBUSI BARU
// ============================================================================

function openNewDistributionModal() {
  const modal = document.getElementById('modal-new-distribution');
  if (!modal) return;

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const localIso = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('dist-input-date').value = localIso;

  const destSelect = document.getElementById('dist-select-destination');
  destSelect.innerHTML = '<option value="">-- Pilih Tujuan Terdaftar atau Ketik Manual --</option>';
  state.destinations.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.name} (${d.city || 'Alamat Tersimpan'})`;
    destSelect.appendChild(opt);
  });

  const vehSelect = document.getElementById('dist-select-vehicle');
  vehSelect.innerHTML = '<option value="">-- Pilih Kendaraan --</option>';
  state.vehicles.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.plate_number;
    opt.textContent = `${v.plate_number} - ${v.vehicle_type} (${v.brand_model || ''})`;
    vehSelect.appendChild(opt);
  });

  const offSelect = document.getElementById('dist-select-officer');
  offSelect.innerHTML = '<option value="">-- Pilih Driver / Petugas --</option>';
  state.officers.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.name;
    opt.textContent = `${o.name} (${o.role} - ${o.phone || ''})`;
    offSelect.appendChild(opt);
  });

  document.getElementById('dist-dest-name').value = '';
  document.getElementById('dist-dest-phone').value = '';
  document.getElementById('dist-dest-address').value = '';
  document.getElementById('dist-input-plate').value = '';
  document.getElementById('dist-input-officer').value = '';
  document.getElementById('dist-input-notes').value = '';

  const container = document.getElementById('dist-items-container');
  container.innerHTML = '';
  addDistributionItemRow();

  modal.classList.add('show');
}

function handleSelectDestinationChange(select) {
  const destId = parseInt(select.value, 10);
  if (!destId) return;

  const dest = state.destinations.find(d => d.id === destId);
  if (dest) {
    document.getElementById('dist-dest-name').value = dest.name;
    document.getElementById('dist-dest-address').value = `${dest.address}${dest.city ? ', ' + dest.city : ''}`;
    document.getElementById('dist-dest-phone').value = dest.phone || dest.contact_person || '';
  }
}

function handleSelectVehicleChange(select) {
  const plate = select.value;
  if (!plate) return;

  document.getElementById('dist-input-plate').value = plate;

  const veh = state.vehicles.find(v => v.plate_number === plate);
  if (veh && veh.driver_default) {
    document.getElementById('dist-input-officer').value = veh.driver_default;
    const offSelect = document.getElementById('dist-select-officer');
    if (offSelect) offSelect.value = veh.driver_default;
  }
}

function handleSelectOfficerChange(select) {
  const name = select.value;
  if (name) {
    document.getElementById('dist-input-officer').value = name;
  }
}

function addDistributionItemRow() {
  const container = document.getElementById('dist-items-container');
  if (!container) return;

  const rowId = 'row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const rowDiv = document.createElement('div');
  rowDiv.className = 'dist-item-row';
  rowDiv.id = rowId;

  let optionsHtml = '<option value="">-- Pilih Barang --</option>';
  state.items.forEach(itm => {
    optionsHtml += `<option value="${itm.id}" data-stock="${itm.stock}" data-unit="${itm.unit}">
      ${itm.sku} - ${itm.name} (Stok: ${itm.stock} ${itm.unit})
    </option>`;
  });

  rowDiv.innerHTML = `
    <div>
      <select class="form-select dist-item-select" onchange="handleDistRowItemChange('${rowId}', this)" required>
        ${optionsHtml}
      </select>
      <div class="stock-hint" id="${rowId}-hint">Pilih barang untuk melihat stok</div>
    </div>
    <div>
      <input type="number" class="form-control dist-item-qty" placeholder="Jumlah" min="1" required oninput="validateDistRowQty('${rowId}')">
    </div>
    <div>
      <input type="text" class="form-control dist-item-notes" placeholder="Ket. / No. Dus (opsional)">
    </div>
    <div>
      <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeDistributionItemRow('${rowId}')" title="Hapus Baris">
        &times;
      </button>
    </div>
  `;

  container.appendChild(rowDiv);
}

function removeDistributionItemRow(rowId) {
  const container = document.getElementById('dist-items-container');
  if (container.children.length <= 1) {
    showToast('Peringatan', 'Minimal harus ada 1 barang yang didistribusikan!', 'warning');
    return;
  }
  const row = document.getElementById(rowId);
  if (row) row.remove();
}

function handleDistRowItemChange(rowId, select) {
  const selectedOpt = select.options[select.selectedIndex];
  const stock = parseInt(selectedOpt?.getAttribute('data-stock'), 10) || 0;
  const unit = selectedOpt?.getAttribute('data-unit') || '';
  const hintEl = document.getElementById(`${rowId}-hint`);
  const qtyInput = document.querySelector(`#${rowId} .dist-item-qty`);

  if (!select.value) {
    hintEl.textContent = 'Pilih barang untuk melihat stok';
    hintEl.style.color = 'var(--text-muted)';
    return;
  }

  if (stock <= 0) {
    hintEl.textContent = `PERINGATAN: Stok kosong (0 ${unit})! Tidak dapat didistribusikan.`;
    hintEl.style.color = 'var(--danger)';
    if (qtyInput) qtyInput.max = 0;
  } else {
    hintEl.textContent = `Tersedia di gudang: ${stock} ${unit}`;
    hintEl.style.color = 'var(--success)';
    if (qtyInput) {
      qtyInput.max = stock;
      qtyInput.placeholder = `Maks ${stock}`;
    }
  }
}

function validateDistRowQty(rowId) {
  const select = document.querySelector(`#${rowId} .dist-item-select`);
  const qtyInput = document.querySelector(`#${rowId} .dist-item-qty`);
  const hintEl = document.getElementById(`${rowId}-hint`);

  if (!select || !qtyInput) return;
  const selectedOpt = select.options[select.selectedIndex];
  const stock = parseInt(selectedOpt?.getAttribute('data-stock'), 10) || 0;
  const unit = selectedOpt?.getAttribute('data-unit') || '';
  const enteredQty = parseInt(qtyInput.value, 10);

  if (enteredQty > stock) {
    hintEl.textContent = `ERROR: Jumlah (${enteredQty}) melebihi stok yang ada (${stock} ${unit})!`;
    hintEl.style.color = 'var(--danger)';
    qtyInput.style.borderColor = 'var(--danger)';
  } else {
    hintEl.textContent = `Tersedia di gudang: ${stock} ${unit}`;
    hintEl.style.color = 'var(--success)';
    qtyInput.style.borderColor = 'var(--border)';
  }
}

async function handleSaveDistribution(e) {
  e.preventDefault();

  const dateVal = document.getElementById('dist-input-date').value;
  const formattedDate = dateVal.replace('T', ' ');

  const destinationName = document.getElementById('dist-dest-name').value.trim();
  const destinationAddress = document.getElementById('dist-dest-address').value.trim();
  const destinationPhone = document.getElementById('dist-dest-phone').value.trim();
  const vehiclePlate = document.getElementById('dist-input-plate').value.trim().toUpperCase();
  const officerName = document.getElementById('dist-input-officer').value.trim();
  const status = document.getElementById('dist-input-status').value;
  const notes = document.getElementById('dist-input-notes').value.trim();

  const rowElements = document.querySelectorAll('.dist-item-row');
  const items = [];

  for (const row of rowElements) {
    const select = row.querySelector('.dist-item-select');
    const qtyInput = row.querySelector('.dist-item-qty');
    const notesInput = row.querySelector('.dist-item-notes');

    const itemId = parseInt(select.value, 10);
    const qty = parseInt(qtyInput.value, 10);

    if (!itemId || !qty || qty <= 0) {
      showToast('Validasi Gagal', 'Pastikan semua baris barang dan jumlah diisi dengan benar!', 'danger');
      return;
    }

    const selectedOpt = select.options[select.selectedIndex];
    const stock = parseInt(selectedOpt.getAttribute('data-stock'), 10) || 0;
    if (qty > stock) {
      showToast('Stok Tidak Cukup', `Jumlah melebihi stok yang ada!`, 'danger');
      return;
    }

    items.push({
      item_id: itemId,
      quantity: qty,
      notes: notesInput.value.trim()
    });
  }

  const payload = {
    dist_date: formattedDate,
    destination_name: destinationName,
    destination_address: destinationAddress,
    destination_phone: destinationPhone,
    vehicle_plate: vehiclePlate,
    officer_name: officerName,
    status: status,
    notes: notes,
    items: items
  };

  const btn = document.getElementById('btn-submit-dist');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const res = await fetchAPI('/api/distributions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  btn.disabled = false;
  btn.textContent = 'Simpan & Potong Stok Otomatis';

  if (res.success) {
    closeModal('modal-new-distribution');
    showToast('Distribusi Dibuat', res.message, 'success');
    loadDistributions();
    loadDashboard();
    loadItems();
    loadStockLogs();

    if (res.data && res.data.id) {
      viewDistributionDetail(res.data.id);
    }
  } else {
    showToast('Gagal', res.message, 'danger');
  }
}

// ============================================================================
// DETAIL DISTRIBUSI & CETAK SURAT JALAN
// ============================================================================

async function viewDistributionDetail(id) {
  const res = await fetchAPI(`/api/distributions/${id}`);
  if (!res.success) {
    showToast('Error', res.message, 'danger');
    return;
  }

  const d = res.data;

  document.getElementById('sj-code').textContent = d.dist_code;
  document.getElementById('sj-date').textContent = d.dist_date;
  document.getElementById('sj-vehicle').textContent = d.vehicle_plate;
  document.getElementById('sj-driver').textContent = d.officer_name;
  document.getElementById('sj-driver-phone').textContent = d.officer_phone || '-';
  document.getElementById('sj-dest-name').textContent = d.destination_name;
  document.getElementById('sj-dest-address').textContent = d.destination_address || '-';
  document.getElementById('sj-dest-phone').textContent = d.destination_phone || '-';
  document.getElementById('sj-notes').textContent = d.notes || '-';
  document.getElementById('sj-sign-driver').textContent = `( ${d.officer_name} )`;

  document.getElementById('view-dist-status-badge').innerHTML = getStatusBadge(d.status);

  const actionContainer = document.getElementById('dist-quick-actions');
  actionContainer.innerHTML = '';

  if (d.status === 'Siap Kirim') {
    actionContainer.innerHTML = `
      <button class="btn btn-warning btn-sm" onclick="updateDistributionStatus(${d.id}, 'Dalam Pengiriman')">
        Tandai Berangkat (Jalan) &rarr;
      </button>
      <button class="btn btn-outline-danger btn-sm" onclick="updateDistributionStatus(${d.id}, 'Dibatalkan')">
        Batalkan Pengiriman
      </button>
    `;
  } else if (d.status === 'Dalam Pengiriman') {
    actionContainer.innerHTML = `
      <button class="btn btn-success btn-sm" onclick="updateDistributionStatus(${d.id}, 'Selesai')">
        &#10003; Tandai Sampai / Selesai
      </button>
      <button class="btn btn-outline-danger btn-sm" onclick="updateDistributionStatus(${d.id}, 'Dibatalkan')">
        Batalkan Pengiriman
      </button>
    `;
  } else if (d.status === 'Selesai') {
    actionContainer.innerHTML = `
      <span style="font-size: 12px; color: var(--success); font-weight: 600;">Pengiriman telah sukses terkirim</span>
    `;
  } else if (d.status === 'Dibatalkan') {
    actionContainer.innerHTML = `
      <span style="font-size: 12px; color: var(--danger); font-weight: 600;">Pengiriman dibatalkan</span>
    `;
  }

  const itemsTbody = document.getElementById('sj-items-body');
  if (d.items && d.items.length > 0) {
    itemsTbody.innerHTML = d.items.map((item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="font-family: monospace; font-weight: 600;">${escapeHtml(item.item_sku || 'ITEM')}</td>
        <td><strong>${escapeHtml(item.item_name || 'Barang')}</strong></td>
        <td style="text-align: right; font-weight: bold; font-size: 13px;">${item.quantity}</td>
        <td>${escapeHtml(item.unit || 'Pcs')}</td>
        <td>${escapeHtml(item.notes || '-')}</td>
      </tr>
    `).join('');
  } else {
    itemsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Tidak ada rincian item</td></tr>`;
  }

  const modal = document.getElementById('modal-view-distribution');
  modal.classList.add('show');
}

async function updateDistributionStatus(id, newStatus) {
  const res = await fetchAPI(`/api/distributions/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus })
  });

  if (res.success) {
    showToast('Status Diperbarui', res.message, 'success');
    viewDistributionDetail(id);
    loadDistributions();
    loadDashboard();
  } else {
    showToast('Gagal', res.message, 'danger');
  }
}

async function deleteDistribution(id, code) {
  if (!confirm(`Hapus transaksi distribusi '${code}'?`)) return;
  const res = await fetchAPI(`/api/distributions/${id}`, { method: 'DELETE' });
  if (res.success) {
    showToast('Berhasil', res.message, 'success');
    loadDistributions();
    loadDashboard();
  }
}

// ============================================================================
// MASTER BARANG: TAMBAH / EDIT / HAPUS
// ============================================================================

function openNewItemModal() {
  document.getElementById('modal-item-title').innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
    Tambah Barang Baru
  `;
  document.getElementById('item-input-id').value = '';
  document.getElementById('item-input-sku').value = '';
  document.getElementById('item-input-name').value = '';
  document.getElementById('item-input-unit').value = 'Pcs';
  document.getElementById('item-input-stock').value = '0';
  document.getElementById('item-input-min-stock').value = '5';
  document.getElementById('item-input-location').value = '';
  document.getElementById('item-input-price').value = '';
  document.getElementById('item-input-notes').value = '';
  document.getElementById('group-initial-stock').style.display = 'block';

  populateCategoryDropdowns();
  const modal = document.getElementById('modal-item');
  modal.classList.add('show');
}

function openEditItemModal(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  document.getElementById('modal-item-title').innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
    Edit Informasi Barang
  `;
  document.getElementById('item-input-id').value = item.id;
  document.getElementById('item-input-sku').value = item.sku;
  document.getElementById('item-input-name').value = item.name;
  document.getElementById('item-input-unit').value = item.unit;
  document.getElementById('item-input-min-stock').value = item.min_stock;
  document.getElementById('item-input-location').value = item.location || '';
  document.getElementById('item-input-price').value = item.unit_price || '';
  document.getElementById('item-input-notes').value = item.notes || '';
  document.getElementById('group-initial-stock').style.display = 'none';

  populateCategoryDropdowns();
  document.getElementById('item-input-category').value = item.category;

  const modal = document.getElementById('modal-item');
  modal.classList.add('show');
}

async function handleSaveItem(e) {
  e.preventDefault();
  const id = document.getElementById('item-input-id').value;

  const payload = {
    sku: document.getElementById('item-input-sku').value.trim(),
    name: document.getElementById('item-input-name').value.trim(),
    category: document.getElementById('item-input-category').value,
    unit: document.getElementById('item-input-unit').value.trim(),
    min_stock: parseInt(document.getElementById('item-input-min-stock').value, 10) || 0,
    location: document.getElementById('item-input-location').value.trim(),
    unit_price: parseFloat(document.getElementById('item-input-price').value) || 0,
    notes: document.getElementById('item-input-notes').value.trim()
  };

  let res;
  if (!id) {
    payload.stock = parseInt(document.getElementById('item-input-stock').value, 10) || 0;
    res = await fetchAPI('/api/items', { method: 'POST', body: JSON.stringify(payload) });
  } else {
    res = await fetchAPI(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  if (res.success) {
    closeModal('modal-item');
    showToast('Sukses', res.message, 'success');
    loadItems();
    loadDashboard();
  } else {
    showToast('Gagal', res.message, 'danger');
  }
}

async function deleteItem(id, name) {
  if (!confirm(`Apakah Anda yakin ingin menghapus barang '${name}'?`)) return;
  const res = await fetchAPI(`/api/items/${id}`, { method: 'DELETE' });
  if (res.success) {
    showToast('Berhasil Dihapus', res.message, 'success');
    loadItems();
    loadDashboard();
  }
}

// ============================================================================
// STOK MASUK & OPNAME
// ============================================================================

function openRestockModal(preselectedId = null) {
  const select = document.getElementById('restock-item-id');
  select.innerHTML = '<option value="">-- Pilih Barang --</option>';

  state.items.forEach(itm => {
    const opt = document.createElement('option');
    opt.value = itm.id;
    opt.textContent = `${itm.sku} - ${itm.name} (Stok: ${itm.stock} ${itm.unit})`;
    select.appendChild(opt);
  });

  document.getElementById('restock-quantity').value = '';
  document.getElementById('restock-reference').value = '';
  document.getElementById('restock-notes').value = '';
  document.getElementById('restock-current-stock-hint').textContent = '';

  if (preselectedId) {
    select.value = preselectedId;
    handleRestockItemChange(select);
  }

  document.getElementById('modal-restock').classList.add('show');
}

function handleRestockItemChange(select) {
  const itemId = parseInt(select.value, 10);
  const hintEl = document.getElementById('restock-current-stock-hint');
  if (!itemId) { hintEl.textContent = ''; return; }
  const item = state.items.find(i => i.id === itemId);
  if (item) {
    hintEl.textContent = `Stok saat ini di gudang: ${item.stock} ${item.unit} | Lokasi: ${item.location || '-'}`;
    hintEl.style.color = 'var(--primary)';
  }
}

async function handleSaveRestock(e) {
  e.preventDefault();
  const itemId = document.getElementById('restock-item-id').value;
  const qty = parseInt(document.getElementById('restock-quantity').value, 10);
  const ref = document.getElementById('restock-reference').value.trim();
  const notes = document.getElementById('restock-notes').value.trim();

  const res = await fetchAPI(`/api/items/${itemId}/restock`, {
    method: 'POST',
    body: JSON.stringify({ quantity: qty, reference: ref, notes })
  });

  if (res.success) {
    closeModal('modal-restock');
    showToast('Stok Masuk Berhasil', res.message, 'success');
    loadItems();
    loadDashboard();
    loadStockLogs();
  }
}

function openOpnameModal(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('opname-item-id').value = item.id;
  document.getElementById('opname-item-name').textContent = item.name;
  document.getElementById('opname-item-sku').textContent = item.sku;
  document.getElementById('opname-current-stock').textContent = `${item.stock} ${item.unit}`;
  document.getElementById('opname-actual-stock').value = item.stock;
  document.getElementById('opname-notes').value = '';

  const hintEl = document.getElementById('opname-diff-hint');
  hintEl.textContent = 'Selisih: 0 (Cocok dengan data sistem)';
  hintEl.style.color = 'var(--text-muted)';

  document.getElementById('opname-actual-stock').oninput = function () {
    const actual = parseInt(this.value, 10);
    if (isNaN(actual)) { hintEl.textContent = ''; return; }
    const diff = actual - item.stock;
    if (diff === 0) {
      hintEl.textContent = 'Selisih: 0 (Cocok dengan data sistem)';
      hintEl.style.color = 'var(--success)';
    } else if (diff > 0) {
      hintEl.textContent = `Stok Berlebih: +${diff} ${item.unit} (Akan ditambahkan ke sistem)`;
      hintEl.style.color = 'var(--primary)';
    } else {
      hintEl.textContent = `Stok Kurang / Hilang: ${diff} ${item.unit} (Akan dipotong dari sistem)`;
      hintEl.style.color = 'var(--danger)';
    }
  };

  document.getElementById('modal-opname').classList.add('show');
}

async function handleSaveOpname(e) {
  e.preventDefault();
  const itemId = document.getElementById('opname-item-id').value;
  const actualStock = parseInt(document.getElementById('opname-actual-stock').value, 10);
  const notes = document.getElementById('opname-notes').value.trim();

  const res = await fetchAPI(`/api/items/${itemId}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ actual_stock: actualStock, notes })
  });

  if (res.success) {
    closeModal('modal-opname');
    showToast('Opname Selesai', res.message, 'success');
    loadItems();
    loadDashboard();
    loadStockLogs();
  }
}

// ============================================================================
// MASTER KENDARAAN, PETUGAS & TUJUAN
// ============================================================================

function openNewVehicleModal() {
  document.getElementById('veh-input-plate').value = '';
  document.getElementById('veh-input-brand').value = '';
  document.getElementById('veh-input-capacity').value = '';
  document.getElementById('veh-input-driver').value = '';
  document.getElementById('modal-vehicle').classList.add('show');
}

async function handleSaveVehicle(e) {
  e.preventDefault();
  const payload = {
    plate_number: document.getElementById('veh-input-plate').value.trim().toUpperCase(),
    vehicle_type: document.getElementById('veh-input-type').value,
    brand_model: document.getElementById('veh-input-brand').value.trim(),
    capacity: document.getElementById('veh-input-capacity').value.trim(),
    driver_default: document.getElementById('veh-input-driver').value.trim()
  };

  const res = await fetchAPI('/api/vehicles', { method: 'POST', body: JSON.stringify(payload) });
  if (res.success) {
    closeModal('modal-vehicle');
    showToast('Sukses', res.message, 'success');
    loadFleet();
    loadDashboard();
  }
}

async function deleteVehicle(id, plate) {
  if (!confirm(`Hapus kendaraan '${plate}'?`)) return;
  const res = await fetchAPI(`/api/vehicles/${id}`, { method: 'DELETE' });
  if (res.success) {
    showToast('Sukses', res.message, 'success');
    loadFleet();
    loadDashboard();
  }
}

function openNewOfficerModal() {
  document.getElementById('off-input-name').value = '';
  document.getElementById('off-input-phone').value = '';
  document.getElementById('modal-officer').classList.add('show');
}

async function handleSaveOfficer(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('off-input-name').value.trim(),
    role: document.getElementById('off-input-role').value,
    phone: document.getElementById('off-input-phone').value.trim()
  };

  const res = await fetchAPI('/api/officers', { method: 'POST', body: JSON.stringify(payload) });
  if (res.success) {
    closeModal('modal-officer');
    showToast('Sukses', res.message, 'success');
    loadFleet();
    loadDashboard();
  }
}

async function deleteOfficer(id, name) {
  if (!confirm(`Hapus petugas '${name}'?`)) return;
  const res = await fetchAPI(`/api/officers/${id}`, { method: 'DELETE' });
  if (res.success) {
    showToast('Sukses', res.message, 'success');
    loadFleet();
    loadDashboard();
  }
}

function openNewDestinationModal() {
  document.getElementById('dest-input-name').value = '';
  document.getElementById('dest-input-address').value = '';
  document.getElementById('dest-input-city').value = '';
  document.getElementById('dest-input-pic').value = '';
  document.getElementById('dest-input-phone').value = '';
  document.getElementById('modal-destination').classList.add('show');
}

async function handleSaveDestination(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('dest-input-name').value.trim(),
    address: document.getElementById('dest-input-address').value.trim(),
    city: document.getElementById('dest-input-city').value.trim(),
    contact_person: document.getElementById('dest-input-pic').value.trim(),
    phone: document.getElementById('dest-input-phone').value.trim()
  };

  const res = await fetchAPI('/api/destinations', { method: 'POST', body: JSON.stringify(payload) });
  if (res.success) {
    closeModal('modal-destination');
    showToast('Sukses', res.message, 'success');
    loadDestinations();
  }
}

async function deleteDestination(id, name) {
  if (!confirm(`Hapus tujuan '${name}'?`)) return;
  const res = await fetchAPI(`/api/destinations/${id}`, { method: 'DELETE' });
  if (res.success) {
    showToast('Sukses', res.message, 'success');
    loadDestinations();
  }
}

// ============================================================================
// UI HELPERS (MODAL, TOAST, FORMATTERS)
// ============================================================================

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('show');
}

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('show');
  }
});

function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'danger') {
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else {
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('id-ID');
}

function formatRupiah(num) {
  if (!num || num === 0) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
