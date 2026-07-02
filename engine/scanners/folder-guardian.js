import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

const CONFIG_PATH = path.join(os.homedir(), '.ishguard', 'folder-guardian.json');
const TIMELINE_PATH = path.join(os.homedir(), '.ishguard', 'guardian-timeline.json');
const QUARANTINE_DIR = path.join(os.homedir(), '.ishguard', 'guardian-quarantine');
const MAX_TIMELINE_EVENTS = 10000;

const TEMP_PATTERNS = [
  os.tmpdir().toLowerCase(),
  path.join(os.homedir(), 'AppData', 'Local', 'Temp').toLowerCase(),
  path.join(os.homedir(), 'AppData', 'Roaming').toLowerCase(),
  '\\temp\\',
  '\\tmp\\',
];

const ENTROPY_THRESHOLD = 7.5;
const MASS_RENAME_THRESHOLD = 5;
const MASS_ENCRYPTION_THRESHOLD = 3;
const MASS_DELETION_THRESHOLD = 5;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureConfigDir() {
  ensureDir(path.dirname(CONFIG_PATH));
}

function loadConfig() {
  ensureConfigDir();
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch {}
  return { folders: [] };
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function loadTimeline() {
  ensureConfigDir();
  try {
    if (fs.existsSync(TIMELINE_PATH)) {
      return JSON.parse(fs.readFileSync(TIMELINE_PATH, 'utf8'));
    }
  } catch {}
  return { events: [] };
}

function saveTimeline(timeline) {
  ensureConfigDir();
  if (timeline.events.length > MAX_TIMELINE_EVENTS) {
    timeline.events = timeline.events.slice(-MAX_TIMELINE_EVENTS);
  }
  fs.writeFileSync(TIMELINE_PATH, JSON.stringify(timeline, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function addTimelineEvent(folderPath, type, details, threatFiles) {
  const timeline = loadTimeline();
  const event = {
    id: generateId(),
    folderPath,
    type,
    timestamp: new Date().toISOString(),
    details,
    threatFiles: threatFiles || [],
    quarantined: false,
    quarantinedAt: null,
  };
  timeline.events.push(event);
  saveTimeline(timeline);
  return event;
}

function isHiddenFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (process.platform === 'win32' && (stat.attributes & 2) !== 0) {
      return true;
    }
    if (path.basename(filePath).startsWith('.')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function isSuspiciousPath(filePath) {
  const lower = filePath.toLowerCase();
  for (const pattern of TEMP_PATTERNS) {
    if (lower.includes(pattern)) return true;
  }
  return false;
}

export function calculateEntropy(buffer) {
  const freq = new Uint32Array(256);
  for (let i = 0; i < buffer.length; i++) {
    freq[buffer[i]]++;
  }
  const len = buffer.length;
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] === 0) continue;
    const p = freq[i] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function computeFileHash(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    const hash = crypto.createHash('sha256');
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(65536);
    let bytesRead;
    try {
      while ((bytesRead = fs.readSync(fd, buffer, 0, 65536, null)) > 0) {
        hash.update(buffer.subarray(0, bytesRead));
      }
    } finally {
      fs.closeSync(fd);
    }
    return hash.digest('hex');
  } catch {
    return null;
  }
}

function computeQuickEntropy(filePath) {
  try {
    if (!fs.existsSync(filePath)) return 0;
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size === 0) return 0;
    const readSize = Math.min(stat.size, 4096);
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(readSize);
    try {
      fs.readSync(fd, buffer, 0, readSize, 0);
    } finally {
      fs.closeSync(fd);
    }
    return calculateEntropy(buffer);
  } catch {
    return 0;
  }
}

export function takeSnapshot(folderPath) {
  try {
    if (!fs.existsSync(folderPath)) {
      return { error: 'Folder not found', files: [] };
    }
    const stat = fs.statSync(folderPath);
    if (!stat.isDirectory()) {
      return { error: 'Not a directory', files: [] };
    }

    const files = [];

    function walk(dir) {
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.isFile()) {
            const s = fs.statSync(fullPath);
            const fileHash = computeFileHash(fullPath);
            files.push({
              path: fullPath,
              relativePath: path.relative(folderPath, fullPath),
              size: s.size,
              modifiedTime: s.mtime.toISOString(),
              hash: fileHash || '',
              isHidden: isHiddenFile(fullPath),
              entropy: computeQuickEntropy(fullPath),
            });
          }
        } catch {}
      }
    }

    walk(folderPath);
    return { files };
  } catch (err) {
    return { error: err.message, files: [] };
  }
}

export function diffSnapshots(oldSnap, newSnap) {
  const renamed = [];
  const encrypted = [];
  const deleted = [];
  const copied = [];
  const hidden = [];
  const modified = [];

  const oldMap = new Map();
  const oldByHash = new Map();

  for (const f of oldSnap) {
    oldMap.set(f.path, f);
    if (f.hash) {
      if (!oldByHash.has(f.hash)) oldByHash.set(f.hash, []);
      oldByHash.get(f.hash).push(f);
    }
  }

  const newMap = new Map();
  for (const f of newSnap) {
    newMap.set(f.path, f);
  }

  for (const f of oldSnap) {
    if (!newMap.has(f.path)) {
      deleted.push(f);
    }
  }

  for (const f of newSnap) {
    if (oldMap.has(f.path)) {
      const old = oldMap.get(f.path);
      if (old.size !== f.size || old.hash !== f.hash) {
        modified.push({ old, current: f });
        if (f.entropy > ENTROPY_THRESHOLD) {
          encrypted.push(f);
        }
      }
    } else {
      let foundRename = false;
      if (f.hash && oldByHash.has(f.hash)) {
        const candidates = oldByHash.get(f.hash);
        for (const candidate of candidates) {
          if (!newMap.has(candidate.path)) {
            renamed.push({ oldPath: candidate.path, newPath: f.path });
            foundRename = true;
            break;
          }
        }
      }
      if (!foundRename) {
        copied.push(f);
      }
    }

    if (f.isHidden) {
      if (oldMap.has(f.path)) {
        const old = oldMap.get(f.path);
        if (!old.isHidden) {
          hidden.push(f);
        }
      } else {
        hidden.push(f);
      }
    }
  }

  return { renamed, encrypted, deleted, copied, hidden, modified };
}

export function watchFolder(folderPath) {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { error: 'Invalid folder path' };
    }

    const resolvedPath = path.resolve(folderPath);
    if (!fs.existsSync(resolvedPath)) {
      return { error: 'Folder does not exist' };
    }
    if (!fs.statSync(resolvedPath).isDirectory()) {
      return { error: 'Path is not a directory' };
    }

    const config = loadConfig();
    if (config.folders.some(f => path.resolve(f.path) === resolvedPath)) {
      return { error: 'Folder is already being watched' };
    }

    const snapshot = takeSnapshot(resolvedPath);
    if (snapshot.error) {
      return { error: snapshot.error };
    }

    const entry = {
      path: resolvedPath,
      name: path.basename(resolvedPath),
      addedAt: new Date().toISOString(),
      baseline: snapshot.files,
    };

    config.folders.push(entry);
    saveConfig(config);
    addTimelineEvent(resolvedPath, 'watch_added', { message: 'Folder added to watch list' });

    return { success: true, folder: entry };
  } catch (err) {
    return { error: err.message };
  }
}

export function unwatchFolder(folderPath) {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { error: 'Invalid folder path' };
    }

    const resolvedPath = path.resolve(folderPath);
    const config = loadConfig();
    const index = config.folders.findIndex(f => path.resolve(f.path) === resolvedPath);

    if (index === -1) {
      return { error: 'Folder is not being watched' };
    }

    config.folders.splice(index, 1);
    saveConfig(config);

    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export function getWatchedFolders() {
  try {
    const config = loadConfig();
    return config.folders.map(f => ({
      path: f.path,
      name: f.name,
      addedAt: f.addedAt,
      fileCount: f.baseline ? f.baseline.length : 0,
      lastScan: f.lastScan || null,
    }));
  } catch (err) {
    return { error: err.message };
  }
}

export function scanForSuspiciousActivity(folderPath) {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { error: 'Invalid folder path', threat: 'none', confidence: 0, details: [], changes: null };
    }

    const resolvedPath = path.resolve(folderPath);
    const config = loadConfig();
    const folderConfig = config.folders.find(f => path.resolve(f.path) === resolvedPath);

    if (!folderConfig) {
      return { error: 'Folder is not being watched', threat: 'none', confidence: 0, details: [], changes: null };
    }

    const currentSnap = takeSnapshot(resolvedPath);
    if (currentSnap.error) {
      return { error: currentSnap.error, threat: 'none', confidence: 0, details: [], changes: null };
    }

    const changes = diffSnapshots(folderConfig.baseline, currentSnap.files);
    const details = [];
    let threat = 'none';
    let confidence = 0;

    if (changes.renamed.length > MASS_RENAME_THRESHOLD) {
      const count = changes.renamed.length;
      details.push({
        type: 'mass_rename',
        severity: 'high',
        count,
        message: `Mass file renaming detected: ${count} files renamed`,
        files: changes.renamed.map(r => r.newPath),
      });
      confidence = Math.max(confidence, Math.min(85, count * 10));
      threat = 'suspicious_rename';
    }

    if (changes.encrypted.length > MASS_ENCRYPTION_THRESHOLD) {
      const count = changes.encrypted.length;
      details.push({
        type: 'mass_encryption',
        severity: 'critical',
        count,
        message: `Possible ransomware encryption detected: ${count} files with high entropy (>7.5)`,
        files: changes.encrypted.map(f => f.path),
        entropies: changes.encrypted.map(f => f.entropy),
      });
      confidence = Math.max(confidence, Math.min(95, 70 + count * 8));
      threat = 'ransomware_encryption';
    }

    if (changes.deleted.length > MASS_DELETION_THRESHOLD) {
      const count = changes.deleted.length;
      details.push({
        type: 'mass_deletion',
        severity: 'high',
        count,
        message: `Mass file deletion detected: ${count} files removed`,
        files: changes.deleted.map(f => f.path),
      });
      confidence = Math.max(confidence, Math.min(80, count * 8));
      if (threat === 'none') threat = 'mass_deletion';
    }

    const suspiciousCopies = changes.copied.filter(f => isSuspiciousPath(f.path));
    if (suspiciousCopies.length > 0) {
      details.push({
        type: 'suspicious_copy',
        severity: 'high',
        count: suspiciousCopies.length,
        message: `Suspicious file copying detected: ${suspiciousCopies.length} files created in temp/unknown locations`,
        files: suspiciousCopies.map(f => f.path),
      });
      confidence = Math.max(confidence, Math.min(75, 50 + suspiciousCopies.length * 10));
      if (threat === 'none') threat = 'suspicious_copy';
    }

    const suspiciousHidden = changes.hidden.filter(f => {
      const lower = f.path.toLowerCase();
      return lower.includes('appdata') || lower.includes('\\temp\\') || lower.includes('\\tmp\\') ||
             lower.includes('\\startup\\') || lower.includes('\\programdata\\');
    });

    if (suspiciousHidden.length > 0) {
      details.push({
        type: 'hidden_malware',
        severity: 'critical',
        count: suspiciousHidden.length,
        message: `Hidden files detected in sensitive system locations: ${suspiciousHidden.length} files`,
        files: suspiciousHidden.map(f => f.path),
      });
      confidence = Math.max(confidence, Math.min(90, 60 + suspiciousHidden.length * 15));
      threat = 'hidden_malware';
    }

    const highEntropyModified = changes.modified.filter(m => m.current.entropy > ENTROPY_THRESHOLD);
    if (highEntropyModified.length > MASS_ENCRYPTION_THRESHOLD && changes.encrypted.length <= MASS_ENCRYPTION_THRESHOLD) {
      details.push({
        type: 'modified_encryption',
        severity: 'critical',
        count: highEntropyModified.length,
        message: `Files modified with high entropy pattern: ${highEntropyModified.length} files may be encrypted`,
        files: highEntropyModified.map(m => m.current.path),
      });
      confidence = Math.max(confidence, Math.min(90, 60 + highEntropyModified.length * 8));
      if (threat === 'none') threat = 'possible_encryption';
    }

    if (confidence >= 70) {
      threat = threat === 'none' ? 'suspicious_activity' : threat;
    } else if (confidence >= 30) {
      threat = 'low_risk';
    }

    return {
      threat,
      confidence,
      details,
      changes: {
        renamed: changes.renamed.length,
        encrypted: changes.encrypted.length,
        deleted: changes.deleted.length,
        copied: changes.copied.length,
        hidden: changes.hidden.length,
        modified: changes.modified.length,
      },
    };
  } catch (err) {
    return { error: err.message, threat: 'none', confidence: 0, details: [], changes: null };
  }
}

export function getActivityTimeline(folderPath, limit) {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { error: 'Invalid folder path', events: [] };
    }

    const resolvedPath = path.resolve(folderPath);
    const timeline = loadTimeline();
    const maxLimit = typeof limit === 'number' && limit > 0 ? limit : 50;

    return timeline.events
      .filter(e => path.resolve(e.folderPath) === resolvedPath)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, maxLimit);
  } catch (err) {
    return { error: err.message, events: [] };
  }
}

export function getAllActivityTimeline(limit) {
  try {
    const timeline = loadTimeline();
    const maxLimit = typeof limit === 'number' && limit > 0 ? limit : 50;

    return timeline.events
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, maxLimit);
  } catch (err) {
    return { error: err.message, events: [] };
  }
}

export function quarantineThreat(folderPath, threatId) {
  const result = { quarantined: [], failed: [] };

  try {
    const timeline = loadTimeline();
    const eventIndex = timeline.events.findIndex(e => e.id === threatId);

    if (eventIndex === -1) {
      return { error: 'Threat event not found', ...result };
    }

    const event = timeline.events[eventIndex];
    if (event.quarantined) {
      return { error: 'Threat already quarantined', ...result };
    }

    ensureDir(QUARANTINE_DIR);
    const threatFiles = event.threatFiles || [];

    for (const filePath of threatFiles) {
      try {
        if (!fs.existsSync(filePath)) {
          result.failed.push({ file: filePath, error: 'File not found' });
          continue;
        }

        const fileName = path.basename(filePath);
        const safeName = `guardian_${event.id}_${fileName}`;
        let destPath = path.join(QUARANTINE_DIR, safeName);

        let counter = 0;
        while (fs.existsSync(destPath)) {
          counter++;
          destPath = path.join(QUARANTINE_DIR, `guardian_${event.id}_${counter}_${fileName}`);
        }

        fs.copyFileSync(filePath, destPath);
        fs.unlinkSync(filePath);
        result.quarantined.push({ file: filePath, quarantinedPath: destPath });
      } catch (err) {
        result.failed.push({ file: filePath, error: err.message });
      }
    }

    event.quarantined = true;
    event.quarantinedAt = new Date().toISOString();
    event.quarantineResult = { ...result };
    saveTimeline(timeline);

    return result;
  } catch (err) {
    return { error: err.message, ...result };
  }
}

export function restoreFromQuarantine(folderPath, threatId) {
  try {
    const timeline = loadTimeline();
    const eventIndex = timeline.events.findIndex(e => e.id === threatId);

    if (eventIndex === -1) {
      return { error: 'Threat event not found' };
    }

    const event = timeline.events[eventIndex];
    if (!event.quarantined) {
      return { error: 'Threat has not been quarantined' };
    }

    const restored = [];
    const failed = [];
    const quarantineResult = event.quarantineResult || { quarantined: [] };

    for (const qItem of quarantineResult.quarantined || []) {
      try {
        if (!fs.existsSync(qItem.quarantinedPath)) {
          failed.push({ file: qItem.file, error: 'Quarantined file not found' });
          continue;
        }

        const destDir = path.dirname(qItem.file);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        fs.copyFileSync(qItem.quarantinedPath, qItem.file);
        fs.unlinkSync(qItem.quarantinedPath);
        restored.push({ file: qItem.file });
      } catch (err) {
        failed.push({ file: qItem.file, error: err.message });
      }
    }

    event.quarantined = false;
    event.restoredAt = new Date().toISOString();
    saveTimeline(timeline);

    return { restored, failed };
  } catch (err) {
    return { error: err.message };
  }
}

export function getGuardianStats() {
  try {
    const config = loadConfig();
    const timeline = loadTimeline();
    const events = timeline.events;

    const threatsDetected = events.filter(e =>
      e.type !== 'watch_added' && e.type !== 'scan_completed'
    ).length;

    const threatsQuarantined = events.filter(e => e.quarantined).length;

    let securityScore = 100;
    if (threatsDetected > 0) {
      securityScore -= Math.min(40, threatsDetected * 8);
    }
    if (threatsQuarantined > 0) {
      securityScore += Math.min(20, threatsQuarantined * 5);
    }
    securityScore = Math.max(0, Math.min(100, securityScore));

    const scanEvents = events.filter(e => e.type === 'scan_completed');
    const lastScan = scanEvents.length > 0
      ? scanEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp
      : null;

    return {
      watchedFolders: config.folders.length,
      totalEvents: events.length,
      threatsDetected,
      threatsQuarantined,
      lastScan,
      securityScore,
    };
  } catch (err) {
    return { error: err.message };
  }
}

export function runGuardianScan(folderPath) {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { error: 'Invalid folder path' };
    }

    const resolvedPath = path.resolve(folderPath);
    const config = loadConfig();
    const folderIndex = config.folders.findIndex(f => path.resolve(f.path) === resolvedPath);

    if (folderIndex === -1) {
      return { error: 'Folder is not being watched' };
    }

    const currentSnap = takeSnapshot(resolvedPath);
    if (currentSnap.error) {
      return { error: currentSnap.error };
    }

    const threatInfo = scanForSuspiciousActivity(resolvedPath);
    if (threatInfo.error) {
      return { error: threatInfo.error };
    }

    const threatFiles = [];
    for (const detail of threatInfo.details) {
      if (detail.files) {
        threatFiles.push(...detail.files);
      }
    }

    const eventType = threatInfo.threat !== 'none' && threatInfo.threat !== 'low_risk'
      ? 'threat_detected'
      : 'scan_completed';

    if (threatInfo.threat !== 'none' && threatInfo.threat !== 'low_risk') {
      addTimelineEvent(resolvedPath, eventType, {
        threat: threatInfo.threat,
        confidence: threatInfo.confidence,
        findings: threatInfo.details,
      }, threatFiles);
    } else {
      addTimelineEvent(resolvedPath, 'scan_completed', {
        status: 'clean',
        message: 'No suspicious activity detected',
      });
    }

    config.folders[folderIndex].baseline = currentSnap.files;
    config.folders[folderIndex].lastScan = new Date().toISOString();
    saveConfig(config);

    return {
      folderPath: resolvedPath,
      timestamp: new Date().toISOString(),
      threat: threatInfo.threat,
      confidence: threatInfo.confidence,
      details: threatInfo.details,
      changes: threatInfo.changes,
      status: threatInfo.threat === 'none' || threatInfo.threat === 'low_risk' ? 'clean' : 'threat',
    };
  } catch (err) {
    return { error: err.message };
  }
}

export function runAllGuardianScans() {
  try {
    const config = loadConfig();
    const results = [];

    for (const folder of config.folders) {
      const result = runGuardianScan(folder.path);
      results.push(result);
    }

    return {
      scanned: config.folders.length,
      results,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return { error: err.message };
  }
}

export function clearTimeline(olderThan) {
  try {
    if (!olderThan) {
      return { error: 'Invalid date' };
    }

    const cutoffDate = new Date(olderThan).getTime();
    if (isNaN(cutoffDate)) {
      return { error: 'Invalid date format' };
    }

    const timeline = loadTimeline();
    const beforeCount = timeline.events.length;
    timeline.events = timeline.events.filter(e => new Date(e.timestamp).getTime() > cutoffDate);
    const clearedCount = beforeCount - timeline.events.length;
    saveTimeline(timeline);

    return { success: true, clearedCount };
  } catch (err) {
    return { error: err.message };
  }
}
