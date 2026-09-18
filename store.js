// RationNearMe - Reactive Store & Local Database Engine
// Handles state persistence, real-time sync across tabs, distance calculation, stock alerts, and Web Audio notifications

const STORAGE_KEYS = {
  SHOPS: 'ration_near_me_shops',
  ITEMS: 'ration_near_me_items',
  ALERTS: 'ration_near_me_alerts',
  REPORTS: 'ration_near_me_reports',
  USER_LOCATION: 'ration_near_me_user_loc',
  CURRENT_ITEM: 'ration_near_me_selected_item',
  ROLE: 'ration_near_me_active_role' // 'citizen', 'shopkeeper', 'admin'
};

class RationStore {
  constructor() {
    this.listeners = new Set();
    this.init();
  }

  init() {
    // Initialize default shops if not present
    if (!localStorage.getItem(STORAGE_KEYS.SHOPS)) {
      localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(DEFAULT_SHOPS));
    }
    // Initialize items
    if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
    }
    // Initialize alerts
    if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    }
    // Initialize reports
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_PENDING_REPORTS));
    }
    // Default location: Kakkanad, Kochi (10.0159, 76.3419)
    if (!localStorage.getItem(STORAGE_KEYS.USER_LOCATION)) {
      const defaultLoc = {
        name: 'Kakkanad Civil Station, Kochi',
        pincode: '682030',
        lat: 10.0159,
        lng: 76.3419
      };
      localStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify(defaultLoc));
    }
    // Default selected item
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_ITEM)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ITEM, 'rice');
    }

    // Cross-tab synchronization
    window.addEventListener('storage', (e) => {
      if (Object.values(STORAGE_KEYS).includes(e.key)) {
        this.notify();
      }
    });
  }

  // Subscribe to changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(eventDetail = {}) {
    for (const callback of this.listeners) {
      try {
        callback(eventDetail);
      } catch (err) {
        console.error('Store listener error:', err);
      }
    }
  }

  // Getters
  getShops() {
    try {
      const shops = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOPS)) || DEFAULT_SHOPS;
      const userLoc = this.getUserLocation();
      
      // Recalculate distance and relative time
      return shops.map(shop => {
        const dist = this.calculateDistance(userLoc.lat, userLoc.lng, shop.lat, shop.lng);
        const distanceKm = parseFloat(dist.toFixed(1));
        const minutesAgo = Math.max(1, Math.round((Date.now() - new Date(shop.updatedAt).getTime()) / (60 * 1000)));
        
        // Determine trust color
        let trustStatus = 'verified';
        let verificationBadge = 'Verified Shop';
        if (minutesAgo > 360) { // > 6 hrs
          trustStatus = 'outdated';
          verificationBadge = 'Information Outdated';
        } else if (minutesAgo > 120) { // 2 to 6 hrs
          trustStatus = 'expiring';
          verificationBadge = 'Update Getting Old';
        }

        return {
          ...shop,
          distanceKm,
          lastUpdatedMinutesAgo: minutesAgo,
          trustStatus: shop.hasDiscrepancy ? 'discrepancy' : trustStatus,
          verificationBadge: shop.hasDiscrepancy ? 'Verification Required' : verificationBadge
        };
      });
    } catch (e) {
      return DEFAULT_SHOPS;
    }
  }

  getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS)) || DEFAULT_ITEMS;
    } catch (e) {
      return DEFAULT_ITEMS;
    }
  }

  getShopById(id) {
    return this.getShops().find(s => s.id === id);
  }

  getUserLocation() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_LOCATION)) || {
        name: 'Kakkanad Civil Station, Kochi',
        pincode: '682030',
        lat: 10.0159,
        lng: 76.3419
      };
    } catch (e) {
      return { name: 'Kakkanad', pincode: '682030', lat: 10.0159, lng: 76.3419 };
    }
  }

  setUserLocation(location) {
    localStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify(location));
    this.notify({ type: 'LOCATION_CHANGED', location });
  }

  getSelectedItem() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ITEM) || 'rice';
  }

  setSelectedItem(itemId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ITEM, itemId);
    this.notify({ type: 'ITEM_CHANGED', itemId });
  }

  getAlerts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS)) || [];
    } catch (e) {
      return [];
    }
  }

  getReports() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS)) || [];
    } catch (e) {
      return [];
    }
  }

  // Stock status determination
  calculateStockStatus(itemId, qty) {
    const item = this.getItems().find(i => i.id === itemId);
    const threshold = item ? item.defaultThreshold : 30;
    if (qty <= 0) return 'OUT_OF_STOCK';
    if (qty < threshold) return 'LOW';
    return 'AVAILABLE';
  }

  // Update shop stock by Shopkeeper
  updateShopStock(shopId, newStockMap, updaterName = 'Authorized Shopkeeper') {
    const shops = this.getShops();
    const shopIndex = shops.findIndex(s => s.id === shopId);
    if (shopIndex === -1) return null;

    const shop = shops[shopIndex];
    const oldStock = JSON.parse(JSON.stringify(shop.stock));
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const triggeredAlerts = [];

    // Apply updates and log audit
    const historyEntries = [];

    for (const [itemId, newQty] of Object.entries(newStockMap)) {
      const qtyNum = Math.max(0, parseInt(newQty) || 0);
      const oldQty = oldStock[itemId] ? oldStock[itemId].qty : 0;
      const oldStatus = oldStock[itemId] ? oldStock[itemId].status : 'OUT_OF_STOCK';
      const newStatus = this.calculateStockStatus(itemId, qtyNum);
      const unit = (oldStock[itemId] && oldStock[itemId].unit) || (itemId === 'kerosene' ? 'L' : 'kg');

      // Update stock
      shop.stock[itemId] = {
        qty: qtyNum,
        status: newStatus,
        unit
      };

      // Check for status change to log
      if (oldQty !== qtyNum || oldStatus !== newStatus) {
        const itemObj = this.getItems().find(i => i.id === itemId);
        const itemName = itemObj ? itemObj.name : itemId;
        
        historyEntries.push({
          id: 'hist-' + Date.now() + '-' + itemId,
          time: timeStr,
          timestamp: now.toISOString(),
          item: itemName,
          action: `${oldQty} ${unit} → ${qtyNum} ${unit} (${newStatus.replace('_', ' ')})`,
          details: `Updated by ${updaterName}`,
          updatedBy: updaterName
        });

        // Check if an alert was satisfied (was OUT_OF_STOCK / LOW and now is AVAILABLE)
        if (newStatus === 'AVAILABLE' && (oldStatus === 'OUT_OF_STOCK' || oldStatus === 'LOW')) {
          const matchingAlerts = this.checkAndTriggerAlerts(shop.id, shop.name, itemId, itemName);
          triggeredAlerts.push(...matchingAlerts);
        }
      }
    }

    shop.updatedAt = now.toISOString();
    shop.lastUpdatedMinutesAgo = 0;
    shop.updatedBy = updaterName;
    shop.trustStatus = 'verified';
    shop.verificationBadge = 'Verified Shop';
    
    // Prepend history
    if (!shop.history) shop.history = [];
    shop.history.unshift(...historyEntries);

    // Save
    shops[shopIndex] = shop;
    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));

    // Dispatch notifications
    this.notify({
      type: 'STOCK_UPDATED',
      shopId,
      shop,
      triggeredAlerts
    });

    return { shop, triggeredAlerts, historyEntries };
  }

  // Create citizen stock alert
  createStockAlert({ shopId, itemId, channel, contact, radiusKm }) {
    const alerts = this.getAlerts();
    const itemObj = this.getItems().find(i => i.id === itemId);
    const shopObj = shopId ? this.getShopById(shopId) : null;

    const newAlert = {
      id: 'alert-' + Date.now(),
      shopId: shopId || 'any',
      shopName: shopObj ? shopObj.name : 'Any nearby shop (< 3km)',
      itemId,
      itemName: itemObj ? itemObj.name : itemId,
      channel, // 'SMS', 'WhatsApp', 'App Notification'
      contact,
      radiusKm: radiusKm || 2,
      createdAt: new Date().toISOString(),
      active: true
    };

    alerts.unshift(newAlert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    this.notify({ type: 'ALERT_CREATED', alert: newAlert });
    return newAlert;
  }

  // Check alerts when stock changes
  checkAndTriggerAlerts(shopId, shopName, itemId, itemName) {
    const alerts = this.getAlerts();
    const triggered = [];

    alerts.forEach(alert => {
      if (alert.active && alert.itemId === itemId) {
        if (alert.shopId === 'any' || alert.shopId === shopId) {
          triggered.push({
            alert,
            shopId,
            shopName,
            itemName,
            message: `🔔 ${itemName} is now available at ${shopName}!`
          });
        }
      }
    });

    return triggered;
  }

  // Citizen discrepancy reporting
  reportStockDiscrepancy({ shopId, item, reason, citizenCard, details }) {
    const shops = this.getShops();
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return false;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark discrepancy
    shop.reportsCount = (shop.reportsCount || 0) + 1;
    shop.hasDiscrepancy = true;
    shop.trustStatus = 'discrepancy';
    shop.verificationBadge = 'Verification Required';

    const newReport = {
      id: 'rep-' + Date.now(),
      shopId,
      shopName: shop.name,
      item,
      reason,
      citizenCard: citizenCard || 'Card ending in ' + Math.floor(1000 + Math.random() * 9000),
      details: details || reason,
      reportedStatus: 'Reported Unavailable',
      officialStatus: shop.stock[item.toLowerCase()] ? shop.stock[item.toLowerCase()].status : 'UNKNOWN',
      createdAt: now.toISOString(),
      time: timeStr,
      status: 'pending'
    };

    // Add to shop history
    if (!shop.history) shop.history = [];
    shop.history.unshift({
      id: 'hist-rep-' + Date.now(),
      time: timeStr,
      timestamp: now.toISOString(),
      item,
      action: 'Citizen Report Received',
      details: `Citizen reported "${reason}". Stock marked for verification.`,
      updatedBy: 'Citizen Card ' + (citizenCard || 'Holder')
    });

    // Save shops
    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));

    // Save global reports
    const reports = this.getReports();
    reports.unshift(newReport);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    this.notify({ type: 'DISCREPANCY_REPORTED', report: newReport, shopId });
    return newReport;
  }

  // Admin / Shopkeeper verifies stock and resolves report
  verifyStockAndResolve(shopId, reportId = null, verifiedBy = 'Civil Supplies Inspector') {
    const shops = this.getShops();
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return false;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    shop.reportsCount = 0;
    shop.hasDiscrepancy = false;
    shop.trustStatus = 'verified';
    shop.verificationBadge = 'Verified Shop';
    shop.updatedAt = now.toISOString();
    shop.lastUpdatedMinutesAgo = 0;
    shop.updatedBy = verifiedBy;

    // Add audit entry
    if (!shop.history) shop.history = [];
    shop.history.unshift({
      id: 'hist-verify-' + Date.now(),
      time: timeStr,
      timestamp: now.toISOString(),
      item: 'All Commodities',
      action: 'Official Verification Complete',
      details: `Physical stock confirmed by ${verifiedBy}. Reports cleared.`,
      updatedBy: verifiedBy
    });

    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));

    // Update pending reports if reportId provided
    if (reportId) {
      const reports = this.getReports();
      const rep = reports.find(r => r.id === reportId);
      if (rep) rep.status = 'resolved';
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    }

    this.notify({ type: 'STOCK_VERIFIED', shopId });
    return true;
  }

  // Distance helper (Haversine formula in km)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Play pleasant notification chime using Web Audio API (Zero external mp3 files!)
  playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);

      // Vibration if on mobile device
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 150]);
      }
    } catch (e) {
      console.warn('Audio not allowed yet or not supported:', e);
    }
  }

  // Reset demo to initial state anytime
  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(DEFAULT_SHOPS));
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_PENDING_REPORTS));
    this.notify({ type: 'DATABASE_RESET' });
  }
}

// Global Singleton
const store = new RationStore();
