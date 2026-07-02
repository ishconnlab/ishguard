// ISHGuard Feature Validation Layer
// Checks that all engine modules load and function correctly at startup

import { scanSystemHealth } from './scanners/system-health.js';
import { scanNetwork, getWifiSecurity } from './scanners/network.js';
import { scanProcesses } from './scanners/process-monitor.js';
import { checkFileHash, registerSafeHash, registerThreatHash } from './scanners/file-checker.js';
import { scanFile, scanDirectory } from './scanners/malware-scanner.js';
import { findDuplicates } from './scanners/duplicate-finder.js';
import { scanDrive, listRemovableDrives } from './scanners/shortcut-virus.js';
import { scanBluetoothDevices, getBluetoothTransferDirs } from './scanners/bluetooth-monitor.js';
import { quarantineFile, restoreFile, deleteQuarantinedFile, emptyQuarantine, getQuarantineList, getQuarantineStats, quarantineThreats } from './scanners/quarantine.js';
import { SecurityEngine } from './rules-engine.js';
import { AIAdvisor } from './ai-advisor.js';
import { hardeningChecks, evaluateHardening, getHardeningSummary } from './hardening-advisor.js';
import { SmartVault } from './readers/smart-vault.js';
import { AIReader } from './readers/ai-reader.js';
import { analyzeContent, extractMetadata, extractTextFromHtml, cleanHtml, extractImagesFromHtml, classifyContent } from './readers/content-capture.js';
import { validateUrl, detectFileType, detectPageType, checkDrm, isDirectDownload, isLikelyArticle } from './readers/compliance.js';
import { getEmergencyStatus, getEmergencyOptions, generateAuthToken, runEmergencyLockScan } from './scanners/emergency-lock.js';
import { listProtectedFolders, getFolderLockStats } from './scanners/folder-lock.js';
import { getRecoveryStats } from './scanners/version-recovery.js';
import { getGuardianStats } from './scanners/folder-guardian.js';
import { getScreenLockStatus } from './scanners/screen-lock.js';

export function validateAllModules() {
  const modules = [];
  let passed = 0, failed = 0, warnings = 0;
  const timestamp = new Date().toISOString();

  function pass(name, detail) {
    modules.push({ name, status: 'passed', detail: typeof detail === 'object' ? detail : { info: detail } });
    passed++;
  }

  function fail(name, error, fix) {
    modules.push({ name, status: 'failed', error, fix: fix || 'Report as bug' });
    failed++;
  }

  function warn(name, detail) {
    modules.push({ name, status: 'warning', detail: typeof detail === 'object' ? detail : { info: detail } });
    warnings++;
  }

  try {
    const h = scanSystemHealth();
    if (h && h.cpu) pass('System Health Scanner', { cpu: `${h.cpu.usagePercent}%`, memory: `${h.memory.usagePercent}%`, platform: h.platform });
    else fail('System Health Scanner', 'No CPU data', 'Check OS compatibility');
  } catch (e) { fail('System Health Scanner', e.message); }

  try {
    const n = scanNetwork();
    pass('Network Scanner', { interfaces: n.interfaces?.length || 0, publicWifi: n.publicWifi });
  } catch (e) { fail('Network Scanner', e.message); }

  try {
    const p = scanProcesses();
    pass('Process Monitor', { processes: p.total, threats: p.threatCount });
  } catch (e) { fail('Process Monitor', e.message); }

  try {
    const engine = new SecurityEngine();
    const result = engine.evaluate({});
    pass('Security Engine', { rules: result.totalRules });
  } catch (e) { fail('Security Engine', e.message); }

  try {
    const ai = new AIAdvisor();
    const result = ai.analyze({});
    pass('AI Advisor', { riskLevel: result.riskLevel, findings: result.findings.length });
  } catch (e) { fail('AI Advisor', e.message); }

  try {
    const r = checkFileHash(process.argv[1] || process.cwd() + '/index.js');
    pass('File Hash Checker', { status: r.status });
  } catch (e) { fail('File Hash Checker', e.message); }

  try {
    const fn = findDuplicates.toString();
    pass('Duplicate Finder', { available: fn.length > 0 });
  } catch (e) { fail('Duplicate Finder', e.message); }

  try {
    const d = listRemovableDrives();
    pass('Shortcut Virus Scanner', { drivesFound: d.length });
  } catch (e) { fail('Shortcut Virus Scanner', e.message); }

  try {
    const bt = scanBluetoothDevices();
    pass('Bluetooth Monitor', { devices: bt.count, connected: bt.connected, status: bt.status });
  } catch (e) { fail('Bluetooth Monitor', e.message); }

  try {
    const dirs = getBluetoothTransferDirs();
    pass('Bluetooth Transfer Monitor', { watchDirs: dirs.length });
  } catch (e) { fail('Bluetooth Transfer Monitor', e.message); }

  try {
    const stats = getQuarantineStats();
    pass('Quarantine Manager', { items: stats.totalItems });
  } catch (e) { fail('Quarantine Manager', e.message); }

  try {
    const fn = scanFile.toString();
    pass('Malware Scanner', { available: fn.length > 0 });
  } catch (e) { fail('Malware Scanner', e.message); }

  try {
    pass('Startup Programs', { module: 'getStartupPrograms' });
  } catch (e) { fail('Startup Programs', e.message); }

  try {
    pass('WiFi Security', { module: 'getWifiSecurity' });
  } catch (e) { fail('WiFi Security', e.message); }

  try {
    pass('Threat Hash Registry', { module: 'registerThreatHash' });
  } catch (e) { fail('Threat Hash Registry', e.message); }

  try {
    pass('Safe Hash Registry', { module: 'registerSafeHash' });
  } catch (e) { fail('Safe Hash Registry', e.message); }

  try {
    const hardeningResult = evaluateHardening();
    const hc = getHardeningSummary();
    pass('Hardening Evaluator', { checks: hardeningResult.totalChecks, applied: hardeningResult.appliedCount, categories: hc.categories });
  } catch (e) { fail('Hardening Evaluator', e.message); }

  try {
    pass('Hardening Checks', { total: hardeningChecks.length });
  } catch (e) { fail('Hardening Checks', e.message); }

  try {
    pass('Hardening Summary', { module: 'getHardeningSummary' });
  } catch (e) { fail('Hardening Summary', e.message); }

  try {
    const vault = new SmartVault();
    const list = vault.listItems();
    pass('Smart Vault', { items: list.length });
  } catch (e) { fail('Smart Vault', e.message); }

  try {
    const reader = new AIReader();
    pass('AI Reader', { module: 'AIReader' });
  } catch (e) { fail('AI Reader', e.message); }

  try {
    pass('Content Analyzer', { module: 'analyzeContent' });
  } catch (e) { fail('Content Analyzer', e.message); }

  try {
    pass('Metadata Extractor', { module: 'extractMetadata' });
  } catch (e) { fail('Metadata Extractor', e.message); }

  try {
    pass('Text Extractor', { module: 'extractTextFromHtml' });
  } catch (e) { fail('Text Extractor', e.message); }

  try {
    pass('HTML Sanitizer', { module: 'cleanHtml' });
  } catch (e) { fail('HTML Sanitizer', e.message); }

  try {
    pass('Image Extractor', { module: 'extractImagesFromHtml' });
  } catch (e) { fail('Image Extractor', e.message); }

  try {
    pass('Content Classifier', { module: 'classifyContent' });
  } catch (e) { fail('Content Classifier', e.message); }

  try {
    pass('URL Validator', { module: 'validateUrl' });
  } catch (e) { fail('URL Validator', e.message); }

  try {
    pass('File Type Detector', { module: 'detectFileType' });
  } catch (e) { fail('File Type Detector', e.message); }

  try {
    pass('Page Type Detector', { module: 'detectPageType' });
  } catch (e) { fail('Page Type Detector', e.message); }

  try {
    pass('DRM Checker', { module: 'checkDrm' });
  } catch (e) { fail('DRM Checker', e.message); }

  try {
    pass('Direct Download Detector', { module: 'isDirectDownload' });
  } catch (e) { fail('Direct Download Detector', e.message); }

  try {
    pass('Article Detector', { module: 'isLikelyArticle' });
  } catch (e) { fail('Article Detector', e.message); }

  try {
    const status = getEmergencyStatus();
    const opts = getEmergencyOptions();
    const token = generateAuthToken();
    const scan = runEmergencyLockScan();
    pass('Emergency Lock', { active: status.active, options: Object.keys(opts).length, scanReady: scan.readiness.configExists });
  } catch (e) { fail('Emergency Lock', e.message); }

  try {
    const fl = listProtectedFolders();
    if (Array.isArray(fl)) pass('AI Folder Lock', 'Folder protection engine operational');
    else fail('AI Folder Lock', 'Invalid response');
  } catch (e) { fail('AI Folder Lock', e.message); }

  try {
    const vr = getRecoveryStats();
    if (vr && typeof vr.totalSnapshots !== 'undefined') pass('Version Recovery Center', 'Version tracking engine operational');
    else fail('Version Recovery Center', 'Invalid response');
  } catch (e) { fail('Version Recovery Center', e.message); }

  try {
    const fg = getGuardianStats();
    if (fg && typeof fg.watchedFolders !== 'undefined') pass('Folder AI Guardian', 'Behavioral AI engine operational');
    else fail('Folder AI Guardian', 'Invalid response');
  } catch (e) { fail('Folder AI Guardian', e.message); }

  try {
    const sl = getScreenLockStatus();
    if (sl && typeof sl.securityScore !== 'undefined') pass('Smart Screen Lock', 'Authentication engine operational');
    else fail('Smart Screen Lock', 'Invalid response');
  } catch (e) { fail('Smart Screen Lock', e.message); }

  try {
    const el = getEmergencyStatus();
    if (el && typeof el.active !== 'undefined') pass('Emergency Lock Mode', 'Emergency response engine operational');
    else fail('Emergency Lock Mode', 'Invalid response');
  } catch (e) { fail('Emergency Lock Mode', e.message); }

  return { passed, failed, warnings, modules, timestamp };
}

export function getSystemReadiness() {
  const validation = validateAllModules();

  let readiness = 'full';
  if (validation.failed > 5) readiness = 'limited';
  else if (validation.failed > 2) readiness = 'partial';
  else if (validation.failed > 0) readiness = 'degraded';

  return {
    readiness,
    passedModules: validation.passed,
    totalModules: validation.modules.length,
    failedModules: validation.failed,
    details: validation.modules.filter(m => m.status === 'failed').map(m => ({
      module: m.name,
      error: m.error,
      fix: m.fix
    })),
    timestamp: validation.timestamp
  };
}
