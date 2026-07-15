// ── NAVIGATION ────────────────────────────────────────────────────
const PAGES = {
  dashboard:     '../pages/dashboard.html',
  actual_operation: '../pages/actual-operation.html',
  shift:         '../pages/shift.html',
  rit_operation: '../pages/rit-operation.html',
  delay:         '../pages/delay.html',
  maintenance:   '../pages/maintenance.html',
  bbm:           '../pages/bbm.html',
  cycle_time:    '../pages/cycle-time.html',
  approval:      '../pages/approval.html',
  laporan:       '../pages/laporan.html',
  summary_ops:   '../pages/summary-operations.html',
  master:        '../pages/master.html',
  settings:      '../pages/settings.html',
};

function navigate(page) {
  if (PAGES[page]) window.location.href = PAGES[page];
}

function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const href = item.getAttribute('href') || '';
    const fname = href.split('/').pop();
    if (fname && path.includes(fname)) item.classList.add('active');
  });
}

// ── MODAL ──────────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay') && !e.target.hasAttribute('data-no-overlay-close')) {
    e.target.classList.remove('show');
  }
});

// ── NOTIFICATION ───────────────────────────────────────────────────
function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  if (panel) panel.classList.toggle('show');
}
document.addEventListener('click', e => {
  const panel = document.getElementById('notifPanel');
  const btn   = document.getElementById('notifBtn');
  if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target))
    panel.classList.remove('show');
});

// ── TOAST ──────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const colors = { success: '#16A34A', warn: '#CA8A04', danger: '#DC2626' };
  const icons  = { success: '✓', warn: '⚠', danger: '✕' };
  const toast  = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;
    background:${colors[type]||colors.success};color:white;
    padding:12px 18px;border-radius:8px;font-size:13px;
    box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:9999;
    animation:fadeInUp .3s ease;font-family:'DM Sans',sans-serif;
    display:flex;gap:8px;align-items:center;max-width:340px;
  `;
  toast.innerHTML = `<span>${icons[type]||'✓'}</span><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── SIDEBAR ────────────────────────────────────────────────────────
function renderSidebar(activePage) {
  const navItems = [
    { id:'dashboard',     icon:'📊', label:'Dashboard',       badge:'Need Adjustment' },
    { id:'actual_operation', icon:'📋', label:'Actual Operation', badge:'Hold' },
    { id:'shift',         icon:'🔄', label:'Manajemen Shift',  badge:null },
    { id:'rit_operation', icon:'📋', label:'Rit Operation',    badge:null },
    { id:'delay',         icon:'⏸', label:'Delay',            badge:null },
    { id:'maintenance',   icon:'🔧', label:'Maintenance',      badge:null },
    { id:'bbm',           icon:'⛽', label:'BBM',              badge:null },
    { id:'cycle_time',    icon:'🔁', label:'Cycle Time',       badge:'Hold' },
  ];
  const monitorItems = [
    { id:'laporan',   icon:'📈', label:'Laporan',           badge:null },
    { id:'summary_ops', icon:'📊', label:'Rekap Bulanan',   badge:null },
    { id:'approval',  icon:'✅', label:'Approval',          badge:'3' },
  ];
  const adminItems = [
    { id:'master',   icon:'⚙', label:'Master Data',  badge:null },
    { id:'settings', icon:'👥', label:'Pengaturan',   badge:null },
  ];

  const makeItem = item => `
    <a class="nav-item${item.id===activePage?' active':''}" href="${PAGES[item.id]}">
      <span style="font-size:15px">${item.icon}</span>
      <span>${item.label}</span>
      ${item.badge ? `<span class="nav-badge ${item.badge === 'Need Adjustment' ? 'hold' : ''}">${item.badge}</span>` : ''}
    </a>`;

  return `
  <aside class="sidebar">
    <div class="sidebar-logo">
      <img src="../assets/haulops.png" alt="HAULOPS" style="height:32px;width:auto;display:block;margin:0 auto">
      <div style="text-align:center;font-size:10px;color:rgba(196,168,130,0.6);margin-top:6px;letter-spacing:.5px">Smart Mining BJU Platform</div>
    </div>

    <div class="sidebar-branch" onclick="openModal('branchModal')">
      <div class="branch-label">Branch Aktif</div>
      <div class="branch-name">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="#E8C84A"/></svg>
        Project NPM Konawe
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-left:auto;opacity:.5"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-label">Operasional</div>
      ${navItems.map(makeItem).join('')}
      <div class="nav-section-label">Monitoring</div>
      ${monitorItems.map(makeItem).join('')}
      <div class="nav-section-label">Administrasi</div>
      ${adminItems.map(makeItem).join('')}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user" onclick="navigate('settings')">
        <div class="user-avatar">AM</div>
        <div class="user-info">
          <div class="user-name">Ahmad Mining</div>
          <div class="user-role">Admin Mining · Kal. A</div>
        </div>
      </div>
    </div>
  </aside>`;
}

// ── TOPBAR ─────────────────────────────────────────────────────────
function renderTopbar(title, subtitle) {
  return `
  <header class="topbar">
    <div class="topbar-title">${title}${subtitle ? ` <span>/ ${subtitle}</span>` : ''}</div>
    <div class="topbar-actions">
      <button class="notif-btn" id="notifBtn" onclick="toggleNotifPanel()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
        <span class="notif-dot"></span>
      </button>
    </div>
  </header>

  <div class="notif-panel" id="notifPanel">
    <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;font-weight:600">Notifikasi</span>
      <button class="btn btn-ghost btn-sm" onclick="showToast('Semua ditandai dibaca')">Tandai semua</button>
    </div>
    <div class="notif-item unread" onclick="navigate('approval')">
      <div class="notif-dot-indicator"></div>
      <div>
        <div class="notif-item-title">Shift menunggu approval</div>
        <div class="notif-item-msg">Shift Pagi 07 Jun — Project CLM Luwu Raya</div>
        <div class="notif-item-time">5 menit lalu</div>
      </div>
    </div>
    <div class="notif-item unread" onclick="navigate('approval')">
      <div class="notif-dot-indicator"></div>
      <div>
        <div class="notif-item-title">Edit Request masuk</div>
        <div class="notif-item-msg">Admin Mining minta edit RIT-20260606-0019</div>
        <div class="notif-item-time">22 menit lalu</div>
      </div>
    </div>
    <div class="notif-item unread" onclick="navigate('rit_operation')">
      <div class="notif-dot-indicator"></div>
      <div>
        <div class="notif-item-title">Data timbangan tidak sesuai</div>
        <div class="notif-item-msg">RIT-0019 selisih 820 kg dari data vendor</div>
        <div class="notif-item-time">1 jam lalu</div>
      </div>
    </div>
    <div class="notif-item" onclick="navigate('maintenance')">
      <div style="width:7px"></div>
      <div>
        <div class="notif-item-title">DT-007 Breakdown over budget</div>
        <div class="notif-item-msg">Actual 10j / Budget 4j — Kalimantan A</div>
        <div class="notif-item-time">2 jam lalu</div>
      </div>
    </div>
    <div class="notif-item" onclick="navigate('bbm')">
      <div style="width:7px"></div>
      <div>
        <div class="notif-item-title">Budget BBM hampir tercapai</div>
        <div class="notif-item-msg">88.6% dari budget harian — DT-003</div>
        <div class="notif-item-time">3 jam lalu</div>
      </div>
    </div>
    <div style="padding:10px;text-align:center">
      <a href="#" style="font-size:12px;color:var(--brown-mid)">Lihat semua notifikasi →</a>
    </div>
  </div>

  <!-- Branch Modal -->
  <div class="modal-overlay" id="branchModal">
    <div class="modal modal-sm">
      <div class="modal-header">
        <span class="modal-title">Pilih Branch</span>
        <button class="modal-close" onclick="closeModal('branchModal')">✕</button>
      </div>
      <div class="modal-body">
        ${[
          {name:'Project CLM Luwu Raya', skema:'WITH_TIMBANGAN', active:false},
          {name:'Project NPM Konawe', skema:'WITHOUT_TIMBANGAN', active:true},
          {name:'Project PPS Sultra', skema:'WITH_TIMBANGAN', active:false},
        ].map(b=>`
        <div style="padding:12px;border:1px solid ${b.active?'var(--brown-mid)':'var(--border)'};border-radius:8px;margin-bottom:10px;cursor:pointer;background:${b.active?'var(--cream)':'white'};display:flex;justify-content:space-between;align-items:center" onclick="showToast('Berpindah ke ${b.name}');closeModal('branchModal')">
          <div>
            <div style="font-weight:600;font-size:13px">${b.name}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
              <span class="badge ${b.skema==='WITH_TIMBANGAN'?'badge-imported':'badge-manual'}">${b.skema}</span>
            </div>
          </div>
          ${b.active?'<svg width="16" height="16" fill="#16A34A" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>':''}
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', setActiveNav);
