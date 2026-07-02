import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const CONFIG_DIR = path.join(os.homedir(), '.ishguard');
const CONFIG_FILE = path.join(CONFIG_DIR, 'folder-lock.json');

function getConfigPath() {
  return CONFIG_FILE;
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (data && typeof data === 'object') return data;
    }
  } catch {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({
        version: 1,
        recoveryKey: null,
        lastUnlock: null,
        folders: []
      }, null, 2));
    } catch {}
  }
  return { version: 1, recoveryKey: null, lastUnlock: null, folders: [] };
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function hashPin(pin) {
  return crypto.createHash('sha256').update('pin:' + pin).digest('hex');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function verifyPasswordOrPin(storedPwdHash, storedPinHash, input) {
  if (!input) return false;
  if (storedPwdHash && hashPassword(input) === storedPwdHash) return true;
  if (storedPinHash && hashPin(input) === storedPinHash) return true;
  return false;
}

export function listProtectedFolders() {
  try {
    const config = loadConfig();
    return config.folders || [];
  } catch (err) {
    return { error: err.message };
  }
}

export function protectFolder(folderPath, password, pin, options = {}) {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { success: false, error: 'Invalid folder path' };
    }
    if (!password && !pin) {
      return { success: false, error: 'Password or PIN is required' };
    }
    if (!fs.existsSync(folderPath)) {
      return { success: false, error: 'Folder does not exist' };
    }
    const stat = fs.statSync(folderPath);
    if (!stat.isDirectory()) {
      return { success: false, error: 'Path is not a directory' };
    }

    const config = loadConfig();
    const existing = config.folders.find(f =>
      path.resolve(f.folderPath) === path.resolve(folderPath)
    );
    if (existing) {
      return { success: false, error: 'Folder is already protected' };
    }

    const id = generateId();
    const now = new Date().toISOString();
    const entry = {
      id,
      folderPath: path.resolve(folderPath),
      passwordHash: password ? hashPassword(password) : null,
      pinHash: pin ? hashPin(pin) : null,
      locked: true,
      favorite: !!options.favorite,
      readOnly: !!options.readOnly,
      autoLock: !!options.autoLock,
      createdAt: now,
      updatedAt: now,
      history: [
        { type: 'protect', timestamp: now },
        { type: 'lock', timestamp: now }
      ]
    };

    config.folders.push(entry);
    saveConfig(config);

    try {
      applyAclLock(folderPath);
    } catch {}

    return { success: true, folder: entry };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function unlockFolder(folderId, passwordOrPin) {
  try {
    if (!folderId || !passwordOrPin) {
      return { success: false, error: 'Folder ID and password/PIN are required' };
    }
    const config = loadConfig();
    const folder = config.folders.find(f => f.id === folderId);
    if (!folder) {
      return { success: false, error: 'Protected folder not found' };
    }
    if (!verifyPasswordOrPin(folder.passwordHash, folder.pinHash, passwordOrPin)) {
      return { success: false, error: 'Incorrect password or PIN' };
    }
    if (!folder.locked) {
      return { success: false, error: 'Folder is already unlocked' };
    }

    folder.locked = false;
    folder.updatedAt = new Date().toISOString();
    folder.history.push({ type: 'unlock', timestamp: new Date().toISOString() });
    config.lastUnlock = new Date().toISOString();
    saveConfig(config);

    try {
      removeAclLock(folder.folderPath);
    } catch {}

    return { success: true, unlockedAt: folder.updatedAt, folder };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function lockFolder(folderId) {
  try {
    if (!folderId) {
      return { success: false, error: 'Folder ID is required' };
    }
    const config = loadConfig();
    const folder = config.folders.find(f => f.id === folderId);
    if (!folder) {
      return { success: false, error: 'Protected folder not found' };
    }
    if (folder.locked) {
      return { success: false, error: 'Folder is already locked' };
    }

    folder.locked = true;
    folder.updatedAt = new Date().toISOString();
    folder.history.push({ type: 'lock', timestamp: new Date().toISOString() });
    saveConfig(config);

    try {
      applyAclLock(folder.folderPath);
    } catch (aclErr) {
      return { success: true, warning: 'Folder marked locked but ACL could not be applied', aclError: aclErr.message, folder };
    }

    return { success: true, lockedAt: folder.updatedAt, folder };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function lockAllFolders() {
  try {
    const config = loadConfig();
    const unlocked = config.folders.filter(f => !f.locked);
    const results = [];

    for (const folder of unlocked) {
      folder.locked = true;
      folder.updatedAt = new Date().toISOString();
      folder.history.push({ type: 'lock', timestamp: new Date().toISOString() });
      try {
        applyAclLock(folder.folderPath);
        results.push({ id: folder.id, path: folder.folderPath, status: 'locked' });
      } catch (aclErr) {
        results.push({ id: folder.id, path: folder.folderPath, status: 'locked_config_only', aclError: aclErr.message });
      }
    }

    saveConfig(config);
    return { success: true, locked: results.length, results };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function unlockAllFolders(password) {
  try {
    if (!password) {
      return { success: false, error: 'Password is required' };
    }
    const config = loadConfig();
    const locked = config.folders.filter(f => f.locked);
    const results = [];
    let verifiedCount = 0;

    for (const folder of locked) {
      if (!verifyPasswordOrPin(folder.passwordHash, folder.pinHash, password)) {
        results.push({ id: folder.id, path: folder.folderPath, status: 'skipped', reason: 'incorrect password' });
        continue;
      }
      folder.locked = false;
      folder.updatedAt = new Date().toISOString();
      folder.history.push({ type: 'unlock', timestamp: new Date().toISOString() });
      try {
        removeAclLock(folder.folderPath);
        results.push({ id: folder.id, path: folder.folderPath, status: 'unlocked' });
      } catch (aclErr) {
        results.push({ id: folder.id, path: folder.folderPath, status: 'unlocked_config_only', aclError: aclErr.message });
      }
      verifiedCount++;
    }

    if (verifiedCount === 0) {
      return { success: false, error: 'No folders could be unlocked — incorrect password for all locked folders' };
    }

    config.lastUnlock = new Date().toISOString();
    saveConfig(config);
    return { success: true, unlocked: results.length, results };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function removeProtection(folderId, password, secureDelete) {
  try {
    if (!folderId || !password) {
      return { success: false, error: 'Folder ID and password are required' };
    }
    const config = loadConfig();
    const index = config.folders.findIndex(f => f.id === folderId);
    if (index === -1) {
      return { success: false, error: 'Protected folder not found' };
    }

    const folder = config.folders[index];
    if (!verifyPasswordOrPin(folder.passwordHash, folder.pinHash, password)) {
      return { success: false, error: 'Incorrect password' };
    }

    if (secureDelete) {
      const blank = {
        id: 'REMOVED_' + folder.id,
        folderPath: '[SECURELY DELETED]',
        passwordHash: null,
        pinHash: null,
        locked: false,
        favorite: false,
        readOnly: false,
        autoLock: false,
        createdAt: folder.createdAt,
        updatedAt: new Date().toISOString(),
        history: []
      };
      config.folders[index] = blank;
    }

    const removed = config.folders.splice(index, 1)[0];

    try {
      removeAclLock(removed.folderPath);
    } catch {}

    saveConfig(config);
    return { success: true, removedId: folderId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function getFolderLockStats() {
  try {
    const config = loadConfig();
    const folders = config.folders || [];
    const locked = folders.filter(f => f.locked);
    const unlocked = folders.filter(f => !f.locked);

    const securityScore = calculateSecurityScore(folders);

    const allHistory = folders.flatMap(f => (f.history || []).map(h => ({ ...h, folderId: f.id, folderPath: f.folderPath })));
    allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentHistory = allHistory.slice(0, 20);

    return {
      total: folders.length,
      locked: locked.length,
      unlocked: unlocked.length,
      lastUnlock: config.lastUnlock || null,
      securityScore,
      recentHistory,
      folders: folders.map(f => ({
        id: f.id,
        folderPath: f.folderPath,
        locked: f.locked,
        favorite: f.favorite,
        readOnly: f.readOnly,
        autoLock: f.autoLock,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      }))
    };
  } catch (err) {
    return { error: err.message };
  }
}

export function getFolderHistory(folderId) {
  try {
    if (!folderId) {
      return { error: 'Folder ID is required' };
    }
    const config = loadConfig();
    const folder = config.folders.find(f => f.id === folderId);
    if (!folder) {
      return { error: 'Protected folder not found' };
    }
    return {
      folderId: folder.id,
      folderPath: folder.folderPath,
      history: folder.history || []
    };
  } catch (err) {
    return { error: err.message };
  }
}

export function searchProtectedFolders(query) {
  try {
    if (!query || typeof query !== 'string') {
      return [];
    }
    const config = loadConfig();
    const q = query.toLowerCase();
    return config.folders.filter(f =>
      f.folderPath.toLowerCase().includes(q) ||
      path.basename(f.folderPath).toLowerCase().includes(q) ||
      (f.id && f.id.toLowerCase().includes(q))
    ).map(f => ({
      id: f.id,
      folderPath: f.folderPath,
      locked: f.locked,
      favorite: f.favorite,
      readOnly: f.readOnly,
      autoLock: f.autoLock,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt
    }));
  } catch (err) {
    return { error: err.message };
  }
}

export function toggleFavorite(folderId) {
  try {
    if (!folderId) {
      return { success: false, error: 'Folder ID is required' };
    }
    const config = loadConfig();
    const folder = config.folders.find(f => f.id === folderId);
    if (!folder) {
      return { success: false, error: 'Protected folder not found' };
    }
    folder.favorite = !folder.favorite;
    folder.updatedAt = new Date().toISOString();
    saveConfig(config);
    return { success: true, favorite: folder.favorite, folder };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function regenerateRecoveryKey() {
  try {
    const config = loadConfig();
    const key = crypto.randomBytes(8).toString('hex');
    config.recoveryKey = key;
    saveConfig(config);
    return { success: true, recoveryKey: key };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function verifyRecoveryKey(key) {
  try {
    if (!key) {
      return { success: false, valid: false, error: 'Recovery key is required' };
    }
    const config = loadConfig();
    if (!config.recoveryKey) {
      return { success: false, valid: false, error: 'No recovery key has been generated' };
    }
    const valid = config.recoveryKey === key;
    return { success: true, valid };
  } catch (err) {
    return { success: false, valid: false, error: err.message };
  }
}

export function backupConfig(destinationPath) {
  try {
    if (!destinationPath || typeof destinationPath !== 'string') {
      return { success: false, error: 'Destination path is required' };
    }
    const config = loadConfig();
    const destDir = path.dirname(destinationPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(CONFIG_FILE, destinationPath);
    return { success: true, destination: destinationPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function restoreConfig(sourcePath) {
  try {
    if (!sourcePath || typeof sourcePath !== 'string') {
      return { success: false, error: 'Source path is required' };
    }
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: 'Backup file does not exist' };
    }
    const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid backup file format' };
    }
    saveConfig(data);
    return { success: true, restoredFrom: sourcePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function runFolderLockScan() {
  try {
    const config = loadConfig();
    const folders = config.folders || [];
    const results = [];
    let missing = 0;
    let accessible = 0;

    for (const folder of folders) {
      const exists = fs.existsSync(folder.folderPath);
      if (!exists) missing++;
      else accessible++;
      results.push({
        id: folder.id,
        folderPath: folder.folderPath,
        exists,
        locked: folder.locked,
        readOnly: folder.readOnly,
        autoLock: folder.autoLock,
        favorite: folder.favorite,
        historyCount: (folder.history || []).length
      });
    }

    const lockedCount = folders.filter(f => f.locked).length;

    return {
      success: true,
      total: folders.length,
      locked: lockedCount,
      unlocked: folders.length - lockedCount,
      missing,
      accessible,
      recoveryKeyConfigured: !!config.recoveryKey,
      lastUnlock: config.lastUnlock || null,
      securityScore: calculateSecurityScore(folders),
      folders: results,
      scannedAt: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function calculateSecurityScore(folders) {
  if (!folders || folders.length === 0) return 100;
  let score = 100;

  const allLocked = folders.every(f => f.locked);
  if (!allLocked) score -= 20;

  const allHavePassword = folders.every(f => f.passwordHash);
  if (!allHavePassword) score -= 15;

  const missing = folders.filter(f => !fs.existsSync(f.folderPath));
  score -= missing.length * 10;

  const noHistory = folders.filter(f => !f.history || f.history.length < 2);
  if (noHistory.length > 0) score -= 5;

  const noAutoLock = folders.filter(f => !f.autoLock);
  if (noAutoLock.length === folders.length) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function applyAclLock(folderPath) {
  if (process.platform !== 'win32') return;
  if (!folderPath || !fs.existsSync(folderPath)) return;

  const userName = os.userInfo().username;
  execFileSync('powershell', [
    '-NoProfile',
    '-Command',
    `$acl = Get-Acl -Path "${folderPath}"; ` +
    `$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("${userName}","Write,DELETE,CreateDirectories,CreateFiles,DeleteSubdirectoriesAndFiles","ContainerInherit,ObjectInherit","None","Deny"); ` +
    `$acl.AddAccessRule($rule); ` +
    `Set-Acl -Path "${folderPath}" -AclObject $acl`
  ], { timeout: 10000, windowsHide: true, stdio: 'pipe' });
}

function removeAclLock(folderPath) {
  if (process.platform !== 'win32') return;
  if (!folderPath || !fs.existsSync(folderPath)) return;

  const userName = os.userInfo().username;
  try {
    execFileSync('powershell', [
      '-NoProfile',
      '-Command',
      `$acl = Get-Acl -Path "${folderPath}"; ` +
      `$rules = $acl.GetAccessRules($true, $true, [System.Security.Principal.NTAccount]) | Where-Object { $_.IdentityReference -eq "${userName}" -and $_.AccessControlType -eq "Deny" }; ` +
      `foreach ($rule in $rules) { $acl.RemoveAccessRule($rule) }; ` +
      `Set-Acl -Path "${folderPath}" -AclObject $acl`
    ], { timeout: 10000, windowsHide: true, stdio: 'pipe' });
  } catch {}
}
