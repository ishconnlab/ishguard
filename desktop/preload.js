const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ishguard', {
  // System
  scanSystemHealth: (...args) => ipcRenderer.invoke('scan:system-health', ...args),
  getStartupPrograms: (...args) => ipcRenderer.invoke('scan:startup-programs', ...args),
  scanNetwork: (...args) => ipcRenderer.invoke('scan:network', ...args),
  getWifiSecurity: (...args) => ipcRenderer.invoke('scan:wifi-security', ...args),
  scanProcesses: (...args) => ipcRenderer.invoke('scan:processes', ...args),
  checkFileHash: (...args) => ipcRenderer.invoke('scan:file-hash', ...args),
  runFullScan: (...args) => ipcRenderer.invoke('scan:full', ...args),
  scanThreatFile: (...args) => ipcRenderer.invoke('scan:threat-file', ...args),
  scanThreatDir: (...args) => ipcRenderer.invoke('scan:threat-dir', ...args),
  scanDuplicates: (...args) => ipcRenderer.invoke('scan:duplicates', ...args),
  scanDrive: (...args) => ipcRenderer.invoke('scan:drive', ...args),
  listDrives: (...args) => ipcRenderer.invoke('scan:list-drives', ...args),

  // Bluetooth
  bluetoothScanDevices: (...args) => ipcRenderer.invoke('bluetooth:scan-devices', ...args),
  bluetoothTransferDirs: (...args) => ipcRenderer.invoke('bluetooth:transfer-dirs', ...args),
  bluetoothScanDir: (...args) => ipcRenderer.invoke('bluetooth:scan-dir', ...args),
  bluetoothScanFile: (...args) => ipcRenderer.invoke('bluetooth:scan-file', ...args),
  bluetoothHandleThreat: (...args) => ipcRenderer.invoke('bluetooth:handle-threat', ...args),
  bluetoothQuarantine: (...args) => ipcRenderer.invoke('bluetooth:quarantine', ...args),
  bluetoothRunScan: (...args) => ipcRenderer.invoke('bluetooth:run-scan', ...args),

  // Quarantine
  quarantineAdd: (...args) => ipcRenderer.invoke('quarantine:add', ...args),
  quarantineRestore: (...args) => ipcRenderer.invoke('quarantine:restore', ...args),
  quarantineDelete: (...args) => ipcRenderer.invoke('quarantine:delete', ...args),
  quarantineEmpty: (...args) => ipcRenderer.invoke('quarantine:empty', ...args),
  quarantineList: (...args) => ipcRenderer.invoke('quarantine:list', ...args),
  quarantineStats: (...args) => ipcRenderer.invoke('quarantine:stats', ...args),
  quarantineThreats: (...args) => ipcRenderer.invoke('quarantine:threats', ...args),

  // AI
  aiAnalyze: (...args) => ipcRenderer.invoke('ai:analyze', ...args),
  aiFullScan: (...args) => ipcRenderer.invoke('ai:full-scan', ...args),
  aiAnalyzeCurrent: (...args) => ipcRenderer.invoke('ai:analyze-current', ...args),
  aiScanAndAnalyze: (...args) => ipcRenderer.invoke('ai:scan-and-analyze', ...args),

  // Validation
  validateModules: (...args) => ipcRenderer.invoke('validate:modules', ...args),
  getReadiness: (...args) => ipcRenderer.invoke('validate:readiness', ...args),

  // Hardening
  hardeningList: (...args) => ipcRenderer.invoke('hardening:list', ...args),
  hardeningSummary: (...args) => ipcRenderer.invoke('hardening:summary', ...args),
  hardeningRunCheck: (...args) => ipcRenderer.invoke('hardening:run-check', ...args),

  // Vault
  vaultSave: (...args) => ipcRenderer.invoke('vault:save', ...args),
  vaultGet: (...args) => ipcRenderer.invoke('vault:get', ...args),
  vaultDelete: (...args) => ipcRenderer.invoke('vault:delete', ...args),
  vaultList: (...args) => ipcRenderer.invoke('vault:list', ...args),
  vaultSearch: (...args) => ipcRenderer.invoke('vault:search', ...args),
  vaultStats: (...args) => ipcRenderer.invoke('vault:stats', ...args),
  vaultAnalyzeItem: (...args) => ipcRenderer.invoke('vault:analyze-item', ...args),
  vaultSummarize: (...args) => ipcRenderer.invoke('vault:summarize', ...args),
  vaultClear: (...args) => ipcRenderer.invoke('vault:clear', ...args),
  vaultExport: (...args) => ipcRenderer.invoke('vault:export', ...args),

  vaultAnalyze: (...args) => ipcRenderer.invoke('vault:analyze', ...args),
  vaultCategories: (...args) => ipcRenderer.invoke('vault:categories', ...args),
  vaultAddNotes: (...args) => ipcRenderer.invoke('vault:add-notes', ...args),
  vaultStudyNotes: (...args) => ipcRenderer.invoke('vault:study-notes', ...args),

  // Reader
  readerAnalyze: (...args) => ipcRenderer.invoke('reader:analyze', ...args),
  readerTranslate: (...args) => ipcRenderer.invoke('reader:translate', ...args),
  readerCompare: (...args) => ipcRenderer.invoke('reader:compare', ...args),

  // Folder Lock
  folderLockList: (...args) => ipcRenderer.invoke('folder-lock:list', ...args),
  folderLockProtect: (...args) => ipcRenderer.invoke('folder-lock:protect', ...args),
  folderLockUnlock: (...args) => ipcRenderer.invoke('folder-lock:unlock', ...args),
  folderLockLock: (...args) => ipcRenderer.invoke('folder-lock:lock', ...args),
  folderLockLockAll: (...args) => ipcRenderer.invoke('folder-lock:lock-all', ...args),
  folderLockUnlockAll: (...args) => ipcRenderer.invoke('folder-lock:unlock-all', ...args),
  folderLockRemove: (...args) => ipcRenderer.invoke('folder-lock:remove', ...args),
  folderLockStats: (...args) => ipcRenderer.invoke('folder-lock:stats', ...args),
  folderLockHistory: (...args) => ipcRenderer.invoke('folder-lock:history', ...args),
  folderLockSearch: (...args) => ipcRenderer.invoke('folder-lock:search', ...args),
  folderLockFavorite: (...args) => ipcRenderer.invoke('folder-lock:favorite', ...args),
  folderLockRecoveryKey: (...args) => ipcRenderer.invoke('folder-lock:recovery-key', ...args),
  folderLockVerifyRecovery: (...args) => ipcRenderer.invoke('folder-lock:verify-recovery', ...args),
  folderLockBackup: (...args) => ipcRenderer.invoke('folder-lock:backup', ...args),
  folderLockRestore: (...args) => ipcRenderer.invoke('folder-lock:restore', ...args),
  folderLockRunScan: (...args) => ipcRenderer.invoke('folder-lock:run-scan', ...args),

  // Version Recovery
  versionCreateSnapshot: (...args) => ipcRenderer.invoke('version:create-snapshot', ...args),
  versionCreateManual: (...args) => ipcRenderer.invoke('version:create-manual', ...args),
  versionHistory: (...args) => ipcRenderer.invoke('version:history', ...args),
  versionRestore: (...args) => ipcRenderer.invoke('version:restore', ...args),
  versionCompare: (...args) => ipcRenderer.invoke('version:compare', ...args),
  versionDelete: (...args) => ipcRenderer.invoke('version:delete', ...args),
  versionRestoreDeleted: (...args) => ipcRenderer.invoke('version:restore-deleted', ...args),
  versionRestoreEncrypted: (...args) => ipcRenderer.invoke('version:restore-encrypted', ...args),
  versionRansomwareRollback: (...args) => ipcRenderer.invoke('version:ransomware-rollback', ...args),
  versionSchedule: (...args) => ipcRenderer.invoke('version:schedule', ...args),
  versionRunScheduled: (...args) => ipcRenderer.invoke('version:run-scheduled', ...args),
  versionStats: (...args) => ipcRenderer.invoke('version:stats', ...args),
  versionBackupDb: (...args) => ipcRenderer.invoke('version:backup-db', ...args),
  versionVerify: (...args) => ipcRenderer.invoke('version:verify', ...args),
  versionRunScan: (...args) => ipcRenderer.invoke('version:run-scan', ...args),

  // Folder Guardian
  guardianWatch: (...args) => ipcRenderer.invoke('guardian:watch', ...args),
  guardianUnwatch: (...args) => ipcRenderer.invoke('guardian:unwatch', ...args),
  guardianWatched: (...args) => ipcRenderer.invoke('guardian:watched', ...args),
  guardianScan: (...args) => ipcRenderer.invoke('guardian:scan', ...args),
  guardianTimeline: (...args) => ipcRenderer.invoke('guardian:timeline', ...args),
  guardianAllTimeline: (...args) => ipcRenderer.invoke('guardian:all-timeline', ...args),
  guardianQuarantine: (...args) => ipcRenderer.invoke('guardian:quarantine', ...args),
  guardianRestore: (...args) => ipcRenderer.invoke('guardian:restore', ...args),
  guardianStats: (...args) => ipcRenderer.invoke('guardian:stats', ...args),
  guardianRunScan: (...args) => ipcRenderer.invoke('guardian:run-scan', ...args),
  guardianRunAll: (...args) => ipcRenderer.invoke('guardian:run-all', ...args),
  guardianClearTimeline: (...args) => ipcRenderer.invoke('guardian:clear-timeline', ...args),

  // Screen Lock
  screenLockRegisterPin: (...args) => ipcRenderer.invoke('screen-lock:register-pin', ...args),
  screenLockVerifyPin: (...args) => ipcRenderer.invoke('screen-lock:verify-pin', ...args),
  screenLockRegisterPassword: (...args) => ipcRenderer.invoke('screen-lock:register-password', ...args),
  screenLockVerifyPassword: (...args) => ipcRenderer.invoke('screen-lock:verify-password', ...args),
  screenLockCheckHello: (...args) => ipcRenderer.invoke('screen-lock:check-hello', ...args),
  screenLockRegisterFace: (...args) => ipcRenderer.invoke('screen-lock:register-face', ...args),
  screenLockVerifyFace: (...args) => ipcRenderer.invoke('screen-lock:verify-face', ...args),
  screenLockAuthMethods: (...args) => ipcRenderer.invoke('screen-lock:auth-methods', ...args),
  screenLockSetTimer: (...args) => ipcRenderer.invoke('screen-lock:set-timer', ...args),
  screenLockGetTimer: (...args) => ipcRenderer.invoke('screen-lock:get-timer', ...args),
  screenLockSetTriggers: (...args) => ipcRenderer.invoke('screen-lock:set-triggers', ...args),
  screenLockGetTriggers: (...args) => ipcRenderer.invoke('screen-lock:get-triggers', ...args),
  screenLockFailedAttempts: (...args) => ipcRenderer.invoke('screen-lock:failed-attempts', ...args),
  screenLockCheckPrivacy: (...args) => ipcRenderer.invoke('screen-lock:check-privacy', ...args),
  screenLockGetConfig: (...args) => ipcRenderer.invoke('screen-lock:get-config', ...args),
  screenLockSetConfig: (...args) => ipcRenderer.invoke('screen-lock:set-config', ...args),
  screenLockStatus: (...args) => ipcRenderer.invoke('screen-lock:status', ...args),
  screenLockRunScan: (...args) => ipcRenderer.invoke('screen-lock:run-scan', ...args),

  // Emergency Lock
  emergencyActivate: (...args) => ipcRenderer.invoke('emergency:activate', ...args),
  emergencyDeactivate: (...args) => ipcRenderer.invoke('emergency:deactivate', ...args),
  emergencyStatus: (...args) => ipcRenderer.invoke('emergency:status', ...args),
  emergencyHistory: (...args) => ipcRenderer.invoke('emergency:history', ...args),
  emergencyConfigure: (...args) => ipcRenderer.invoke('emergency:configure', ...args),
  emergencyOptions: (...args) => ipcRenderer.invoke('emergency:options', ...args),
  emergencyGenerateToken: (...args) => ipcRenderer.invoke('emergency:generate-token', ...args),
  emergencyRunScan: (...args) => ipcRenderer.invoke('emergency:run-scan', ...args),

  // System
  getHomeDir: (...args) => ipcRenderer.invoke('system:home-dir', ...args),

  // Dialogs
  selectFile: (...args) => ipcRenderer.invoke('dialog:select-file', ...args),
  selectDir: (...args) => ipcRenderer.invoke('dialog:select-dir', ...args),

  // Events
  onScanComplete: (cb) => ipcRenderer.on('scan:complete', (_, d) => cb(d)),
  onStatusUpdate: (cb) => ipcRenderer.on('status:update', (_, d) => cb(d)),
  onScanProgress: (cb) => ipcRenderer.on('scan:progress', (_, d) => cb(d)),
  onThreatFound: (cb) => ipcRenderer.on('scan:threat-found', (_, d) => cb(d)),
  onQuickScan: (cb) => ipcRenderer.on('action:quick-scan', () => cb()),
  onAction: (action, cb) => ipcRenderer.on(`action:${action}`, () => cb()),
});
