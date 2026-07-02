import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';

const QUARANTINE_DIR = path.join(os.homedir(), 'ISHGuard', 'quarantine');
const INDEX_FILE = path.join(QUARANTINE_DIR, 'index.json');
const MAX_QUARANTINE_SIZE = 10 * 1024 * 1024 * 1024;

function ensureQuarantineDir() {
  if (!fs.existsSync(QUARANTINE_DIR)) {
    fs.mkdirSync(QUARANTINE_DIR, { recursive: true });
  }
}

function loadIndex() {
  ensureQuarantineDir();
  try {
    if (fs.existsSync(INDEX_FILE)) {
      const data = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
      if (data && Array.isArray(data.items)) return data;
    }
  } catch {
    try {
      fs.writeFileSync(INDEX_FILE, JSON.stringify({ items: [] }));
    } catch {}
  }
  return { items: [] };
}

function saveIndex(index) {
  ensureQuarantineDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

const KILL_TIMEOUT = 3000;

function tryKillProcess(filePath) {
  const fileName = path.basename(filePath).toLowerCase();
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/F', '/FI', `IMAGENAME eq ${fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`], { timeout: KILL_TIMEOUT, windowsHide: true, stdio: 'ignore' });
    } else {
      execFileSync('pkill', ['-f', fileName], { timeout: KILL_TIMEOUT, stdio: 'ignore' });
    }
  } catch {}
}

export function quarantineFile(filePath) {
  const result = { success: false, error: null, quarantinedPath: null, fileInfo: null };

  try {
    if (!filePath || typeof filePath !== 'string') {
      return { ...result, error: 'Invalid file path' };
    }
    if (!fs.existsSync(filePath)) {
      return { ...result, error: 'File not found' };
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return { ...result, error: 'Not a file' };
    }

    const currentStats = getQuarantineStats();
    if (currentStats.totalSize + stats.size > MAX_QUARANTINE_SIZE) {
      return { ...result, error: 'Quarantine storage limit exceeded' };
    }

    tryKillProcess(filePath);
    ensureQuarantineDir();

    const fileName = path.basename(filePath);
    const timestamp = Date.now();
    const safeName = `${timestamp}_${fileName}`;
    let destPath = path.join(QUARANTINE_DIR, safeName);

    let counter = 0;
    while (fs.existsSync(destPath)) {
      counter++;
      destPath = path.join(QUARANTINE_DIR, `${timestamp}_${counter}_${fileName}`);
    }

    fs.copyFileSync(filePath, destPath);
    fs.unlinkSync(filePath);

    const fileInfo = {
      id: timestamp.toString(),
      originalPath: filePath,
      quarantinedPath: destPath,
      fileName,
      fileSize: stats.size,
      quarantinedAt: new Date().toISOString(),
      restored: false
    };

    const index = loadIndex();
    index.items.push(fileInfo);
    saveIndex(index);

    return { success: true, quarantinedPath: destPath, fileInfo };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function quarantineThreats(threats) {
  const results = { quarantined: [], failed: [], total: 0 };
  if (!Array.isArray(threats)) return results;

  for (const threat of threats) {
    const filePath = threat.file || threat.path || (threat.fileInfo?.originalPath);
    if (!filePath || typeof filePath !== 'string') {
      results.failed.push({ file: filePath, error: 'Invalid path' });
      results.total++;
      continue;
    }
    const r = quarantineFile(filePath);
    if (r.success) {
      results.quarantined.push({ file: filePath, id: r.fileInfo.id });
    } else {
      results.failed.push({ file: filePath, error: r.error });
    }
    results.total++;
  }
  return results;
}

export function restoreFile(quarantineId) {
  const index = loadIndex();
  const itemIndex = index.items.findIndex(i => i.id === quarantineId);
  if (itemIndex === -1) {
    return { success: false, error: 'Quarantined item not found' };
  }

  const item = index.items[itemIndex];

  try {
    if (!fs.existsSync(item.quarantinedPath)) {
      return { success: false, error: 'Quarantined file no longer exists' };
    }

    const destDir = path.dirname(item.originalPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(item.quarantinedPath, item.originalPath);
    fs.unlinkSync(item.quarantinedPath);

    item.restored = true;
    item.restoredAt = new Date().toISOString();
    saveIndex(index);

    return { success: true, restoredPath: item.originalPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function deleteQuarantinedFile(quarantineId) {
  const index = loadIndex();
  const itemIndex = index.items.findIndex(i => i.id === quarantineId);
  if (itemIndex === -1) {
    return { success: false, error: 'Quarantined item not found' };
  }

  const item = index.items[itemIndex];
  try {
    if (fs.existsSync(item.quarantinedPath)) {
      fs.unlinkSync(item.quarantinedPath);
    }
  } catch {}

  index.items.splice(itemIndex, 1);
  saveIndex(index);
  return { success: true };
}

export function emptyQuarantine() {
  const index = loadIndex();
  let count = 0;

  for (const item of [...index.items]) {
    try {
      if (fs.existsSync(item.quarantinedPath)) {
        fs.unlinkSync(item.quarantinedPath);
        count++;
      }
    } catch {}
  }

  index.items = [];
  saveIndex(index);
  return { success: true, clearedCount: count };
}

export function getQuarantineList() {
  const index = loadIndex();

  const validItems = index.items.filter(i => {
    const exists = fs.existsSync(i.quarantinedPath);
    if (!exists && !i.restored) {
      i.restored = true;
      i.restoredAt = new Date().toISOString();
    }
    return exists || i.restored;
  });

  if (validItems.length !== index.items.length) {
    index.items = validItems;
    saveIndex(index);
  }

  return validItems;
}

export function getQuarantineStats() {
  const items = getQuarantineList();
  const totalSize = items.reduce((sum, i) => sum + (i.fileSize || 0), 0);
  return {
    totalItems: items.length,
    totalSize,
    quarantinedItems: items.filter(i => !i.restored).length,
    restoredItems: items.filter(i => i.restored).length
  };
}
