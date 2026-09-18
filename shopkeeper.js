// RationNearMe - Shopkeeper Dashboard Module
// Enables authorized shopkeepers to log in, adjust stock, and instantly broadcast updates to citizens

window.activeShopkeeperShopId = 'fps-01'; // Default: Green Valley

function renderShopkeeperDashboard() {
  const container = document.getElementById('shopkeeper-dashboard-content');
  if (!container) return;

  const shops = store.getShops();
  const currentShop = store.getShopById(window.activeShopkeeperShopId) || shops[0];
  const items = store.getItems();

  // Create shop options
  const shopOptions = shops.map(s => `
    <option value="${s.id}" ${s.id === currentShop.id ? 'selected' : ''}>
      ${s.name} (${s.area} - ${s.fpsCode})
    </option>
  `).join('');

  // Create item inventory update cards
  const itemCards = items.map(item => {
    const stockInfo = currentShop.stock[item.id] || { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' };
    const isOut = stockInfo.status === 'OUT_OF_STOCK';
    const isLow = stockInfo.status === 'LOW';

    let statusBadge = `<span class="count-badge available">🟢 AVAILABLE</span>`;
    if (isLow) statusBadge = `<span class="count-badge low">🟠 LOW STOCK</span>`;
    if (isOut) statusBadge = `<span class="count-badge out">🔴 OUT OF STOCK</span>`;

    return `
      <div class="inventory-item-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.5rem;">${item.icon}</span>
            <div>
              <div style="font-weight: 800; font-size: 1rem; color: var(--text-main);">${item.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${item.localName} • Limit: ${item.quota}</div>
            </div>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div class="item-control-row">
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            Current: <strong>${stockInfo.qty} ${stockInfo.unit}</strong>
          </div>
          
          <div class="qty-stepper">
            <button class="btn-stepper" onclick="adjustItemQty('${item.id}', -50)">-50</button>
            <button class="btn-stepper" onclick="adjustItemQty('${item.id}', -10)">-10</button>
            <input 
              type="number" 
              id="input-stock-${item.id}" 
              class="input-qty" 
              value="${stockInfo.qty}" 
              min="0"
              data-original-qty="${stockInfo.qty}"
            />
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${stockInfo.unit}</span>
            <button class="btn-stepper" onclick="adjustItemQty('${item.id}', 10)">+10</button>
            <button class="btn-stepper" onclick="adjustItemQty('${item.id}', 50)">+50</button>
          </div>
        </div>

        <div style="display: flex; gap: 6px; justify-content: flex-end;">
          <button class="btn-action-secondary" style="font-size: 0.75rem; padding: 4px 8px; color: #dc2626;" onclick="setItemZero('${item.id}')">
            Mark Out of Stock (0)
          </button>
          <button class="btn-action-secondary" style="font-size: 0.75rem; padding: 4px 8px; color: #047857;" onclick="setItemRestockPreset('${item.id}', 300)">
            +300 Restock
          </button>
        </div>
      </div>
    `;
  }).join('');

  // History timeline items
  const historyList = (currentShop.history || []).slice(0, 6).map(h => `
    <div class="timeline-item">
      <div class="timeline-time">${h.time} • ${h.updatedBy}</div>
      <div class="timeline-title">${h.action} (${h.item})</div>
      <div class="timeline-desc">${h.details}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <!-- Top Header & Selector -->
    <div class="shopkeeper-header">
      <div>
        <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #a7f3d0; font-weight: 700;">
          E-PoS Shopkeeper Terminal • Department of Civil Supplies
        </div>
        <div style="font-size: 1.4rem; font-weight: 900; margin-top: 2px;">
          🏪 ${currentShop.name}
        </div>
        <div style="font-size: 0.85rem; color: #d1fae5; margin-top: 2px;">
          Dealer: <strong>${currentShop.dealerName}</strong> • FPS Code: <strong>${currentShop.fpsCode}</strong>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 10px;">
        <label style="font-size: 0.8rem; color: #d1fae5; font-weight: 600;">Switch Shop:</label>
        <select id="shopkeeper-shop-select" class="select-input" style="background: #ffffff; color: var(--text-main); font-weight: 700; width: auto;" onchange="changeShopkeeperShop(this.value)">
          ${shopOptions}
        </select>
      </div>
    </div>

    <!-- Quick Status Banner -->
    <div style="background: #ffffff; border-radius: var(--radius-md); border: 1px solid var(--border-light); padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: var(--shadow-sm);">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="trust-tag ${currentShop.trustStatus}">✓ ${currentShop.verificationBadge}</span>
        <span style="font-size: 0.85rem; color: var(--text-muted);">
          Last updated: <strong>${currentShop.lastUpdatedMinutesAgo} mins ago</strong> by ${currentShop.updatedBy}
        </span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-action-primary" style="background: #047857; padding: 8px 14px;" onclick="applyStockShipmentRestock()">
          📦 Log Full Morning Supply (+500kg All)
        </button>
      </div>
    </div>

    <!-- Inventory Form -->
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 12px; color: var(--text-main);">
        Update Stock Quantities
      </h3>
      <div class="inventory-grid">
        ${itemCards}
      </div>

      <div style="background: #ffffff; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: var(--shadow-sm);">
        <div>
          <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">
            Ready to broadcast stock to cardholders?
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            Changes will immediately reflect on the public page, and notify users who set alerts.
          </div>
        </div>
        <button class="btn-action-primary" style="padding: 12px 24px; font-size: 1rem;" onclick="saveAllStockChanges()">
          ✅ UPDATE STOCK & BROADCAST
        </button>
      </div>
    </div>

    <!-- Audit History & Discrepancies -->
    <div style="background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border-light); padding: 20px; box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">
            Audit Trail & Transaction History
          </h3>
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            Proves who updated stock, when, and resolves citizen feedback
          </div>
        </div>
        ${currentShop.hasDiscrepancy ? `
          <button class="btn-action-primary" style="background: #b91c1c; font-size: 0.8rem;" onclick="resolveShopDiscrepancies('${currentShop.id}')">
            Resolve ${currentShop.reportsCount} Pending Citizen Reports
          </button>
        ` : ''}
      </div>

      <div class="audit-timeline">
        ${historyList}
      </div>
    </div>
  `;
}

window.changeShopkeeperShop = function(shopId) {
  window.activeShopkeeperShopId = shopId;
  renderShopkeeperDashboard();
};

window.adjustItemQty = function(itemId, delta) {
  const input = document.getElementById(`input-stock-${itemId}`);
  if (!input) return;
  let val = parseInt(input.value) || 0;
  val = Math.max(0, val + delta);
  input.value = val;
};

window.setItemZero = function(itemId) {
  const input = document.getElementById(`input-stock-${itemId}`);
  if (input) input.value = 0;
};

window.setItemRestockPreset = function(itemId, amount) {
  const input = document.getElementById(`input-stock-${itemId}`);
  if (!input) return;
  let val = parseInt(input.value) || 0;
  input.value = val + amount;
};

window.applyStockShipmentRestock = function() {
  const items = store.getItems();
  items.forEach(item => {
    const input = document.getElementById(`input-stock-${item.id}`);
    if (input) {
      input.value = (parseInt(input.value) || 0) + (item.id === 'kerosene' ? 100 : 500);
    }
  });
};

window.saveAllStockChanges = function() {
  const currentShop = store.getShopById(window.activeShopkeeperShopId);
  if (!currentShop) return;

  const items = store.getItems();
  const stockMap = {};

  items.forEach(item => {
    const input = document.getElementById(`input-stock-${item.id}`);
    if (input) {
      stockMap[item.id] = parseInt(input.value) || 0;
    }
  });

  const result = store.updateShopStock(currentShop.id, stockMap, `Authorized Shopkeeper (${currentShop.dealerName.split(' ')[0]})`);

  if (result) {
    let msg = `Updated inventory for ${currentShop.name}.`;
    if (result.triggeredAlerts.length > 0) {
      msg += ` Triggered ${result.triggeredAlerts.length} stock alert(s)!`;
    }
    window.showToastBanner ? window.showToastBanner('Stock Updated & Broadcast', msg) : alert(msg);
    renderShopkeeperDashboard();
  }
};

window.resolveShopDiscrepancies = function(shopId) {
  store.verifyStockAndResolve(shopId, null, 'Authorized Shopkeeper Verification');
  if (window.showToastBanner) {
    window.showToastBanner('Verification Complete', 'Citizen reports cleared and stock verified.');
  }
  renderShopkeeperDashboard();
};
