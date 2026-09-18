// RationNearMe - Main Citizen Application Logic & Interactive Map
// Implements: Location -> Item -> Stock -> Map -> Directions -> Alerts -> Reports

let mapInstance = null;
let mapMarkers = [];
let userLocationMarker = null;

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupNavigation();
  setupSearchAndFilters();
  setupDemoBar();
  initMap();
  renderApp();

  // Subscribe to store updates (both local and cross-tab)
  store.subscribe((event) => {
    if (event.type === 'STOCK_UPDATED') {
      // Check if any alerts were triggered
      if (event.triggeredAlerts && event.triggeredAlerts.length > 0) {
        event.triggeredAlerts.forEach(trig => {
          showNotificationToast(trig);
        });
      }
    }
    renderApp();
  });
}

// Navigation between Citizen Mode, Shopkeeper Mode, and Admin Mode
function setupNavigation() {
  const citizenView = document.getElementById('citizen-view');
  const shopkeeperView = document.getElementById('shopkeeper-view');
  const adminView = document.getElementById('admin-view');
  const roleButtons = document.querySelectorAll('.role-btn');

  roleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const role = btn.dataset.role;
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (role === 'citizen') {
        citizenView.style.display = 'block';
        shopkeeperView.style.display = 'none';
        adminView.style.display = 'none';
        setTimeout(() => {
          if (mapInstance) mapInstance.invalidateSize();
        }, 100);
      } else if (role === 'shopkeeper') {
        citizenView.style.display = 'none';
        shopkeeperView.style.display = 'block';
        adminView.style.display = 'none';
        if (window.renderShopkeeperDashboard) window.renderShopkeeperDashboard();
      } else if (role === 'admin') {
        citizenView.style.display = 'none';
        shopkeeperView.style.display = 'none';
        adminView.style.display = 'block';
        if (window.renderAdminDashboard) window.renderAdminDashboard();
      }
    });
  });
}

// Search, Items, and Filter handlers
function setupSearchAndFilters() {
  const locationInput = document.getElementById('location-input');
  const gpsBtn = document.getElementById('btn-use-gps');
  const itemSelect = document.getElementById('item-select');
  const searchBtn = document.getElementById('btn-search-main');
  const filterPills = document.querySelectorAll('.filter-pill');
  const viewBtns = document.querySelectorAll('.view-btn');

  // Populate item dropdown & chips
  populateCommodities();

  // Location input preset change
  locationInput.addEventListener('change', () => {
    updateLocationFromPreset(locationInput.value);
  });

  // GPS Simulation Button
  gpsBtn.addEventListener('click', () => {
    gpsBtn.innerHTML = '⏳ Locating...';
    setTimeout(() => {
      const userLoc = {
        name: 'Kakkanad Civil Station (Current GPS)',
        pincode: '682030',
        lat: 10.0159,
        lng: 76.3419
      };
      store.setUserLocation(userLoc);
      locationInput.value = 'kakkanad';
      gpsBtn.innerHTML = '📍 Use My Location';
      showToastBanner('Location Detected', 'Set to Kakkanad Civil Station, Kochi');
      renderApp();
    }, 450);
  });

  // Item dropdown selection
  itemSelect.addEventListener('change', () => {
    store.setSelectedItem(itemSelect.value);
    syncActiveChip(itemSelect.value);
  });

  // Search button
  searchBtn.addEventListener('click', () => {
    renderApp();
    const shopsListEl = document.getElementById('shops-list-container');
    if (shopsListEl) {
      shopsListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Status Filter Pills (All, Available, Low, Out)
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      window.activeStatusFilter = pill.dataset.filter;
      renderApp();
    });
  });

  // View switch: Split, List, Map
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const viewMode = btn.dataset.view;
      applyViewMode(viewMode);
    });
  });
}

function updateLocationFromPreset(presetKey) {
  const presets = {
    'kakkanad': { name: 'Kakkanad Civil Station, Kochi', pincode: '682030', lat: 10.0159, lng: 76.3419 },
    'palarivattom': { name: 'Palarivattom Junction, Kochi', pincode: '682025', lat: 10.0035, lng: 76.3115 },
    'vazhakkala': { name: 'Vazhakkala Temple Road, Kochi', pincode: '682021', lat: 10.0112, lng: 76.3275 },
    'edappally': { name: 'Edappally Metro Station, Kochi', pincode: '682024', lat: 10.0245, lng: 76.3075 },
    'thrikkakara': { name: 'Thrikkakara Municipality, Kochi', pincode: '682021', lat: 10.0340, lng: 76.3350 },
    'kalamassery': { name: 'Kalamassery HMT Road, Kochi', pincode: '683104', lat: 10.0480, lng: 76.3230 }
  };

  const selected = presets[presetKey] || presets['kakkanad'];
  store.setUserLocation(selected);
  renderApp();
}

function populateCommodities() {
  const items = store.getItems();
  const itemSelect = document.getElementById('item-select');
  const chipsWrapper = document.getElementById('item-chips-wrapper');
  const currentItem = store.getSelectedItem();

  itemSelect.innerHTML = items.map(item => 
    `<option value="${item.id}" ${item.id === currentItem ? 'selected' : ''}>${item.icon} ${item.name} (${item.localName.split('/')[0].trim()})</option>`
  ).join('');

  chipsWrapper.innerHTML = items.map(item => `
    <button class="item-chip ${item.id === currentItem ? 'active' : ''}" data-item-id="${item.id}">
      <span>${item.icon}</span>
      <span>${item.name}</span>
    </button>
  `).join('');

  chipsWrapper.querySelectorAll('.item-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const itemId = chip.dataset.itemId;
      store.setSelectedItem(itemId);
      itemSelect.value = itemId;
      syncActiveChip(itemId);
    });
  });
}

function syncActiveChip(itemId) {
  document.querySelectorAll('.item-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.itemId === itemId);
  });
}

function applyViewMode(viewMode) {
  const contentContainer = document.getElementById('content-container');
  const listCol = document.getElementById('col-list');
  const mapCol = document.getElementById('col-map');

  if (viewMode === 'split') {
    contentContainer.className = 'layout-split';
    listCol.style.display = 'block';
    mapCol.style.display = 'block';
  } else if (viewMode === 'list') {
    contentContainer.className = 'layout-list-only';
    listCol.style.display = 'block';
    mapCol.style.display = 'none';
  } else if (viewMode === 'map') {
    contentContainer.className = 'layout-map-only';
    listCol.style.display = 'none';
    mapCol.style.display = 'block';
  }

  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 150);
}

// Leaflet Map Initialization
function initMap() {
  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement || mapInstance) return;

  const userLoc = store.getUserLocation();

  // Create Leaflet map centered at user coordinates
  mapInstance = L.map('leaflet-map', {
    zoomControl: true,
    attributionControl: false
  }).setView([userLoc.lat, userLoc.lng], 13);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(mapInstance);
}

// Main Render Function for Citizen View
function renderApp() {
  const selectedItemId = store.getSelectedItem();
  const selectedItemObj = store.getItems().find(i => i.id === selectedItemId) || store.getItems()[0];
  const userLoc = store.getUserLocation();
  let shops = store.getShops();

  // Priority sorting:
  // 1. Available first, then Low, then Out of stock
  // 2. Distance nearest first
  const statusRank = { 'AVAILABLE': 1, 'LOW': 2, 'OUT_OF_STOCK': 3 };
  
  shops.sort((a, b) => {
    const statusA = (a.stock[selectedItemId] && a.stock[selectedItemId].status) || 'OUT_OF_STOCK';
    const statusB = (b.stock[selectedItemId] && b.stock[selectedItemId].status) || 'OUT_OF_STOCK';
    const rankDiff = (statusRank[statusA] || 4) - (statusRank[statusB] || 4);
    if (rankDiff !== 0) return rankDiff;
    return a.distanceKm - b.distanceKm;
  });

  // Calculate live item counts for the summary banner
  let countAvailable = 0;
  let countLow = 0;
  let countOut = 0;

  shops.forEach(shop => {
    const st = (shop.stock[selectedItemId] && shop.stock[selectedItemId].status) || 'OUT_OF_STOCK';
    if (st === 'AVAILABLE') countAvailable++;
    else if (st === 'LOW') countLow++;
    else if (st === 'OUT_OF_STOCK') countOut++;
  });

  renderStockSummaryBanner(selectedItemObj, countAvailable, countLow, countOut);

  // Apply status filter if selected
  const activeFilter = window.activeStatusFilter || 'all';
  let filteredShops = shops;
  if (activeFilter === 'available') {
    filteredShops = shops.filter(s => (s.stock[selectedItemId] && s.stock[selectedItemId].status) === 'AVAILABLE');
  } else if (activeFilter === 'low') {
    filteredShops = shops.filter(s => (s.stock[selectedItemId] && s.stock[selectedItemId].status) === 'LOW');
  } else if (activeFilter === 'out') {
    filteredShops = shops.filter(s => (s.stock[selectedItemId] && s.stock[selectedItemId].status) === 'OUT_OF_STOCK');
  }

  // Render Shop Cards
  renderShopCards(filteredShops, selectedItemId, selectedItemObj);

  // Update Map Markers
  updateMapMarkers(shops, selectedItemId, selectedItemObj, userLoc);
}

// Render the Live Stock Summary Banner
function renderStockSummaryBanner(item, available, low, out) {
  const bannerEl = document.getElementById('stock-summary-banner');
  if (!bannerEl) return;

  bannerEl.innerHTML = `
    <div class="summary-left">
      <span style="font-size: 1.4rem;">${item.icon}</span>
      <div>
        <div class="summary-title">Ration Stock for <strong>${item.name}</strong> near you</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${item.quota} • Subsidy price: ${item.price}</div>
      </div>
    </div>
    <div class="summary-counts">
      <span class="count-badge available">🟢 ${available} shops Available</span>
      <span class="count-badge low">🟠 ${low} shops Low Stock</span>
      <span class="count-badge out">🔴 ${out} shops Out of Stock</span>
    </div>
  `;
}

// Render Shop Cards in List
function renderShopCards(shops, selectedItemId, selectedItemObj) {
  const container = document.getElementById('shops-list-container');
  if (!container) return;

  if (shops.length === 0) {
    container.innerHTML = `
      <div style="background: #ffffff; border-radius: 12px; padding: 32px; text-align: center; border: 1px dashed var(--border-light);">
        <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">No ration shops match your filter</p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Try switching to "All" to see other nearby options.</p>
        <button onclick="resetStatusFilter()" class="btn-action-primary" style="display: inline-flex; width: auto;">Show All Shops</button>
      </div>
    `;
    return;
  }

  container.innerHTML = shops.map(shop => {
    const itemStock = shop.stock[selectedItemId] || { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' };
    const status = itemStock.status;
    const isOutOrLow = status === 'OUT_OF_STOCK' || status === 'LOW';

    let statusClass = 'available';
    let statusText = 'AVAILABLE';
    let statusIcon = '🟢';

    if (status === 'LOW') {
      statusClass = 'low';
      statusText = 'LOW STOCK';
      statusIcon = '🟠';
    } else if (status === 'OUT_OF_STOCK') {
      statusClass = 'out';
      statusText = 'OUT OF STOCK';
      statusIcon = '🔴';
    }

    // Relative updated text
    let updatedText = `Updated ${shop.lastUpdatedMinutesAgo} mins ago`;
    if (shop.lastUpdatedMinutesAgo < 2) {
      updatedText = `Updated just now`;
    } else if (shop.lastUpdatedMinutesAgo > 60) {
      const hrs = Math.floor(shop.lastUpdatedMinutesAgo / 60);
      updatedText = `Updated ${hrs}h ago`;
    }

    // Secondary items pills
    const allItems = store.getItems();
    const otherItemsHtml = allItems.map(it => {
      const itStock = shop.stock[it.id] || { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' };
      let dotColor = 'green';
      if (itStock.status === 'LOW') dotColor = 'orange';
      else if (itStock.status === 'OUT_OF_STOCK') dotColor = 'red';

      return `
        <div class="item-mini-chip">
          <span class="dot ${dotColor}"></span>
          <span style="font-weight: 600;">${it.name}</span>
          <span style="color: var(--text-muted); font-size: 0.7rem;">${itStock.qty}${itStock.unit}</span>
        </div>
      `;
    }).join('');

    // Trust badge indicator
    let trustClass = shop.trustStatus;
    let trustLabel = `✓ ${shop.verificationBadge}`;
    if (shop.hasDiscrepancy) {
      trustLabel = `⚠ ${shop.reportsCount} Citizen Reports Received`;
    }

    return `
      <div class="shop-card" id="card-${shop.id}">
        <!-- Top Priority Header -->
        <div class="shop-card-header">
          <div>
            <div class="shop-name-row">
              <span class="shop-title">🏪 ${shop.name}</span>
              <span class="fps-badge">${shop.fpsCode}</span>
            </div>
            <div class="shop-location-row">
              <span>📍 ${shop.area}</span>
              <span>•</span>
              <span class="dist-pill">📏 ${shop.distanceKm} km away</span>
              <span>•</span>
              <span style="color: ${shop.isOpen ? '#059669' : '#dc2626'}; font-weight: 700;">${shop.isOpen ? 'Open Now' : 'Closed'}</span>
            </div>
          </div>
        </div>

        <!-- 3. Primary Requested Item Availability Box -->
        <div class="priority-item-box ${statusClass}">
          <div class="item-left">
            <span class="item-icon">${selectedItemObj.icon}</span>
            <div class="item-text-group">
              <span class="item-label-name">${selectedItemObj.name}</span>
              <span class="item-label-quota">Quota: ${selectedItemObj.quota} • Stock: <strong>${itemStock.qty} ${itemStock.unit}</strong></span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <div class="status-badge-lg ${statusClass}">
              ${statusIcon} ${statusText}
            </div>
            ${isOutOrLow ? `
              <button class="btn-alert-pill" onclick="openStockAlertModal('${shop.id}', '${selectedItemId}')">
                🔔 Notify Me
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Secondary Items Quick View -->
        <div class="other-items-preview">
          ${otherItemsHtml}
        </div>

        <!-- Card Meta Row: Trust & Last Updated -->
        <div class="card-meta-row">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="trust-tag ${trustClass}">${trustLabel}</span>
            <span>by ${shop.updatedBy}</span>
          </div>
          <div style="font-weight: 700; color: var(--text-main);">
            🕒 ${updatedText}
          </div>
        </div>

        <!-- Card Actions -->
        <div class="card-actions">
          <button class="btn-action-primary" onclick="openShopDetailsModal('${shop.id}')">
            📋 View Stock & Details
          </button>
          <button class="btn-action-secondary" onclick="openDirectionsModal('${shop.id}')">
            🧭 Get Directions (${shop.distanceKm} km)
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.resetStatusFilter = function() {
  window.activeStatusFilter = 'all';
  document.querySelectorAll('.filter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.filter === 'all');
  });
  renderApp();
};

// Update Map Markers with Color-Coded Pins
function updateMapMarkers(shops, selectedItemId, selectedItemObj, userLoc) {
  if (!mapInstance) return;

  // Clear existing markers
  mapMarkers.forEach(m => mapInstance.removeLayer(m));
  mapMarkers = [];

  if (userLocationMarker) {
    mapInstance.removeLayer(userLocationMarker);
  }

  // Add User Location Pulse Pin
  const userIcon = L.divIcon({
    className: 'user-location-pin',
    html: `
      <div style="width: 22px; height: 22px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(37,99,235,0.7);">
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  userLocationMarker = L.marker([userLoc.lat, userLoc.lng], { icon: userIcon })
    .addTo(mapInstance)
    .bindPopup(`<strong>📍 You are here</strong><br>${userLoc.name}`);

  // Add Ration Shop Pins
  shops.forEach(shop => {
    const itemStock = shop.stock[selectedItemId] || { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' };
    const status = itemStock.status;

    let pinColorClass = 'pin-green';
    let pinSymbol = '🟢';
    let statusText = 'AVAILABLE';

    if (shop.trustStatus === 'outdated') {
      pinColorClass = 'pin-gray';
      pinSymbol = '⚪';
      statusText = 'OUTDATED';
    } else if (status === 'LOW') {
      pinColorClass = 'pin-orange';
      pinSymbol = '🟠';
      statusText = 'LOW STOCK';
    } else if (status === 'OUT_OF_STOCK') {
      pinColorClass = 'pin-red';
      pinSymbol = '🔴';
      statusText = 'OUT OF STOCK';
    }

    const customIcon = L.divIcon({
      className: 'custom-map-pin-container',
      html: `
        <div class="custom-map-pin ${pinColorClass}">
          🏪
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18]
    });

    const marker = L.marker([shop.lat, shop.lng], { icon: customIcon }).addTo(mapInstance);

    // Popup format requested:
    // Shop name, Distance, Selected item, Stock status, Last updated time, [ VIEW SHOP ]
    const popupContent = `
      <div style="font-family: inherit; min-width: 190px; padding: 2px;">
        <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 800; color: #0f172a;">📍 ${shop.name}</h4>
        <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 8px;">
          📏 <strong>${shop.distanceKm} km away</strong> • ${shop.area}
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
          <div style="font-size: 0.75rem; color: #64748b;">${selectedItemObj.name}:</div>
          <div style="font-size: 0.85rem; font-weight: 800;">${pinSymbol} ${statusText} (${itemStock.qty} ${itemStock.unit})</div>
        </div>
        <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 8px;">
          🕒 Last updated: <strong>${shop.lastUpdatedMinutesAgo} mins ago</strong>
        </div>
        <div style="display: flex; gap: 4px;">
          <button onclick="openShopDetailsModal('${shop.id}')" style="flex: 1; background: #047857; color: white; border: none; padding: 6px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">
            View Shop
          </button>
          <button onclick="openDirectionsModal('${shop.id}')" style="background: #0284c7; color: white; border: none; padding: 6px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">
            Directions
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    mapMarkers.push(marker);
  });
}

// MODAL 1: Shop Details Modal
window.openShopDetailsModal = function(shopId) {
  const shop = store.getShopById(shopId);
  if (!shop) return;

  const modal = document.getElementById('app-modal');
  const items = store.getItems();

  let stockRows = items.map(item => {
    const stockInfo = shop.stock[item.id] || { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' };
    let statusClass = 'available';
    let statusLabel = 'AVAILABLE';
    let statusDot = '🟢';

    if (stockInfo.status === 'LOW') {
      statusClass = 'low';
      statusLabel = 'LOW';
      statusDot = '🟠';
    } else if (stockInfo.status === 'OUT_OF_STOCK') {
      statusClass = 'out';
      statusLabel = 'OUT OF STOCK';
      statusDot = '🔴';
    }

    return `
      <tr>
        <td style="font-weight: 700;">
          <span style="font-size: 1.1rem; margin-right: 4px;">${item.icon}</span> ${item.name}
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 400;">Quota: ${item.quota}</div>
        </td>
        <td>
          <span class="count-badge ${statusClass}">
            ${statusDot} ${statusLabel}
          </span>
        </td>
        <td style="font-weight: 800; font-size: 0.95rem;">
          ${stockInfo.qty} ${stockInfo.unit}
        </td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">
          ${item.price}
        </td>
      </tr>
    `;
  }).join('');

  // Update history entries
  const historyHtml = (shop.history || []).slice(0, 4).map(h => `
    <div class="timeline-item">
      <div class="timeline-time">${h.time} • ${h.updatedBy}</div>
      <div class="timeline-title">${h.action} (${h.item})</div>
      <div class="timeline-desc">${h.details}</div>
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeModalOnBackdrop(event)">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-title">🏪 ${shop.name}</span>
            <span class="modal-subtitle">FPS ID: ${shop.fpsCode} • ${shop.area}</span>
          </div>
          <button class="modal-close-btn" onclick="closeModal()">×</button>
        </div>

        <div class="modal-body">
          <!-- Save Time Feature Banner -->
          <div class="save-time-banner">
            <span class="icon">⏱️</span>
            <div>
              <div class="save-time-text">"Save your time. Check stock before you travel."</div>
              <div style="font-size: 0.8rem; color: #1e3a8a; margin-top: 2px;">
                You are <strong>${shop.distanceKm} km</strong> from this shop (${shop.travelTime}).
              </div>
            </div>
          </div>

          <!-- Quick Info Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.8rem;">
            <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border-light);">
              <div style="font-weight: 700; color: var(--text-muted); text-transform: uppercase; font-size: 0.7rem;">Dealer Contact</div>
              <div style="font-weight: 700; color: var(--text-main); margin-top: 2px;">${shop.dealerName}</div>
              <a href="tel:${shop.phone}" style="color: var(--primary-brand); font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;">
                📞 ${shop.phone}
              </a>
            </div>
            <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border-light);">
              <div style="font-weight: 700; color: var(--text-muted); text-transform: uppercase; font-size: 0.7rem;">Timings & Queue</div>
              <div style="font-weight: 700; color: var(--text-main); margin-top: 2px;">${shop.timing.split('&')[0]}</div>
              <div style="font-size: 0.75rem; color: #0284c7; font-weight: 600; margin-top: 4px;">
                👥 ${shop.queueStatus}
              </div>
            </div>
          </div>

          <!-- Stock Table Section -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;">Commodity Stock Levels</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Updated ${shop.lastUpdatedMinutesAgo} mins ago</span>
            </div>
            <table class="stock-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Stock Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${stockRows}
              </tbody>
            </table>
          </div>

          <!-- Important Disclaimer -->
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; color: #92400e; display: flex; align-items: center; gap: 8px;">
            <span>ℹ️</span>
            <span><strong>Notice:</strong> Stock information may change during the day as cardholders collect their monthly quotas.</span>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 10px;">
            <button class="btn-action-primary" style="flex: 2;" onclick="openDirectionsModal('${shop.id}')">
              🧭 Get Directions (${shop.distanceKm} km)
            </button>
            <button class="btn-action-secondary" style="flex: 1; border-color: #fca5a5; color: #b91c1c;" onclick="openDiscrepancyModal('${shop.id}')">
              ⚠️ Report Incorrect Stock
            </button>
          </div>

          <!-- Verification Audit History -->
          <div style="border-top: 1px solid var(--border-light); padding-top: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-main);">Update History & Audit Trail</span>
              <span class="trust-tag ${shop.trustStatus}">✓ ${shop.verificationBadge}</span>
            </div>
            <div class="audit-timeline">
              ${historyHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// MODAL 2: Directions Modal
window.openDirectionsModal = function(shopId) {
  const shop = store.getShopById(shopId);
  if (!shop) return;

  const modal = document.getElementById('app-modal');
  const userLoc = store.getUserLocation();

  // Google Maps External URL
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${shop.lat},${shop.lng}&travelmode=driving`;

  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeModalOnBackdrop(event)">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-title">🧭 Directions to ${shop.name}</span>
            <span class="modal-subtitle">Distance: ${shop.distanceKm} km (${shop.travelTime})</span>
          </div>
          <button class="modal-close-btn" onclick="closeModal()">×</button>
        </div>

        <div class="modal-body">
          <div style="background: #f0fdf4; border: 1px solid var(--status-available-border); border-radius: 10px; padding: 14px;">
            <div style="font-weight: 800; color: var(--primary-dark); font-size: 0.95rem; margin-bottom: 4px;">
              📍 Destination: ${shop.name}
            </div>
            <div style="font-size: 0.85rem; color: #334155;">
              ${shop.fullAddress}
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">
              <strong>Landmark:</strong> ${shop.landmark}
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: 10px; padding: 14px;">
            <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 10px; color: var(--text-main);">
              Estimated Travel Routes from ${userLoc.name.split(',')[0]}
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border-light);">
                <span>🏍️ Two-Wheeler / Bike</span>
                <span style="font-weight: 700; color: var(--primary-brand);">${Math.round(shop.distanceKm * 3.5)} mins (${shop.distanceKm} km)</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border-light);">
                <span>🛺 Auto Rickshaw / Car</span>
                <span style="font-weight: 700; color: var(--primary-brand);">${Math.round(shop.distanceKm * 4.5)} mins</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                <span>🚶 Walking</span>
                <span style="font-weight: 700; color: var(--primary-brand);">${Math.round(shop.distanceKm * 12)} mins</span>
              </div>
            </div>
          </div>

          <!-- Direct Google Maps Navigation Link -->
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-action-primary" style="text-decoration: none; padding: 14px; font-size: 1rem;">
            🗺️ Open Live Route in Google Maps
          </a>

          <button class="btn-action-secondary" onclick="closeModal()">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
};

// MODAL 3: Stock Alert Creation Modal
window.openStockAlertModal = function(shopId, itemId) {
  const shop = store.getShopById(shopId);
  const item = store.getItems().find(i => i.id === itemId) || store.getItems()[0];
  const modal = document.getElementById('app-modal');

  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeModalOnBackdrop(event)">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-title">🔔 Get Stock Alert</span>
            <span class="modal-subtitle">Item: ${item.name} (${item.localName.split('/')[0].trim()})</span>
          </div>
          <button class="modal-close-btn" onclick="closeModal()">×</button>
        </div>

        <div class="modal-body">
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; font-size: 0.85rem; color: #1e40af;">
            Get notified immediately when <strong>${item.name}</strong> becomes available at <strong>${shop ? shop.name : 'any nearby shop'}</strong>.
          </div>

          <div class="form-group">
            <label class="form-label">Notification Method</label>
            <div style="display: flex; gap: 8px;">
              <label style="flex: 1; border: 1.5px solid var(--border-light); border-radius: 8px; padding: 10px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <input type="radio" name="alert-channel" value="App" checked>
                <span>📲 App Push</span>
              </label>
              <label style="flex: 1; border: 1.5px solid var(--border-light); border-radius: 8px; padding: 10px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <input type="radio" name="alert-channel" value="WhatsApp">
                <span>💬 WhatsApp</span>
              </label>
              <label style="flex: 1; border: 1.5px solid var(--border-light); border-radius: 8px; padding: 10px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <input type="radio" name="alert-channel" value="SMS">
                <span>✉️ SMS</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number (For WhatsApp / SMS)</label>
            <input type="tel" id="alert-phone-input" class="text-input" placeholder="+91 98470 XXXXX" value="+91 98470 54321">
          </div>

          <button class="btn-action-primary" style="padding: 13px;" onclick="submitStockAlert('${shopId}', '${itemId}')">
            🔔 Set Alert & Notify Me
          </button>
        </div>
      </div>
    </div>
  `;
};

window.submitStockAlert = function(shopId, itemId) {
  const channel = document.querySelector('input[name="alert-channel"]:checked')?.value || 'App';
  const phone = document.getElementById('alert-phone-input')?.value || '+91 98470 54321';
  const item = store.getItems().find(i => i.id === itemId);
  const shop = store.getShopById(shopId);

  store.createStockAlert({
    shopId,
    itemId,
    channel,
    contact: phone
  });

  closeModal();
  showToastBanner(
    `🔔 Alert Activated!`,
    `We will notify you via ${channel} the instant ${item ? item.name : 'item'} arrives at ${shop ? shop.name : 'this shop'}.`
  );
};

// MODAL 4: Citizen Report Discrepancy Modal
window.openDiscrepancyModal = function(shopId) {
  const shop = store.getShopById(shopId);
  if (!shop) return;

  const modal = document.getElementById('app-modal');

  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeModalOnBackdrop(event)">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-title">⚠️ Report Stock Discrepancy</span>
            <span class="modal-subtitle">${shop.name}</span>
          </div>
          <button class="modal-close-btn" onclick="closeModal()">×</button>
        </div>

        <div class="modal-body">
          <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; font-size: 0.8rem; color: #991b1b;">
            Citizen feedback helps prevent wasted trips for others. Official stock is not changed immediately, but marked as <strong>Verification Required</strong>.
          </div>

          <div class="form-group">
            <label class="form-label">Select Problematic Item</label>
            <select id="report-item-select" class="select-input">
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Sugar">Sugar</option>
              <option value="Dal">Dal</option>
              <option value="Kerosene">Kerosene</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">What is the discrepancy?</label>
            <select id="report-reason-select" class="select-input">
              <option value="Dealer said item is out of stock">Dealer said item is completely out of stock</option>
              <option value="Shop closed during scheduled open hours">Shop closed during scheduled open hours</option>
              <option value="Electronic weighing scale broken">Electronic weighing scale or e-PoS device broken</option>
              <option value="Stock is available despite online out-of-stock badge">Stock is available (website showed out-of-stock)</option>
              <option value="Excessive waiting queue (>45 mins)">Excessive waiting queue (>45 mins)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Your Ration Card Last 4 Digits (Optional)</label>
            <input type="text" id="report-card-input" class="text-input" placeholder="e.g. 4091" maxlength="4">
          </div>

          <button class="btn-action-primary" style="background: #b91c1c;" onclick="submitDiscrepancyReport('${shopId}')">
            Submit Citizen Report
          </button>
        </div>
      </div>
    </div>
  `;
};

window.submitDiscrepancyReport = function(shopId) {
  const item = document.getElementById('report-item-select').value;
  const reason = document.getElementById('report-reason-select').value;
  const cardDigits = document.getElementById('report-card-input').value || Math.floor(1000 + Math.random() * 9000);

  store.reportStockDiscrepancy({
    shopId,
    item,
    reason,
    citizenCard: `Card ***-${cardDigits}`
  });

  closeModal();
  showToastBanner(
    'Report Registered',
    `Thank you! ${item} at this shop has been flagged for official verification.`
  );
  renderApp();
};

window.closeModal = function() {
  const modal = document.getElementById('app-modal');
  if (modal) modal.innerHTML = '';
};

window.closeModalOnBackdrop = function(event) {
  if (event.target.classList.contains('modal-backdrop')) {
    closeModal();
  }
};

// Toast Notification Banner (Floating)
function showToastBanner(title, message) {
  const existing = document.querySelector('.toast-notification-banner');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification-banner';
  toast.innerHTML = `
    <div class="toast-icon">📢</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #94a3b8;">×</button>
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}
window.showToastBanner = showToastBanner;

// Special Animated Stock Alert Notification (with audio chime)
function showNotificationToast(trig) {
  store.playNotificationChime();

  const existing = document.querySelector('.toast-notification-banner');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification-banner';
  toast.style.border = '2px solid #16a34a';
  toast.innerHTML = `
    <div class="toast-icon" style="background: #dcfce7; color: #16a34a;">🔔</div>
    <div class="toast-content">
      <div class="toast-title" style="color: #15803d;">Stock Available Alert!</div>
      <div class="toast-message">
        <strong>${trig.itemName}</strong> is now available at <strong>${trig.shopName}</strong>.
      </div>
      <div class="toast-actions">
        <button class="toast-btn" onclick="openShopDetailsModal('${trig.shopId}'); this.closest('.toast-notification-banner').remove();">
          View Shop Details
        </button>
        <button class="toast-btn" style="background: #0284c7;" onclick="openDirectionsModal('${trig.shopId}'); this.closest('.toast-notification-banner').remove();">
          Get Directions
        </button>
      </div>
    </div>
    <button onclick="this.parentElement.remove()" style="background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #94a3b8;">×</button>
  `;

  document.body.appendChild(toast);
}
window.showNotificationToast = showNotificationToast;

// Setup Demo Bar at bottom
function setupDemoBar() {
  const bar = document.getElementById('hackathon-demo-bar');
  if (!bar) return;

  bar.innerHTML = `
    <div class="demo-title">
      <span class="demo-badge">Hackathon Demo</span>
      <span>Live Simulation Controls</span>
    </div>
    <div class="demo-buttons">
      <button class="btn-demo-action btn-demo-highlight" onclick="runHackathonDemo()">
        ▶️ Run 1-Click Demo Walkthrough
      </button>
      <button class="btn-demo-action" onclick="simulateRestockRiceAtJanaseva()">
        ⚡ Restock Rice at Janaseva (+300kg)
      </button>
      <button class="btn-demo-action" onclick="store.resetToDefaults(); showToastBanner('Reset Complete', 'Database reset to initial hackathon state');">
        🔄 Reset Data
      </button>
    </div>
  `;
}

// 1-Click Demo walkthrough matching user specification
window.runHackathonDemo = function() {
  showToastBanner('Starting Hackathon Demo', 'Step 1: Searching for Rice near Kakkanad...');
  
  // 1. Select Rice
  store.setSelectedItem('rice');
  document.getElementById('item-select').value = 'rice';
  syncActiveChip('rice');
  renderApp();

  setTimeout(() => {
    // 2. Highlight Green Valley (Available)
    const gvCard = document.getElementById('card-fps-01');
    if (gvCard) {
      gvCard.classList.add('highlighted');
      gvCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToastBanner('Step 2: Green Valley Ration Shop', '1.2 km away • Rice 🟢 AVAILABLE (420 kg)');
  }, 1800);

  setTimeout(() => {
    // 3. Highlight Janaseva (Out of Stock)
    const gvCard = document.getElementById('card-fps-01');
    if (gvCard) gvCard.classList.remove('highlighted');

    const jsCard = document.getElementById('card-fps-02');
    if (jsCard) {
      jsCard.classList.add('highlighted');
      jsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToastBanner('Step 3: Janaseva Ration Shop', '2.0 km away • Rice 🔴 OUT OF STOCK (0 kg)');
  }, 3800);

  setTimeout(() => {
    // 4. Set stock alert on Janaseva
    store.createStockAlert({
      shopId: 'fps-02',
      itemId: 'rice',
      channel: 'App',
      contact: '+91 98470 54321'
    });
    showToastBanner('Step 4: Alert Created', 'User registered alert: "Notify me when Rice arrives at Janaseva"');
  }, 5800);

  setTimeout(() => {
    // 5. Simulate Shopkeeper Restock
    showToastBanner('Step 5: Shopkeeper Logs In', 'Authorized Shopkeeper enters 300 kg Rice at Janaseva...');
    window.simulateRestockRiceAtJanaseva();
  }, 7800);
};

// Helper to simulate restock
window.simulateRestockRiceAtJanaseva = function() {
  const res = store.updateShopStock('fps-02', {
    rice: 300
  }, 'Authorized Shopkeeper M. S. Radhakrishnan');

  renderApp();

  const jsCard = document.getElementById('card-fps-02');
  if (jsCard) {
    jsCard.classList.add('highlighted');
    jsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
