const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const Store = require('electron-store');
const store = new Store({ defaults: { firstRun: true, installTime: null } });

let mainWindow;
let tray;
let apiServer;
let engineCache = null;
let lastFullScanResult = null;
let lastFullScanTime = 0;

function getEnginePath() {
  const isDev = !app.isPackaged;
  if (isDev) return path.join(__dirname, '..', 'engine', 'index.js');
  return path.join(process.resourcesPath, 'engine', 'index.js');
}

async function loadEngine() {
  const enginePath = getEnginePath();
  return await import(`file://${enginePath.replace(/\\/g, '/')}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#050A12',
    icon: path.join(__dirname, 'resources', 'logo.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'resources', 'logo.ico');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('ISHGuard v3 Enterprise Security');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Dashboard', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { label: 'Run Quick Scan', click: () => { mainWindow.webContents.send('action:quick-scan'); mainWindow.show(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => { mainWindow.show(); mainWindow.focus(); });
}

function registerIPC(engine) {
  const wrap = (fn) => async (event, ...args) => {
    try {
      const mod = engineCache || (engineCache = await loadEngine());
      return await fn(mod, ...args);
    } catch (err) {
      return { error: err.message };
    }
  };

  ipcMain.handle('scan:system-health', wrap((m) => m.scanSystemHealth()));
  ipcMain.handle('scan:startup-programs', wrap((m) => m.getStartupPrograms()));
  ipcMain.handle('scan:network', wrap((m) => m.scanNetwork()));
  ipcMain.handle('scan:wifi-security', wrap((m) => m.getWifiSecurity()));
  ipcMain.handle('scan:processes', wrap((m) => m.scanProcesses()));
  ipcMain.handle('scan:file-hash', wrap((m, filePath) => m.checkFileHash(filePath)));
  ipcMain.handle('scan:full', wrap((m) => m.runFullScan()));
  ipcMain.handle('scan:threat-file', wrap((m, filePath) => m.scanFile(filePath)));
  ipcMain.handle('scan:threat-dir', wrap((m, dir, onProgress) => m.scanDirectory(dir)));
  ipcMain.handle('scan:duplicates', wrap((m, dir) => m.findDuplicates(dir)));
  ipcMain.handle('scan:drive', wrap((m, drivePath) => m.scanDrive(drivePath)));
  ipcMain.handle('scan:list-drives', wrap((m) => m.listRemovableDrives()));

  // Bluetooth
  ipcMain.handle('bluetooth:scan-devices', wrap((m) => m.scanBluetoothDevices()));
  ipcMain.handle('bluetooth:transfer-dirs', wrap((m) => m.getBluetoothTransferDirs()));
  ipcMain.handle('bluetooth:scan-dir', wrap((m, dir, known) => m.scanBluetoothTransferDir(dir, known)));
  ipcMain.handle('bluetooth:scan-file', wrap((m, filePath) => m.scanBluetoothFile(filePath)));
  ipcMain.handle('bluetooth:handle-threat', wrap((m, filePath, action) => m.handleBluetoothThreat(filePath, action)));
  ipcMain.handle('bluetooth:quarantine', wrap((m, filePath) => m.quarantineBluetoothFile(filePath)));
  ipcMain.handle('bluetooth:run-scan', wrap((m) => m.runBluetoothScan()));

  ipcMain.handle('quarantine:add', wrap((m, filePath) => m.quarantineFile(filePath)));
  ipcMain.handle('quarantine:restore', wrap((m, id) => m.restoreFile(id)));
  ipcMain.handle('quarantine:delete', wrap((m, id) => m.deleteQuarantinedFile(id)));
  ipcMain.handle('quarantine:empty', wrap((m) => m.emptyQuarantine()));
  ipcMain.handle('quarantine:list', wrap((m) => m.getQuarantineList()));
  ipcMain.handle('quarantine:stats', wrap((m) => m.getQuarantineStats()));
  ipcMain.handle('quarantine:threats', wrap((m, threats) => m.quarantineThreats(threats)));

  ipcMain.handle('ai:analyze', wrap((m, data) => m.runAIAnalysis(data)));
  ipcMain.handle('ai:full-scan', wrap((m) => {
    lastFullScanResult = m.runFullScan();
    lastFullScanTime = Date.now();
    return lastFullScanResult;
  }));
  ipcMain.handle('ai:scan-and-analyze', wrap((m) => {
    lastFullScanResult = m.runFullScan();
    lastFullScanTime = Date.now();
    return lastFullScanResult;
  }));
  ipcMain.handle('ai:analyze-current', wrap((m) => {
    const FIVE_MIN = 300000;
    if (!lastFullScanResult || (Date.now() - lastFullScanTime) > FIVE_MIN) {
      lastFullScanResult = m.runFullScan();
      lastFullScanTime = Date.now();
    }
    return lastFullScanResult;
  }));

  ipcMain.handle('validate:modules', wrap((m) => m.validateAllModules()));
  ipcMain.handle('validate:readiness', wrap((m) => m.getSystemReadiness()));

  ipcMain.handle('hardening:list', wrap((m) => m.hardeningChecks));
  ipcMain.handle('hardening:summary', wrap((m) => m.getHardeningSummary()));
  ipcMain.handle('hardening:run-check', wrap((m, checkId) => ({ id: checkId, status: 'simulated' })));

  ipcMain.handle('vault:save', wrap((m, content) => { const v = m.getVault(); return v.saveContent(content); }));
  ipcMain.handle('vault:get', wrap((m, id) => { const v = m.getVault(); return v.getContent(id); }));
  ipcMain.handle('vault:delete', wrap((m, id) => { const v = m.getVault(); return v.deleteItem(id); }));
  ipcMain.handle('vault:list', wrap((m) => { const v = m.getVault(); return v.listItems(); }));
  ipcMain.handle('vault:search', wrap((m, query) => { const v = m.getVault(); return v.searchItems(query); }));
  ipcMain.handle('vault:stats', wrap((m) => { const v = m.getVault(); return v.getStats(); }));
  ipcMain.handle('vault:analyze-item', wrap((m, id) => { const v = m.getVault(); return v.analyzeItem(id); }));
  ipcMain.handle('vault:summarize', wrap((m, id) => { const v = m.getVault(); return v.summarizeItem(id); }));
  ipcMain.handle('vault:clear', wrap((m) => { const v = m.getVault(); return v.clearAll(); }));
  ipcMain.handle('vault:export', wrap((m, id, format) => { const v = m.getVault(); return v.exportItem(id, format); }));
  ipcMain.handle('vault:analyze', wrap((m, id) => { const v = m.getVault(); return v.analyzeItem(id); }));
  ipcMain.handle('vault:categories', wrap(() => ['articles', 'PDFs', 'images', 'notes', 'summaries', 'bookmarks']));
  ipcMain.handle('vault:add-notes', wrap((m, id, notes) => { const v = m.getVault(); return v.addNotes(id, notes); }));
  ipcMain.handle('vault:study-notes', wrap((m, id) => { const v = m.getVault(); return v.createStudyNotes(id); }));

  ipcMain.handle('reader:analyze', wrap((m, text) => { const r = m.getReader(); return r.analyze(text); }));
  ipcMain.handle('reader:translate', wrap((m, text, lang) => { const r = m.getReader(); return r.translate(text, lang); }));
  ipcMain.handle('reader:compare', wrap((m, a, b) => { const r = m.getReader(); return r.compareTexts(a, b); }));

  // Folder Lock
  ipcMain.handle('folder-lock:list', wrap((m) => m.listProtectedFolders()));
  ipcMain.handle('folder-lock:protect', wrap((m, p) => m.protectFolder(p.path, p.password, p.pin, p.options)));
  ipcMain.handle('folder-lock:unlock', wrap((m, id, auth) => m.unlockFolder(id, auth)));
  ipcMain.handle('folder-lock:lock', wrap((m, id) => m.lockFolder(id)));
  ipcMain.handle('folder-lock:lock-all', wrap((m) => m.lockAllFolders()));
  ipcMain.handle('folder-lock:unlock-all', wrap((m, pwd) => m.unlockAllFolders(pwd)));
  ipcMain.handle('folder-lock:remove', wrap((m, id, pwd, sd) => m.removeProtection(id, pwd, sd)));
  ipcMain.handle('folder-lock:stats', wrap((m) => m.getFolderLockStats()));
  ipcMain.handle('folder-lock:history', wrap((m, id) => m.getFolderHistory(id)));
  ipcMain.handle('folder-lock:search', wrap((m, q) => m.searchProtectedFolders(q)));
  ipcMain.handle('folder-lock:favorite', wrap((m, id) => m.toggleFavorite(id)));
  ipcMain.handle('folder-lock:recovery-key', wrap((m) => m.regenerateRecoveryKey()));
  ipcMain.handle('folder-lock:verify-recovery', wrap((m, key) => m.verifyRecoveryKey(key)));
  ipcMain.handle('folder-lock:backup', wrap((m, dest) => m.backupConfig(dest)));
  ipcMain.handle('folder-lock:restore', wrap((m, src) => m.restoreConfig(src)));
  ipcMain.handle('folder-lock:run-scan', wrap((m) => m.runFolderLockFullScan()));
  ipcMain.handle('folder-lock:accessible', wrap((m, path) => m.isFolderAccessible(path)));

  // Version Recovery
  ipcMain.handle('version:create-snapshot', wrap((m, p) => m.createSnapshot(p.path, p.label)));
  ipcMain.handle('version:create-manual', wrap((m, p) => m.createManualSnapshot(p)));
  ipcMain.handle('version:history', wrap((m, fp) => m.getVersionHistory(fp)));
  ipcMain.handle('version:restore', wrap((m, id, dest) => m.restoreVersion(id, dest)));
  ipcMain.handle('version:compare', wrap((m, a, b) => m.compareVersions(a, b)));
  ipcMain.handle('version:delete', wrap((m, id) => m.deleteSnapshot(id)));
  ipcMain.handle('version:restore-deleted', wrap((m, fp) => m.restoreDeletedFile(fp)));
  ipcMain.handle('version:restore-encrypted', wrap((m, fp) => m.restoreEncryptedFile(fp)));
  ipcMain.handle('version:ransomware-rollback', wrap((m, dir) => m.performRansomwareRollback(dir)));
  ipcMain.handle('version:schedule', wrap((m, fp, int) => m.scheduleSnapshot(fp, int)));
  ipcMain.handle('version:run-scheduled', wrap((m) => m.runScheduledSnapshots()));
  ipcMain.handle('version:stats', wrap((m) => m.getRecoveryStats()));
  ipcMain.handle('version:backup-db', wrap((m, dest) => m.backupRecoveryDb(dest)));
  ipcMain.handle('version:verify', wrap((m, id) => m.verifyBackupIntegrity(id)));
  ipcMain.handle('version:run-scan', wrap((m) => m.runVersionRecoveryFullScan()));

  // Folder Guardian
  ipcMain.handle('guardian:watch', wrap((m, fp) => m.watchFolder(fp)));
  ipcMain.handle('guardian:unwatch', wrap((m, fp) => m.unwatchFolder(fp)));
  ipcMain.handle('guardian:watched', wrap((m) => m.getWatchedFolders()));
  ipcMain.handle('guardian:scan', wrap((m, fp) => m.scanForSuspiciousActivity(fp)));
  ipcMain.handle('guardian:timeline', wrap((m, fp, limit) => m.getActivityTimeline(fp, limit)));
  ipcMain.handle('guardian:all-timeline', wrap((m, limit) => m.getAllActivityTimeline(limit)));
  ipcMain.handle('guardian:quarantine', wrap((m, fp, tid) => m.quarantineThreat(fp, tid)));
  ipcMain.handle('guardian:restore', wrap((m, fp, tid) => m.restoreFromQuarantine(fp, tid)));
  ipcMain.handle('guardian:stats', wrap((m) => m.getGuardianStats()));
  ipcMain.handle('guardian:run-scan', wrap((m, fp) => m.runGuardianScan(fp)));
  ipcMain.handle('guardian:run-all', wrap((m) => m.runAllGuardianScans()));
  ipcMain.handle('guardian:clear-timeline', wrap((m, older) => m.clearTimeline(older)));

  // Screen Lock
  ipcMain.handle('screen-lock:register-pin', wrap((m, pin) => m.registerPin(pin)));
  ipcMain.handle('screen-lock:verify-pin', wrap((m, pin) => m.verifyPin(pin)));
  ipcMain.handle('screen-lock:register-password', wrap((m, pwd) => m.registerPassword(pwd)));
  ipcMain.handle('screen-lock:verify-password', wrap((m, pwd) => m.verifyPassword(pwd)));
  ipcMain.handle('screen-lock:check-hello', wrap((m) => m.checkWindowsHello()));
  ipcMain.handle('screen-lock:register-face', wrap((m, data) => m.registerFaceTemplate(data)));
  ipcMain.handle('screen-lock:verify-face', wrap((m, data) => m.verifyFace(data)));
  ipcMain.handle('screen-lock:auth-methods', wrap((m) => m.getAuthMethods()));
  ipcMain.handle('screen-lock:set-timer', wrap((m, sec) => m.setAutoLockTimer(sec)));
  ipcMain.handle('screen-lock:get-timer', wrap((m) => m.getAutoLockTimer()));
  ipcMain.handle('screen-lock:set-triggers', wrap((m, t) => m.setAutoLockTriggers(t)));
  ipcMain.handle('screen-lock:get-triggers', wrap((m) => m.getAutoLockTriggers()));
  ipcMain.handle('screen-lock:failed-attempts', wrap((m) => m.getFailedAttempts()));
  ipcMain.handle('screen-lock:check-privacy', wrap((m) => m.checkCameraPrivacy()));
  ipcMain.handle('screen-lock:get-config', wrap((m) => m.getLockScreenConfig()));
  ipcMain.handle('screen-lock:set-config', wrap((m, c) => m.setLockScreenConfig(c)));
  ipcMain.handle('screen-lock:status', wrap((m) => m.getScreenLockStatus()));
  ipcMain.handle('screen-lock:run-scan', wrap((m) => m.runScreenLockFullScan()));
  ipcMain.handle('screen-lock:lock', wrap((m) => m.lockScreen()));
  ipcMain.handle('screen-lock:unlock', wrap((m, password) => m.unlockScreen(password)));

  // Emergency Lock
  ipcMain.handle('emergency:activate', wrap((m, opts) => m.activateEmergencyLock(opts)));
  ipcMain.handle('emergency:deactivate', wrap((m, token) => m.deactivateEmergencyLock(token)));
  ipcMain.handle('emergency:status', wrap((m) => m.getEmergencyStatus()));
  ipcMain.handle('emergency:history', wrap((m, limit) => m.getEmergencyHistory(limit)));
  ipcMain.handle('emergency:configure', wrap((m, opts) => m.configureEmergencyOptions(opts)));
  ipcMain.handle('emergency:options', wrap((m) => m.getEmergencyOptions()));
  ipcMain.handle('emergency:generate-token', wrap((m) => m.generateAuthToken()));
  ipcMain.handle('emergency:run-scan', wrap((m) => m.runEmergencyFullScan()));

  // Privacy Cleaner
  ipcMain.handle('privacy:scan', wrap((m) => m.scanPrivacy()));
  ipcMain.handle('privacy:clean', wrap((m, ids) => m.cleanPrivacy(ids)));
  ipcMain.handle('privacy:stats', wrap((m) => m.getPrivacyStats()));
  ipcMain.handle('privacy:last-cleaned', wrap((m) => m.getPrivacyLastCleaned()));
  ipcMain.handle('privacy:log', wrap((m) => m.getPrivacyLog()));
  ipcMain.handle('privacy:export', wrap((m) => m.exportPrivacyReport()));

  // Security Policies
  ipcMain.handle('policies:list', wrap((m) => m.getPolicies()));
  ipcMain.handle('policies:apply', wrap((m, id) => m.applyPolicy(id)));
  ipcMain.handle('policies:disable', wrap((m, id) => m.disablePolicy(id)));
  ipcMain.handle('policies:restore', wrap((m, id) => m.restorePolicyDefault(id)));
  ipcMain.handle('policies:score', wrap((m) => m.getSecurityScore()));
  ipcMain.handle('policies:banner-get', wrap((m) => m.getLoginBanner()));
  ipcMain.handle('policies:banner-set', wrap((m, config) => m.setLoginBanner(config)));
  ipcMain.handle('policies:banner-remove', wrap((m) => m.removeLoginBanner()));
  ipcMain.handle('policies:export', wrap((m) => m.exportHardeningReport()));
  ipcMain.handle('policies:log', wrap((m) => m.getHardeningLog()));

  ipcMain.handle('system:home-dir', () => require('os').homedir());

  ipcMain.handle('dialog:select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:select-dir', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });
}

function startAPIServer() {
  apiServer = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') { res.end(); return; }

    const parsed = new URL(req.url, 'http://localhost:9721');
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    try {
      const engine = await loadEngine();

      if (req.method === 'GET' && (pathParts[0] === 'api' && pathParts[1] === 'status' || pathParts[1] === 'health')) {
        res.end(JSON.stringify({ ...engine.scanSystemHealth(), timestamp: new Date().toISOString() }));
      } else if (req.method === 'GET' && pathParts[1] === 'network') {
        res.end(JSON.stringify({ ...engine.scanNetwork(), wifi: engine.getWifiSecurity() }));
      } else if (req.method === 'GET' && pathParts[1] === 'processes') {
        res.end(JSON.stringify(engine.scanProcesses()));
      } else if (req.method === 'GET' && pathParts[1] === 'full') {
        const fullScan = await engine.runFullScan();
        res.end(JSON.stringify({ ...fullScan, version: '3.0.0' }));
      } else if (req.method === 'GET' && pathParts[1] === 'info') {
        res.end(JSON.stringify({ name: 'ISHGuard Engine', version: '3.0.0', modules: 48, status: 'operational' }));
      } else if (req.method === 'GET' && pathParts[1] === 'vault' && pathParts[2] === 'items') {
        const vault = engine.getVault();
        res.end(JSON.stringify(vault.listItems()));
      } else if (req.method === 'POST' && pathParts[1] === 'vault' && pathParts[2] === 'items') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const vault = engine.getVault();
          const data = JSON.parse(body);
          res.end(JSON.stringify(vault.saveContent(data)));
        });
      } else if (req.method === 'GET' && pathParts[1] === 'vault' && pathParts[2] === 'item' && pathParts[3]) {
        const vault = engine.getVault();
        res.end(JSON.stringify(vault.getContent(pathParts[3])));
      } else if (req.method === 'DELETE' && pathParts[1] === 'vault' && pathParts[2] === 'item' && pathParts[3]) {
        const vault = engine.getVault();
        res.end(JSON.stringify(vault.deleteItem(pathParts[3])));
      } else if (req.method === 'GET' && pathParts[1] === 'folder-lock' && pathParts[2] === 'stats') {
        res.end(JSON.stringify(engine.getFolderLockStats()));
      } else if (req.method === 'GET' && pathParts[1] === 'version' && pathParts[2] === 'stats') {
        res.end(JSON.stringify(engine.getRecoveryStats()));
      } else if (req.method === 'GET' && pathParts[1] === 'guardian' && pathParts[2] === 'stats') {
        res.end(JSON.stringify(engine.getGuardianStats()));
      } else if (req.method === 'GET' && pathParts[1] === 'screen-lock' && pathParts[2] === 'status') {
        res.end(JSON.stringify(engine.getScreenLockStatus()));
      } else if (req.method === 'GET' && pathParts[1] === 'emergency' && pathParts[2] === 'status') {
        res.end(JSON.stringify(engine.getEmergencyStatus()));
      } else if (req.method === 'GET' && pathParts[1] === 'vault' && pathParts[2] === 'analyze' && pathParts[3]) {
        const vault = engine.getVault();
        res.end(JSON.stringify(await vault.analyzeItem(pathParts[3])));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  apiServer.listen(9721, '127.0.0.1');
  apiServer.unref();
}

process.on('uncaughtException', (err) => {
  console.error('[ISHGuard] Uncaught exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[ISHGuard] Unhandled rejection:', reason);
});

const gotSingleInstance = app.requestSingleInstanceLock();
if (!gotSingleInstance) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    createWindow();
    createTray();
    try {
      engineCache = await loadEngine();
      registerIPC(engineCache);
      startAPIServer();

      // First-run: auto-trigger quick scan
      if (store.get('firstRun')) {
        store.set('firstRun', false);
        store.set('installTime', Date.now());
        console.log('[ISHGuard] First run detected — scheduling initial system scan...');
        mainWindow.webContents.on('did-finish-load', () => {
          setTimeout(() => {
            mainWindow.webContents.send('action:first-run-scan');
          }, 3000);
        });
      }
    } catch (err) {
      console.error('Failed to load engine:', err.message);
    }
  });
}

app.on('window-all-closed', () => {});
app.on('activate', () => { if (!mainWindow) createWindow(); });
app.on('before-quit', () => { app.isQuitting = true; if (apiServer) apiServer.close(); });
