(function() {
  'use strict';

  /* ── Custom Modal System ── */
  function showModal(html, options) {
    const existing = document.getElementById('custom-modal');
    if (existing) existing.remove();
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'custom-modal';
    backdrop.innerHTML = `<div class="modal-box">${html}</div>`;
    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    if (options && options.closeOnClick) backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    return { modal: backdrop, close };
  }

  function showAlert(msg, title) {
    const { close } = showModal(`<div style="margin-bottom:16px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.9);">${title || 'ISHGuard'}</div><div class="modal-input" style="border:none;background:transparent;padding:0;margin-bottom:20px;line-height:1.5;word-break:break-word;font-size:13px;color:rgba(255,255,255,0.7);">${msg}</div><button onclick="this.closest('.modal-backdrop').remove()" class="modal-btn" style="width:100%;background:#FF6B00;color:#fff;">OK</button>`);
  }

  function showConfirm(msg, title) {
    return new Promise((resolve) => {
      const { close } = showModal(`<div style="margin-bottom:16px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.9);">${title || 'Confirm'}</div><div style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:20px;line-height:1.5;">${msg}</div><div style="display:flex;gap:8px;"><button id="modal-cancel" class="modal-btn" style="flex:1;background:transparent;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);">Cancel</button><button id="modal-confirm" class="modal-btn" style="flex:1;background:#FF6B00;color:#fff;">Confirm</button></div>`);
      document.getElementById('modal-confirm').onclick = () => { close(); resolve(true); };
      document.getElementById('modal-cancel').onclick = () => { close(); resolve(false); };
    });
  }

  function showPrompt(msg, defaultValue) {
    return new Promise((resolve) => {
      const { close } = showModal(`<div style="margin-bottom:16px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.9);">${msg}</div><input id="modal-prompt-input" class="modal-input" type="text" value="${(defaultValue||'').replace(/"/g,'&quot;')}" style="margin-bottom:16px;"><div style="display:flex;gap:8px;"><button id="modal-cancel" class="modal-btn" style="flex:1;background:transparent;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);">Cancel</button><button id="modal-confirm" class="modal-btn" style="flex:1;background:#FF6B00;color:#fff;">Save</button></div>`);
      const input = document.getElementById('modal-prompt-input');
      input.focus();
      input.select();
      document.getElementById('modal-confirm').onclick = () => { close(); resolve(input.value); };
      document.getElementById('modal-cancel').onclick = () => { close(); resolve(null); };
      input.onkeydown = (e) => { if (e.key === 'Enter') { close(); resolve(input.value); } };
    });
  }

  window.showEmergencyContact = function() {
    showModal(`<div style="margin-bottom:16px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.9);">Emergency Contact: ISHConnect Security</div><div style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:20px;line-height:1.8;"><div>Phone/WhatsApp: +250 787 377 750</div><div>Email: ishconnlab@gmail.com</div><div style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.3);">Response Time: Within 24 hours</div></div><button onclick="this.closest('.modal-backdrop').remove()" class="modal-btn" style="width:100%;background:#FF6B00;color:#fff;">OK</button>`, { closeOnClick: true });
  };

  const state = {
    view: 'dashboard',
    health: null,
    network: null,
    processes: null,
    scanRunning: false,
    scanResults: null,
    threats: [],
    duplicates: null,
    drives: [],
    quarantine: [],
    quarantineStats: null,
    scanning: false,
    scanProgress: null,
    aiAnalysis: null,
    validation: null,
    hardening: null,
    lastScanTime: null,
    vaultItems: [],
    vaultStats: null,
    vaultCategories: null,
    vaultSearchResults: null,
    vaultViewing: null,
    vaultReaderMode: false,
    vaultFloatingVisible: false,
    folderLockData: null,
    folderLockStats: null,
    versionRecoveryStats: null,
    guardianStats: null,
    guardianTimeline: null,
    screenLockStatus: null,
    emergencyStatus: null
  };

  document.addEventListener('DOMContentLoaded', init);

  let healthInterval = null;
  let aiInterval = null;

  function init() {
    document.getElementById('app').innerHTML = layout();
    if (window.ishguard) {
      window.ishguard.getHomeDir().then(d => { window._homeDir = d; }).catch(() => {});
    }
    bindNav();
    showView('dashboard');
    refreshDashboard();

    // First-run auto-scan
    window.ishguard?.onAction?.('first-run-scan', () => {
      setTimeout(() => startThreatScan('system'), 1000);
    });
    if (window.ishguard && window.ishguard.onQuickScan) {
      window.ishguard.onQuickScan(() => showView('threat-scan'));
    }
    healthInterval = setInterval(() => {
      refreshMetrics();
    }, 5000);
    aiInterval = setInterval(() => {
      if (state.view === 'dashboard' && window.ishguard) {
        loadAiAnalysis();
        loadValidation();
        loadHardening();
      }
    }, 30000);
  }

  function layout() {
    return `
    <div class="app-shell">
      ${sidebar()}
      <div class="main-area">
        ${topbar()}
        <div id="view-container" class="view-container"></div>
      </div>
    </div>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif; background:#050A12; color:#fff; overflow:hidden; }
      .app-shell { display:flex; height:100vh; }
      .sidebar { width:240px; background:#0B1F3B; border-right:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; padding:20px 12px; flex-shrink:0; box-shadow:2px 0 12px rgba(0,0,0,0.2); }
      .sidebar-brand { display:flex; align-items:center; gap:10px; padding:0 8px; margin-bottom:28px; }
      .sidebar-brand svg { flex-shrink:0; }
      .sidebar-brand span { font-size:18px; font-weight:700; letter-spacing:-0.3px; }
      .sidebar-brand .gold { color:#FF6B00; }
      .nav-section { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.25); padding:12px 8px 6px; font-weight:600; }
      .nav-btn { display:flex; align-items:center; gap:10px; width:100%; padding:10px 12px; border:none; border-radius:8px; background:transparent; color:rgba(255,255,255,0.5); font-size:13px; cursor:pointer; transition:all 0.15s; text-align:left; }
      .nav-btn:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.8); }
      .nav-btn.active { background:rgba(201,162,39,0.1); color:#FF6B00; }
      .nav-btn svg { flex-shrink:0; }
      .sidebar-footer { margin-top:auto; padding:16px 8px 0; border-top:1px solid rgba(255,255,255,0.05); }
      .status-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
      .status-dot { width:8px; height:8px; border-radius:50%; }
      .status-dot.safe { background:#4ade80; box-shadow:0 0 6px rgba(74,222,128,0.4); }
      .status-dot.warning { background:#facc15; box-shadow:0 0 6px rgba(250,204,21,0.4); }
      .status-dot.risk { background:#ef4444; box-shadow:0 0 6px rgba(239,68,68,0.4); }
      .status-label { font-size:12px; color:rgba(255,255,255,0.5); }
      .status-sub { font-size:10px; color:rgba(255,255,255,0.2); }
      .main-area { flex:1; display:flex; flex-direction:column; overflow:hidden; }
      .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 32px; border-bottom:1px solid rgba(255,255,255,0.05); background:#0B1F3B; flex-shrink:0; }
      .topbar-title { font-size:16px; font-weight:600; }
      .topbar-sub { font-size:12px; color:rgba(255,255,255,0.3); margin-left:12px; }
      .topbar-actions { display:flex; gap:8px; }
      .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; transition:all 0.15s; border:1px solid transparent; }
      .btn-ghost { background:transparent; color:rgba(255,255,255,0.6); border-color:rgba(255,255,255,0.1); }
      .btn-ghost:hover { background:rgba(255,255,255,0.05); color:#fff; }
      .btn-primary { background:#FF6B00; color:#0B1F3B; font-weight:700; }
      .btn-primary:hover { background:#d4a92e; }
      .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
      .btn-secondary { background:rgba(201,162,39,0.15); color:#FF6B00; border-color:rgba(201,162,39,0.3); }
      .btn-secondary:hover { background:rgba(201,162,39,0.25); }
      .btn-danger { background:rgba(239,68,68,0.15); color:#ef4444; border-color:rgba(239,68,68,0.3); }
      .btn-danger:hover { background:rgba(239,68,68,0.25); }
      .btn-sm { padding:6px 12px; font-size:12px; }
      .btn-lg { padding:12px 28px; font-size:14px; }
      .view-container { flex:1; overflow-y:auto; padding:24px 32px; }
      .card { background:rgba(11,31,59,0.5); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:20px; backdrop-filter:blur(8px); }
      .card-title { font-size:11px; font-weight:600; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
      .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
      .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
      .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
      .metric { padding:16px; background:rgba(11,31,59,0.5); border:1px solid rgba(255,255,255,0.05); border-radius:10px; }
      .metric-label { font-size:10px; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
      .metric-value { font-size:20px; font-weight:700; font-family:'SF Mono','Cascadia Code',monospace; margin-bottom:2px; }
      .metric-detail { font-size:11px; color:rgba(255,255,255,0.25); }
      .text-safe { color:#4ade80; }
      .text-warning { color:#facc15; }
      .text-risk { color:#ef4444; }
      .text-muted { color:rgba(255,255,255,0.4); }
      .text-gold { color:#FF6B00; }
      .flex-center { display:flex; align-items:center; justify-content:center; }
      .flex-col { flex-direction:column; }
      .gap-sm { gap:8px; }
      .gap-md { gap:16px; }
      .gap-lg { gap:24px; }
      .mt-sm { margin-top:8px; }
      .mt-md { margin-top:16px; }
      .mt-lg { margin-top:24px; }
      .mb-sm { margin-bottom:8px; }
      .mb-md { margin-bottom:16px; }
      .mb-lg { margin-bottom:24px; }
      .text-center { text-align:center; }
      .w-full { width:100%; }
      .progress-bar { width:100%; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden; }
      .progress-fill { height:100%; background:#FF6B00; border-radius:2px; transition:width 0.3s; }
      .progress-fill.safe { background:#4ade80; }
      .progress-fill.warning { background:#facc15; }
      .progress-fill.risk { background:#ef4444; }
      .scroll-area { max-height:400px; overflow-y:auto; }
      .threat-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:13px; }
      .threat-item:last-child { border-bottom:none; }
      .threat-name { color:rgba(255,255,255,0.8); }
      .threat-file { font-size:11px; color:rgba(255,255,255,0.3); font-family:'SF Mono',monospace; word-break:break-all; }
      .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; color:rgba(255,255,255,0.2); }
      .empty-state .icon { font-size:48px; margin-bottom:16px; }
      .empty-state .text { font-size:14px; }
      .drive-card { display:flex; align-items:center; gap:12px; padding:12px 16px; background:rgba(11,31,59,0.5); border:1px solid rgba(255,255,255,0.05); border-radius:10px; cursor:pointer; transition:all 0.15s; }
      .drive-card:hover { border-color:rgba(255,255,255,0.15); }
      .drive-letter { width:40px; height:40px; border-radius:8px; background:rgba(201,162,39,0.1); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; color:#FF6B00; }
      .drive-path { font-size:13px; color:rgba(255,255,255,0.7); }
      .drive-status { font-size:11px; }
      .table-header { display:flex; padding:8px 14px; font-size:11px; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid rgba(255,255,255,0.05); }
      .table-row { display:flex; align-items:center; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:13px; }
      .table-row:last-child { border-bottom:none; }
      .table-row:hover { background:rgba(255,255,255,0.02); }
      .col-1 { flex:0 0 40px; }
      .col-2 { flex:2; }
      .col-3 { flex:3; }
      .col-1r { flex:0 0 100px; text-align:right; }
      .col-actions { flex:0 0 120px; text-align:right; }
      .col-actions-wide { flex:0 0 180px; text-align:right; }
      .scan-overlay { position:fixed; inset:0; background:rgba(5,10,18,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:100; }
      .scan-overlay .title { font-size:20px; font-weight:700; margin-bottom:8px; }
      .scan-overlay .sub { font-size:13px; color:rgba(255,255,255,0.4); margin-bottom:24px; }
      .scan-overlay .bar { width:320px; }
      .scan-overlay .count { font-size:11px; color:rgba(255,255,255,0.3); margin-top:8px; }
      .tab-bar { display:flex; gap:4px; margin-bottom:20px; }
      .tab-btn { padding:8px 16px; border-radius:8px; border:1px solid transparent; font-size:12px; font-weight:500; cursor:pointer; background:transparent; color:rgba(255,255,255,0.4); transition:all 0.15s; }
      .tab-btn:hover { color:rgba(255,255,255,0.7); }
      .tab-btn.active { background:rgba(201,162,39,0.1); color:#FF6B00; border-color:rgba(201,162,39,0.3); }
      .scroll-thin::-webkit-scrollbar { width:4px; }
      .scroll-thin::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
      .ai-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:rgba(201,162,39,0.08); color:#FF6B00; border:1px solid rgba(201,162,39,0.15); }
      .risk-meter { width:120px; height:120px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-direction:column; margin:0 auto; }
      .risk-meter-text { font-size:28px; font-weight:800; font-family:'SF Mono',monospace; }
      .risk-meter-label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; }
      .finding-item { padding:12px 16px; border-left:3px solid; margin-bottom:8px; background:rgba(11,31,59,0.3); border-radius:0 8px 8px 0; }
      .finding-item.critical { border-color:#ef4444; }
      .finding-item.warning { border-color:#facc15; }
      .finding-item.info { border-color:#FF6B00; }
      .finding-title { font-size:13px; font-weight:600; margin-bottom:4px; }
      .finding-desc { font-size:12px; color:rgba(255,255,255,0.5); margin-bottom:6px; }
      .finding-recommendation { font-size:11px; color:#FF6B00; padding:6px 10px; background:rgba(201,162,39,0.06); border-radius:6px; }
      .validation-item { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:12px; }
      .validation-item:last-child { border-bottom:none; }
      .hardening-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.03); }
      .hardening-item:last-child { border-bottom:none; }
      .hardening-item:hover { background:rgba(255,255,255,0.02); }
      .timeline { position:relative; padding-left:24px; }
      .timeline::before { content:''; position:absolute; left:8px; top:4px; bottom:4px; width:1px; background:rgba(255,255,255,0.08); }
      .timeline-event { position:relative; padding:8px 0 8px 16px; font-size:12px; }
      .timeline-event::before { content:''; position:absolute; left:-20px; top:12px; width:8px; height:8px; border-radius:50%; background:#FF6B00; }
      .timeline-event.safe::before { background:#4ade80; }
      .timeline-event.risk::before { background:#ef4444; }
      .timeline-event .event-time { font-size:10px; color:rgba(255,255,255,0.2); margin-right:8px; }
      .timeline-event .event-desc { color:rgba(255,255,255,0.6); }
      @keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      .modal-backdrop { position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; background:rgba(5,10,18,0.85); backdrop-filter:blur(4px); animation:fadeIn .15s; }
      .modal-box { background:#0B1F3B; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:24px; min-width:360px; max-width:480px; box-shadow:0 24px 48px rgba(0,0,0,0.4); animation:slideUp .2s; }
      .modal-btn { padding:10px 20px; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; }
      .modal-btn:hover { filter:brightness(1.1); }
      .modal-btn:active { transform:scale(0.97); }
      .modal-input { width:100%; padding:10px 12px; border:1px solid rgba(255,255,255,0.12); border-radius:8px; background:rgba(5,10,18,0.5); color:#fff; font-size:13px; outline:none; transition:border-color .15s; box-sizing:border-box; }
      .modal-input:focus { border-color:#FF6B00; }
      .view-transition { animation:slideUp .2s; }
      ::-webkit-scrollbar { width:6px; }
      ::-webkit-scrollbar-track { background:transparent; }
      ::-webkit-scrollbar-thumb { background:rgba(255,107,0,0.3); border-radius:3px; }
      ::-webkit-scrollbar-thumb:hover { background:rgba(255,107,0,0.5); }
      .vault-card { display:flex; align-items:center; gap:12px; padding:12px 16px; background:rgba(11,31,59,0.4); border:1px solid rgba(255,107,0,0.1); border-radius:10px; transition:all .2s; cursor:pointer; }
      .vault-card:hover { border-color:rgba(255,107,0,0.25); transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,0.2); }
      .vault-card.active { border-color:rgba(255,107,0,0.3); background:rgba(11,31,59,0.6); }
      .skeleton { background:linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:6px; }
      @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
      @keyframes scanPulse { 0%,100% { transform:scale(1); opacity:0.15; } 50% { transform:scale(1.05); opacity:0.3; } }
      @keyframes scanRotate { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes scanDash { 0% { stroke-dashoffset:565; } 100% { stroke-dashoffset:0; } }
      .scan-ring-container { position:relative; width:140px; height:140px; margin:0 auto 20px; }
      .scan-ring-container svg { position:absolute; inset:0; }
      .scan-ring-bg { fill:none; stroke:rgba(255,107,0,0.1); stroke-width:4; }
      .scan-ring-fg { fill:none; stroke:#FF6B00; stroke-width:4; stroke-linecap:round; stroke-dasharray:565; transform:rotate(-90deg); transform-origin:70px 70px; animation:scanDash 2s ease-out forwards; }
      .scan-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
      .scan-center-icon { width:36px; height:36px; border-radius:50%; background:rgba(255,107,0,0.15); display:flex; align-items:center; justify-content:center; animation:scanPulse 1.5s ease-in-out infinite; }
      .scan-ring-pulse { position:absolute; inset:-8px; border-radius:50%; border:2px solid rgba(255,107,0,0.2); animation:scanPulse 2s ease-in-out infinite; }
      .ai-pulse-dot { width:6px; height:6px; border-radius:50%; background:#FF6B00; display:inline-block; animation:aiPulse 1.5s ease-in-out infinite; }
      .bt-card { display:flex; align-items:center; gap:12px; padding:12px 16px; background:rgba(11,31,59,0.4); border:1px solid rgba(255,255,255,0.05); border-radius:10px; transition:all .2s; }
      .bt-card:hover { border-color:rgba(255,107,0,0.2); }
      .bt-icon { width:36px; height:36px; border-radius:8px; background:rgba(59,130,246,0.15); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
      .bt-icon.connected { background:rgba(74,222,128,0.15); }
      .bt-threat-prompt { display:flex; gap:8px; margin-top:16px; }
      .bt-threat-prompt .btn { flex:1; padding:12px 16px; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; }
      .bt-threat-prompt .btn:hover { filter:brightness(1.1); }
      .bt-threat-prompt .btn:active { transform:scale(0.97); }
      .bt-threat-prompt .btn-delete { background:#ef4444; color:#fff; }
      .bt-threat-prompt .btn-quarantine { background:#FF6B00; color:#fff; }
      .bt-threat-prompt .btn-cancel { background:transparent; border:1px solid rgba(255,255,255,0.15); color:rgba(255,255,255,0.7); }
      .bt-file-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.03); }
      .bt-file-item:last-child { border-bottom:none; }
      .bt-file-item.threat { background:rgba(239,68,68,0.05); border-left:3px solid #ef4444; }
      .bt-file-item.safe { border-left:3px solid #4ade80; }
      .bt-file-item.pending { border-left:3px solid rgba(255,255,255,0.15); }
      @keyframes aiPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(0.7); } }
      @keyframes animateIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      .animate-in { animation:animateIn 0.4s cubic-bezier(.16,1,.3,1) both; }

      /* ── Premium Security Modules CSS ── */
      .pm-hero { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; gap:16px; flex-wrap:wrap; }
      .pm-hero h2 { font-size:22px; font-weight:700; color:#fff; }
      .pm-hero p { font-size:13px; color:rgba(255,255,255,0.4); margin-top:4px; }
      .pm-card { background:linear-gradient(135deg,rgba(11,31,59,0.6),rgba(11,31,59,0.3)); border:1px solid rgba(255,107,0,0.08); border-radius:12px; padding:20px; transition:all .3s cubic-bezier(.16,1,.3,1); backdrop-filter:blur(20px); }
      .pm-card:hover { border-color:rgba(255,107,0,0.2); transform:translateY(-1px); }
      .pm-card-accent { background:linear-gradient(135deg,rgba(255,107,0,0.07),rgba(255,107,0,0.02)); border:1px solid rgba(255,107,0,0.12); border-radius:12px; padding:20px; }
      .pm-grid-4 { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-bottom:24px; }
      .pm-grid-2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(360px,1fr)); gap:16px; margin-bottom:24px; }
      .pm-stat { display:flex; align-items:center; gap:14px; }
      .pm-stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .pm-stat-value { font-size:24px; font-weight:700; color:#fff; }
      .pm-stat-label { font-size:12px; color:rgba(255,255,255,0.4); margin-top:2px; }
      .pm-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; cursor:pointer; transition:all .2s; }
      .pm-btn:hover { filter:brightness(1.1); transform:translateY(-1px); }
      .pm-btn:active { transform:scale(.97); }
      .pm-btn-primary { background:linear-gradient(135deg,#FF6B00,#FF8C00); color:#fff; }
      .pm-btn-secondary { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.8); }
      .pm-btn-danger { background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); }
      .pm-btn-sm { padding:6px 12px; font-size:12px; }
      .pm-tag { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:600; }
      .pm-tag-green { background:rgba(24,201,100,0.12); color:#18C964; }
      .pm-tag-orange { background:rgba(255,107,0,0.12); color:#FF6B00; }
      .pm-tag-red { background:rgba(239,68,68,0.12); color:#ef4444; }
      .pm-tag-blue { background:rgba(59,130,246,0.12); color:#3B82F6; }
      .pm-tag-gray { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.4); }
      .pm-table { width:100%; border-collapse:collapse; font-size:13px; }
      .pm-table th { text-align:left; padding:10px 12px; color:rgba(255,255,255,0.4); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid rgba(255,255,255,0.05); }
      .pm-table td { padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.03); color:rgba(255,255,255,0.7); }
      .pm-table tr:hover td { background:rgba(255,255,255,0.02); }
      .pm-progress { height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; margin-top:8px; }
      .pm-progress-bar { height:100%; border-radius:3px; transition:width .6s cubic-bezier(.16,1,.3,1); }
      .pm-empty { text-align:center; padding:40px 20px; color:rgba(255,255,255,0.3); font-size:14px; }
      .pm-empty svg { width:48px; height:48px; margin:0 auto 12px; opacity:0.2; }
      .pm-list { display:flex; flex-direction:column; gap:4px; }
      .pm-list-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:8px; transition:background .15s; }
      .pm-list-item:hover { background:rgba(255,255,255,0.03); }
      .pm-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px 14px; font-size:13px; color:#fff; width:100%; outline:none; transition:border-color .2s; }
      .pm-input:focus { border-color:rgba(255,107,0,0.4); }
      .pm-input::placeholder { color:rgba(255,255,255,0.25); }
      .pm-lockscreen { position:fixed; inset:0; z-index:9999; background:#050A12; display:flex; align-items:center; justify-content:center; }
      .pm-lockscreen-bg { position:absolute; inset:0; background:radial-gradient(ellipse 60% 50% at 50% 20%,rgba(255,107,0,0.08),transparent 60%),radial-gradient(ellipse 40% 30% at 80% 80%,rgba(59,130,246,0.04),transparent 60%); }
      .pm-lockscreen-content { position:relative; text-align:center; z-index:1; }
      .pm-lockscreen-shield { width:80px; height:80px; margin:0 auto 24px; background:linear-gradient(135deg,rgba(255,107,0,0.15),rgba(255,107,0,0.05)); border-radius:20px; border:1px solid rgba(255,107,0,0.2); display:flex; align-items:center; justify-content:center; }
      .pm-lockscreen-time { font-size:64px; font-weight:700; color:#fff; letter-spacing:-2px; line-height:1; }
      .pm-lockscreen-date { font-size:16px; color:rgba(255,255,255,0.4); margin-top:8px; }
      .pm-lockscreen-status { margin-top:16px; display:flex; align-items:center; justify-content:center; gap:8px; }
      .pm-lockscreen-status-text { font-size:13px; color:rgba(255,255,255,0.5); }
      .pm-lockscreen-footer { position:absolute; bottom:40px; left:0; right:0; text-align:center; }
      .pm-lockscreen-footer span { font-size:12px; color:rgba(255,255,255,0.2); }
      .pm-lockscreen-footer .brand { color:#FF6B00; }
      .pm-emergency-active { animation:emergencyPulse 2s ease-in-out infinite; }
      @keyframes emergencyPulse { 0%,100% { box-shadow:0 0 20px rgba(239,68,68,0.2); } 50% { box-shadow:0 0 40px rgba(239,68,68,0.4); } }
      .pm-auth-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:20px; }
      .pm-auth-card { padding:16px; border-radius:10px; text-align:center; cursor:pointer; transition:all .2s; border:1px solid rgba(255,255,255,0.06); }
      .pm-auth-card:hover { border-color:rgba(255,107,0,0.2); background:rgba(255,107,0,0.05); }
      .pm-auth-card.active { border-color:#FF6B00; background:rgba(255,107,0,0.08); }
      .pm-auth-card-icon { width:40px; height:40px; margin:0 auto 8px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; }
      .pm-auth-card-label { font-size:13px; font-weight:600; color:#fff; }
      .pm-auth-card-desc { font-size:11px; color:rgba(255,255,255,0.4); margin-top:2px; }
      .pm-toggle { display:flex; align-items:center; gap:10px; cursor:pointer; padding:6px 0; }
      .pm-toggle-switch { width:36px; height:20px; border-radius:10px; background:rgba(255,255,255,0.1); position:relative; transition:background .2s; flex-shrink:0; }
      .pm-toggle-switch.active { background:#FF6B00; }
      .pm-toggle-switch::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .2s; }
      .pm-toggle-switch.active::after { transform:translateX(16px); }

    </style>`;
  }

  function sidebar() {
    return `
    <div class="sidebar">
      <div class="sidebar-brand">
        <svg width="28" height="28" viewBox="0 0 512 512" style="fill:none;">
          <path d="M256 32L448 96V240C448 352 352 448 256 480 160 448 64 352 64 240V96Z" fill="#0B1F3B" stroke="#FF6B00" stroke-width="12"/>
          <text x="256" y="290" text-anchor="middle" font-weight="800" font-size="140" fill="#FF6B00" font-family="Inter,sans-serif">IS</text>
        </svg>
        <span>ISH<span class="gold">Guard</span></span>
      </div>
      <div class="nav-section">Security Tools</div>
      ${navBtn('dashboard', 'Dashboard', 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6')}
      ${navBtn('threat-scan', 'Threat Scanner', 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z')}
      ${navBtn('usb-scan', 'USB Drive Scan', 'M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z')}
      ${navBtn('duplicates', 'Duplicate Finder', 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z')}
      ${navBtn('quarantine', 'Quarantine', 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z')}
      <div class="nav-section">Bluetooth Security</div>
      ${navBtn('bluetooth-scan', 'Bluetooth Scan', 'M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.61-7.812-1.7a.75.75 0 01-.437-.695z')}
      <div class="nav-section">Premium Security</div>
      ${navBtn('folder-lock', 'AI Folder Lock', 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z')}
      ${navBtn('version-recovery', 'Version Recovery', 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15')}
      ${navBtn('folder-guardian', 'Folder AI Guardian', 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z')}
      ${navBtn('screen-lock', 'Smart Screen Lock', 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z')}
      ${navBtn('lock-screen', 'Lock Screen', 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z')}
      ${navBtn('emergency-lock', 'Emergency Lock', 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z')}
      <div class="nav-section">System Optimization</div>
      ${navBtn('privacy-cleaner', 'Privacy Cleaner', 'M9.75 3.75v2.25m0 0a2.25 2.25 0 002.25 2.25h1.5m-3.75-4.5a2.25 2.25 0 00-2.25 2.25v1.5m0 0H6.75a2.25 2.25 0 00-2.25 2.25v1.5m0 0H3.75m0 0a2.25 2.25 0 01-2.25-2.25v-1.5m0 0H3.75m0 0V7.5a2.25 2.25 0 012.25-2.25h1.5M12 12l-3 3m0 0l3 3m-3-3h12')}
      ${navBtn('security-policies', 'Security Policies', 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z')}
      <div class="nav-section">Smart Vault</div>
      ${navBtn('vault', 'Content Vault', 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z')}
      ${navBtn('vault-reader', 'Reader Mode', 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25')}
      <div class="sidebar-footer">
        <div class="status-row"><div id="sd-dot" class="status-dot safe"></div><span id="sd-label" class="status-label">All Systems Normal</span></div>
        <div class="status-sub"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:2px;opacity:0.4;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>ISHGuard Engine v3.0.0 · <span style="display:inline-flex;align-items:center;gap:4px;"><span class="ai-pulse-dot"></span>AI-Powered</span></div>
        <div style="font-size:10px;color:rgba(255,255,255,0.2);margin-top:6px;"><span style="color:#F97316;font-size:10px;">●</span> Powered by ISHConnect</div>
      </div>
    </div>`;
  }

  function navBtn(id, label, path) {
    return `<button class="nav-btn" data-view="${id}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>${label}</button>`;
  }

  function topbar() {
    const titles = {
      'dashboard': ['Security Dashboard', 'Real-time system analysis with AI insights'],
      'threat-scan': ['Threat Scanner', 'Deep malware & virus analysis engine'],
      'usb-scan': ['USB Drive Scan', 'Shortcut virus & autorun detection'],
      'duplicates': ['Duplicate Finder', 'SHA256 content-based deduplication'],
      'quarantine': ['Quarantine Manager', 'Isolated threat containment zone'],
      'folder-lock': ['AI Folder Lock', 'AES-256 encrypted folder protection'],
      'version-recovery': ['Version Recovery', 'File version history & ransomware rollback'],
      'folder-guardian': ['Folder AI Guardian', 'Behavioral AI folder protection'],
      'screen-lock': ['Smart Screen Lock', 'Face, PIN & password authentication'],
      'lock-screen': ['Lock Screen', 'Premium security lock screen display'],
      'emergency-lock': ['Emergency Lock', 'One-click maximum security mode'],
      'privacy-cleaner': ['Privacy Cleaner', 'Remove temporary files, caches & browsing data'],
      'security-policies': ['Security Policies', 'Windows security configuration & hardening']
    };
    const t = titles['dashboard'];
    return `
    <div class="topbar">
      <div><span class="topbar-title" id="tb-title">${t[0]}</span><span class="topbar-sub" id="tb-sub">${t[1]}</span></div>
      <div class="topbar-actions">
        <span id="ai-badge-top" class="ai-badge" style="display:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a4 4 0 014 4c0 1.5-.8 2.8-2 3.5v.5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-.5A4 4 0 018 8a4 4 0 014-4z"/><path d="M6 12a3 3 0 000 6h12a3 3 0 000-6"/><path d="M12 21v-4"/></svg>
          AI
        </span>
        <button class="btn btn-ghost btn-sm" onclick="window.showEmergencyContact()" style="color:#ef4444;border-color:rgba(239,68,68,0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          SOS
        </button>
        <button class="btn btn-ghost btn-sm" id="btn-refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
          Refresh
        </button>
      </div>
    </div>`;
  }

  function bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('active'); });
        btn.classList.add('active');
        showView(btn.dataset.view);
      });
    });
    document.querySelector('.nav-btn').classList.add('active');
    document.getElementById('btn-refresh').addEventListener('click', () => refreshDashboard());
  }

  function showView(view) {
    state.view = view;
    const titles = {
      'dashboard': ['Security Dashboard', 'Real-time system analysis with AI insights'],
      'threat-scan': ['Threat Scanner', 'Deep malware & virus analysis engine'],
      'usb-scan': ['USB Drive Scan', 'Shortcut virus & autorun detection'],
      'duplicates': ['Duplicate Finder', 'SHA256 content-based deduplication'],
      'quarantine': ['Quarantine Manager', 'Isolated threat containment zone'],
      'bluetooth-scan': ['Bluetooth Security', 'Scan files transferred via Bluetooth devices'],
      'vault': ['Content Vault', 'Saved articles, PDFs, notes & AI summaries'],
      'vault-reader': ['Reader Mode', 'AI-powered reading & study assistant'],
      'folder-lock': ['AI Folder Lock', 'AES-256 encrypted folder protection'],
      'version-recovery': ['Version Recovery', 'File version history & ransomware rollback'],
      'folder-guardian': ['Folder AI Guardian', 'Behavioral AI folder protection'],
      'screen-lock': ['Smart Screen Lock', 'Face, PIN & password authentication'],
      'lock-screen': ['Lock Screen', 'Premium security lock screen display'],
      'emergency-lock': ['Emergency Lock', 'One-click maximum security mode'],
      'privacy-cleaner': ['Privacy Cleaner', 'Remove temporary files, caches & browsing data'],
      'security-policies': ['Security Policies', 'Windows security configuration & hardening']
    };
    const t = titles[view] || ['Unknown', ''];
    document.getElementById('tb-title').textContent = t[0];
    document.getElementById('tb-sub').textContent = t[1];
    const c = document.getElementById('view-container');
    c.className = 'view-container view-transition';
    if (view === 'dashboard') c.innerHTML = viewDashboard();
    else if (view === 'threat-scan') c.innerHTML = viewThreatScan();
    else if (view === 'usb-scan') c.innerHTML = viewUsbScan();
    else if (view === 'duplicates') c.innerHTML = viewDuplicates();
    else if (view === 'quarantine') c.innerHTML = viewQuarantine();
    else if (view === 'bluetooth-scan') c.innerHTML = viewBluetoothScan();
    else if (view === 'vault') { c.innerHTML = viewVault(); loadVault(); }
    else if (view === 'vault-reader') c.innerHTML = viewReaderMode();
    else if (view === 'folder-lock') { c.innerHTML = viewFolderLock(); loadFolderLock(); }
    else if (view === 'version-recovery') { c.innerHTML = viewVersionRecovery(); loadVersionRecovery(); }
    else if (view === 'folder-guardian') { c.innerHTML = viewFolderGuardian(); loadFolderGuardian(); }
    else if (view === 'screen-lock') { c.innerHTML = viewScreenLock(); loadScreenLock(); }
    else if (view === 'lock-screen') { c.innerHTML = viewLockScreen(); }
    else if (view === 'privacy-cleaner') { c.innerHTML = viewPrivacyCleaner(); }
    else if (view === 'security-policies') { c.innerHTML = viewSecurityPolicies(); loadSecurityPolicies(); }
    setTimeout(() => c.className = 'view-container', 300);
    updateAiBadge();
  }

  async function updateAiBadge() {
    const badge = document.getElementById('ai-badge-top');
    if (!badge) return;
    if (state.aiAnalysis) {
      badge.style.display = 'flex';
      badge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a4 4 0 014 4c0 1.5-.8 2.8-2 3.5v.5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-.5A4 4 0 018 8a4 4 0 014-4z"/><path d="M6 12a3 3 0 000 6h12a3 3 0 000-6"/><path d="M12 21v-4"/></svg> AI ${state.aiAnalysis.riskLevel}`;
    } else {
      badge.style.display = 'none';
    }
  }

  async function refreshMetrics() {
    if (!window.ishguard) return;
    try {
      const h = await window.ishguard.scanSystemHealth();
      state.health = h;
      updateStatusBar(h);
      if (state.view === 'dashboard') {
        const cpuEl = document.getElementById('metric-cpu');
        if (cpuEl) {
          document.getElementById('metric-cpu-value').textContent = (h.cpu?.usagePercent ?? '?') + '%';
          document.getElementById('metric-cpu-detail').textContent = (h.cpu?.cores ?? '?') + ' cores';
        }
        const memEl = document.getElementById('metric-mem');
        if (memEl) {
          document.getElementById('metric-mem-value').textContent = fmtBytes(h.memory?.used) + ' / ' + fmtBytes(h.memory?.total);
          document.getElementById('metric-mem-detail').textContent = (h.memory?.usagePercent ?? '?') + '% utilized';
        }
        const upEl = document.getElementById('metric-uptime');
        if (upEl) {
          document.getElementById('metric-uptime-value').textContent = fmtUptime(h.uptime);
        }
        const platEl = document.getElementById('metric-platform');
        if (platEl) {
          document.getElementById('metric-platform-value').textContent = h.platform || '?';
          document.getElementById('metric-platform-detail').textContent = h.arch || '';
        }
      }
    } catch {}
  }

  window.refreshDashboard = async function() {
    if (!window.ishguard) return;
    try {
      const h = await window.ishguard.scanSystemHealth();
      state.health = h;
      updateStatusBar(h);
      if (state.view === 'dashboard') {
        document.getElementById('view-container').innerHTML = viewDashboard();
        loadAiAnalysis();
        loadValidation();
        loadHardening();
      }
    } catch {}
  };

  async function loadAiAnalysis() {
    if (!window.ishguard) return;
    try {
      const analysis = await window.ishguard.aiAnalyzeCurrent();
      state.aiAnalysis = analysis;
      updateStatusBar(state.health);
      const el = document.getElementById('ai-panel');
      if (el) el.innerHTML = renderAiPanel(analysis);
      updateAiBadge();
    } catch {}
  }

  async function loadValidation() {
    if (!window.ishguard) return;
    try {
      const v = await window.ishguard.validateModules();
      state.validation = v;
      const el = document.getElementById('validation-panel');
      if (el) el.innerHTML = renderValidationPanel(v);
    } catch {}
  }

  async function loadHardening() {
    if (!window.ishguard) return;
    try {
      const h = await window.ishguard.hardeningSummary();
      state.hardening = h;
      const el = document.getElementById('hardening-panel');
      if (el) el.innerHTML = renderHardeningPanel(h);
    } catch {}
  }

  function updateStatusBar(h) {
    if (!h) return;
    const dot = document.getElementById('sd-dot');
    const lab = document.getElementById('sd-label');
    const ai = state.aiAnalysis;
    if (ai && ai.riskLevel === 'high') {
      dot.className = 'status-dot risk'; lab.textContent = 'HIGH RISK — AI recommends action';
    } else if (ai && ai.riskLevel === 'medium') {
      dot.className = 'status-dot warning'; lab.textContent = 'MEDIUM RISK — Review needed';
    } else if (h.cpu?.status === 'warning' || h.memory?.status === 'warning') {
      dot.className = 'status-dot warning'; lab.textContent = 'Warning — Review required';
    } else {
      dot.className = 'status-dot safe'; lab.textContent = 'Protected — AI monitoring active';
    }
  }

  /* ── DASHBOARD ── */
  function viewDashboard() {
    const h = state.health;
    const ai = state.aiAnalysis;
    const val = state.validation;
    const hard = state.hardening;
    if (!h) return `<div class="flex-center flex-col" style="height:60%;color:rgba(255,255,255,0.2);"><div style="font-size:40px;margin-bottom:16px;">🛡️</div><div>Loading system data...</div></div>`;

    const riskColor = ai ? (ai.riskLevel === 'high' ? '#ef4444' : ai.riskLevel === 'medium' ? '#facc15' : '#4ade80') : '#4ade80';
    const riskPct = ai ? ai.riskScore : 0;

    return `
    <!-- System Metrics Row -->
    <div class="grid-4" style="margin-bottom:16px;">
      ${metric('CPU Usage', h.cpu?.usagePercent+'%', h.cpu?.cores+' cores', h.cpu?.status, 'cpu')}
      ${metric('Memory', fmtBytes(h.memory?.used)+' / '+fmtBytes(h.memory?.total), h.memory?.usagePercent+'% utilized', h.memory?.status, 'mem')}
      ${metric('Platform', h.platform, h.arch, 'safe', 'platform')}
      ${metric('Uptime', fmtUptime(h.uptime), h.hostname, 'safe', 'uptime')}
    </div>

    <div class="grid-2" style="margin-bottom:16px;">
      <!-- AI Risk Meter -->
      <div class="card" style="text-align:center;">
        <div class="card-title">AI Risk Assessment</div>
        <div id="ai-panel">${ai ? renderAiPanel(ai) : '<div class="flex-center flex-col" style="padding:20px;"><div style="font-size:12px;color:rgba(255,255,255,0.3);">Analyzing system...</div></div>'}</div>
      </div>

      <!-- Security Status -->
      <div class="card">
        <div class="card-title">Device Status & Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
          ${statusRow('CPU', h.cpu?.status)}
          ${statusRow('Memory', h.memory?.status)}
          ${statusRow('AI Engine', ai ? 'safe' : 'pending')}
          ${statusRow('Threat Rules', 'safe')}
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;display:flex;flex-direction:column;gap:6px;">
          <button onclick="showView('threat-scan')" class="btn btn-ghost w-full" style="justify-content:flex-start;padding:10px 14px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            Run Threat Scan
          </button>
          <button onclick="showView('usb-scan')" class="btn btn-ghost w-full" style="justify-content:flex-start;padding:10px 14px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Scan USB Drives
          </button>
          <button onclick="showView('duplicates')" class="btn btn-ghost w-full" style="justify-content:flex-start;padding:10px 14px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25"/></svg>
            Find Duplicates
          </button>
        </div>
      </div>
    </div>

    <!-- Validation & Hardening Row -->
    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card">
        <div class="card-title">Feature Validation</div>
        <div id="validation-panel">${val ? renderValidationPanel(val) : '<div style="font-size:12px;color:rgba(255,255,255,0.3);padding:8px;">Checking modules...</div>'}</div>
      </div>
      <div class="card">
        <div class="card-title">Security Hardening (${hard ? hard.total : '...'} checks)</div>
        <div id="hardening-panel">${hard ? renderHardeningPanel(hard) : '<div style="font-size:12px;color:rgba(255,255,255,0.3);padding:8px;">Checking system...</div>'}</div>
      </div>
    </div>

    ${state.lastScanTime ? `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">Alert Timeline</div>
      <div class="timeline">
        ${renderTimeline()}
      </div>
    </div>` : ''}

    <div style="margin-top:16px;text-align:center;padding:12px;">
      <div style="font-size:10px;color:rgba(255,255,255,0.1);">ISHGuard v3.0.0 · AI-Powered Offline Security · ${new Date().toLocaleString()}</div>
    </div>`;
  }

  function renderAiPanel(analysis) {
    const score = analysis.riskScore || 0;
    const color = analysis.riskLevel === 'high' ? '#ef4444' : analysis.riskLevel === 'medium' ? '#facc15' : '#4ade80';
    const r = 48;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;
    return `
    <div style="display:flex;flex-direction:column;align-items:center;padding:8px 0;">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="8"
          stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
          transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 0.6s ease,stroke 0.3s;"/>
        <text x="60" y="52" text-anchor="middle" font-size="28" font-weight="800"
          font-family="'SF Mono','Cascadia Code',monospace" fill="${color}">${score}</text>
        <text x="60" y="74" text-anchor="middle" font-size="10" font-weight="600"
          letter-spacing="0.5" fill="${color}" text-transform="uppercase">${analysis.riskLevel.toUpperCase()}</text>
      </svg>
      <div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,0.5);">${analysis.summary || 'No summary available'}</div>
    </div>
    ${analysis.findings && analysis.findings.length > 0 ? `
    <div style="margin-top:12px;text-align:left;border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
      <div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">AI Observations</div>
      ${analysis.findings.slice(0, 3).map(f => `
        <div class="finding-item ${f.severity}">
          <div class="finding-title" style="color:${f.severity === 'critical' ? '#ef4444' : f.severity === 'warning' ? '#facc15' : '#FF6B00'};">${f.title || f.name}</div>
          <div class="finding-desc">${f.description}</div>
          ${f.recommendation ? `<div class="finding-recommendation">→ ${f.recommendation}</div>` : ''}
        </div>
      `).join('')}
    </div>` : ''}
    <div style="margin-top:8px;font-size:10px;color:rgba(255,255,255,0.2);">${analysis.findings ? analysis.findings.length + ' observations' : ''}</div>`;
  }

  function renderValidationPanel(v) {
    return `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <span style="font-size:24px;font-weight:700;color:${v.passed === v.modules.length ? '#4ade80' : '#facc15'};">${v.passed}/${v.modules.length}</span>
      <span style="font-size:11px;color:rgba(255,255,255,0.3);">modules passed</span>
    </div>
    <div class="scroll-area scroll-thin" style="max-height:200px;">
      ${v.modules.map(m => `
        <div class="validation-item">
          <span style="color:rgba(255,255,255,0.6);">${m.name}</span>
          <span class="badge ${m.status === 'passed' ? 'badge-safe' : m.status === 'warning' ? 'badge-warning' : 'badge-risk'}">${m.status}</span>
        </div>
      `).join('')}
    </div>`;
  }

  function renderHardeningPanel(h) {
    if (!h.checks || h.checks.length === 0) {
      return '<div style="font-size:12px;color:rgba(255,255,255,0.3);padding:8px;">No hardening checks available</div>';
    }
    return `
    <div class="scroll-area scroll-thin" style="max-height:200px;">
      ${h.checks.slice(0, 6).map(c => `
        <div class="hardening-item">
          <div style="flex:1;">
            <div style="font-size:12px;color:rgba(255,255,255,0.7);">${c.name}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.3);">${c.description || ''}</div>
          </div>
          <span class="badge ${c.recommended !== c.current ? 'badge-warning' : 'badge-safe'}">${c.recommended !== c.current ? 'Fix needed' : 'Secure'}</span>
        </div>
      `).join('')}
    </div>`;
  }

  function renderTimeline() {
    const events = [];
    if (state.lastScanTime) events.push({ time: state.lastScanTime, desc: 'Full system scan completed', cls: 'safe' });
    if (state.aiAnalysis && state.aiAnalysis.riskLevel === 'high') events.push({ time: state.lastScanTime, desc: 'AI risk assessment: HIGH', cls: 'risk' });
    return events.map(e => `
      <div class="timeline-event ${e.cls}">
        <span class="event-time">${new Date(e.time).toLocaleTimeString()}</span>
        <span class="event-desc">${e.desc}</span>
      </div>
    `).join('');
  }

  function metric(l, v, d, s, id) {
    const color = s === 'warning' ? '#facc15' : s === 'risk' ? '#ef4444' : '#4ade80';
    const idAttr = id ? ` id="metric-${id}"` : '';
    return `<div class="metric"${idAttr}><div class="metric-label">${l}</div><div class="metric-value" style="color:${color};" id="${id ? 'metric-' + id + '-value' : ''}">${v}</div><div class="metric-detail" id="${id ? 'metric-' + id + '-detail' : ''}">${d}</div></div>`;
  }

  function statusRow(l, s) {
    const icon = s === 'safe' ? '✓' : s === 'pending' ? '○' : '⚠';
    const c = s === 'safe' ? '#4ade80' : s === 'pending' ? 'rgba(255,255,255,0.2)' : '#facc15';
    return `<div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;padding:4px 0;"><span style="color:rgba(255,255,255,0.4);">${l}</span><span style="color:${c};">${icon}</span></div>`;
  }

  /* ── THREAT SCANNER ── */
  function viewThreatScan() {
    return `
    <div class="flex-center flex-col" style="padding:40px 0;">
      <div class="scan-ring-container" id="scan-ring-idle">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle class="scan-ring-bg" cx="70" cy="70" r="64"/>
          <circle class="scan-ring-fg" cx="70" cy="70" r="64" stroke-dashoffset="400" style="animation:none;"/>
        </svg>
        <div class="scan-center">
          <div class="scan-center-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" stroke-width="1.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          </div>
        </div>
      </div>
      <div id="scan-ring-active" style="display:none;" class="scan-ring-container">
        <div class="scan-ring-pulse"></div>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle class="scan-ring-bg" cx="70" cy="70" r="64"/>
          <circle id="scan-arc" class="scan-ring-fg" cx="70" cy="70" r="64" stroke-dashoffset="400" style="stroke-dasharray:400;"/>
        </svg>
        <div class="scan-center">
          <div style="text-align:center;">
            <div id="sp-pct" style="font-size:22px;font-weight:800;font-family:'SF Mono',monospace;color:#FF6B00;">0%</div>
            <div id="sp-files" style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;">Scanning...</div>
          </div>
        </div>
      </div>
      <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;">Malware & Virus Scanner</h2>
      <p style="font-size:13px;color:rgba(255,255,255,0.4);max-width:450px;text-align:center;margin-bottom:24px;">
        Scans executables, scripts, shortcuts, and suspicious files for known malware signatures, suspicious patterns, and behavioral threats.
      </p>
      <div style="display:flex;gap:12px;">
        <button id="btn-scan-system" onclick="startThreatScan('system')" class="btn btn-primary btn-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Scan System
        </button>
        <button id="btn-scan-custom" onclick="startThreatScan('custom')" class="btn btn-ghost btn-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
          Select Folder
        </button>
      </div>
      <div id="threat-results" style="display:none;"></div>`;
  }

  window.startThreatScan = async function(type) {
    let dir = '';
    if (type === 'custom') {
      if (!window.ishguard) return;
      dir = await window.ishguard.selectDir();
      if (!dir) return;
    } else {
      dir = window._homeDir || 'C:\\';
    }

    document.getElementById('btn-scan-system').disabled = true;
    document.getElementById('btn-scan-custom').disabled = true;
    document.getElementById('scan-ring-idle').style.display = 'none';
    document.getElementById('scan-ring-active').style.display = '';
    const res = document.getElementById('threat-results');
    res.style.display = 'none';
    res.innerHTML = '';

    state.threats = [];

    if (window.ishguard) {
      try {
        const circumference = 400;
        window.ishguard.onScanProgress((p) => {
          const arc = document.getElementById('scan-arc');
          const pctEl = document.getElementById('sp-pct');
          const filesEl = document.getElementById('sp-files');
          const maxFiles = Math.max(p.total || 100, p.scanned || 0);
          const pct = maxFiles > 0 ? Math.min(100, Math.round(((p.scanned || 0) / maxFiles) * 100)) : 0;
          const dashOffset = circumference - (pct / 100) * circumference;
          arc.style.strokeDashoffset = dashOffset;
          arc.style.transition = 'stroke-dashoffset 0.3s ease';
          pctEl.textContent = pct + '%';
          filesEl.textContent = `Scanning ${p.total || '...'} files`;
        });
        window.ishguard.onThreatFound((t) => {
          state.threats.push(t);
        });

        const result = await window.ishguard.scanThreatDir(dir);
        state.scanResults = result;
        state.lastScanTime = new Date().toISOString();

        document.getElementById('scan-ring-active').style.display = 'none';
        document.getElementById('btn-scan-system').disabled = false;
        document.getElementById('btn-scan-custom').disabled = false;
        res.style.display = 'block';
        res.innerHTML = renderThreatResults(result, dir);

        const dot = document.getElementById('sd-dot');
        const lab = document.getElementById('sd-label');
        if (result.threats?.length > 0) {
          dot.className = 'status-dot risk'; lab.textContent = `${result.threats.length} threat(s) detected`;
        } else {
          dot.className = 'status-dot safe'; lab.textContent = 'Scan complete — no threats found';
        }

        // Run AI analysis on results
        if (window.ishguard.aiAnalyze) {
          const analysis = await window.ishguard.aiAnalyze({
            health: state.health,
            network: state.network,
            processes: state.processes,
            verdict: { status: result.threats?.length > 0 ? 'risk' : 'safe', triggeredCount: result.threats?.length || 0, findings: (result.threats || []).map(t => ({ name: t.threats?.[0]?.name || 'Threat', severity: t.threats?.[0]?.severity || 'risk', description: t.file })) }
          });
          state.aiAnalysis = analysis;
          updateAiBadge();
        }
      } catch (e) {
        prog.style.display = 'none';
        document.getElementById('btn-scan-system').disabled = false;
        document.getElementById('btn-scan-custom').disabled = false;
        res.style.display = 'block';
        res.innerHTML = `<div class="card" style="text-align:center;color:#ef4444;padding:40px;">Error: ${e.message || 'Scan failed'}</div>`;
      }
    }
  };

  function renderThreatResults(result, dir) {
    const threats = result.threats || [];
    const safe = threats.length === 0;
    return `
    <div class="card" style="margin-top:8px;">
      <div class="flex-center flex-col" style="padding:20px;">
        <div style="width:72px;height:72px;border-radius:50%;background:${safe ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)'};border:3px solid ${safe ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'};display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${safe ? '#4ade80' : '#ef4444'}" stroke-width="2">
            ${safe ? '<path d="M9 12l2 2 4-4m5-6v13a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14z"/>' : '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>'}
          </svg>
        </div>
        <div style="font-size:22px;font-weight:700;color:${safe ? '#4ade80' : '#ef4444'};">${safe ? 'SYSTEM CLEAN' : 'THREATS DETECTED'}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:8px;">
          Scanned ${result.scanned || 0} files in ${dir}
          ${!safe ? ' &middot; ' + threats.length + ' threat(s) found' : ''}
        </div>
      </div>
      ${!safe ? `
      <div style="border-top:1px solid rgba(255,255,255,0.05);padding:16px;">
        <div class="card-title mb-sm">Detected Threats</div>
        <div class="scroll-area scroll-thin">
          ${threats.map(t => `
            <div class="threat-item">
              <div><div class="threat-name">${t.threats?.[0]?.name || 'Unknown Threat'}</div><div class="threat-file">${t.file}</div></div>
              <div style="display:flex;gap:6px;align-items:center;">
                <span class="badge badge-risk">${t.threats?.[0]?.severity || 'risk'}</span>
                <button class="btn btn-danger btn-sm" onclick="quarantineFile('${escapePath(t.file)}')">Quarantine</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
      <div style="border-top:1px solid rgba(255,255,255,0.05);padding:12px 16px;display:flex;gap:8px;justify-content:flex-end;">
        <button onclick="showView('threat-scan')" class="btn btn-ghost btn-sm">Scan Again</button>
        ${!safe ? `<button onclick="quarantineAll()" class="btn btn-danger btn-sm">Quarantine All</button>` : ''}
      </div>
    </div>`;
  }

  /* ── USB SCAN ── */
  function viewUsbScan() {
    return `
    <div class="card" style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" stroke-width="1.5"><path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>
        <div><div style="font-size:14px;font-weight:600;">USB Drive Security Scanner</div><div style="font-size:11px;color:rgba(255,255,255,0.3);">Detects shortcut viruses, autorun.inf, and hidden executables on removable drives</div></div>
      </div>
      <button onclick="scanDrives()" class="btn btn-primary" id="btn-scan-drives">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        Scan All Drives
      </button>
    </div>
    <div id="drive-scan-ring" style="display:none;" class="scan-ring-container">
      <div class="scan-ring-pulse"></div>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle class="scan-ring-bg" cx="70" cy="70" r="64"/>
        <circle id="dscan-arc" class="scan-ring-fg" cx="70" cy="70" r="64" stroke-dashoffset="0" style="stroke-dasharray:400;"/>
      </svg>
      <div class="scan-center">
        <div style="text-align:center;">
          <div id="dsp-pct" style="font-size:22px;font-weight:800;font-family:'SF Mono',monospace;color:#FF6B00;">Scanning</div>
          <div id="dsp-files" style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;">Checking drives...</div>
        </div>
      </div>
    </div>
    <div id="drive-list"></div>
    <div id="drive-results" style="margin-top:16px;"></div>`;
  }

  window.scanDrives = async function() {
    const btn = document.getElementById('btn-scan-drives');
    btn.disabled = true;
    btn.textContent = 'Scanning...';
    const list = document.getElementById('drive-list');
    const res = document.getElementById('drive-results');
    list.innerHTML = '';
    res.innerHTML = '';

    if (!window.ishguard) return;

    const drives = await window.ishguard.listDrives();
    state.drives = drives;

    if (!drives || drives.length === 0) {
      list.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);">No removable drives detected.</div>';
      btn.disabled = false; btn.textContent = 'Scan All Drives';
      return;
    }

    const scanRing = document.getElementById('drive-scan-ring');
    scanRing.style.display = '';
    const pctEl = document.getElementById('dsp-pct');
    const filesEl = document.getElementById('dsp-files');
    const arc = document.getElementById('dscan-arc');
    const circumference = 400;

    let allThreats = [];
    for (const drive of drives) {
      list.innerHTML += `<div class="card" style="margin-bottom:8px;padding:16px;"><div style="display:flex;align-items:center;gap:12px;"><div class="drive-letter">${drive.letter}</div><div><div class="drive-path">${drive.path}</div><div class="drive-status" style="color:rgba(255,255,255,0.3);">Scanning...</div></div></div></div>`;
    }

    for (let i = 0; i < drives.length; i++) {
      const d = drives[i];
      const pct = Math.round(((i + 1) / drives.length) * 100);
      const dashOffset = circumference - (pct / 100) * circumference;
      arc.style.strokeDashoffset = dashOffset;
      arc.style.transition = 'stroke-dashoffset 0.3s ease';
      pctEl.textContent = pct + '%';
      filesEl.textContent = `Drive ${i + 1} of ${drives.length}`;
      try {
        const result = await window.ishguard.scanDrive(d.path);
        const cards = list.querySelectorAll('.card');
        const statusEl = cards[i]?.querySelector('.drive-status');
        if (result.status === 'risk') {
          allThreats.push({ drive: d.path, ...result });
          if (statusEl) { statusEl.textContent = `${result.threats?.length || 0} threat(s) found`; statusEl.style.color = '#ef4444'; }
        } else {
          if (statusEl) { statusEl.textContent = 'Clean'; statusEl.style.color = '#4ade80'; }
        }
      } catch {}
    }

    scanRing.style.display = 'none';
    res.innerHTML = renderDriveResults(allThreats);
    btn.disabled = false; btn.textContent = 'Scan All Drives';
  };

  function renderDriveResults(threats) {
    if (threats.length === 0) {
      return `<div class="card" style="text-align:center;padding:24px;"><div style="font-size:32px;margin-bottom:8px;">✅</div><div style="color:#4ade80;font-weight:600;">All drives clean — no threats detected</div></div>`;
    }
    return `
    <div class="card">
      <div class="card-title">Threats Found (${threats.reduce((s,t) => s + (t.threats?.length||0), 0)})</div>
      ${threats.map(t => `
        <div style="padding:12px;border-bottom:1px solid rgba(255,255,255,0.03);">
          <div style="font-size:13px;font-weight:600;color:#ef4444;">${t.drive}</div>
          ${(t.threats || []).map(th => `<div style="font-size:12px;color:rgba(255,255,255,0.5);padding:4px 0;">⚠ ${th.name}: ${th.detail}</div>`).join('')}
          ${(t.suspiciousFiles || []).length > 0 ? `<button onclick="cleanDrive('${escapePath(t.drive)}')" class="btn btn-danger btn-sm mt-sm">Clean Drive (${t.suspiciousFiles.length} shortcuts)</button>` : ''}
        </div>
      `).join('')}
    </div>`;
  }

  window.cleanDrive = async function(drivePath) {
    if (!window.ishguard) return;
    const result = await window.ishguard.scanDrive(drivePath);
    for (const threat of (result.threats || [])) { if (threat.file) await window.ishguard.quarantineAdd(threat.file); }
    for (const sf of (result.suspiciousFiles || [])) { await window.ishguard.quarantineAdd(sf.file); }
        showAlert(`Cleaned ${(result.suspiciousFiles || []).length + (result.hiddenExecutables || []).length} threat(s) from ${drivePath}`, 'USB Scan Complete');
    showView('usb-scan');
  };

  /* ── DUPLICATE FINDER ── */
  function viewDuplicates() {
    return `
    <div class="card" style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
        <div><div style="font-size:14px;font-weight:600;">Duplicate File Finder</div><div style="font-size:11px;color:rgba(255,255,255,0.3);">Find exact file duplicates by SHA256 content hash — free up disk space</div></div>
      </div>
      <div style="display:flex;gap:12px;">
        <button onclick="startDupScan('system')" class="btn btn-primary" id="btn-dup-scan">Scan User Folders</button>
        <button onclick="startDupScan('custom')" class="btn btn-ghost" id="btn-dup-custom">Select Folder</button>
      </div>
      <div id="dup-scan-ring" style="display:none;" class="scan-ring-container">
        <div class="scan-ring-pulse"></div>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle class="scan-ring-bg" cx="70" cy="70" r="64"/>
          <circle id="dupscan-arc" class="scan-ring-fg" cx="70" cy="70" r="64" stroke-dashoffset="0" style="stroke-dasharray:400;"/>
        </svg>
        <div class="scan-center">
          <div style="text-align:center;">
            <div id="dupsp-pct" style="font-size:22px;font-weight:800;font-family:'SF Mono',monospace;color:#FF6B00;">Scanning</div>
            <div id="dupsp-files" style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;">Finding duplicates...</div>
          </div>
        </div>
      </div>
    </div>
    <div id="dup-results"></div>`;
  }

  window.startDupScan = async function(type) {
    let dir = '';
    if (type === 'custom') {
      if (!window.ishguard) return;
      dir = await window.ishguard.selectDir();
      if (!dir) return;
    } else {
      dir = window._homeDir || 'C:\\Users';
    }

    document.getElementById('btn-dup-scan').disabled = true;
    document.getElementById('btn-dup-custom').disabled = true;
    const scanRing = document.getElementById('dup-scan-ring');
    scanRing.style.display = '';
    const res = document.getElementById('dup-results');
    res.innerHTML = '';

    if (window.ishguard) {
      try {
        const result = await window.ishguard.scanDuplicates(dir);
        scanRing.style.display = 'none';
        document.getElementById('btn-dup-scan').disabled = false;
        document.getElementById('btn-dup-custom').disabled = false;

        if (result.totalDuplicates === 0) {
          res.innerHTML = `<div class="card" style="text-align:center;padding:40px;"><div style="font-size:32px;margin-bottom:8px;">✅</div><div style="color:#4ade80;font-weight:600;">No duplicate files found</div></div>`;
        } else {
          res.innerHTML = renderDupResults(result);
        }
      } catch (e) {
        prog.style.display = 'none';
        document.getElementById('btn-dup-scan').disabled = false;
        document.getElementById('btn-dup-custom').disabled = false;
        res.innerHTML = `<div class="card" style="text-align:center;color:#ef4444;padding:40px;">Error: ${e.message || 'Scan failed'}</div>`;
      }
    }
  };

  function renderDupResults(result) {
    const dups = result.duplicates || [];
    const shown = dups.slice(0, 100);
    const totalSize = dups.reduce((s, d) => s + (d.size || 0), 0);
    return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
          <div class="card-title" style="margin-bottom:0;">Duplicate Files</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.3);">${result.totalDuplicates} groups · ${fmtBytes(totalSize)} reclaimable</div>
        </div>
        <span class="badge badge-info">${result.scanned} files scanned</span>
      </div>
      ${dups.length > 100 ? `<div style="font-size:12px;color:rgba(255,255,255,0.2);margin-bottom:8px;">Showing 100 of ${dups.length} duplicates</div>` : ''}
      <div class="scroll-area scroll-thin" style="max-height:500px;">
        ${shown.map((d, i) => `
          <div class="table-row" style="font-size:12px;">
            <span class="col-1" style="color:rgba(255,255,255,0.2);">${i+1}</span>
            <span class="col-3" style="font-family:'SF Mono',monospace;font-size:11px;color:rgba(255,255,255,0.5);word-break:break-all;">${d.original}</span>
            <span class="col-3" style="font-family:'SF Mono',monospace;font-size:11px;color:rgba(255,255,255,0.5);word-break:break-all;">${d.duplicate}</span>
            <span class="col-1r" style="color:rgba(255,255,255,0.3);">${fmtBytes(d.size)}</span>
            <span class="col-actions">
              <button class="btn btn-danger btn-sm" onclick="quarantineFile('${escapePath(d.duplicate)}')">Delete</button>
            </span>
          </div>
        `).join('')}
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.05);padding:12px 0 0;display:flex;gap:8px;justify-content:flex-end;">
        <button onclick="showView('duplicates')" class="btn btn-ghost btn-sm">Scan Again</button>
      </div>
    </div>`;
  }

  /* ── QUARANTINE ── */
  function viewQuarantine() {
    loadQuarantine();
    return `<div id="quarantine-content"><div class="flex-center flex-col" style="padding:60px;color:rgba(255,255,255,0.2);"><div style="font-size:32px;margin-bottom:12px;">🔒</div><div>Loading quarantine...</div></div></div>`;
  }

  async function loadQuarantine() {
    if (!window.ishguard) return;
    try {
      const list = await window.ishguard.quarantineList();
      state.quarantine = list || [];
      const stats = await window.ishguard.quarantineStats();
      state.quarantineStats = stats;
      const el = document.getElementById('quarantine-content');
      if (el) el.innerHTML = renderQuarantine(list, stats);
    } catch {}
  }

  function renderQuarantine(list, stats) {
    if (!list || list.length === 0) {
      return `<div class="card" style="text-align:center;padding:60px;">
        <div style="font-size:48px;margin-bottom:16px;opacity:0.3;">🛡️</div>
        <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Quarantine is Empty</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.3);">No threats have been quarantined yet. Threats will appear here after scanning.</div>
      </div>`;
    }
    const totalSize = list.reduce((s, i) => s + (i.fileSize || 0), 0);
    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div>
        <div style="font-size:16px;font-weight:600;">${list.length} Quarantined Item(s)</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.3);">${fmtBytes(totalSize)} total</div>
      </div>
      <button onclick="emptyQuarantine()" class="btn btn-danger btn-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        Empty All
      </button>
    </div>
    <div class="card">
      <div class="table-header">
        <span class="col-2">File Name</span>
        <span class="col-3">Original Path</span>
        <span class="col-1r">Size</span>
        <span class="col-1r">Date</span>
        <span class="col-actions-wide">Actions</span>
      </div>
      <div class="scroll-area scroll-thin" style="max-height:500px;">
        ${list.map((item) => `
          <div class="table-row">
            <span class="col-2" style="font-family:'SF Mono',monospace;font-size:12px;">${item.fileName || 'Unknown'}</span>
            <span class="col-3" style="font-size:11px;color:rgba(255,255,255,0.4);word-break:break-all;">${item.originalPath || 'Unknown'}</span>
            <span class="col-1r" style="font-size:12px;color:rgba(255,255,255,0.3);">${fmtBytes(item.fileSize)}</span>
            <span class="col-1r" style="font-size:11px;color:rgba(255,255,255,0.3);">${item.quarantinedAt ? new Date(item.quarantinedAt).toLocaleDateString() : ''}</span>
            <span class="col-actions-wide" style="display:flex;gap:4px;justify-content:flex-end;">
              <button class="btn btn-ghost btn-sm" onclick="restoreQuarantine('${item.id}')">Restore</button>
              <button class="btn btn-danger btn-sm" onclick="deleteQuarantine('${item.id}')">Delete</button>
            </span>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  window.quarantineFile = async function(filePath) {
    if (!window.ishguard) return;
    try {
      const result = await window.ishguard.quarantineAdd(filePath);
      if (result.success) {
        showAlert(`File quarantined successfully:\n${filePath}\n→ ${result.quarantinedPath}`, 'Quarantine');
        if (state.view === 'quarantine') loadQuarantine();
      } else { showAlert(`Failed to quarantine: ${result.error || 'Unknown error'}`, 'Error'); }
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  window.quarantineAll = async function() {
    if (!window.ishguard || !state.threats || state.threats.length === 0) return;
    let count = 0;
    for (const threat of state.threats) {
      try { const r = await window.ishguard.quarantineAdd(threat.file); if (r.success) count++; } catch {}
    }
      showAlert(`${count} of ${state.threats.length} threats quarantined.`, 'Quarantine');
    showView('quarantine');
  };

  window.restoreQuarantine = async function(id) {
    if (!window.ishguard) return;
    try {
      const r = await window.ishguard.quarantineRestore(id);
      if (r.success) loadQuarantine();
      else showAlert('Restore failed: ' + (r.error || 'Unknown'), 'Restore');
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  window.deleteQuarantine = async function(id) {
    if (!window.ishguard) return;
    const confirmed = await showConfirm('Permanently delete this quarantined file?');
    if (!confirmed) return;
    try { await window.ishguard.quarantineDelete(id); loadQuarantine(); } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  window.emptyQuarantine = async function() {
    if (!window.ishguard) return;
    const confirmed = await showConfirm('Permanently delete ALL quarantined files? This cannot be undone.');
    if (!confirmed) return;
    try { await window.ishguard.quarantineEmpty(); loadQuarantine(); } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  /* ── BLUETOOTH SECURITY ── */
  let btKnownFiles = new Set();
  let btDevices = [];
  let btTransferDirs = [];
  let btPendingFiles = [];
  let btScannedFiles = [];

  function viewBluetoothScan() {
    btKnownFiles = new Set();
    btDevices = [];
    btPendingFiles = [];
    btScannedFiles = [];
    return `
    <div style="max-width:800px;">
      <div class="grid-2" style="margin-bottom:16px;">
        <div class="card" style="text-align:center;">
          <div class="card-title">Bluetooth Devices</div>
          <div style="font-size:28px;font-weight:700;color:#3B82F6;font-family:'SF Mono',monospace;" id="bt-device-count">...</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;" id="bt-device-sub">Scanning for devices...</div>
        </div>
        <div class="card" style="text-align:center;">
          <div class="card-title">Transfer Watch Dirs</div>
          <div style="font-size:28px;font-weight:700;color:#3B82F6;font-family:'SF Mono',monospace;" id="bt-dir-count">...</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;" id="bt-dir-sub">Monitoring for new files...</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div class="card-title" style="margin-bottom:0;">Discovered Devices</div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary" onclick="window.startBluetoothScan()" id="btn-bt-scan">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.61-7.812-1.7a.75.75 0 01-.437-.695z"/></svg>
              Scan Devices
            </button>
            <button class="btn btn-ghost" onclick="window.scanBluetoothTransfers()" id="btn-bt-transfer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
              Check Transfers
            </button>
          </div>
        </div>
        <div id="bt-device-list">
          <div class="empty-state">
            <div class="icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3;"><path d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.61-7.812-1.7a.75.75 0 01-.437-.695z"/></svg>
            </div>
            <div class="text">Click "Scan Devices" to discover Bluetooth devices</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div class="card-title" style="margin-bottom:0;">Monitored Transfer Directories</div>
        </div>
        <div id="bt-dir-list">
          <div class="empty-state">
            <div class="text" style="font-size:12px;">Run "Scan Devices" to detect transfer folders</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div class="card-title" style="margin-bottom:0;">Incoming Files</div>
          <span style="font-size:11px;color:rgba(255,255,255,0.3);" id="bt-file-count">0 files</span>
        </div>
        <div id="bt-file-list">
          <div class="empty-state">
            <div class="icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3;"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V6l-4.5-4.5z"/><path d="M16.5 3v4.5H21"/></svg>
            </div>
            <div class="text">No incoming Bluetooth file transfers detected</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  window.startBluetoothScan = async function() {
    if (!window.ishguard) return;
    const btn = document.getElementById('btn-bt-scan');
    if (btn) { btn.disabled = true; btn.textContent = ' Scanning...'; }

    try {
      const scanResult = await window.ishguard.bluetoothRunScan();
      btDevices = scanResult.devices.devices || [];
      btTransferDirs = scanResult.watchedDirs || [];
      btPendingFiles = scanResult.pendingTransfers || [];

      document.getElementById('bt-device-count').textContent = btDevices.length;
      document.getElementById('bt-device-sub').textContent = btDevices.filter(d => d.connected).length + ' connected';
      document.getElementById('bt-dir-count').textContent = btTransferDirs.length;
      document.getElementById('bt-dir-sub').textContent = btTransferDirs.map(d => d.split('\\').pop()).join(', ') || 'No BT folders';

      renderBtDevices();
      renderBtDirs();
      renderBtFiles();
    } catch (e) {
      showAlert('Bluetooth scan error: ' + e.message, 'Error');
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.61-7.812-1.7a.75.75 0 01-.437-.695z"/></svg> Scan Devices'; }
  };

  window.scanBluetoothTransfers = async function() {
    if (!window.ishguard || btTransferDirs.length === 0) return;
    const btn = document.getElementById('btn-bt-transfer');
    if (btn) { btn.disabled = true; btn.textContent = ' Checking...'; }

    try {
      for (const dir of btTransferDirs) {
        const result = await window.ishguard.bluetoothScanDir(dir, Array.from(btKnownFiles));
        if (result.newFiles && result.newFiles.length > 0) {
          result.newFiles.forEach(f => {
            if (!btPendingFiles.find(p => p.path === f.path)) {
              btPendingFiles.push(f);
            }
            btKnownFiles.add(`${f.file}_${f.size}_${f.modified}`);
          });
        }
      }
      renderBtFiles();

      if (btPendingFiles.length > 0) {
        const total = btPendingFiles.length;
        const processed = btScannedFiles.length;
        const unprocessed = btPendingFiles.slice(processed);
        if (unprocessed.length > 0) {
          showAlert(`${unprocessed.length} new file${unprocessed.length > 1 ? 's' : ''} detected via Bluetooth. Scanning for threats...`, 'Bluetooth Transfer');
          await window.scanBluetoothIncoming();
        }
      }
    } catch (e) {
      showAlert('Transfer check error: ' + e.message, 'Error');
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg> Check Transfers'; }
  };

  window.scanBluetoothIncoming = async function() {
    if (!window.ishguard) return;
    for (let i = btScannedFiles.length; i < btPendingFiles.length; i++) {
      const file = btPendingFiles[i];
      try {
        const result = await window.ishguard.bluetoothScanFile(file.path);
        const scanned = { ...file, scanned: true, ...result };
        btScannedFiles.push(scanned);
        renderBtFiles();

        if (scanned.isThreat) {
          await showBluetoothThreatPrompt(scanned);
        }
      } catch (e) {
        btScannedFiles.push({ ...file, scanned: true, error: e.message, verdict: 'error' });
        renderBtFiles();
      }
    }
  };

  async function showBluetoothThreatPrompt(threat) {
    const fileName = threat.file || threat.path.split('\\').pop();
    const { close } = showModal(`
      <div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
        <span style="font-size:14px;font-weight:600;color:#ef4444;">Threat Detected via Bluetooth</span>
      </div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:16px;line-height:1.6;">
        <div style="margin-bottom:8px;">A threat was detected in a file received via Bluetooth:</div>
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:12px;margin-bottom:12px;">
          <div style="color:#fff;font-weight:600;margin-bottom:4px;word-break:break-all;">${escapeHtml(fileName)}</div>
          <div style="color:rgba(255,255,255,0.4);font-size:11px;font-family:'SF Mono',monospace;">${escapeHtml(threat.path || '')}</div>
          ${threat.threats && threat.threats.length > 0 ? `<div style="color:#ef4444;font-size:11px;margin-top:6px;">${threat.threats.map(t => '⚠ ' + (t.name || t.signature || t)).join('<br>')}</div>` : ''}
        </div>
        <div style="color:rgba(255,255,255,0.5);font-size:12px;">Choose an action for this file:</div>
      </div>
      <div class="bt-threat-prompt">
        <button class="btn btn-delete" id="bt-action-delete">Delete File</button>
        <button class="btn btn-quarantine" id="bt-action-quarantine">Quarantine</button>
        <button class="btn btn-cancel" id="bt-action-cancel">Cancel</button>
      </div>
    `, { closeOnClick: true });

    document.getElementById('bt-action-delete').onclick = async () => {
      close();
      try {
        const r = await window.ishguard.bluetoothHandleThreat(threat.path, 'delete');
        updateThreatStatus(threat.path, 'deleted');
        if (r.success) showAlert(r.message, 'File Deleted');
        else showAlert('Error: ' + r.message, 'Error');
      } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
    };

    document.getElementById('bt-action-quarantine').onclick = async () => {
      close();
      try {
        const r = await window.ishguard.bluetoothHandleThreat(threat.path, 'quarantine');
        updateThreatStatus(threat.path, 'quarantined');
        if (r.success) showAlert(r.message, 'Quarantined');
        else showAlert('Error: ' + r.message, 'Error');
      } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
    };

    document.getElementById('bt-action-cancel').onclick = () => {
      close();
      updateThreatStatus(threat.path, 'cancelled');
      showAlert('Transfer cancelled. File left in place.', 'Cancelled');
    };
  }

  function updateThreatStatus(filePath, action) {
    const idx = btScannedFiles.findIndex(f => f.path === filePath);
    if (idx >= 0) {
      btScannedFiles[idx].action = action;
      renderBtFiles();
    }
  }

  function renderBtDevices() {
    const el = document.getElementById('bt-device-list');
    if (!el) return;
    if (btDevices.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3;"><path d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.61-7.812-1.7a.75.75 0 01-.437-.695z"/></svg></div><div class="text">No Bluetooth devices found</div></div>';
      return;
    }
    el.innerHTML = btDevices.map(d => `
      <div class="bt-card">
        <div class="bt-icon ${d.connected ? 'connected' : ''}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${d.connected ? '#4ade80' : '#3B82F6'}" stroke-width="1.5"><path d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.61-7.812-1.7a.75.75 0 01-.437-.695z"/></svg>
        </div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:500;color:rgba(255,255,255,0.85);">${escapeHtml(d.name)}</div>
          <div style="font-size:11px;color:${d.connected ? '#4ade80' : 'rgba(255,255,255,0.3)'};">${d.connected ? 'Connected' : 'Disconnected'}</div>
        </div>
        <span style="font-size:10px;padding:2px 8px;border-radius:4px;background:${d.connected ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)'};color:${d.connected ? '#4ade80' : 'rgba(255,255,255,0.3)'};">${d.connected ? 'PAIRED' : 'AVAILABLE'}</span>
      </div>
    `).join('');
  }

  function renderBtDirs() {
    const el = document.getElementById('bt-dir-list');
    if (!el) return;
    if (btTransferDirs.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="text" style="font-size:12px;">No Bluetooth transfer directories detected</div></div>';
      return;
    }
    el.innerHTML = btTransferDirs.map(d => `
      <div class="bt-card">
        <div class="bt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="1.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
        </div>
        <div style="flex:1;">
          <div style="font-size:12px;color:rgba(255,255,255,0.7);font-family:\'SF Mono\',monospace;word-break:break-all;">${escapeHtml(d)}</div>
        </div>
      </div>
    `).join('');
  }

  function renderBtFiles() {
    const el = document.getElementById('bt-file-list');
    const countEl = document.getElementById('bt-file-count');
    if (!el) return;

    const allFiles = btPendingFiles.map(f => {
      const scanned = btScannedFiles.find(s => s.path === f.path);
      return scanned || f;
    });

    if (countEl) countEl.textContent = allFiles.length + ' file' + (allFiles.length !== 1 ? 's' : '');

    if (allFiles.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3;"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V6l-4.5-4.5z"/><path d="M16.5 3v4.5H21"/></svg></div><div class="text">No incoming Bluetooth file transfers detected</div></div>';
      return;
    }

    el.innerHTML = allFiles.map(f => {
      const status = f.scanned ? (f.isThreat ? 'threat' : 'safe') : 'pending';
      const actionLabel = f.action ? f.action.charAt(0).toUpperCase() + f.action.slice(1) : null;
      return `
      <div class="bt-file-item ${status}">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${status === 'threat' ? '#ef4444' : status === 'safe' ? '#4ade80' : 'rgba(255,255,255,0.3)'}" stroke-width="1.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V6l-4.5-4.5z"/><path d="M16.5 3v4.5H21"/></svg>
            <span style="font-size:13px;color:${status === 'threat' ? '#ef4444' : 'rgba(255,255,255,0.8)'};">${escapeHtml(f.file || f.name || f.path.split('\\').pop())}</span>
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,0.3);font-family:'SF Mono',monospace;margin-top:2px;">${f.size ? fmtBytes(f.size) : ''}${f.modified ? ' · ' + new Date(f.modified).toLocaleTimeString() : ''}</div>
        </div>
        <div style="text-align:right;">
          ${actionLabel ? `<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);text-transform:uppercase;">${actionLabel}</span>` :
          `<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${status === 'threat' ? 'rgba(239,68,68,0.15)' : status === 'safe' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)'};color:${status === 'threat' ? '#ef4444' : status === 'safe' ? '#4ade80' : 'rgba(255,255,255,0.4)'};">${status === 'threat' ? 'THREAT' : status === 'safe' ? 'SAFE' : 'PENDING'}</span>`}
        </div>
      </div>`;
    }).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── VAULT ── */
  function viewVault() {
    const stats = state.vaultStats;
    return `
    <div class="grid-3" style="margin-bottom:16px;">
      <div class="card" style="text-align:center;">
        <div class="card-title">Total Items</div>
        <div style="font-size:28px;font-weight:700;color:#FF6B00;font-family:'SF Mono',monospace;">${stats ? stats.totalItems : '...'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;">${stats ? fmtBytes(stats.totalSize) : ''} stored</div>
      </div>
      <div class="card" style="text-align:center;">
        <div class="card-title">Categories</div>
        <div style="font-size:28px;font-weight:700;color:#FF6B00;font-family:'SF Mono',monospace;">${stats ? Object.keys(stats.categoryCounts).length : '...'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;">${stats ? stats.categories.filter(c => c.count > 0).map(c => c.name).join(', ') : ''}</div>
      </div>
      <div class="card" style="text-align:center;">
        <div class="card-title">AI Analyses</div>
        <div style="font-size:28px;font-weight:700;color:#FF6B00;font-family:'SF Mono',monospace;">${stats && stats.categories ? (stats.categories.find(c => c.id === 'summaries')?.count || 0) : '...'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;">summaries & study notes</div>
      </div>
    </div>
    <div class="flex-center" style="gap:12px;margin-bottom:16px;">
      <input id="vault-url-input" type="text" placeholder="Paste URL to save content..." style="flex:1;max-width:500px;padding:10px 14px;background:rgba(11,31,59,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:13px;" />
      <button onclick="vaultSaveUrl()" class="btn btn-primary">Save to Vault</button>
      <button onclick="showView('vault-reader')" class="btn btn-ghost">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
        Reader Mode
      </button>
    </div>
    <div id="vault-content">
      <div class="flex-center flex-col" style="padding:40px;color:rgba(255,255,255,0.2);"><div style="font-size:32px;margin-bottom:12px;">📚</div><div>Loading vault...</div></div>
    </div>`;
  }

  async function loadVault(category) {
    if (!window.ishguard) return;
    try {
      const items = await window.ishguard.vaultList(category || 'all', 'savedAt', 'desc');
      state.vaultItems = items || [];
      const stats = await window.ishguard.vaultStats();
      state.vaultStats = stats;
      const cats = await window.ishguard.vaultCategories();
      state.vaultCategories = cats;
      const el = document.getElementById('vault-content');
      if (el) el.innerHTML = renderVaultItems(items, cats);
      const statEls = document.querySelectorAll('.grid-3 .card');
      if (statEls.length >= 3 && stats) {
        statEls[0].querySelector('div[style*="font-size:28px"]').textContent = stats.totalItems;
        statEls[1].querySelector('div[style*="font-size:28px"]').textContent = Object.keys(stats.categoryCounts).length;
        statEls[2].querySelector('div[style*="font-size:28px"]').textContent = stats.categories.find(c => c.id === 'summaries')?.count || 0;
      }
    } catch {}
  }

  function iconSvg(name) {
    const icons = {
      sparkles: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
      pencil: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
      download: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
      trash: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
      search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
      shield: 'M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z'
    };
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="${icons[name] || icons.shield}"/></svg>`;
  }

  function vaultIcon(cat) {
    const icons = { articles: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', pdfs: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', images: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z', notes: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10', summaries: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z', bookmarks: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z' };
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[cat] || icons.articles}"/></svg>`;
  }

  function renderVaultItems(items, categories) {
    if (!items || items.length === 0) {
      return `<div class="card" style="text-align:center;padding:60px;">
        <div style="margin-bottom:16px;opacity:0.3;">${vaultIcon('bookmarks')}</div>
        <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Your Vault is Empty</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.3);">Paste a URL above or use Reader Mode to save content offline.</div>
      </div>`;
    }
    return `
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="btn btn-sm ${!state.vaultFilter ? 'btn-secondary' : 'btn-ghost'}" onclick="state.vaultFilter=null;loadVault();">All (${items.length})</button>
      ${(categories || []).map(c => `
        <button class="btn btn-sm ${state.vaultFilter === c.id ? 'btn-secondary' : 'btn-ghost'}" onclick="state.vaultFilter='${c.id}';loadVault('${c.id}');">${vaultIcon(c.id)} ${c.name} (${c.count})</button>
      `).join('')}
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:12px;color:rgba(255,255,255,0.3);">${items.length} item(s) &middot; Sorted by date</div>
        <input id="vault-search-input" type="text" placeholder="Search vault..." style="padding:6px 12px;background:rgba(11,31,59,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;font-size:12px;width:200px;" oninput="vaultSearch(this.value)" />
      </div>
      <div class="scroll-area scroll-thin" style="max-height:500px;">
        ${items.map(item => `
          <div class="threat-item" onclick="vaultOpenItem('${item.id}')" style="cursor:pointer;">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;">
                ${vaultIcon(item.category)}
                <div>
                  <div class="threat-name">${item.title || 'Untitled'}</div>
                  <div class="threat-file">${item.url || item.type || ''} ${item.hasAiSummary ? '&middot; ' + vaultIcon('summaries') + ' AI Analyzed' : ''}</div>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;font-size:11px;color:rgba(255,255,255,0.3);">
              <span>${new Date(item.savedAt).toLocaleDateString()}</span>
              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();vaultDeleteItem('${item.id}')" style="padding:3px 8px;font-size:10px;">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  window.vaultSaveUrl = async function() {
    const input = document.getElementById('vault-url-input');
    if (!input || !input.value.trim()) return;
    const url = input.value.trim();
    input.value = '';
    if (!window.ishguard) return;
    try {
      const analysis = await window.ishguard.vaultAnalyze(url, '', 'text/html', {});
      if (!analysis.canSave) { showAlert('Cannot save: ' + (analysis.reason || 'Content not allowed'), 'Save Error'); return; }
      const pageText = analysis.textContent || analysis.metadata?.description || '';
      const sourceContent = pageText ? `<html><article><p>${pageText}</p></article></html>` : '<html><body><p>Saved from: ' + url + '</p></body></html>';
      const textContent = pageText || 'Content saved offline from: ' + url;
      const result = await window.ishguard.vaultSave({
        url, title: analysis.metadata?.title || url.split('/').pop() || 'Saved Page',
        content: sourceContent, textContent: textContent,
        type: analysis.pageType || 'webpage', category: analysis.pageType === 'article' ? 'articles' : 'bookmarks',
        tags: analysis.classification?.tags || []
      });
      if (result.success) { showAlert('Saved to vault!', 'Vault'); loadVault(); }
      else { showAlert('Failed: ' + (result.error || 'Unknown'), 'Error'); }
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  window.vaultSearch = async function(query) {
    if (!window.ishguard || query.length < 2) { loadVault(); return; }
    try {
      const results = await window.ishguard.vaultSearch(query);
      state.vaultSearchResults = results;
      const cats = state.vaultCategories;
      const el = document.getElementById('vault-content');
      if (el) {
        if (results.length === 0) el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);">No results for "' + query + '"</div>';
        else { state.vaultItems = results; el.innerHTML = renderVaultItems(results, cats); }
      }
    } catch {}
  };

  window.vaultOpenItem = async function(id) {
    if (!window.ishguard) return;
    try {
      const data = await window.ishguard.vaultGet(id);
      state.vaultViewing = data;
      const c = document.getElementById('view-container');
      c.innerHTML = viewVaultItem(data);
    } catch {}
  };

  function viewVaultItem(data) {
    const item = data.item || {};
    const hasAI = item.hasAiSummary;
    return `
    <button onclick="showView('vault')" class="btn btn-ghost btn-sm mb-sm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
      Back to Vault
    </button>
    <div class="card">
      <div style="font-size:16px;font-weight:700;margin-bottom:8px;">${item.title || 'Untitled'}</div>
      ${item.url ? `<div style="font-size:11px;color:rgba(255,255,255,0.3);font-family:'SF Mono',monospace;margin-bottom:12px;word-break:break-all;">${item.url}</div>` : ''}
      <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
        <span class="badge badge-info">${item.type || item.category}</span>
        <span class="badge badge-info">${new Date(item.savedAt).toLocaleDateString()}</span>
        ${(item.tags || []).map(t => `<span class="badge badge-info" style="background:rgba(201,162,39,0.05);">${t}</span>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        ${hasAI ? `<button onclick="vaultShowAnalysis('${item.id}')" class="btn btn-secondary btn-sm">${iconSvg('sparkles')} View AI Analysis</button>` : `<button onclick="vaultAnalyzeItem('${item.id}')" class="btn btn-ghost btn-sm">${iconSvg('sparkles')} AI Analyze</button>`}
        <button onclick="vaultAddNotesPrompt('${item.id}')" class="btn btn-ghost btn-sm">${iconSvg('pencil')} Add Notes</button>
        <button onclick="vaultExportItem('${item.id}')" class="btn btn-ghost btn-sm">${iconSvg('download')} Export</button>
        <button onclick="vaultDeleteItem('${item.id}')" class="btn btn-danger btn-sm">${iconSvg('trash')} Delete</button>
      </div>
      ${data.textContent ? `<div style="background:rgba(11,31,59,0.3);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:16px;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;max-height:400px;overflow-y:auto;" class="scroll-thin">${data.textContent.substring(0, 5000)}</div>` : ''}
      ${data.content ? `<div style="margin-top:12px;"><div style="font-size:11px;color:rgba(255,255,255,0.2);">HTML content (${data.content.length} chars) saved</div></div>` : ''}
      ${item.notes ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05);"><div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;">Your Notes</div><div style="font-size:13px;color:rgba(255,255,255,0.7);">${item.notes}</div></div>` : ''}
    </div>`;
  }

  window.vaultAnalyzeItem = async function(id) {
    if (!window.ishguard) return;
    try {
      const result = await window.ishguard.vaultAnalyzeItem(id);
      if (result.analysis) {
        state.aiAnalysis = result.analysis;
        showAlert('AI Analysis complete! Check the AI Analysis view for details.', 'AI Analysis');
        vaultOpenItem(id);
      } else { showAlert('Analysis failed: ' + (result.error || 'Content too short'), 'Error'); }
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  window.vaultShowAnalysis = async function(id) {
    if (!window.ishguard) return;
    try {
      const summary = await window.ishguard.vaultSummarize(id);
      const notes = await window.ishguard.vaultStudyNotes(id);
      if (summary.error) { showAlert(summary.error, 'Error'); return; }
      const c = document.getElementById('view-container');
      c.innerHTML = viewVaultAnalysis(id, summary, notes);
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  function viewVaultAnalysis(id, summary, studyNotes) {
    return `
    <button onclick="vaultOpenItem('${id}')" class="btn btn-ghost btn-sm mb-sm">← Back to Item</button>
    <div class="card mb-md">
      <div class="card-title">AI Summary</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;margin-bottom:12px;">${summary.summary}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.3);">${summary.wordCount} words &middot; ${summary.estimatedReadTime} read time</div>
    </div>
    ${summary.keyPoints && summary.keyPoints.length > 0 ? `
    <div class="card mb-md">
      <div class="card-title">Key Points</div>
      <ul style="padding-left:20px;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.8;">
        ${summary.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
      </ul>
    </div>` : ''}
    ${summary.concepts && summary.concepts.length > 0 ? `
    <div class="card mb-md">
      <div class="card-title">Key Concepts</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${summary.concepts.slice(0, 10).map(c => `<span class="badge badge-info">${c.word} (${c.frequency})</span>`).join('')}
      </div>
    </div>` : ''}
    ${studyNotes && studyNotes.flashcards && studyNotes.flashcards.length > 0 ? `
    <div class="card mb-md">
      <div class="card-title">Flashcards (${studyNotes.flashcards.length})</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${studyNotes.flashcards.slice(0, 6).map(fc => `
          <div style="padding:12px;background:rgba(11,31,59,0.3);border:1px solid rgba(255,255,255,0.05);border-radius:8px;font-size:12px;">
            <div style="color:rgba(255,255,255,0.7);margin-bottom:6px;">${fc.question}</div>
            <div style="color:#FF6B00;font-weight:600;">→ ${fc.answer}</div>
          </div>
        `).join('')}
      </div>
    </div>` : ''}
    ${studyNotes && studyNotes.revisionNotes ? `
    <div class="card">
      <div class="card-title">Revision Notes (${studyNotes.revisionNotes.difficulty})</div>
      <ul style="padding-left:20px;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.8;">
        ${(studyNotes.revisionNotes.bulletPoints || []).map(bp => `<li>${bp}</li>`).join('')}
      </ul>
      <div style="margin-top:12px;font-size:11px;color:#FF6B00;">💡 ${studyNotes.revisionNotes.studyTip}</div>
    </div>` : ''}`;
  }

  window.vaultAddNotesPrompt = async function(id) {
    const notes = await showPrompt('Enter your notes for this item:');
    if (!notes || notes === null) return;
    if (!window.ishguard) return;
    try {
      const result = await window.ishguard.vaultAddNotes(id, notes);
      if (result.success) { showAlert('Notes saved!', 'Vault'); vaultOpenItem(id); }
      else { showAlert('Failed: ' + (result.error || 'Unknown'), 'Error'); }
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  window.vaultExportItem = async function(id) {
    if (!window.ishguard) return;
    try {
      const result = await window.ishguard.vaultExport(id, 'text');
      if (result.content) {
        const blob = new Blob([result.content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'vault_export_' + id + '.txt';
        a.click();
      }
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  window.vaultDeleteItem = async function(id) {
    if (!window.ishguard) return;
    const confirmed = await showConfirm('Remove this item from the vault?');
    if (!confirmed) return;
    try {
      await window.ishguard.vaultDelete(id);
      if (state.view === 'vault') loadVault();
      else showView('vault');
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  /* ── READER MODE ── */
  function viewReaderMode() {
    return `
    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card">
        <div class="card-title">AI Reader Engine</div>
        <p style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:16px;">Paste or type content below to analyze with the ISHGuard AI Reader. Get summaries, key points, flashcards, and study notes.</p>
        <textarea id="reader-input" placeholder="Paste article text, document content, or notes here..." style="width:100%;min-height:200px;padding:12px;background:rgba(11,31,59,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:rgba(255,255,255,0.8);font-size:13px;font-family:'SF Mono',monospace;resize:vertical;">${state.readerText || ''}</textarea>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button onclick="readerAnalyze()" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>
            AI Analyze
          </button>
          <button onclick="readerClear()" class="btn btn-ghost">Clear</button>
        </div>
        <div id="reader-word-count" style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:8px;"></div>
      </div>
      <div class="card">
        <div class="card-title">Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button onclick="readerSample('short')" class="btn btn-ghost w-full" style="justify-content:flex-start;">Try with sample text (short)</button>
          <button onclick="readerSample('medium')" class="btn btn-ghost w-full" style="justify-content:flex-start;">Try with sample text (medium)</button>
          <button onclick="showView('vault')" class="btn btn-ghost w-full" style="justify-content:flex-start;">📚 Open Content Vault</button>
          <button onclick="readerSaveToVault()" class="btn btn-ghost w-full" style="justify-content:flex-start;">💾 Save Analysis to Vault</button>
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;">Translate to Simple English</div>
            <button onclick="readerTranslate()" class="btn btn-ghost btn-sm w-full">Simplify Text</button>
          </div>
        </div>
      </div>
    </div>
    <div id="reader-results"></div>`;
  }

  window.readerAnalyze = async function() {
    const input = document.getElementById('reader-input');
    if (!input || !input.value.trim()) return;
    const content = input.value.trim();
    state.readerText = content;
    if (content.length < 10) { showAlert('Please enter at least 10 characters.', 'Reader'); return; }
    if (!window.ishguard) return;
    try {
      const result = await window.ishguard.readerAnalyze(content, {});
      const el = document.getElementById('reader-results');
      el.innerHTML = renderReaderResults(result);
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  window.readerTranslate = async function() {
    const input = document.getElementById('reader-input');
    if (!input || !input.value.trim()) return;
    if (!window.ishguard) return;
    try {
      const result = await window.ishguard.readerTranslate(input.value.trim(), 'simple');
      const el = document.getElementById('reader-results');
      el.innerHTML = `
      <div class="card mb-md">
        <div class="card-title">Simplified Text</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6;">${result.simplified || 'No simplified version available'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;">${result.originalWords} words → ${result.simplifiedWords} words (simplified)</div>
      </div>
      ${result.summary ? `
      <div class="card">
        <div class="card-title">Summary</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.7);">${result.summary}</div>
      </div>` : ''}`;
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  window.readerClear = function() {
    const input = document.getElementById('reader-input');
    if (input) input.value = '';
    const el = document.getElementById('reader-results');
    if (el) el.innerHTML = '';
    state.readerText = '';
  };

  window.readerSample = function(size) {
    const input = document.getElementById('reader-input');
    if (!input) return;
    const samples = {
      short: 'Artificial intelligence is transforming the way we live and work. Machine learning algorithms can now analyze vast amounts of data to make predictions and decisions. This technology is being used in healthcare, finance, and transportation. The key challenge is ensuring AI systems are safe and fair.',
      medium: 'Climate change represents one of the most significant challenges facing humanity in the 21st century. Scientific evidence clearly shows that global temperatures are rising due to increased greenhouse gas emissions from human activities. The primary sources of these emissions include the burning of fossil fuels for energy, deforestation, and industrial processes. If left unchecked, climate change could lead to severe consequences including more frequent extreme weather events, rising sea levels, and disruptions to ecosystems and agriculture. However, there are potential solutions. Transitioning to renewable energy sources, improving energy efficiency, and adopting sustainable land use practices can help mitigate the worst effects. International cooperation through agreements like the Paris Accord demonstrates global commitment to addressing this crisis, though much more action is needed.'
    };
    input.value = samples[size] || '';
    const wc = document.getElementById('reader-word-count');
    if (wc) wc.textContent = samples[size].split(/\s+/).length + ' words loaded';
  };

  window.readerSaveToVault = async function() {
    const el = document.getElementById('reader-results');
    if (!el || !el.innerHTML) { showAlert('Run an AI analysis first.', 'Reader'); return; }
    if (!window.ishguard) return;
    try {
      const result = await window.ishguard.vaultSave({
        url: 'reader://analysis/' + Date.now(),
        title: 'AI Reader Analysis - ' + new Date().toLocaleDateString(),
        content: state.readerText || '',
        textContent: state.readerText || '',
        type: 'analysis',
        category: 'summaries',
        tags: ['ai-analysis', 'reader', 'study-notes']
      });
      if (result.success) showAlert('Analysis saved to Vault under AI Summaries!', 'Vault');
      else showAlert('Failed: ' + (result.error || 'Unknown'), 'Error');
    } catch (e) { showAlert('Error: ' + e.message, 'Error'); }
  };

  function renderReaderResults(result) {
    return `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">AI Summary</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;margin-bottom:8px;">${result.summary}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);">${result.wordCount} words &middot; ${result.sentenceCount} sentences &middot; ${result.estimatedReadTime}</div>
      </div>
      ${result.keyPoints && result.keyPoints.length > 0 ? `
      <div class="card">
        <div class="card-title">Key Points (${result.keyPoints.length})</div>
        <ul style="padding-left:20px;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.8;">
          ${result.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
        </ul>
      </div>` : ''}
    </div>
    ${result.concepts && result.concepts.length > 0 ? `
    <div class="card mb-md">
      <div class="card-title">Key Concepts</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${result.concepts.slice(0, 15).map(c => `<span class="badge badge-info">${c.word} (${c.frequency})</span>`).join('')}
      </div>
    </div>` : ''}
    <div class="grid-3">
      ${result.studyNotes ? `
      <div class="card">
        <div class="card-title">Stats</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6);">
          <div>Total Words: ${result.studyNotes.stats.totalWords}</div>
          <div>Unique Words: ${result.studyNotes.stats.uniqueWords}</div>
          <div>Avg Sentence: ${result.studyNotes.stats.avgSentenceLength} words</div>
          <div>Complexity: ${result.studyNotes.stats.complexity}</div>
          <div>Reading Level: ${result.studyNotes.stats.readingLevel}</div>
          <div>Paragraphs: ${result.studyNotes.stats.paragraphCount}</div>
        </div>
      </div>` : ''}
      ${result.flashcards && result.flashcards.length > 0 ? `
      <div class="card">
        <div class="card-title">Flashcards (${result.flashcards.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${result.flashcards.slice(0, 4).map(fc => `
            <div style="padding:8px;background:rgba(11,31,59,0.3);border-radius:6px;font-size:12px;">
              <div style="color:rgba(255,255,255,0.6);">${fc.question}</div>
              <div style="color:#FF6B00;font-weight:600;margin-top:2px;">→ ${fc.answer}</div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
      ${result.revisionNotes ? `
      <div class="card">
        <div class="card-title">Revision (${result.revisionNotes.difficulty})</div>
        <ul style="padding-left:16px;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;">
          ${(result.revisionNotes.bulletPoints || []).slice(0, 5).map(bp => `<li>${bp}</li>`).join('')}
        </ul>
        <div style="margin-top:8px;font-size:10px;color:#FF6B00;">💡 ${result.revisionNotes.studyTip}</div>
      </div>` : ''}
    </div>`;
  }

  // Trigger word count on reader input
  document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'reader-input') {
      const wc = document.getElementById('reader-word-count');
      if (wc) wc.textContent = e.target.value.split(/\s+/).filter(w => w.length > 0).length + ' words';
    }
  });

  /* ── PRIVACY CLEANER ── */
  let _privacyScanResult = null;
  let _privacySelected = new Set();
  let _privacyCleanLog = null;

  function viewPrivacyCleaner() {
    return `
    <div style="max-width:900px;">
      <div class="pm-hero animate-in"><div><h2>Privacy Cleaner</h2><p>Scan and safely remove temporary files, browser caches, and application data</p></div>
        <div style="display:flex;gap:8px;">
          <button class="pm-btn pm-btn-primary" onclick="window.privacyRunScan()" id="btn-privacy-scan">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Preview Scan
          </button>
          <button class="pm-btn pm-btn-secondary" onclick="window.privacyCleanSelected()" id="btn-privacy-clean" disabled>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
            Clean Selected
          </button>
          <button class="pm-btn pm-btn-secondary" onclick="window.privacyRefresh()" id="btn-privacy-refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Refresh
          </button>
          <button class="pm-btn pm-btn-ghost" onclick="window.privacyExportReport()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            Export Report
          </button>
        </div>
      </div>

      <div id="privacy-stats-bar" style="display:none;" class="pm-grid-4 mb-md">
        <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(255,107,0,0.12);color:#FF6B00;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg></div><div><div class="pm-stat-value" id="privacy-total-size">0 B</div><div class="pm-stat-label">Reclaimable Space</div></div></div></div>
        <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(245,165,36,0.12);color:#F5A524;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div><div><div class="pm-stat-value" id="privacy-total-files">0</div><div class="pm-stat-label">Files to Clean</div></div></div></div>
        <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(24,201,100,0.12);color:#18C964;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div><div><div class="pm-stat-value" id="privacy-categories">0</div><div class="pm-stat-label">Categories</div></div></div></div>
        <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(59,130,246,0.12);color:#3B82F6;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg></div><div><div class="pm-stat-value" id="privacy-last-cleaned">Never</div><div class="pm-stat-label">Last Cleaned</div></div></div></div>
      </div>

      <div id="privacy-scan-ring" style="display:none;" class="flex-center flex-col" style="padding:40px;">
        <div class="scan-ring-container">
          <div class="scan-ring-pulse"></div>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle class="scan-ring-bg" cx="70" cy="70" r="64"/>
            <circle id="privacy-scan-arc" class="scan-ring-fg" cx="70" cy="70" r="64" stroke-dashoffset="0" style="stroke-dasharray:400;"/>
          </svg>
          <div class="scan-center">
            <div style="text-align:center;">
              <div id="privacy-sp-pct" style="font-size:22px;font-weight:800;font-family:\'SF Mono\',monospace;color:#FF6B00;">Scanning</div>
              <div id="privacy-sp-files" style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;">Analyzing system...</div>
            </div>
          </div>
        </div>
      </div>

      <div id="privacy-categories-list"></div>
      <div id="privacy-progress-bar" style="display:none;" class="card mb-md">
        <div class="card-title">Cleaning Progress</div>
        <div class="pm-progress"><div id="privacy-progress-fill" class="pm-progress-bar" style="width:0%;background:#FF6B00;"></div></div>
        <div id="privacy-progress-text" style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">Starting...</div>
      </div>
      <div id="privacy-clean-log"></div>
    </div>`;
  }

  window.privacyRunScan = async function() {
    if (!window.ishguard) return;
    const btn = document.getElementById('btn-privacy-scan');
    if (btn) { btn.disabled = true; btn.textContent = ' Scanning...'; }

    const ring = document.getElementById('privacy-scan-ring');
    const list = document.getElementById('privacy-categories-list');
    const statsBar = document.getElementById('privacy-stats-bar');
    const cleanLog = document.getElementById('privacy-clean-log');
    if (ring) ring.style.display = '';
    if (list) list.innerHTML = '';
    if (cleanLog) cleanLog.innerHTML = '';
    if (statsBar) statsBar.style.display = 'none';

    try {
      const result = await window.ishguard.privacyScan();
      _privacyScanResult = result;
      _privacySelected = new Set();

      if (ring) ring.style.display = 'none';

      if (statsBar) {
        statsBar.style.display = '';
        document.getElementById('privacy-total-size').textContent = result.totalFormatted || '0 B';
        document.getElementById('privacy-total-files').textContent = result.totalFiles || 0;
        document.getElementById('privacy-categories').textContent = result.categories?.length || 0;
      }

      const lastCleaned = await window.ishguard.privacyLastCleaned();
      const lastEl = document.getElementById('privacy-last-cleaned');
      if (lastEl) {
        if (lastCleaned && lastCleaned.timestamp) {
          lastEl.textContent = new Date(lastCleaned.timestamp).toLocaleDateString();
        } else {
          lastEl.textContent = 'Never';
        }
      }

      if (list) {
        list.innerHTML = renderPrivacyCategories(result);
      }

      const cleanBtn = document.getElementById('btn-privacy-clean');
      if (cleanBtn) cleanBtn.disabled = false;
    } catch (e) {
      if (ring) ring.style.display = 'none';
      if (list) list.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:#ef4444;">Error: ' + e.message + '</div>';
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg> Preview Scan'; }
  };

  window.privacyRefresh = function() { window.privacyRunScan(); };

  function renderPrivacyCategories(result) {
    if (!result || !result.categories || result.categories.length === 0) {
      return '<div class="card" style="text-align:center;padding:40px;"><div style="font-size:32px;margin-bottom:8px;">✅</div><div style="color:#4ade80;font-weight:600;">No privacy items found — your system is clean</div></div>';
    }

    let html = '<div class="card"><div class="flex-center" style="justify-content:space-between;margin-bottom:12px;">';
    html += '<div><div class="card-title" style="margin-bottom:0;">Items to Clean</div><div style="font-size:11px;color:rgba(255,255,255,0.3);">Select categories and click Clean Selected</div></div>';
    html += '<div style="display:flex;gap:8px;"><button class="btn btn-sm btn-ghost" onclick="window.privacySelectAll()">Select All</button><button class="btn btn-sm btn-ghost" onclick="window.privacyDeselectAll()">Deselect All</button></div></div>';

    let currentType = '';
    for (const cat of result.categories) {
      if (!cat.scanned) continue;

      const catType = cat.type || (cat.app ? 'app-cache' : cat.browser ? 'browser' : 'windows');
      const typeLabel = cat.app ? cat.app : cat.browser ? cat.browser : 'Windows System';
      const typeHeader = cat.app ? 'Application Cache' : cat.browser ? 'Browser Data' : 'Windows System';

      if (currentType !== catType) {
        if (currentType !== '') html += '</div>';
        currentType = catType;
        html += `<div style="margin-top:16px;"><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${typeHeader}</div></div>`;
      }

      const id = cat.id;
      const checked = _privacySelected.has(id) ? 'checked' : '';
      html += `
        <div class="threat-item" style="cursor:pointer;" onclick="window.privacyToggleItem('${id}')">
          <div style="display:flex;align-items:center;gap:10px;flex:1;">
            <input type="checkbox" id="chk-${id}" ${checked} style="accent-color:#FF6B00;width:16px;height:16px;cursor:pointer;" onclick="event.stopPropagation();window.privacyToggleItem('${id}')">
            <div>
              <div class="threat-name">${cat.icon || '📄'} ${cat.name}</div>
              <div class="threat-file">${cat.files > 0 ? cat.files + ' files' : 'No files'} ${cat.size > 0 ? '· ' + fmtBytes(cat.size) : ''}</div>
            </div>
          </div>
          <span style="font-size:12px;color:${cat.size > 0 ? '#facc15' : 'rgba(255,255,255,0.2)'};">${cat.size > 0 ? fmtBytes(cat.size) : 'Empty'}</span>
        </div>`;
    }
    if (currentType !== '') html += '</div>';

    html += '<div style="padding:12px 0 0;border-top:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;align-items:center;">';
    html += '<div style="font-size:12px;color:rgba(255,255,255,0.3);"><span id="privacy-selected-count">0</span> selected</div>';
    html += '<div style="font-size:14px;font-weight:700;color:#FF6B00;">Total: ' + result.totalFormatted + '</div>';
    html += '</div></div>';

    return html;
  }

  window.privacyToggleItem = function(id) {
    if (_privacySelected.has(id)) _privacySelected.delete(id);
    else _privacySelected.add(id);
    const chk = document.getElementById('chk-' + id);
    if (chk) chk.checked = _privacySelected.has(id);
    const countEl = document.getElementById('privacy-selected-count');
    if (countEl) countEl.textContent = _privacySelected.size;
  };

  window.privacySelectAll = function() {
    if (!_privacyScanResult || !_privacyScanResult.categories) return;
    for (const cat of _privacyScanResult.categories) {
      if (cat.scanned) _privacySelected.add(cat.id);
    }
    for (const cat of _privacyScanResult.categories) {
      const chk = document.getElementById('chk-' + cat.id);
      if (chk) chk.checked = true;
    }
    const countEl = document.getElementById('privacy-selected-count');
    if (countEl) countEl.textContent = _privacySelected.size;
  };

  window.privacyDeselectAll = function() {
    _privacySelected.clear();
    if (_privacyScanResult && _privacyScanResult.categories) {
      for (const cat of _privacyScanResult.categories) {
        const chk = document.getElementById('chk-' + cat.id);
        if (chk) chk.checked = false;
      }
    }
    const countEl = document.getElementById('privacy-selected-count');
    if (countEl) countEl.textContent = '0';
  };

  window.privacyCleanSelected = async function() {
    if (_privacySelected.size === 0) {
      showAlert('Please select items to clean first.', 'Privacy Cleaner');
      return;
    }
    if (!window.ishguard) return;

    const confirmed = await showConfirm(`Clean ${_privacySelected.size} selected item(s)?\n\nThis will delete temporary files and caches. Browser passwords and bookmarks will NOT be affected.`, 'Privacy Cleaner');
    if (!confirmed) return;

    const cleanBtn = document.getElementById('btn-privacy-clean');
    if (cleanBtn) { cleanBtn.disabled = true; cleanBtn.textContent = ' Cleaning...'; }

    const progressBar = document.getElementById('privacy-progress-bar');
    const progressFill = document.getElementById('privacy-progress-fill');
    const progressText = document.getElementById('privacy-progress-text');
    const logEl = document.getElementById('privacy-clean-log');

    if (progressBar) progressBar.style.display = '';
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = 'Starting...';

    try {
      const ids = Array.from(_privacySelected);
      const result = await window.ishguard.privacyClean(ids);
      _privacyCleanLog = result;

      if (progressFill) progressFill.style.width = '100%';
      if (progressText) progressText.textContent = 'Complete!';

      if (result.success) {
        if (logEl) {
          let logHtml = '<div class="card mt-md"><div class="card-title">Cleaning Results</div>';
          logHtml += `<div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;">
            <div><span style="color:#4ade80;font-weight:700;">${fmtBytes(result.totalFreed)}</span> freed</div>
            <div><span style="color:#FF6B00;font-weight:700;">${result.totalFilesRemoved}</span> files removed</div>
            <div><span style="color:rgba(255,255,255,0.3);">${(result.elapsed / 1000).toFixed(1)}s</span></div>
          </div>`;
          if (result.log && result.log.length > 0) {
            logHtml += '<div class="scroll-area scroll-thin" style="max-height:300px;">';
            for (const entry of result.log) {
              const icon = entry.status === 'success' ? '✅' : entry.status === 'skipped' ? '⏭️' : '❌';
              logHtml += `<div class="table-row" style="font-size:12px;"><span style="flex:1;">${icon} ${entry.category}</span><span style="color:${entry.status === 'success' ? '#4ade80' : '#facc15'};">${entry.filesRemoved ? entry.filesRemoved + ' files' : entry.status}</span></div>`;
            }
            logHtml += '</div>';
          }
          if (result.errors && result.errors.length > 0) {
            logHtml += '<div style="margin-top:8px;color:#ef4444;font-size:12px;">Errors: ' + result.errors.map(e => e.error).join('; ') + '</div>';
          }
          logHtml += '</div>';
          logEl.innerHTML = logHtml;
        }

        setTimeout(async () => {
          await window.privacyRunScan();
        }, 1000);
      } else {
        if (logEl) logEl.innerHTML = '<div class="card" style="text-align:center;color:#ef4444;padding:20px;">Error: ' + (result.error || 'Cleaning failed') + '</div>';
      }
    } catch (e) {
      if (logEl) logEl.innerHTML = '<div class="card" style="text-align:center;color:#ef4444;padding:20px;">Error: ' + e.message + '</div>';
    }

    if (cleanBtn) { cleanBtn.disabled = false; cleanBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg> Clean Selected'; }
  };

  window.privacyExportReport = async function() {
    if (!window.ishguard) return;
    try {
      const report = await window.ishguard.privacyExport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'privacy-report-' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      showAlert('Privacy report exported successfully.', 'Export');
    } catch (e) {
      showAlert('Export error: ' + e.message, 'Error');
    }
  };

  /* ── SECURITY POLICIES ── */
  let _policiesData = null;
  let _securityScoreData = null;

  function viewSecurityPolicies() {
    return `
    <div style="max-width:1000px;">
      <div class="pm-hero animate-in"><div><h2>Windows Security Policies</h2><p>Centralized management of Windows security settings and hardening configuration</p></div>
        <div style="display:flex;gap:8px;">
          <button class="pm-btn pm-btn-primary" onclick="window.policiesRefresh()" id="btn-policies-refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Refresh
          </button>
          <button class="pm-btn pm-btn-secondary" onclick="window.policiesExport()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            Export Report
          </button>
        </div>
      </div>

      <div id="policies-score-card" class="pm-grid-4 mb-md"></div>

      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="btn btn-sm btn-secondary" onclick="window.policiesShowAll()">All Policies</button>
        <button class="btn btn-sm btn-ghost" onclick="window.policiesShowCategory('network')">Network</button>
        <button class="btn btn-sm btn-ghost" onclick="window.policiesShowCategory('defender')">Defender</button>
        <button class="btn btn-sm btn-ghost" onclick="window.policiesShowCategory('access')">Access Control</button>
        <button class="btn btn-sm btn-ghost" onclick="window.policiesShowCategory('device')">Device</button>
      </div>

      <div id="policies-list"></div>

      <div class="card mt-lg">
        <div class="card-title">Interactive Login Banner</div>
        <p style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:16px;">Configure a legal warning message displayed before user login. Recommended for business environments.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px;">Banner Title</div>
            <input id="banner-title-input" class="pm-input" type="text" value="ISHGUARD SECURITY SYSTEM" />
          </div>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px;">Status</div>
            <div id="banner-status" style="font-size:13px;color:rgba(255,255,255,0.3);">Checking...</div>
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px;">Banner Message</div>
          <textarea id="banner-message-input" class="pm-input" style="min-height:120px;resize:vertical;font-family:'SF Mono',monospace;font-size:12px;">This system is owned and protected by IshGuard Security.

        Access is restricted to authorized users only.

        By continuing, you acknowledge that your activity may be monitored, recorded, and audited.

        If you are not an authorized user, disconnect immediately.</textarea>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="pm-btn pm-btn-primary" onclick="window.policiesPreviewBanner()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Preview
          </button>
          <button class="pm-btn pm-btn-primary" onclick="window.policiesApplyBanner()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
            Apply
          </button>
          <button class="pm-btn pm-btn-danger" onclick="window.policiesRemoveBanner()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Remove Banner
          </button>
          <button class="pm-btn pm-btn-secondary" onclick="window.policiesRestoreBanner()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Restore Default
          </button>
        </div>
      </div>
    </div>`;
  }

  window.policiesShowAll = function() { renderPoliciesList(_policiesData); };
  window.policiesShowCategory = function(cat) {
    if (!_policiesData) return;
    const filtered = _policiesData.filter(p => p.category === cat);
    renderPoliciesList(filtered);
  };

  window.loadSecurityPolicies = async function() {
    if (!window.ishguard) return;
    try {
      const policies = await window.ishguard.policiesList();
      if (policies && !policies.error) _policiesData = policies;
      const score = await window.ishguard.policiesScore();
      if (score && !score.error) _securityScoreData = score;

      renderPoliciesScore();
      renderPoliciesList(policies);

      const banner = await window.ishguard.policiesBannerGet();
      if (banner && !banner.error) {
        const statusEl = document.getElementById('banner-status');
        if (statusEl) {
          if (banner.configured) {
            statusEl.innerHTML = '<span style="color:#4ade80;">● Configured</span>';
            document.getElementById('banner-title-input').value = banner.title || '';
            document.getElementById('banner-message-input').value = banner.message || '';
          } else {
            statusEl.innerHTML = '<span style="color:rgba(255,255,255,0.3);">○ Not Configured</span>';
          }
        }
      }
    } catch (e) {
      const list = document.getElementById('policies-list');
      if (list) list.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:#ef4444;">Error loading policies: ' + e.message + '</div>';
    }
  };

  window.policiesRefresh = function() { window.loadSecurityPolicies(); };

  function renderPoliciesScore() {
    const el = document.getElementById('policies-score-card');
    if (!el || !_securityScoreData) return;
    const s = _securityScoreData;
    const color = s.riskLevel === 'critical' ? '#ef4444' : s.riskLevel === 'high' ? '#facc15' : s.riskLevel === 'medium' ? '#FF6B00' : '#4ade80';
    const count = s.details ? s.details.length : 0;
    const enabled = s.details ? s.details.filter(d => d.enabled).length : 0;
    const missing = s.missingPolicies ? s.missingPolicies.length : 0;

    el.innerHTML = `
      <div class="pm-card" style="text-align:center;"><div class="pm-stat-value" style="color:${color};">${s.score}%</div><div class="pm-stat-label">Security Score</div><div style="font-size:10px;color:${color};">${s.riskLevel.toUpperCase()}</div></div>
      <div class="pm-card" style="text-align:center;"><div class="pm-stat-value">${enabled}/${count}</div><div class="pm-stat-label">Policies Active</div></div>
      <div class="pm-card" style="text-align:center;"><div class="pm-stat-value" style="color:${missing > 0 ? '#facc15' : '#4ade80'};">${missing}</div><div class="pm-stat-label">${missing > 0 ? 'Need Attention' : 'All Good'}</div></div>
      <div class="pm-card" style="text-align:center;"><div class="pm-stat-value">${s.totalWeight || 0}</div><div class="pm-stat-label">Total Weight</div></div>`;
  }

  function renderPoliciesList(policies) {
    const el = document.getElementById('policies-list');
    if (!el) return;
    if (!policies || policies.length === 0) {
      el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);">No policies available</div>';
      return;
    }

    let html = '<div class="card" style="padding:0;overflow:hidden;"><table class="pm-table"><thead><tr><th>Policy</th><th>Status</th><th>Risk</th><th>Description</th><th>Actions</th></tr></thead><tbody>';

    for (const p of policies) {
      const enabled = p.currentEnabled;
      const statusColor = enabled ? '#4ade80' : '#ef4444';
      const statusText = enabled ? 'Enabled' : 'Disabled';
      const riskColor = p.riskLevel === 'high' ? '#ef4444' : p.riskLevel === 'medium' ? '#facc15' : '#3B82F6';
      const riskLabel = p.riskLevel === 'high' ? 'Critical' : p.riskLevel === 'medium' ? 'Medium' : 'Low';

      html += `<tr>
        <td style="font-weight:600;color:rgba(255,255,255,0.85);">${p.name}</td>
        <td><span class="pm-tag ${enabled ? 'pm-tag-green' : 'pm-tag-red'}" style="background:${enabled ? 'rgba(24,201,100,0.12)' : 'rgba(239,68,68,0.12)'};">${statusText}</span></td>
        <td><span class="pm-tag ${p.riskLevel === 'high' ? 'pm-tag-red' : p.riskLevel === 'medium' ? 'pm-tag-orange' : 'pm-tag-blue'}">${riskLabel}</span></td>
        <td style="font-size:12px;color:rgba(255,255,255,0.5);max-width:250px;">${p.description}</td>
        <td>
          <div style="display:flex;gap:4px;">
            ${!enabled ? `<button class="pm-btn pm-btn-sm pm-btn-primary" onclick="window.policiesApply('${p.id}')">Apply</button>` : `<button class="pm-btn pm-btn-sm pm-btn-danger" onclick="window.policiesDisable('${p.id}')">Disable</button>`}
            ${p.canRestore ? `<button class="pm-btn pm-btn-sm pm-btn-secondary" onclick="window.policiesRestore('${p.id}')">Default</button>` : ''}
          </div>
        </td>
      </tr>`;
    }

    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  window.policiesApply = async function(id) {
    if (!window.ishguard) return;
    const policy = _policiesData?.find(p => p.id === id);
    if (!policy) return;

    const confirmed = await showConfirm(`Enable "${policy.name}"?\n\n${policy.description}\n\nThis may require Administrator privileges.`, 'Apply Policy');
    if (!confirmed) return;

    try {
      const result = await window.ishguard.policiesApply(id);
      if (result.success) {
        showAlert(result.message || `${policy.name} enabled successfully.`, 'Policy Applied');
      } else {
        showAlert(result.error || 'Failed to apply policy. Try running as Administrator.', 'Error');
      }
      window.loadSecurityPolicies();
    } catch (e) {
      showAlert('Error: ' + e.message, 'Error');
    }
  };

  window.policiesDisable = async function(id) {
    if (!window.ishguard) return;
    const policy = _policiesData?.find(p => p.id === id);
    if (!policy) return;
    if (!policy.canDisable) {
      showAlert(`${policy.name} cannot be disabled.`, 'Policy');
      return;
    }

    const confirmed = await showConfirm(`Disable "${policy.name}"?\n\n${policy.description}\n\nDisabling this policy may reduce security.`, 'Disable Policy');
    if (!confirmed) return;

    try {
      const result = await window.ishguard.policiesDisable(id);
      if (result.success) {
        showAlert(result.message || `${policy.name} disabled.`, 'Policy Disabled');
      } else {
        showAlert(result.error || 'Failed to disable policy.', 'Error');
      }
      window.loadSecurityPolicies();
    } catch (e) {
      showAlert('Error: ' + e.message, 'Error');
    }
  };

  window.policiesRestore = async function(id) {
    if (!window.ishguard) return;
    const policy = _policiesData?.find(p => p.id === id);
    if (!policy) return;

    const confirmed = await showConfirm(`Restore "${policy.name}" to default settings?`, 'Restore Default');
    if (!confirmed) return;

    try {
      const result = await window.ishguard.policiesRestore(id);
      if (result.success) {
        showAlert(result.message || `${policy.name} defaults restored.`, 'Restored');
      } else {
        showAlert(result.error || 'Failed to restore defaults.', 'Error');
      }
      window.loadSecurityPolicies();
    } catch (e) {
      showAlert('Error: ' + e.message, 'Error');
    }
  };

  window.policiesPreviewBanner = function() {
    const title = document.getElementById('banner-title-input')?.value || 'ISHGUARD SECURITY SYSTEM';
    const message = document.getElementById('banner-message-input')?.value || '';
    showModal(`
      <div style="margin-bottom:16px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.9);">Login Banner Preview</div>
      <div style="background:rgba(5,10,18,0.8);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:20px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:700;color:#FF6B00;margin-bottom:12px;text-align:center;">${escapeHtml(title)}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.3);">This message will appear on the Windows login screen.</div>
      <button onclick="this.closest('.modal-backdrop').remove()" class="modal-btn" style="width:100%;background:#FF6B00;color:#fff;margin-top:16px;">Close</button>
    `, { closeOnClick: true });
  };

  window.policiesApplyBanner = async function() {
    if (!window.ishguard) return;
    const title = document.getElementById('banner-title-input')?.value || 'ISHGUARD SECURITY SYSTEM';
    const message = document.getElementById('banner-message-input')?.value || '';

    const confirmed = await showConfirm('Apply this login banner? It will appear on the Windows login screen.\n\nAdministrator privileges are required.', 'Apply Login Banner');
    if (!confirmed) return;

    try {
      const result = await window.ishguard.policiesBannerSet({ title, message });
      if (result.success) {
        showAlert(result.message || 'Login banner applied successfully.', 'Banner Applied');
        const statusEl = document.getElementById('banner-status');
        if (statusEl) statusEl.innerHTML = '<span style="color:#4ade80;">● Configured</span>';
      } else {
        showAlert(result.error || 'Failed to apply banner. Try running as Administrator.', 'Error');
      }
    } catch (e) {
      showAlert('Error: ' + e.message, 'Error');
    }
  };

  window.policiesRemoveBanner = async function() {
    if (!window.ishguard) return;
    const confirmed = await showConfirm('Remove the login banner?', 'Remove Banner');
    if (!confirmed) return;

    try {
      const result = await window.ishguard.policiesBannerRemove();
      if (result.success) {
        showAlert(result.message || 'Login banner removed.', 'Banner Removed');
        const statusEl = document.getElementById('banner-status');
        if (statusEl) statusEl.innerHTML = '<span style="color:rgba(255,255,255,0.3);">○ Not Configured</span>';
      } else {
        showAlert(result.error || 'Failed to remove banner.', 'Error');
      }
    } catch (e) {
      showAlert('Error: ' + e.message, 'Error');
    }
  };

  window.policiesRestoreBanner = function() {
    document.getElementById('banner-title-input').value = 'ISHGUARD SECURITY SYSTEM';
    document.getElementById('banner-message-input').value = 'This system is owned and protected by IshGuard Security.\n\nAccess is restricted to authorized users only.\n\nBy continuing, you acknowledge that your activity may be monitored, recorded, and audited.\n\nIf you are not an authorized user, disconnect immediately.';
    showAlert('Banner fields restored to defaults. Click "Apply" to save.', 'Defaults Restored');
  };

  window.policiesExport = async function() {
    if (!window.ishguard) return;
    try {
      const report = await window.ishguard.policiesExport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'security-policies-report-' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      showAlert('Security policies report exported successfully.', 'Export');
    } catch (e) {
      showAlert('Export error: ' + e.message, 'Error');
    }
  };

  function fmtBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const s = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
  }

  function fmtUptime(sec) {
    if (!sec) return '0m';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    let s = '';
    if (d > 0) s += d + 'd ';
    if (h > 0) s += h + 'h ';
    s += m + 'm';
    return s;
  }

  function escapePath(p) {
    if (!p) return '';
    return p.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  // ── AI Folder Lock ──
  window.viewFolderLock = function() {
    const s = state.folderLockStats || { total:0, locked:0, unlocked:0, securityScore:0, lastUnlock:null, recentHistory:[] };
    return `
    <div class="pm-hero animate-in"><div><h2>AI Folder Lock</h2><p>AES-256 encrypted folder protection with multi-factor authentication</p></div>
      <div style="display:flex;gap:8px;">
        <button class="pm-btn pm-btn-secondary" onclick="window.folderLockAdd()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>Protect Folder</button>
        <button class="pm-btn pm-btn-primary" onclick="window.folderLockRefresh()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>Refresh</button>
      </div>
    </div>
    <div class="pm-grid-4">
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(255,107,0,0.12);color:#FF6B00;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div><div><div class="pm-stat-value">${s.total}</div><div class="pm-stat-label">Protected Folders</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div><div class="pm-stat-value">${s.locked}</div><div class="pm-stat-label">Locked</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(24,201,100,0.12);color:#18C964;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div><div><div class="pm-stat-value">${s.unlocked}</div><div class="pm-stat-label">Unlocked</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(59,130,246,0.12);color:#3B82F6;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div><div><div class="pm-stat-value">${s.securityScore}%</div><div class="pm-stat-label">Security Score</div></div></div></div>
    </div>
    <div style="margin-bottom:16px;"><h3 style="font-size:15px;font-weight:600;color:#fff;margin-bottom:12px;">Protected Folders</h3></div>
    <div id="fl-list" class="pm-card" style="padding:0;overflow:hidden;">
      ${(state.folderLockData && state.folderLockData.length > 0) ? renderFolderLockList(state.folderLockData) : '<div class="pm-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg><p>No folders protected yet</p><p style="font-size:12px;margin-top:4px;">Click "Protect Folder" to secure your first folder</p></div>'}
    </div>
    ${s.recentHistory && s.recentHistory.length > 0 ? `<div style="margin-top:20px;"><h3 style="font-size:15px;font-weight:600;color:#fff;margin-bottom:12px;">Recent Activity</h3><div class="pm-card" style="padding:0;"><table class="pm-table"><thead><tr><th>Action</th><th>Folder</th><th>Time</th></tr></thead><tbody>${s.recentHistory.slice(0,5).map(e => `<tr><td><span class="pm-tag ${e.action === 'lock' ? 'pm-tag-red' : 'pm-tag-green'}">${e.action}</span></td><td>${e.folder || '-'}</td><td>${e.time || '-'}</td></tr>`).join('')}</tbody></table></div></div>` : ''}`;
  };

  window.renderFolderLockList = function(items) {
    return `<table class="pm-table"><thead><tr><th>Folder</th><th>Status</th><th>Favorite</th><th>Last Access</th><th>Actions</th></tr></thead><tbody>${items.map(f => `<tr><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.path || f.folder || f.folderPath || 'Unknown'}</td><td><span class="pm-tag ${f.locked ? 'pm-tag-red' : 'pm-tag-green'}">${f.locked ? 'Locked' : 'Unlocked'}</span></td><td>${f.favorite ? '<span style="color:#FF6B00;">★</span>' : '<span style="color:rgba(255,255,255,0.2);">☆</span>'}</td><td style="color:rgba(255,255,255,0.4);">${f.lastAccess || f.lastUnlock || '-'}</td><td><div style="display:flex;gap:4px;">${f.locked ? `<button class="pm-btn pm-btn-sm pm-btn-primary" onclick="window.folderLockUnlock('${f.id}')">Unlock</button>` : `<button class="pm-btn pm-btn-sm pm-btn-secondary" onclick="window.folderLockLockAct('${f.id}')">Lock</button>`}<button class="pm-btn pm-btn-sm pm-btn-secondary" onclick="window.folderLockToggleFav('${f.id}')">★</button></div></td></tr>`).join('')}</tbody></table>`;
  };

  window.loadFolderLock = async function() {
    if (!window.ishguard) return;
    try {
      const stats = await window.ishguard.folderLockStats();
      if (stats && !stats.error) state.folderLockStats = stats;
      const list = await window.ishguard.folderLockList();
      if (list && !list.error) { state.folderLockData = Array.isArray(list) ? list : []; }
      if (state.view === 'folder-lock') document.getElementById('view-container').innerHTML = viewFolderLock();
    } catch(e) {}
  };
  window.folderLockRefresh = function() { loadFolderLock(); };
  window.folderLockAdd = async function() {
    const dir = window.ishguard ? await window.ishguard.selectDir() : null;
    if (!dir) return;
    const pwd = await showPrompt('Enter a strong password for this folder:');
    if (!pwd) return;
    await window.ishguard.folderLockProtect({ path: dir, password: pwd, pin: '', options: {} });
    loadFolderLock();
  };
  window.folderLockUnlock = async function(id) {
    const pwd = await showPrompt('Enter password to unlock:');
    if (!pwd) return;
    await window.ishguard.folderLockUnlock(id, pwd);
    loadFolderLock();
  };
  window.folderLockLockAct = async function(id) {
    await window.ishguard.folderLockLock(id);
    loadFolderLock();
  };
  window.folderLockToggleFav = async function(id) {
    await window.ishguard.folderLockFavorite(id);
    loadFolderLock();
  };

  // ── Version Recovery Center ──
  window.viewVersionRecovery = function() {
    const s = state.versionRecoveryStats || { totalSnapshots:0, totalSize:'0 B', lastSnapshot:null, scheduledFolders:0, protectedFiles:0 };
    return `
    <div class="pm-hero animate-in"><div><h2>Version Recovery Center</h2><p>Automatic file version history with ransomware rollback protection</p></div>
      <div style="display:flex;gap:8px;">
        <button class="pm-btn pm-btn-secondary" onclick="window.versionCreateManual()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>Manual Snapshot</button>
        <button class="pm-btn pm-btn-primary" onclick="window.versionRefresh()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>Scan Now</button>
      </div>
    </div>
    <div class="pm-grid-4">
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(255,107,0,0.12);color:#FF6B00;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg></div><div><div class="pm-stat-value">${s.totalSnapshots}</div><div class="pm-stat-label">Snapshots</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(24,201,100,0.12);color:#18C964;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div><div class="pm-stat-value">${s.protectedFiles}</div><div class="pm-stat-label">Protected Files</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(59,130,246,0.12);color:#3B82F6;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div><div><div class="pm-stat-value">${typeof s.totalSize === 'string' ? s.totalSize : s.totalSize + ' MB'}</div><div class="pm-stat-label">Storage Used</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(245,165,36,0.12);color:#F5A524;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div><div><div class="pm-stat-value">${s.scheduledFolders}</div><div class="pm-stat-label">Scheduled</div></div></div></div>
    </div>
    <div style="margin-bottom:16px;"><h3 style="font-size:15px;font-weight:600;color:#fff;margin-bottom:12px;">Snapshot Timeline</h3></div>
    <div id="vr-timeline" class="pm-card" style="padding:0;">
      ${renderVersionTimeline()}
    </div>
    <div style="margin-top:20px;"><h3 style="font-size:15px;font-weight:600;color:#fff;margin-bottom:12px;">Quick Actions</h3></div>
    <div class="pm-grid-4">
      <button class="pm-card" style="text-align:left;cursor:pointer;" onclick="window.versionScheduleFolder()"><div style="font-size:13px;font-weight:600;color:#fff;">Schedule Snapshots</div><div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Auto-backup folders on a timer</div></button>
      <button class="pm-card" style="text-align:left;cursor:pointer;" onclick="window.versionRansomwareScan()"><div style="font-size:13px;font-weight:600;color:#fff;">Ransomware Rollback</div><div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Detect & restore encrypted files</div></button>
      <button class="pm-card" style="text-align:left;cursor:pointer;" onclick="window.versionVerifyBackups()"><div style="font-size:13px;font-weight:600;color:#fff;">Verify Backups</div><div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Check snapshot integrity</div></button>
      <button class="pm-card" style="text-align:left;cursor:pointer;" onclick="window.versionCreateManual()"><div style="font-size:13px;font-weight:600;color:#fff;">Create Backup</div><div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Full backup of tracked files</div></button>
    </div>`;
  };

  window.renderVersionTimeline = function() {
    if (!state.versionRecoveryStats || !state.versionRecoveryStats.totalSnapshots) {
      return '<div class="pm-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg><p>No snapshots yet</p><p style="font-size:12px;margin-top:4px;">Click "Manual Snapshot" to create your first version backup</p></div>';
    }
    return '<div style="padding:16px;text-align:center;color:rgba(255,255,255,0.5);font-size:13px;">Snapshots available — use the refresh button to load latest data</div>';
  };

  window.loadVersionRecovery = async function() {
    if (!window.ishguard) return;
    try {
      const stats = await window.ishguard.versionStats();
      if (stats && !stats.error) state.versionRecoveryStats = stats;
      if (state.view === 'version-recovery') document.getElementById('view-container').innerHTML = viewVersionRecovery();
    } catch(e) {}
  };
  window.versionRefresh = function() { loadVersionRecovery(); };
  window.versionCreateManual = async function() {
    const dir = window.ishguard ? await window.ishguard.selectDir() : null;
    if (!dir) return;
    await window.ishguard.versionCreateManual(dir);
    loadVersionRecovery();
  };
  window.versionScheduleFolder = async function() {
    const dir = window.ishguard ? await window.ishguard.selectDir() : null;
    if (!dir) return;
    const interval = await showPrompt('Snapshot interval in minutes (default 60):', '60');
    if (!interval) return;
    await window.ishguard.versionSchedule(dir, parseInt(interval));
    showAlert('Folder scheduled for automatic snapshots.');
  };
  window.versionRansomwareScan = async function() {
    const dir = window.ishguard ? await window.ishguard.selectDir() : null;
    if (!dir) return;
    showAlert('Running ransomware rollback scan... (this may take a moment)');
    const result = await window.ishguard.versionRansomwareRollback(dir);
    if (result && result.error) showAlert('Error: ' + result.error, 'Ransomware Scan');
    else showAlert('Ransomware rollback scan complete.\n' + JSON.stringify(result || {}, null, 2), 'Scan Results');
  };
  window.versionVerifyBackups = async function() {
    if (state.versionRecoveryStats && state.versionRecoveryStats.totalSnapshots > 0) {
      showAlert('Backup verification feature active.\nUse the desktop app for detailed integrity checks.', 'Backup Verify');
    } else {
      showAlert('No backups to verify yet. Create a snapshot first.', 'Backup Verify');
    }
  };

  // ── Folder AI Guardian ──
  window.viewFolderGuardian = function() {
    const s = state.guardianStats || { watchedFolders:0, totalEvents:0, threatsDetected:0, threatsQuarantined:0, lastScan:null, securityScore:85 };
    return `
    <div class="pm-hero animate-in"><div><h2>Folder AI Guardian</h2><p>Real-time behavioral AI that detects and prevents unauthorized file activity</p></div>
      <div style="display:flex;gap:8px;">
        <button class="pm-btn pm-btn-secondary" onclick="window.guardianWatchFolder()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>Watch Folder</button>
        <button class="pm-btn pm-btn-primary" onclick="window.guardianRunAllScans()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>Scan All</button>
      </div>
    </div>
    <div class="pm-grid-4">
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(255,107,0,0.12);color:#FF6B00;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8l6-4 8 4 6-4v16l-6 4-8-4-6 4V8z"/></svg></div><div><div class="pm-stat-value">${s.watchedFolders}</div><div class="pm-stat-label">Watched Folders</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(245,165,36,0.12);color:#F5A524;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div><div class="pm-stat-value">${s.totalEvents}</div><div class="pm-stat-label">Total Events</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div><div><div class="pm-stat-value">${s.threatsDetected}</div><div class="pm-stat-label">Threats Detected</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(59,130,246,0.12);color:#3B82F6;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div><div><div class="pm-stat-value">${s.securityScore}%</div><div class="pm-stat-label">Security Score</div></div></div></div>
    </div>
    <div style="margin-bottom:16px;"><h3 style="font-size:15px;font-weight:600;color:#fff;margin-bottom:12px;">Activity Timeline</h3></div>
    <div id="guardian-timeline" class="pm-card" style="padding:0;">${renderGuardianTimeline()}</div>`;
  };

  window.renderGuardianTimeline = function() {
    if (!state.guardianTimeline || state.guardianTimeline.length === 0) return '<div class="pm-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg><p>No activity recorded</p><p style="font-size:12px;margin-top:4px;">Add a watched folder to start monitoring</p></div>';
    return `<table class="pm-table"><thead><tr><th>Event</th><th>Folder</th><th>Severity</th><th>Time</th></tr></thead><tbody>${state.guardianTimeline.slice(0,20).map(e => `<tr><td>${e.event || e.action || e.title || '-'}</td><td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;">${e.folder || e.path || '-'}</td><td><span class="pm-tag ${e.severity === 'critical' || e.severity === 'high' ? 'pm-tag-red' : e.severity === 'medium' ? 'pm-tag-orange' : 'pm-tag-green'}">${e.severity || 'info'}</span></td><td style="color:rgba(255,255,255,0.4);">${e.time || e.timestamp || '-'}</td></tr>`).join('')}</tbody></table>`;
  };

  window.loadFolderGuardian = async function() {
    if (!window.ishguard) return;
    try {
      const stats = await window.ishguard.guardianStats();
      if (stats && !stats.error) state.guardianStats = stats;
      const timeline = await window.ishguard.guardianAllTimeline(50);
      if (timeline && !timeline.error) state.guardianTimeline = Array.isArray(timeline) ? timeline : [];
      if (state.view === 'folder-guardian') document.getElementById('view-container').innerHTML = viewFolderGuardian();
    } catch(e) {}
  };
  window.guardianWatchFolder = async function() {
    const dir = window.ishguard ? await window.ishguard.selectDir() : null;
    if (!dir) return;
    await window.ishguard.guardianWatch(dir);
    loadFolderGuardian();
  };
  window.guardianRunAllScans = async function() {
    await window.ishguard.guardianRunAll();
    loadFolderGuardian();
  };

  // ── Smart Screen Lock ──
  window.viewScreenLock = function() {
    const s = state.screenLockStatus || { locked:false, authMethods:[], timer:60, failedAttempts:0, lastUnlock:null, securityScore:0, cameraPrivacy:{localOnly:true,noCloud:true,templatesEncrypted:true,indicatorActive:true} };
    const authMethods = (s.authMethods && s.authMethods.length > 0) ? s.authMethods : ['Face Recognition','Windows Hello','PIN','Password'];
    return `
    <div class="pm-hero animate-in"><div><h2>Smart Screen Lock</h2><p>Intelligent authentication with face recognition, Windows Hello, PIN & password</p></div>
      <div style="display:flex;gap:8px;">
        <button class="pm-btn pm-btn-primary" onclick="window.screenLockSetup()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Setup Wizard</button>
        <button class="pm-btn pm-btn-secondary" onclick="window.screenLockRefresh()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>Refresh</button>
      </div>
    </div>
    <div class="pm-grid-4">
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(59,130,246,0.12);color:#3B82F6;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div><div class="pm-stat-value">${s.locked ? 'Locked' : 'Unlocked'}</div><div class="pm-stat-label">Screen Status</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(255,107,0,0.12);color:#FF6B00;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg></div><div><div class="pm-stat-value">${s.timer}s</div><div class="pm-stat-label">Auto-Lock Timer</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(245,165,36,0.12);color:#F5A524;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01"/><circle cx="12" cy="12" r="10"/></svg></div><div><div class="pm-stat-value">${s.failedAttempts}</div><div class="pm-stat-label">Failed Attempts</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(24,201,100,0.12);color:#18C964;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div><div><div class="pm-stat-value">${s.securityScore}%</div><div class="pm-stat-label">Security Score</div></div></div></div>
    </div>
    <div style="margin-bottom:16px;"><h3 style="font-size:15px;font-weight:600;color:#fff;margin-bottom:12px;">Authentication Methods</h3></div>
    <div class="pm-auth-grid">
      ${authMethods.map(m => `<div class="pm-auth-card ${m === 'Face Recognition' ? 'active' : ''}"><div class="pm-auth-card-icon" style="background:rgba(255,107,0,0.1);color:#FF6B00;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg></div><div class="pm-auth-card-label">${m}</div><div class="pm-auth-card-desc">${m === 'Face Recognition' ? 'Camera-based' : m === 'Windows Hello' ? 'Biometric' : m === 'PIN' ? 'Numeric code' : 'Alphanumeric'}</div></div>`).join('')}
    </div>
    <div class="pm-grid-2">
      <div class="pm-card"><h3 style="font-size:14px;font-weight:600;color:#fff;margin-bottom:12px;">Auto-Lock Settings</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div class="pm-toggle" onclick="window.screenLockToggleTimer()"><span class="pm-toggle-switch active"></span><span style="font-size:13px;color:rgba(255,255,255,0.7);">Auto-lock after inactivity (${s.timer}s)</span></div>
          <div class="pm-toggle"><span class="pm-toggle-switch active"></span><span style="font-size:13px;color:rgba(255,255,255,0.7);">Lock on logout</span></div>
          <div class="pm-toggle"><span class="pm-toggle-switch active"></span><span style="font-size:13px;color:rgba(255,255,255,0.7);">Lock on sleep</span></div>
          <div class="pm-toggle"><span class="pm-toggle-switch"></span><span style="font-size:13px;color:rgba(255,255,255,0.7);">Lock on screen lock</span></div>
          <div style="margin-top:8px;"><button class="pm-btn pm-btn-sm pm-btn-secondary" onclick="window.screenLockSetCustomTimer()">Set Timer</button></div>
        </div>
      </div>
      <div class="pm-card"><h3 style="font-size:14px;font-weight:600;color:#fff;margin-bottom:12px;">Privacy & Security</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;font-size:13px;"><span style="color:${s.cameraPrivacy.localOnly ? '#18C964' : '#ef4444'};" class="pm-tag ${s.cameraPrivacy.localOnly ? 'pm-tag-green' : 'pm-tag-red'}">${s.cameraPrivacy.localOnly ? '✓' : '✗'}</span>Local processing only</div>
          <div style="display:flex;align-items:center;gap:10px;font-size:13px;"><span style="color:${s.cameraPrivacy.noCloud ? '#18C964' : '#ef4444'};" class="pm-tag ${s.cameraPrivacy.noCloud ? 'pm-tag-green' : 'pm-tag-red'}">${s.cameraPrivacy.noCloud ? '✓' : '✗'}</span>No cloud storage</div>
          <div style="display:flex;align-items:center;gap:10px;font-size:13px;"><span style="color:${s.cameraPrivacy.templatesEncrypted ? '#18C964' : '#ef4444'};" class="pm-tag ${s.cameraPrivacy.templatesEncrypted ? 'pm-tag-green' : 'pm-tag-red'}">${s.cameraPrivacy.templatesEncrypted ? '✓' : '✗'}</span>Face templates encrypted</div>
          <div style="display:flex;align-items:center;gap:10px;font-size:13px;"><span style="color:${s.cameraPrivacy.indicatorActive ? '#18C964' : '#ef4444'};" class="pm-tag ${s.cameraPrivacy.indicatorActive ? 'pm-tag-green' : 'pm-tag-red'}">${s.cameraPrivacy.indicatorActive ? '✓' : '✗'}</span>Camera indicator when active</div>
        </div>
      </div>
    </div>`;
  };

  window.loadScreenLock = async function() {
    if (!window.ishguard) return;
    try {
      const status = await window.ishguard.screenLockStatus();
      if (status && !status.error) state.screenLockStatus = status;
      if (state.view === 'screen-lock') document.getElementById('view-container').innerHTML = viewScreenLock();
    } catch(e) {}
  };
  window.screenLockRefresh = function() { loadScreenLock(); };
  window.screenLockSetup = function() {
    showAlert('Screen Lock Setup Wizard\n\nStep 1: Register a PIN\nStep 2: Set up face recognition\nStep 3: Configure auto-lock timer\nStep 4: Test authentication\n\nUse the PIN and Password registration below.', 'Setup Wizard');
  };
  window.screenLockToggleTimer = function() {};
  window.screenLockSetCustomTimer = async function() {
    const sec = await showPrompt('Enter auto-lock timer in seconds (15-600):', '60');
    if (!sec) return;
    const n = parseInt(sec);
    if (n >= 15 && n <= 600) {
      await window.ishguard.screenLockSetTimer(n);
      loadScreenLock();
    } else {
      showAlert('Timer must be between 15 and 600 seconds.');
    }
  };

  // ── Lock Screen Display ──
  window.viewLockScreen = function() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12:false, hour:'2-digit', minute:'2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    return `
    <div class="pm-lockscreen" id="lock-screen-display">
      <div class="pm-lockscreen-bg"></div>
      <div class="pm-lockscreen-content">
        <div class="pm-lockscreen-shield">
          <svg width="40" height="40" viewBox="0 0 512 512" fill="none"><path d="M256 32L448 96V240C448 352 352 448 256 480 160 448 64 352 64 240V96Z" fill="#0B1F3B" stroke="#FF6B00" stroke-width="12"/><text x="256" y="290" text-anchor="middle" font-weight="800" font-size="140" fill="#FF6B00" font-family="Inter,sans-serif">IS</text></svg>
        </div>
        <div style="margin-bottom:12px;"><span class="pm-tag pm-tag-green" style="font-size:12px;padding:6px 16px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#18C964;margin-right:6px;animation:aiPulse 2s infinite;"></span>Protected by ISHGuard</span></div>
        <div class="pm-lockscreen-time">${timeStr}</div>
        <div class="pm-lockscreen-date">${dateStr}</div>
        <div class="pm-lockscreen-status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18C964" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span class="pm-lockscreen-status-text">System Secured · AI Engine Active</span>
        </div>
        <div style="margin-top:24px;"><button class="pm-btn pm-btn-primary" onclick="window.lockScreenDismiss()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>Unlock</button></div>
      </div>
      <div class="pm-lockscreen-footer">
        <span>Powered by <span class="brand">ISHConnect</span> · www.ishconnect.rw</span>
      </div>
    </div>`;
  };
  window.lockScreenDismiss = function() {
    const el = document.getElementById('lock-screen-display');
    if (el) el.style.display = 'none';
  };

  // ── Emergency Lock Mode ──
  window.viewEmergencyLock = function() {
    const s = state.emergencyStatus || { active:false, timestamp:null, actions:[] };
    return `
    <div class="pm-hero animate-in"><div><h2 style="color:${s.active ? '#ef4444' : '#fff'};">${s.active ? '🚨 EMERGENCY LOCK ACTIVE' : 'Emergency Lock Mode'}</h2><p>One-click maximum security — instantly lock everything down</p></div>
      <div style="display:flex;gap:8px;">
        ${s.active ? `<button class="pm-btn pm-btn-danger" onclick="window.emergencyDeactivate()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 11-12.73 0"/><path d="M12 2v10"/></svg>Deactivate</button>` : `<button class="pm-btn pm-btn-danger" onclick="window.emergencyActivate()" style="animation:emergencyPulse 2s infinite;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>ACTIVATE EMERGENCY LOCK</button>`}
        <button class="pm-btn pm-btn-secondary" onclick="window.emergencyRefresh()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>Refresh</button>
      </div>
    </div>
    <div class="pm-grid-4">
      <div class="pm-card ${s.active ? 'pm-emergency-active' : ''}" style="${s.active ? 'border-color:#ef4444;' : ''}"><div class="pm-stat"><div class="pm-stat-icon" style="background:${s.active ? 'rgba(239,68,68,0.15)' : 'rgba(255,107,0,0.12)'};color:${s.active ? '#ef4444' : '#FF6B00'};"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div><div><div class="pm-stat-value" style="color:${s.active ? '#ef4444' : '#fff'};">${s.active ? 'ACTIVE' : 'Standby'}</div><div class="pm-stat-label">Emergency Status</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div><div class="pm-stat-value">${s.active ? '🔒' : '○'}</div><div class="pm-stat-label">Folder Lock</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg></div><div><div class="pm-stat-value">${s.active ? '✓' : '○'}</div><div class="pm-stat-label">Process Monitor</div></div></div></div>
      <div class="pm-card"><div class="pm-stat"><div class="pm-stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></div><div><div class="pm-stat-value">${s.active ? '✓' : '○'}</div><div class="pm-stat-label">Security Recording</div></div></div></div>
    </div>
    <div class="pm-grid-2">
      <div class="pm-card"><h3 style="font-size:14px;font-weight:600;color:#fff;margin-bottom:12px;">Emergency Actions</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div class="pm-toggle"><span class="pm-toggle-switch active"></span><span style="font-size:13px;color:rgba(255,255,255,0.7);">Lock all protected folders</span></div>
          <div class="pm-toggle"><span class="pm-toggle-switch active"></span><span style="font-size:13px;color:rgba(255,255,255,0.7);">Lock workstation</span></div>
          <div class="pm-toggle"><span class="pm-toggle-switch active"></span><span style="font-size:13px;color:rgba(255,255,255,0.7);">Stop unknown processes</span></div>
          <div class="pm-toggle"><span class="pm-toggle-switch"></span><span style="font-size:13px;color:rgba(255,255,255,0.7);">Disable USB access</span></div>
          <div class="pm-toggle"><span class="pm-toggle-switch active"></span><span style="font-size:13px;color:rgba(255,255,255,0.7);">Start security recording</span></div>
        </div>
      </div>
      <div class="pm-card"><h3 style="font-size:14px;font-weight:600;color:#fff;margin-bottom:12px;">Security Token</h3>
        <p style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:12px;">Generate an auth token to safely deactivate emergency mode.</p>
        <button class="pm-btn pm-btn-sm pm-btn-secondary" onclick="window.emergencyGenToken()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>Generate Auth Token</button>
      </div>
    </div>
    ${s.active ? `<div style="margin-top:16px;"><div class="pm-card-accent" style="text-align:center;padding:16px;border-color:#ef4444;"><span style="color:#ef4444;font-weight:600;font-size:15px;">🔒 EMERGENCY LOCK ACTIVE — All security measures engaged</span></div></div>` : ''}`;
  };

  window.emergencyActivate = async function() {
    if (!window.ishguard) return;
    const confirmed = await showConfirm('Activate Emergency Lock Mode?\n\nThis will lock all folders, secure your desktop, and enable maximum protection.', '🚨 Emergency Lock');
    if (!confirmed) return;
    const result = await window.ishguard.emergencyActivate({ lockFolders:true, lockDesktop:true, stopProcesses:true, disableUsb:false, enableMaxProtection:true, startRecording:true });
    if (result && !result.error) {
      state.emergencyStatus = { active:true, timestamp:new Date().toISOString(), actions:result.actions || [] };
      showAlert('🚨 EMERGENCY LOCK ACTIVATED\n\nAll security measures are now engaged.\nUse the Deactivate button to restore normal operation.', 'Emergency Lock');
    }
    if (state.view === 'emergency-lock') document.getElementById('view-container').innerHTML = viewEmergencyLock();
  };
  window.emergencyDeactivate = async function() {
    if (!window.ishguard) return;
    const token = await showPrompt('Enter auth token to deactivate emergency mode:');
    if (!token) return;
    const result = await window.ishguard.emergencyDeactivate(token);
    if (result && !result.error) {
      state.emergencyStatus = { active:false, timestamp:null, actions:[] };
      showAlert('Emergency mode deactivated.\nSystem returned to normal operation.', 'Emergency Lock');
    } else {
      showAlert('Invalid auth token. Emergency mode remains active.\nUse the auth token generated when emergency mode was activated.', 'Authentication Failed');
    }
    if (state.view === 'emergency-lock') document.getElementById('view-container').innerHTML = viewEmergencyLock();
  };
  window.emergencyRefresh = async function() {
    if (!window.ishguard) return;
    try {
      const status = await window.ishguard.emergencyStatus();
      if (status && !status.error) state.emergencyStatus = status;
      if (state.view === 'emergency-lock') document.getElementById('view-container').innerHTML = viewEmergencyLock();
    } catch(e) {}
  };
  window.emergencyGenToken = async function() {
    if (!window.ishguard) return;
    const result = await window.ishguard.emergencyGenerateToken();
    if (result && !result.error) {
      showAlert('Auth Token: ' + (result.token || result) + '\n\nStore this token securely. You will need it to deactivate emergency mode.', 'Auth Token Generated');
    }
  };

  const splash = document.getElementById('splash');
  if (splash) {
    const fp = document.getElementById('splash-progress');
    if (fp) fp.style.width = '100%';
    setTimeout(() => splash.classList.add('hidden'), 200);
  }
})();
