/**
 * SISTEM MANAJEMEN GUDANG & DISTRIBUSI LOGISTIK
 * Frontend Application Controller (app.js)
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
  const titleMap = {
    'tab-dashboard': 'Dashboard Gudang & Logistik',
    'tab-stok': 'Data Stok & Inventori Gudang',
    'tab-distribusi': 'Data Pengiriman & Distribusi Barang',
    'tab-armada': 'Armada Kendaraan & Petugas Pengirim',
    'tab-tujuan': 'Daftar Lokasi & Cabang Tujuan',
    'tab-mutasi': 'Riwayat Mutasi & Audit Trail Stok'
  };

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

  // Refresh target tab data
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
// DATA FETCHING & API CALLS
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
    const json = await res.json();
    return json;
  } catch (err) {
    console.error(`Error requesting ${endpoint}:`, err);
    showToast('Koneksi Gagal', 'Gagal menghubungi server.', 'danger');
    return { success: false, message: err.message };
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

  // Set Stat Cards
  document.getElementById('stat-items-count').textContent = d.items_count;
  document.getElementById('stat-total-stock').textContent = `${formatNumber(d.physical_stock)} unit total stok fisik`;

  document.getElementById('stat-dist-total').textContent = d.distribution_total;
  const inTransit = (d.distribution_status.find(s => s.status === 'Dalam Pengiriman') || {}).count || 0;
  document.getElementById('stat-dist-active').textContent = `${inTransit} sedang dalam pengiriman`;

  document.getElementById('stat-low-stock').textContent = d.low_stock_count;
  document.getElementById('stat-out-of-stock').textContent = `${d.out_of_stock_count} item stok habis (0)`;

  document.getElementById('stat-fleet-count').textContent = d.vehicles_count + d.officers_count;
  document.getElementById('stat-fleet-detail').textContent = `${d.vehicles_count} kendaraan, ${d.officers_count} petugas`;

  // Update Badges on Sidebar
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

  // Render Charts
  renderCategoryChart(d.category_stats);
  renderDistributionChart(d.distribution_status);

  // Render Recent Distributions
  renderDashboardDistributions(d.recent_distributions);

  // Load and Render Low Stock Table
  loadDashboardLowStock();
}

function renderCategoryChart(categories) {
  const ctx = document.getElementById('chart-category');
  if (!ctx) return;

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
  if (!ctx) return;

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
          '#60a5fa', // Siap Kirim (biru muda)
          '#f59e0b', // Dalam Pengiriman (kuning oranye)
          '#10b981', // Selesai (hijau)
          '#ef4444'  // Dibatalkan (merah)
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
  if (stock === 0) {
    return `<span class="badge badge-danger">Habis</span>`;
  }
  if (stock <= minStock) {
    return `<span class="badge badge-warning">Menipis (&le; ${minStock})</span>`;
  }
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
  // Load Vehicles
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

  // Load Officers
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

  // Set Default Date Time to Now
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const localIso = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('dist-input-date').value = localIso;

  // Populate Destination Select
  const destSelect = document.getElementById('dist-select-destination');
  destSelect.innerHTML = '<option value="">-- Pilih Tujuan Terdaftar atau Ketik Manual --</option>';
  state.destinations.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.name} (${d.city || 'Alamat Tersimpan'})`;
    destSelect.appendChild(opt);
  });

  // Populate Vehicle Select
  const vehSelect = document.getElementById('dist-select-vehicle');
  vehSelect.innerHTML = '<option value="">-- Pilih Kendaraan --</option>';
  state.vehicles.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.plate_number;
    opt.textContent = `${v.plate_number} - ${v.vehicle_type} (${v.brand_model || ''})`;
    vehSelect.appendChild(opt);
  });

  // Populate Officer Select
  const offSelect = document.getElementById('dist-select-officer');
  offSelect.innerHTML = '<option value="">-- Pilih Driver / Petugas --</option>';
  state.officers.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.name;
    opt.textContent = `${o.name} (${o.role} - ${o.phone || ''})`;
    offSelect.appendChild(opt);
  });

  // Reset fields
  document.getElementById('dist-dest-name').value = '';
  document.getElementById('dist-dest-phone').value = '';
  document.getElementById('dist-dest-address').value = '';
  document.getElementById('dist-input-plate').value = '';
  document.getElementById('dist-input-officer').value = '';
  document.getElementById('dist-input-notes').value = '';

  // Container Items: Start with 1 empty row
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

  // Auto pick driver default if vehicle has one
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

  // Build item options
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
  const stock = parseInt(selectedOpt.getAttribute('data-stock'), 10) || 0;
  const unit = selectedOpt.getAttribute('data-unit') || '';
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

  // Parse items
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
      showToast('Stok Tidak Cukup', `Jumlah melebihi stok yang ada untuk salah satu barang!`, 'danger');
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
  btn.textContent = 'Menyimpan & Memperbarui Stok...';

  const res = await fetchAPI('/api/distributions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  btn.disabled = false;
  btn.textContent = 'Simpan & Potong Stok Otomatis';

  if (res.success) {
    closeModal('modal-new-distribution');
    showToast('Distribusi Dibuat', res.message, 'success');
    
    // Refresh tables & dashboard
    loadDistributions();
    loadDashboard();
    loadItems();
    loadStockLogs();

    // Langsung buka modal view / Surat Jalan untuk pengiriman yang baru dibuat!
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

  // Set Surat Jalan Header & Meta
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

  // Status Badge in Modal
  document.getElementById('view-dist-status-badge').innerHTML = getStatusBadge(d.status);

  // Quick Action Buttons based on status
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
      <span style="font-size: 12px; color: var(--danger); font-weight: 600;">Pengiriman dibatalkan (stok dikembalikan)</span>
    `;
  }

  // Populate Items Table in Surat Jalan
  const itemsTbody = document.getElementById('sj-items-body');
  if (d.items && d.items.length > 0) {
    itemsTbody.innerHTML = d.items.map((item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="font-family: monospace; font-weight: 600;">${escapeHtml(item.item_sku)}</td>
        <td><strong>${escapeHtml(item.item_name)}</strong></td>
        <td style="text-align: right; font-weight: bold; font-size: 13px;">${item.quantity}</td>
        <td>${escapeHtml(item.unit)}</td>
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
  if (newStatus === 'Dibatalkan') {
    if (!confirm('Apakah Anda yakin ingin membatalkan pengiriman ini? Stok barang akan otomatis dikembalikan ke gudang!')) {
      return;
    }
  }

  const res = await fetchAPI(`/api/distributions/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus })
  });

  if (res.success) {
    showToast('Status Diperbarui', res.message, 'success');
    viewDistributionDetail(id);
    loadDistributions();
    loadDashboard();
    loadItems();
    loadStockLogs();
  } else {
    showToast('Gagal', res.message, 'danger');
  }
}

async function deleteDistribution(id, code) {
  if (!confirm(`Hapus transaksi distribusi '${code}'? Jika belum berstatus dibatalkan, stok barang akan dikembalikan ke gudang.`)) {
    return;
  }

  const res = await fetchAPI(`/api/distributions/${id}`, {
    method: 'DELETE'
  });

  if (res.success) {
    showToast('Berhasil', res.message, 'success');
    loadDistributions();
    loadDashboard();
    loadItems();
    loadStockLogs();
  } else {
    showToast('Gagal', res.message, 'danger');
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
  document.getElementById('group-initial-stock').style.display = 'none'; // jangan edit stok via edit form, gunakan restock/opname

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
    res = await fetchAPI('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } else {
    res = await fetchAPI(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
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
  if (!confirm(`Apakah Anda yakin ingin menghapus barang '${name}'?`)) {
    return;
  }

  const res = await fetchAPI(`/api/items/${id}`, {
    method: 'DELETE'
  });

  if (res.success) {
    showToast('Berhasil Dihapus', res.message, 'success');
    loadItems();
    loadDashboard();
  } else {
    showToast('Gagal Menghapus', res.message, 'danger');
  }
}

// ============================================================================
// STOK MASUK (RESTOCK)
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

  const modal = document.getElementById('modal-restock');
  modal.classList.add('show');
}

function handleRestockItemChange(select) {
  const itemId = parseInt(select.value, 10);
  const hintEl = document.getElementById('restock-current-stock-hint');
  if (!itemId) {
    hintEl.textContent = '';
    return;
  }
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

  if (!itemId || !qty || qty <= 0) {
    showToast('Gagal', 'Pilih barang dan jumlah stok masuk valid!', 'warning');
    return;
  }

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
  } else {
    showToast('Gagal', res.message, 'danger');
  }
}

// ============================================================================
// STOK OPNAME / KOREKSI FISIK
// ============================================================================

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
    if (isNaN(actual)) {
      hintEl.textContent = '';
      return;
    }
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

  const modal = document.getElementById('modal-opname');
  modal.classList.add('show');
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
  } else {
    showToast('Gagal', res.message, 'danger');
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

  const res = await fetchAPI('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (res.success) {
    closeModal('modal-vehicle');
    showToast('Sukses', res.message, 'success');
    loadFleet();
    loadDashboard();
  } else {
    showToast('Gagal', res.message, 'danger');
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

  const res = await fetchAPI('/api/officers', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (res.success) {
    closeModal('modal-officer');
    showToast('Sukses', res.message, 'success');
    loadFleet();
    loadDashboard();
  } else {
    showToast('Gagal', res.message, 'danger');
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

  const res = await fetchAPI('/api/destinations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (res.success) {
    closeModal('modal-destination');
    showToast('Sukses', res.message, 'success');
    loadDestinations();
    // Jika modal new distribution sedang terbuka, perbarui select tujuannya
    const destSelect = document.getElementById('dist-select-destination');
    if (destSelect) {
      await loadAllMasterData();
      destSelect.innerHTML = '<option value="">-- Pilih Tujuan Terdaftar atau Ketik Manual --</option>';
      state.destinations.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = `${d.name} (${d.city || 'Alamat Tersimpan'})`;
        destSelect.appendChild(opt);
      });
      destSelect.value = res.data.id;
      handleSelectDestinationChange(destSelect);
    }
  } else {
    showToast('Gagal', res.message, 'danger');
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

// Close modal on click outside content
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
