// RationNearMe - Admin Verification Dashboard Module
// Manages shop verification, reviews citizen reports, audits stock discrepancies, and verifies reliability

function renderAdminDashboard() {
  const container = document.getElementById('admin-dashboard-content');
  if (!container) return;

  const shops = store.getShops();
  const reports = store.getReports();
  const totalShops = shops.length;
  const verifiedShops = shops.filter(s => s.trustStatus === 'verified' && !s.hasDiscrepancy).length;
  const pendingReports = reports.filter(r => r.status === 'pending');
  const discrepancyShops = shops.filter(s => s.hasDiscrepancy || s.reportsCount > 0);

  // Stats Grid
  const statsHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px;">
      <div style="background: #ffffff; padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Ration Shops</div>
        <div style="font-size: 1.8rem; font-weight: 900; color: var(--text-main); margin-top: 4px;">${totalShops}</div>
        <div style="font-size: 0.75rem; color: #047857; font-weight: 600; margin-top: 4px;">Kochi PDS Zone 1</div>
      </div>

      <div style="background: #ffffff; padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Verified Shops</div>
        <div style="font-size: 1.8rem; font-weight: 900; color: #047857; margin-top: 4px;">${verifiedShops} / ${totalShops}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${Math.round((verifiedShops / totalShops) * 100)}% Trust Compliance</div>
      </div>

      <div style="background: #ffffff; padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Pending Citizen Reports</div>
        <div style="font-size: 1.8rem; font-weight: 900; color: #dc2626; margin-top: 4px;">${pendingReports.length}</div>
        <div style="font-size: 0.75rem; color: #dc2626; font-weight: 600; margin-top: 4px;">Action Required</div>
      </div>

      <div style="background: #ffffff; padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Recent Stock Updates</div>
        <div style="font-size: 1.8rem; font-weight: 900; color: #0284c7; margin-top: 4px;">14 Today</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Via e-PoS & Web Portal</div>
      </div>
    </div>
  `;

  // Discrepancy & Verification Items
  let pendingReportsTable = `
    <div style="background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border-light); padding: 20px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">
          ⚠️ Shops Requiring Verification & Citizen Discrepancies
        </h3>
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          Citizen reports do not automatically change official stock
        </span>
      </div>
  `;

  if (discrepancyShops.length === 0 && pendingReports.length === 0) {
    pendingReportsTable += `
      <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.9rem;">
        ✅ All ration shops are currently verified. No pending discrepancy reports.
      </div>
    `;
  } else {
    pendingReportsTable += `
      <table class="stock-table">
        <thead>
          <tr>
            <th>Ration Shop</th>
            <th>Flagged Item</th>
            <th>Official Stock</th>
            <th>Citizen Reports</th>
            <th>Discrepancy Detail</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${discrepancyShops.map(shop => {
            const flaggedItem = 'Rice';
            const officialStatus = shop.stock['rice'] ? shop.stock['rice'].status : 'AVAILABLE';
            let officialBadge = `<span class="count-badge available">🟢 AVAILABLE</span>`;
            if (officialStatus === 'LOW') officialBadge = `<span class="count-badge low">🟠 LOW</span>`;
            if (officialStatus === 'OUT_OF_STOCK') officialBadge = `<span class="count-badge out">🔴 OUT OF STOCK</span>`;

            return `
              <tr>
                <td>
                  <strong>${shop.name}</strong>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${shop.fpsCode} • ${shop.area}</div>
                </td>
                <td style="font-weight: 700;">🌾 ${flaggedItem}</td>
                <td>${officialBadge}</td>
                <td>
                  <span style="background: #fee2e2; color: #b91c1c; font-weight: 800; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem;">
                    ⚠ ${shop.reportsCount || 1} reported unavailable
                  </span>
                </td>
                <td style="font-size: 0.8rem; color: #475569; max-width: 200px;">
                  Citizens report dealer turned them away stating weigh machine issue.
                </td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-action-primary" style="font-size: 0.75rem; padding: 6px 10px;" onclick="adminVerifyStock('${shop.id}')">
                      ✓ VERIFY STOCK
                    </button>
                    <button class="btn-action-secondary" style="font-size: 0.75rem; padding: 6px 8px;" onclick="openShopDetailsModal('${shop.id}')">
                      REVIEW
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }
  pendingReportsTable += `</div>`;

  // System Audit Timeline requested in specification:
  // 10:00 AM: Shopkeeper updated Rice -> 420 kg
  // 10:15 AM: Citizen report received
  // 10:20 AM: Second report received
  // 10:30 AM: Shopkeeper verified stock
  const auditTimelineHtml = `
    <div style="background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border-light); padding: 20px; box-shadow: var(--shadow-sm);">
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">
          System Trust Audit Timeline (Green Valley Ration Shop Demonstration)
        </h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
          Chronological audit trail demonstrating how the public distribution information remains accurate and tamper-resistant.
        </p>
      </div>

      <div class="audit-timeline" style="margin-top: 14px;">
        <div class="timeline-item">
          <div class="timeline-time">10:30 AM • Official Civil Supplies Inspector S. Menon</div>
          <div class="timeline-title">Shopkeeper & Department Verified Stock</div>
          <div class="timeline-desc">Physical spot check completed. Rice balance verified at 420 kg. System status restored to Verified.</div>
        </div>

        <div class="timeline-item">
          <div class="timeline-time">10:20 AM • Citizen Cardholder #9021</div>
          <div class="timeline-title">Second Citizen Discrepancy Report Received</div>
          <div class="timeline-desc">Cardholder reported: "Biometric machine down, dealer asked to return afternoon". Status changed to ⚠ Verification Required.</div>
        </div>

        <div class="timeline-item">
          <div class="timeline-time">10:15 AM • Citizen Cardholder #4091</div>
          <div class="timeline-title">First Citizen Discrepancy Report Received</div>
          <div class="timeline-desc">Cardholder reported Rice unavailable at counter. System marked alert for inspector review.</div>
        </div>

        <div class="timeline-item">
          <div class="timeline-time">10:00 AM • Authorized Shopkeeper K. R. Narayanan</div>
          <div class="timeline-title">Shopkeeper updated Rice → 420 kg</div>
          <div class="timeline-desc">Manual morning intake logged via e-PoS terminal. Official stock set to AVAILABLE.</div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 900; color: var(--primary-dark);">
            Civil Supplies Department • Admin Verification Portal
          </h2>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            Ensuring high reliability and zero wasted trips for ration card holders.
          </p>
        </div>
        <button class="btn-action-primary" onclick="simulateNewCitizenReport()" style="font-size: 0.82rem; background: #c2410c;">
          ➕ Simulate Incoming Citizen Report
        </button>
      </div>
    </div>

    ${statsHtml}
    ${pendingReportsTable}
    ${auditTimelineHtml}
  `;
}

window.adminVerifyStock = function(shopId) {
  store.verifyStockAndResolve(shopId, null, 'Civil Supplies Inspector S. Menon');
  if (window.showToastBanner) {
    window.showToastBanner('Stock Verified', 'Shop marked as Officially Verified. Discrepancy resolved.');
  }
  renderAdminDashboard();
};

window.simulateNewCitizenReport = function() {
  store.reportStockDiscrepancy({
    shopId: 'fps-01',
    item: 'Rice',
    reason: 'Heavy rush, dealer distributing tokens for 3:00 PM',
    citizenCard: 'Card ***-5912'
  });
  if (window.showToastBanner) {
    window.showToastBanner('Discrepancy Logged', 'Simulated citizen report received for Green Valley.');
  }
  renderAdminDashboard();
};
