import { setImmediate as _setImmediate } from 'timers';
import { scanSystemHealth, getStartupPrograms } from './scanners/system-health.js';
import { scanNetwork, getWifiSecurity } from './scanners/network.js';
import { scanProcesses } from './scanners/process-monitor.js';
import { checkFileHash, registerSafeHash, registerThreatHash } from './scanners/file-checker.js';
import { scanFile, scanDirectory } from './scanners/malware-scanner.js';
import { findDuplicates } from './scanners/duplicate-finder.js';
import { scanDrive, listRemovableDrives } from './scanners/shortcut-virus.js';
import { scanBluetoothDevices, scanBluetoothTransferDir, scanBluetoothFile, getBluetoothTransferDirs, handleBluetoothThreat, quarantineBluetoothFile } from './scanners/bluetooth-monitor.js';
import { quarantineFile, restoreFile, deleteQuarantinedFile, emptyQuarantine, getQuarantineList, getQuarantineStats, quarantineThreats } from './scanners/quarantine.js';
import { SecurityEngine } from './rules-engine.js';
import { AIAdvisor } from './ai-advisor.js';
import { validateAllModules, getSystemReadiness } from './feature-validator.js';
import { hardeningChecks, evaluateHardening, getHardeningSummary } from './hardening-advisor.js';
import { SmartVault } from './readers/smart-vault.js';
import { AIReader } from './readers/ai-reader.js';
import { analyzeContent, extractMetadata, extractTextFromHtml, cleanHtml, extractImagesFromHtml, classifyContent } from './readers/content-capture.js';
import { validateUrl, detectFileType, detectPageType, checkDrm, isDirectDownload, isLikelyArticle } from './readers/compliance.js';
import { createSnapshot, createManualSnapshot, getVersionHistory, restoreVersion, compareVersions, deleteSnapshot, restoreDeletedFile, restoreEncryptedFile, performRansomwareRollback, scheduleSnapshot, runScheduledSnapshots, getRecoveryStats, backupRecoveryDb, createIncrementalBackup, createFullBackup, verifyBackupIntegrity, runVersionRecoveryScan } from './scanners/version-recovery.js';
import { listProtectedFolders, protectFolder, unlockFolder, lockFolder, lockAllFolders, unlockAllFolders, removeProtection, getFolderLockStats, getFolderHistory, searchProtectedFolders, toggleFavorite, regenerateRecoveryKey, verifyRecoveryKey, backupConfig, restoreConfig, runFolderLockScan } from './scanners/folder-lock.js';
import { watchFolder, unwatchFolder, getWatchedFolders, scanForSuspiciousActivity, getActivityTimeline, getAllActivityTimeline, quarantineThreat, restoreFromQuarantine, getGuardianStats, runGuardianScan, runAllGuardianScans, clearTimeline } from './scanners/folder-guardian.js';
import { registerPin, verifyPin, registerPassword, verifyPassword, checkWindowsHello, registerFaceTemplate, verifyFace, getAuthMethods, setAutoLockTimer, getAutoLockTimer, setAutoLockTriggers, getAutoLockTriggers, recordFailedAttempt, getFailedAttempts, resetFailedAttempts, checkCameraPrivacy, getLockScreenConfig, setLockScreenConfig, getScreenLockStatus, runScreenLockScan, lockScreen, unlockScreen } from './scanners/screen-lock.js';
import { activateEmergencyLock, deactivateEmergencyLock, getEmergencyStatus, getEmergencyHistory, configureEmergencyOptions, getEmergencyOptions, generateAuthToken, runEmergencyLockScan } from './scanners/emergency-lock.js';
import { scanPrivacy, cleanPrivacy, getPrivacyLastCleaned, getPrivacyLog, exportPrivacyReport, getPrivacyStats } from './privacy/index.js';
import { getPolicies, applyPolicy, disablePolicy, restorePolicyDefault, getLoginBanner, setLoginBanner, removeLoginBanner, getSecurityScore, exportHardeningReport, getHardeningLog } from './hardening/index.js';

export { createSnapshot, createManualSnapshot, getVersionHistory, restoreVersion, compareVersions, deleteSnapshot, restoreDeletedFile, restoreEncryptedFile, performRansomwareRollback, scheduleSnapshot, runScheduledSnapshots, getRecoveryStats, backupRecoveryDb, createIncrementalBackup, createFullBackup, verifyBackupIntegrity, runVersionRecoveryScan } from './scanners/version-recovery.js';
export { listProtectedFolders, protectFolder, unlockFolder, lockFolder, lockAllFolders, unlockAllFolders, removeProtection, getFolderLockStats, getFolderHistory, searchProtectedFolders, toggleFavorite, regenerateRecoveryKey, verifyRecoveryKey, backupConfig, restoreConfig, runFolderLockScan, isFolderAccessible } from './scanners/folder-lock.js';
export { watchFolder, unwatchFolder, getWatchedFolders, scanForSuspiciousActivity, getActivityTimeline, getAllActivityTimeline, quarantineThreat, restoreFromQuarantine, getGuardianStats, runGuardianScan, runAllGuardianScans, clearTimeline } from './scanners/folder-guardian.js';
export { registerPin, verifyPin, registerPassword, verifyPassword, checkWindowsHello, registerFaceTemplate, verifyFace, getAuthMethods, setAutoLockTimer, getAutoLockTimer, setAutoLockTriggers, getAutoLockTriggers, recordFailedAttempt, getFailedAttempts, resetFailedAttempts, checkCameraPrivacy, getLockScreenConfig, setLockScreenConfig, getScreenLockStatus, runScreenLockScan, lockScreen, unlockScreen } from './scanners/screen-lock.js';
export { activateEmergencyLock, deactivateEmergencyLock, getEmergencyStatus, getEmergencyHistory, configureEmergencyOptions, getEmergencyOptions, generateAuthToken, runEmergencyLockScan } from './scanners/emergency-lock.js';
export { scanPrivacy, cleanPrivacy, getPrivacyLastCleaned, getPrivacyLog, exportPrivacyReport, getPrivacyStats } from './privacy/index.js';
export { getPolicies, applyPolicy, disablePolicy, restorePolicyDefault, getLoginBanner, setLoginBanner, removeLoginBanner, getSecurityScore, exportHardeningReport, getHardeningLog } from './hardening/index.js';
export { SecurityEngine } from './rules-engine.js';
export { scanSystemHealth, getStartupPrograms } from './scanners/system-health.js';
export { scanNetwork, getWifiSecurity } from './scanners/network.js';
export { scanProcesses } from './scanners/process-monitor.js';
export { checkFileHash, registerSafeHash, registerThreatHash } from './scanners/file-checker.js';
export { scanFile, scanDirectory } from './scanners/malware-scanner.js';
export { findDuplicates } from './scanners/duplicate-finder.js';
export { scanDrive, listRemovableDrives } from './scanners/shortcut-virus.js';
export { scanBluetoothDevices, scanBluetoothTransferDir, scanBluetoothFile, getBluetoothTransferDirs, handleBluetoothThreat, quarantineBluetoothFile } from './scanners/bluetooth-monitor.js';
export { quarantineFile, restoreFile, deleteQuarantinedFile, emptyQuarantine, getQuarantineList, getQuarantineStats, quarantineThreats } from './scanners/quarantine.js';
export { AIAdvisor } from './ai-advisor.js';
export { validateAllModules, getSystemReadiness } from './feature-validator.js';
export { hardeningChecks, evaluateHardening, getHardeningSummary } from './hardening-advisor.js';
export { SmartVault } from './readers/smart-vault.js';
export { AIReader } from './readers/ai-reader.js';
export { analyzeContent, extractMetadata, extractTextFromHtml, cleanHtml, extractImagesFromHtml, classifyContent } from './readers/content-capture.js';
export { validateUrl, detectFileType, detectPageType, checkDrm, isDirectDownload, isLikelyArticle } from './readers/compliance.js';

export function yieldToEventLoop() {
  return new Promise(resolve => _setImmediate(resolve));
}

let _aiAdvisor = null;
export function getAIAdvisor() {
  if (!_aiAdvisor) _aiAdvisor = new AIAdvisor();
  return _aiAdvisor;
}

let _vault = null;
export function getVault() {
  if (!_vault) _vault = new SmartVault();
  return _vault;
}

let _reader = null;
export function getReader() {
  if (!_reader) _reader = new AIReader();
  return _reader;
}

export async function runFullScan() {
  const engine = new SecurityEngine();
  console.log('[ISHGuard v3.0] Enterprise AI Security Engine');
  console.log('[ISHGuard v3.0] Running full system scan...\n');

  const health = scanSystemHealth();
  await yieldToEventLoop();
  console.log(`[CPU] ${health.cpu.usagePercent}% — ${health.cpu.status}`);
  console.log(`[MEM] ${health.memory.usagePercent}% — ${health.memory.status}`);
  console.log(`[DISK] ${health.disk.usagePercent}% — ${health.disk.status}`);

  const network = scanNetwork();
  await yieldToEventLoop();
  console.log(`[NET] Public: ${network.publicWifi} | Firewall: ${network.firewallActive === null ? 'unknown' : network.firewallActive ? 'active' : 'disabled'} — ${network.status}`);

  const processes = scanProcesses();
  await yieldToEventLoop();
  console.log(`[PROC] ${processes.total} processes, ${processes.threatCount} threats — ${processes.status}`);

  const snapshot = { health, network, processes };
  const verdict = engine.evaluate(snapshot);
  await yieldToEventLoop();
  const advisor = getAIAdvisor();
  const analysis = advisor.analyze({ health, network, processes, verdict });
  await yieldToEventLoop();
  const validation = await validateAllModules();
  const hardening = getHardeningSummary();
  await yieldToEventLoop();

  console.log(`\n[ISHGuard v3.0] Scan complete.`);
  console.log(`[STATUS] ${verdict.status.toUpperCase()}`);
  console.log(`[AI] Risk level: ${analysis.riskLevel} (score: ${analysis.riskScore}/100)`);
  console.log(`[FINDINGS] ${verdict.triggeredCount} rules triggered, ${analysis.findings.length} AI observations`);
  console.log(`[VALIDATION] ${validation.passed}/${validation.modules.length} modules passed`);
  console.log(`[HARDENING] ${hardening.total} security checks available`);
  if (analysis.autoFixAvailable) {
    console.log(`[AUTO-FIX] ${analysis.autoFixCount} issues can be auto-fixed`);
  }
  if (analysis.anomalyDetected) {
    console.log(`[ANOMALY] ${analysis.anomalyDetected.detail}`);
  }

  return {
    snapshot,
    verdict,
    analysis: {
      ...analysis,
      _engineVersion: '3.0.0'
    },
    validation,
    hardening,
    timestamp: new Date().toISOString(),
    version: '3.0.0'
  };
}

export function runAIAnalysis(scanResults) {
  const advisor = getAIAdvisor();
  return advisor.analyze(scanResults);
}

export function runThreatScan(rootDir, onProgress, onThreat) {
  return scanDirectory(rootDir, onProgress, onThreat);
}

export function runDuplicateScan(rootDir, onProgress) {
  return findDuplicates(rootDir, onProgress);
}

export function runDriveScan(drivePath) {
  return scanDrive(drivePath);
}

export function runBluetoothScan() {
  const devices = scanBluetoothDevices();
  const dirs = getBluetoothTransferDirs();
  const known = new Set();
  const transfers = [];
  dirs.forEach(d => {
    const r = scanBluetoothTransferDir(d, known);
    if (r.newFiles.length > 0) transfers.push(...r.newFiles);
  });
  return { devices, watchedDirs: dirs, pendingTransfers: transfers, timestamp: new Date().toISOString() };
}

export function runFolderLockFullScan() {
  return getFolderLockStats();
}

export function runVersionRecoveryFullScan() {
  return getRecoveryStats();
}

export function runFolderGuardianFullScan() {
  return runAllGuardianScans();
}

export function runScreenLockFullScan() {
  return runScreenLockScan();
}

export function runEmergencyFullScan() {
  return runEmergencyLockScan();
}

if (process.argv[1] && process.argv[1].includes('index.js')) {
  runFullScan().catch(e => console.error(e));
}
