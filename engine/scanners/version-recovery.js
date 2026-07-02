import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const STORAGE_DIR = path.join(os.homedir(), '.ishguard', 'versions');
const CONFIG_PATH = path.join(os.homedir(), '.ishguard', 'version-recovery.json');
const TEMP_DIR = path.join(os.homedir(), '.ishguard', 'versions', '.tmp');

function getStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  return STORAGE_DIR;
}

function loadDb() {
  getStorageDir();
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        if (!Array.isArray(data.snapshots)) data.snapshots = [];
        if (!Array.isArray(data.scheduledFolders)) data.scheduledFolders = [];
        return data;
      }
    }
  } catch {}
  return { snapshots: [], scheduledFolders: [] };
}

function saveDb(db) {
  getStorageDir();
  const tmp = CONFIG_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, CONFIG_PATH);
}

function generateId() {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(6).toString('hex');
  return `${ts}_${rand}`;
}

function copyRecursive(src, dest) {
  const s = fs.statSync(src);
  if (s.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function removeRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      removeRecursive(full);
    } else {
      fs.unlinkSync(full);
    }
  }
  fs.rmdirSync(dir);
}

async function computeHash(filePath) {
  return new Promise(resolve => {
    if (!fs.existsSync(filePath)) return resolve(null);
    try {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', d => hash.update(d));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', () => resolve(null));
    } catch { resolve(null); }
  });
}

function isTextFile(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(512);
    const bytes = fs.readSync(fd, buf, 0, 512, 0);
    fs.closeSync(fd);
    return !buf.subarray(0, bytes).includes(0);
  } catch { return false; }
}

function computeEntropy(data) {
  if (!data || data.length === 0) return 0;
  const freq = {};
  for (let i = 0; i < data.length; i++) {
    const b = data[i];
    freq[b] = (freq[b] || 0) + 1;
  }
  let entropy = 0;
  const len = data.length;
  for (const k in freq) {
    const p = freq[k] / len;
    if (p > 0) entropy -= p * (Math.log2(p));
  }
  return entropy;
}

function computeFileEntropy(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const readSize = Math.min(stats.size, 1024 * 1024);
    const buf = Buffer.alloc(readSize);
    const fd = fs.openSync(filePath, 'r');
    const bytes = fs.readSync(fd, buf, 0, readSize, 0);
    fs.closeSync(fd);
    return computeEntropy(buf.subarray(0, bytes));
  } catch { return 0; }
}

function computeLineDiff(text1, text2) {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const m = lines1.length;
  const n = lines2.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = dp[i - 1][j] > dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];
      }
    }
  }
  const changes = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      changes.unshift({ type: 'equal', value: lines1[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changes.unshift({ type: 'add', value: lines2[j - 1] });
      j--;
    } else {
      changes.unshift({ type: 'remove', value: lines1[i - 1] });
      i--;
    }
  }
  return changes;
}

function makeUnifiedDiff(changes) {
  const lines = [];
  let context = [];
  let removed = 0;
  let added = 0;

  function flushHunk() {
    if (context.length === 0) return;
    const start = Math.max(0, context.length - 3 - removed - added);
    const hunkLines = [];
    for (const c of context) {
      hunkLines.push(c);
    }
    lines.push(...hunkLines);
    context = [];
    removed = 0;
    added = 0;
  }

  for (const c of changes) {
    if (c.type === 'equal') {
      context.push(' ' + c.value);
      if (context.length > 6) context.shift();
    } else if (c.type === 'remove') {
      flushHunk();
      lines.push('-' + c.value);
      removed++;
    } else if (c.type === 'add') {
      flushHunk();
      lines.push('+' + c.value);
      added++;
    }
  }
  flushHunk();
  return lines;
}

function findSnapshotDir(snapshotId) {
  const dir = path.join(STORAGE_DIR, snapshotId);
  return fs.existsSync(dir) ? dir : null;
}

function getSnapshotMeta(snapshotId) {
  const dir = findSnapshotDir(snapshotId);
  if (!dir) return null;
  const metaPath = path.join(dir, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch { return null; }
}

export async function createSnapshot(sourcePath, label) {
  try {
    if (!sourcePath || typeof sourcePath !== 'string') {
      return { error: 'Invalid source path' };
    }
    if (!fs.existsSync(sourcePath)) {
      return { error: 'Source path does not exist' };
    }

    const stats = fs.statSync(sourcePath);
    const id = generateId();
    const snapDir = path.join(getStorageDir(), id);
    fs.mkdirSync(snapDir, { recursive: true });

    const isDir = stats.isDirectory();
    const contentPath = path.join(snapDir, 'content');

    if (isDir) {
      fs.mkdirSync(contentPath, { recursive: true });
      copyRecursive(sourcePath, contentPath);
    } else {
      fs.copyFileSync(sourcePath, contentPath);
    }

    const hash = await computeHash(contentPath);
    const meta = {
      id,
      originalPath: path.resolve(sourcePath),
      storedPath: contentPath,
      timestamp: new Date().toISOString(),
      size: isDir ? dirSize(contentPath) : stats.size,
      hash,
      label: label || '',
      type: isDir ? 'directory' : 'file',
      parentId: null
    };

    fs.writeFileSync(path.join(snapDir, 'meta.json'), JSON.stringify(meta, null, 2));

    const db = loadDb();
    db.snapshots.push(meta);
    saveDb(db);

    return { id, path: contentPath, timestamp: meta.timestamp, size: meta.size, label: meta.label };
  } catch (err) {
    return { error: err.message };
  }
}

function dirSize(dirPath) {
  let total = 0;
  try {
    for (const entry of fs.readdirSync(dirPath)) {
      const full = path.join(dirPath, entry);
      const s = fs.statSync(full);
      if (s.isDirectory()) {
        total += dirSize(full);
      } else {
        total += s.size;
      }
    }
  } catch {}
  return total;
}

export async function createManualSnapshot(sourcePath) {
  const label = `Manual: ${new Date().toLocaleString()}`;
  return createSnapshot(sourcePath, label);
}

export async function getVersionHistory(filePath) {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { error: 'Invalid file path' };
    }
    const resolved = path.resolve(filePath);
    const db = loadDb();
    const snapshots = db.snapshots
      .filter(s => path.resolve(s.originalPath) === resolved)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return snapshots;
  } catch (err) {
    return { error: err.message };
  }
}

export async function restoreVersion(snapshotId, destinationPath) {
  try {
    if (!snapshotId || typeof snapshotId !== 'string') {
      return { error: 'Invalid snapshot ID' };
    }

    const meta = getSnapshotMeta(snapshotId);
    if (!meta) return { error: 'Snapshot not found' };

    const snapDir = findSnapshotDir(snapshotId);
    const contentPath = path.join(snapDir, 'content');

    if (!fs.existsSync(contentPath)) {
      return { error: 'Snapshot content missing' };
    }

    const dest = destinationPath || meta.originalPath;

    if (meta.type === 'directory') {
      if (fs.existsSync(dest)) {
        removeRecursive(dest);
      }
      fs.mkdirSync(dest, { recursive: true });
      copyRecursive(contentPath, dest);
    } else {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(contentPath, dest);
    }

    return { success: true, restoredTo: dest, snapshotId };
  } catch (err) {
    return { error: err.message };
  }
}

export async function compareVersions(snapshotId1, snapshotId2) {
  try {
    if (!snapshotId1 || !snapshotId2) {
      return { error: 'Two snapshot IDs are required' };
    }

    const meta1 = getSnapshotMeta(snapshotId1);
    const meta2 = getSnapshotMeta(snapshotId2);

    if (!meta1) return { error: `Snapshot ${snapshotId1} not found` };
    if (!meta2) return { error: `Snapshot ${snapshotId2} not found` };

    const dir1 = findSnapshotDir(snapshotId1);
    const dir2 = findSnapshotDir(snapshotId2);
    const content1 = path.join(dir1, 'content');
    const content2 = path.join(dir2, 'content');

    if (!fs.existsSync(content1) || !fs.existsSync(content2)) {
      return { error: 'Snapshot content missing' };
    }

    const size1 = meta1.size;
    const size2 = meta2.size;

    if (meta1.type === 'directory' || meta2.type === 'directory') {
      const entries1 = listDirEntries(content1);
      const entries2 = listDirEntries(content2);
      const added = entries2.filter(e => !entries1.includes(e));
      const removed = entries1.filter(e => !entries2.includes(e));
      const common = entries1.filter(e => entries2.includes(e));
      const modified = [];
      for (const name of common) {
        const h1 = await computeHash(path.join(content1, name));
        const h2 = await computeHash(path.join(content2, name));
        if (h1 !== h2) modified.push(name);
      }
      return {
        same: added.length === 0 && removed.length === 0 && modified.length === 0,
        size1, size2, date1: meta1.timestamp, date2: meta2.timestamp,
        type: 'directory',
        added, removed, modified
      };
    }

    if (isTextFile(content1) && isTextFile(content2)) {
      const text1 = fs.readFileSync(content1, 'utf8');
      const text2 = fs.readFileSync(content2, 'utf8');

      if (text1 === text2) {
        return { same: true, size1, size2, date1: meta1.timestamp, date2: meta2.timestamp, type: 'text', diff: [] };
      }

      const diff = computeLineDiff(text1, text2);
      const diffLines = makeUnifiedDiff(diff);

      return {
        same: false, size1, size2, date1: meta1.timestamp, date2: meta2.timestamp,
        type: 'text', diff: diffLines, changes: diff.filter(c => c.type !== 'equal').length
      };
    }

    const same = meta1.hash === meta2.hash;
    return {
      same, size1, size2, date1: meta1.timestamp, date2: meta2.timestamp,
      type: 'binary', hash1: meta1.hash, hash2: meta2.hash
    };
  } catch (err) {
    return { error: err.message };
  }
}

function listDirEntries(dirPath) {
  const entries = [];
  function walk(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const rel = prefix ? prefix + '/' + entry : entry;
      entries.push(rel);
      if (fs.statSync(full).isDirectory()) {
        walk(full, rel);
      }
    }
  }
  walk(dirPath, '');
  return entries;
}

export async function deleteSnapshot(snapshotId) {
  try {
    if (!snapshotId || typeof snapshotId !== 'string') {
      return { error: 'Invalid snapshot ID' };
    }

    const snapDir = findSnapshotDir(snapshotId);
    if (!snapDir) return { error: 'Snapshot not found' };

    removeRecursive(snapDir);

    const db = loadDb();
    db.snapshots = db.snapshots.filter(s => s.id !== snapshotId);
    saveDb(db);

    return { success: true, snapshotId };
  } catch (err) {
    return { error: err.message };
  }
}

export async function restoreDeletedFile(filePath) {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { error: 'Invalid file path' };
    }

    const resolved = path.resolve(filePath);
    const exists = fs.existsSync(resolved);

    const db = loadDb();
    const snapshots = db.snapshots
      .filter(s => path.resolve(s.originalPath) === resolved && s.type === 'file')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (snapshots.length === 0) {
      return { error: 'No snapshots found for this file' };
    }

    const latest = snapshots[0];
    const destDir = path.dirname(resolved);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const snapDir = findSnapshotDir(latest.id);
    const contentPath = path.join(snapDir, 'content');

    if (!fs.existsSync(contentPath)) {
      return { error: 'Snapshot content is missing' };
    }

    fs.copyFileSync(contentPath, resolved);

    return {
      success: true,
      restoredFile: resolved,
      snapshotId: latest.id,
      timestamp: latest.timestamp,
      label: latest.label
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function restoreEncryptedFile(filePath) {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { error: 'Invalid file path' };
    }

    if (!fs.existsSync(filePath)) {
      return { error: 'File not found' };
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      return { error: 'Path is a directory, not a file' };
    }

    const entropy = computeFileEntropy(filePath);
    const isEncrypted = entropy > 7.0;

    const resolved = path.resolve(filePath);
    const db = loadDb();
    const snapshots = db.snapshots
      .filter(s => path.resolve(s.originalPath) === resolved && s.type === 'file')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (snapshots.length === 0) {
      return {
        error: 'No version history available for this file',
        file: filePath,
        entropy: Math.round(entropy * 100) / 100,
        likelyEncrypted: isEncrypted
      };
    }

    const snapshotToRestore = snapshots[0];
    const snapDir = findSnapshotDir(snapshotToRestore.id);
    const contentPath = path.join(snapDir, 'content');

    if (!fs.existsSync(contentPath)) {
      return { error: 'Snapshot content is missing' };
    }

    const currentHash = await computeHash(filePath);
    const snapshotHash = snapshotToRestore.hash;

    if (currentHash === snapshotHash) {
      return {
        success: true,
        message: 'File matches the latest snapshot — no encryption detected',
        file: filePath,
        entropy: Math.round(entropy * 100) / 100,
        restored: false
      };
    }

    const destDir = path.dirname(resolved);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const backupPath = filePath + '.encrypted.bak';
    fs.copyFileSync(filePath, backupPath);
    fs.copyFileSync(contentPath, filePath);

    return {
      success: true,
      file: filePath,
      entropy: Math.round(entropy * 100) / 100,
      likelyEncrypted: isEncrypted,
      restored: true,
      snapshotId: snapshotToRestore.id,
      snapshotTimestamp: snapshotToRestore.timestamp,
      backupOfEncrypted: backupPath
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function performRansomwareRollback(directoryPath) {
  try {
    if (!directoryPath || typeof directoryPath !== 'string') {
      return { error: 'Invalid directory path' };
    }

    if (!fs.existsSync(directoryPath)) {
      return { error: 'Directory not found' };
    }

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const results = { scanned: 0, checked: 0, restored: [], failed: [], errors: [] };

    const db = loadDb();

      async function scanDir(dir) {
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        results.errors.push({ path: dir, error: 'Cannot read directory' });
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.')) {
              scanDir(fullPath);
            }
          } else if (entry.isFile()) {
            results.scanned++;
            const s = fs.statSync(fullPath);

            if (s.mtimeMs < twentyFourHoursAgo) continue;

            results.checked++;

            const resolved = path.resolve(fullPath);
            const snapshots = db.snapshots
              .filter(snap => path.resolve(snap.originalPath) === resolved && snap.type === 'file')
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (snapshots.length === 0) continue;

            const currentHash = await computeHash(fullPath);
            if (currentHash === snapshots[0].hash) continue;

            const entropy = computeFileEntropy(fullPath);
            if (entropy <= 7.0) continue;

            const snapDir = findSnapshotDir(snapshots[0].id);
            const contentPath = path.join(snapDir, 'content');
            if (!fs.existsSync(contentPath)) {
              results.errors.push({ path: fullPath, error: 'Snapshot content missing' });
              continue;
            }

            try {
              const backupPath = fullPath + '.ransomware.bak';
              fs.copyFileSync(fullPath, backupPath);
              fs.copyFileSync(contentPath, fullPath);
              results.restored.push({
                file: fullPath,
                entropy: Math.round(entropy * 100) / 100,
                snapshotId: snapshots[0].id,
                backupPath
              });
            } catch (e) {
              results.failed.push({ file: fullPath, error: e.message });
            }
          }
        } catch (e) {
          results.errors.push({ path: fullPath, error: e.message });
        }
      }
    }

    scanDir(directoryPath);

    return results;
  } catch (err) {
    return { error: err.message };
  }
}

export function scheduleSnapshot(folderPath, interval) {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { error: 'Invalid folder path' };
    }
    if (!fs.existsSync(folderPath)) {
      return { error: 'Folder does not exist' };
    }
    if (!interval || typeof interval !== 'number' || interval < 1) {
      return { error: 'Interval must be a positive number (minutes)' };
    }

    const resolved = path.resolve(folderPath);
    const db = loadDb();

    const existing = db.scheduledFolders.find(f => path.resolve(f.folderPath) === resolved);
    if (existing) {
      existing.interval = interval;
      existing.updatedAt = new Date().toISOString();
      saveDb(db);
      return { success: true, message: 'Schedule updated', folderPath: resolved, interval };
    }

    db.scheduledFolders.push({
      folderPath: resolved,
      interval,
      lastSnapshot: null,
      createdAt: new Date().toISOString()
    });
    saveDb(db);

    return { success: true, folderPath: resolved, interval };
  } catch (err) {
    return { error: err.message };
  }
}

export async function runScheduledSnapshots() {
  try {
    const db = loadDb();
    const results = { created: [], skipped: [], errors: [] };

    const now = Date.now();

    for (const scheduled of db.scheduledFolders) {
      try {
        if (!fs.existsSync(scheduled.folderPath)) {
          results.skipped.push({ folder: scheduled.folderPath, reason: 'No longer exists' });
          continue;
        }

        if (scheduled.lastSnapshot) {
          const elapsed = now - new Date(scheduled.lastSnapshot).getTime();
          const intervalMs = scheduled.interval * 60 * 1000;
          if (elapsed < intervalMs) {
            results.skipped.push({ folder: scheduled.folderPath, reason: 'Interval not yet elapsed' });
            continue;
          }
        }

        const label = `Scheduled: ${new Date().toLocaleString()}`;
        const result = await createSnapshot(scheduled.folderPath, label);
        if (result.error) {
          results.errors.push({ folder: scheduled.folderPath, error: result.error });
        } else {
          scheduled.lastSnapshot = result.timestamp;
          results.created.push({ folder: scheduled.folderPath, snapshotId: result.id, label });
        }
      } catch (e) {
        results.errors.push({ folder: scheduled.folderPath, error: e.message });
      }
    }

    saveDb(db);
    return results;
  } catch (err) {
    return { error: err.message };
  }
}

export function getRecoveryStats() {
  try {
    const db = loadDb();
    const snapshots = db.snapshots;

    const totalSnapshots = snapshots.length;
    const totalSize = snapshots.reduce((sum, s) => sum + (s.size || 0), 0);

    const sorted = [...snapshots].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const lastSnapshot = sorted.length > 0 ? sorted[0].timestamp : null;

    const uniqueFiles = new Set(snapshots.map(s => path.resolve(s.originalPath)));

    return {
      totalSnapshots,
      totalSize,
      storagePath: STORAGE_DIR,
      lastSnapshot,
      scheduledFolders: db.scheduledFolders.length,
      protectedFiles: uniqueFiles.size
    };
  } catch (err) {
    return { error: err.message };
  }
}

export function backupRecoveryDb(destination) {
  try {
    if (!destination || typeof destination !== 'string') {
      return { error: 'Invalid destination path' };
    }

    const db = loadDb();

    if (!fs.existsSync(destination)) {
      const destDir = path.dirname(destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
    }

    const backupData = {
      exportedAt: new Date().toISOString(),
      config: db,
      snapshotsDetail: db.snapshots.map(s => ({
        id: s.id,
        originalPath: s.originalPath,
        timestamp: s.timestamp,
        size: s.size,
        label: s.label,
        type: s.type
      }))
    };

    fs.writeFileSync(destination, JSON.stringify(backupData, null, 2));

    return {
      success: true,
      destination,
      snapshotCount: db.snapshots.length,
      scheduledCount: db.scheduledFolders.length
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function createIncrementalBackup(sourcePath, baseSnapshotId) {
  try {
    if (!sourcePath || !baseSnapshotId) {
      return { error: 'Source path and base snapshot ID are required' };
    }
    if (!fs.existsSync(sourcePath)) {
      return { error: 'Source path does not exist' };
    }

    const baseMeta = getSnapshotMeta(baseSnapshotId);
    if (!baseMeta) return { error: 'Base snapshot not found' };

    const baseDir = findSnapshotDir(baseSnapshotId);
    const baseContent = path.join(baseDir, 'content');

    if (!fs.existsSync(baseContent)) {
      return { error: 'Base snapshot content is missing' };
    }

    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      const baseEntries = listDirEntries(baseContent);
      const currentEntries = listDirEntries(sourcePath);

      const added = currentEntries.filter(e => !baseEntries.includes(e));
      const removed = baseEntries.filter(e => !currentEntries.includes(e));
      const common = baseEntries.filter(e => currentEntries.includes(e));
      const modified = [];

      for (const name of common) {
        const baseFile = path.join(baseContent, name);
        const currentFile = path.join(sourcePath, name);
        if (fs.existsSync(baseFile) && fs.existsSync(currentFile)) {
          const h1 = await computeHash(baseFile);
          const h2 = await computeHash(currentFile);
          if (h1 !== h2) modified.push(name);
        }
      }

      const id = generateId();
      const snapDir = path.join(getStorageDir(), id);
      fs.mkdirSync(snapDir, { recursive: true });

      const patch = { added, removed, modified, baseSnapshotId, type: 'directory-incremental' };
      fs.writeFileSync(path.join(snapDir, `diff_${baseSnapshotId}`), JSON.stringify(patch, null, 2));

      const meta = {
        id,
        originalPath: path.resolve(sourcePath),
        storedPath: snapDir,
        timestamp: new Date().toISOString(),
        size: stats.isDirectory() ? dirSize(sourcePath) : stats.size,
        hash: null,
        label: `Incremental from ${baseSnapshotId}`,
        type: 'incremental',
        parentId: baseSnapshotId
      };
      fs.writeFileSync(path.join(snapDir, 'meta.json'), JSON.stringify(meta, null, 2));

      const db = loadDb();
      db.snapshots.push(meta);
      saveDb(db);

      return {
        id, type: 'directory-incremental',
        added: added.length, removed: removed.length, modified: modified.length,
        baseSnapshotId
      };
    }

    const isText = isTextFile(sourcePath) && isTextFile(baseContent);
    if (isText) {
      const currentText = fs.readFileSync(sourcePath, 'utf8');
      const baseText = fs.readFileSync(baseContent, 'utf8');

      if (currentText === baseText) {
        return { error: 'No changes from base snapshot' };
      }

      const diff = computeLineDiff(baseText, currentText);
      const diffLines = makeUnifiedDiff(diff);

      const id = generateId();
      const snapDir = path.join(getStorageDir(), id);
      fs.mkdirSync(snapDir, { recursive: true });

      fs.writeFileSync(path.join(snapDir, `diff_${baseSnapshotId}`), diffLines.join('\n'), 'utf8');

      const meta = {
        id,
        originalPath: path.resolve(sourcePath),
        storedPath: snapDir,
        timestamp: new Date().toISOString(),
        size: stats.size,
        hash: await computeHash(sourcePath),
        label: `Incremental from ${baseSnapshotId}`,
        type: 'incremental',
        parentId: baseSnapshotId
      };
      fs.writeFileSync(path.join(snapDir, 'meta.json'), JSON.stringify(meta, null, 2));

      const db = loadDb();
      db.snapshots.push(meta);
      saveDb(db);

      return { id, type: 'text-incremental', changes: diffLines.length, baseSnapshotId };
    }

    const id = generateId();
    const snapDir = path.join(getStorageDir(), id);
    fs.mkdirSync(snapDir, { recursive: true });

    const currentHash = await computeHash(sourcePath);
    if (currentHash === baseMeta.hash) {
      removeRecursive(snapDir);
      return { error: 'No changes from base snapshot' };
    }

    fs.copyFileSync(sourcePath, path.join(snapDir, 'content'));

    const meta = {
      id,
      originalPath: path.resolve(sourcePath),
      storedPath: snapDir,
      timestamp: new Date().toISOString(),
      size: stats.size,
      hash: currentHash,
      label: `Full copy (binary differs from ${baseSnapshotId})`,
      type: 'file',
      parentId: baseSnapshotId
    };
    fs.writeFileSync(path.join(snapDir, 'meta.json'), JSON.stringify(meta, null, 2));

    const db = loadDb();
    db.snapshots.push(meta);
    saveDb(db);

    return { id, type: 'binary-copy', baseSnapshotId };
  } catch (err) {
    return { error: err.message };
  }
}

export async function createFullBackup(sourcePath) {
  try {
    if (!sourcePath || typeof sourcePath !== 'string') {
      return { error: 'Invalid source path' };
    }
    return createSnapshot(sourcePath, `Full backup: ${new Date().toLocaleString()}`);
  } catch (err) {
    return { error: err.message };
  }
}

export async function verifyBackupIntegrity(snapshotId) {
  try {
    if (!snapshotId || typeof snapshotId !== 'string') {
      return { error: 'Invalid snapshot ID' };
    }

    const meta = getSnapshotMeta(snapshotId);
    if (!meta) return { error: 'Snapshot not found' };

    const snapDir = findSnapshotDir(snapshotId);
    const contentPath = path.join(snapDir, 'content');
    const metaPath = path.join(snapDir, 'meta.json');

    const results = {
      snapshotId,
      exists: fs.existsSync(snapDir),
      metaExists: fs.existsSync(metaPath),
      contentExists: false,
      hashMatch: false,
      metaValid: false,
      sizeMatch: false
    };

    if (!results.exists) return { ...results, error: 'Snapshot directory missing' };
    if (!results.metaExists) return { ...results, error: 'meta.json missing' };

    try {
      const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      results.metaValid = parsed.id === snapshotId && parsed.originalPath && parsed.timestamp;
    } catch { return { ...results, error: 'meta.json is corrupted' }; }

    if (meta.type === 'incremental') {
      const diffPath = path.join(snapDir, `diff_${meta.parentId}`);
      results.contentExists = fs.existsSync(diffPath);
      return { ...results, type: 'incremental', note: 'Incremental backup — integrity depends on parent snapshot' };
    }

    if (meta.type === 'directory') {
      results.contentExists = fs.existsSync(contentPath) && fs.statSync(contentPath).isDirectory();
      if (results.contentExists) {
        const computedSize = dirSize(contentPath);
        results.sizeMatch = Math.abs(computedSize - meta.size) < 1024;
      }
      return { ...results, type: 'directory' };
    }

    results.contentExists = fs.existsSync(contentPath) && fs.statSync(contentPath).isFile();
    if (!results.contentExists) return { ...results, error: 'content file missing' };

    const actualSize = fs.statSync(contentPath).size;
    results.sizeMatch = actualSize === meta.size;

    if (results.contentExists && meta.hash) {
      const actualHash = await computeHash(contentPath);
      results.hashMatch = actualHash === meta.hash;
    }

    const valid = results.metaExists && results.contentExists && results.metaValid &&
      (meta.type === 'incremental' || (results.hashMatch && results.sizeMatch));

    return { ...results, valid };
  } catch (err) {
    return { error: err.message };
  }
}

export async function runVersionRecoveryScan() {
  try {
    const db = loadDb();
    const results = {
      tracked: db.snapshots.length,
      scanned: 0,
      unchanged: 0,
      updated: 0,
      errors: [],
      status: 'complete'
    };

    const fileMap = new Map();
    for (const snap of db.snapshots) {
      const resolved = path.resolve(snap.originalPath);
      if (!fileMap.has(resolved) || new Date(snap.timestamp) > new Date(fileMap.get(resolved).timestamp)) {
        fileMap.set(resolved, snap);
      }
    }

    for (const [resolved, latestSnap] of fileMap) {
      try {
        if (!fs.existsSync(resolved)) {
          continue;
        }

        const stats = fs.statSync(resolved);
        const latestTime = new Date(latestSnap.timestamp).getTime();
        if (stats.mtimeMs <= latestTime) {
          results.unchanged++;
          continue;
        }

        results.scanned++;

        const snap = db.snapshots.filter(s => path.resolve(s.originalPath) === resolved && s.type === 'file');
        if (snap.length === 0) continue;

        const currentHash = await computeHash(resolved);
        if (currentHash === latestSnap.hash) {
          results.unchanged++;
          continue;
        }

        const label = `Auto-scan: ${new Date().toLocaleString()}`;
        const result = await createSnapshot(resolved, label);
        if (result.error) {
          results.errors.push({ file: resolved, error: result.error });
        } else {
          results.updated++;
        }
      } catch (e) {
        results.errors.push({ file: resolved, error: e.message });
      }
    }

    return results;
  } catch (err) {
    return { error: err.message };
  }
}
