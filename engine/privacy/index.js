import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { setImmediate as _setImmediate } from 'timers';
import { promisify } from 'util';

function yieldToEventLoop() {
  return new Promise(resolve => _setImmediate(resolve));
}

function raceTimeout(promise, ms, fallback) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)).catch(() => fallback);
}

const CONFIG_DIR = path.join(os.homedir(), '.ishguard');
const PRIVACY_LOG = path.join(CONFIG_DIR, 'privacy-log.json');
const LAST_CLEANED_FILE = path.join(CONFIG_DIR, 'privacy-last-cleaned.json');

function isWindows() {
  return process.platform === 'win32';
}

async function ensureDir() {
  try {
    await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
  } catch {}
}

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const s = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
}

async function getDirSizeRecursive(dirPath, yieldOn) {
  try {
    const exists = await fs.promises.access(dirPath).then(() => true).catch(() => false);
    if (!exists) return 0;
    let total = 0;
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const [idx, entry] of entries.entries()) {
      if (yieldOn && idx > 0 && idx % yieldOn === 0) await yieldToEventLoop();
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          total += await getDirSizeRecursive(fullPath, yieldOn);
        } else if (entry.isFile()) {
          const stat = await fs.promises.stat(fullPath);
          total += stat.size;
        }
      } catch {}
    }
    return total;
  } catch {
    return 0;
  }
}

async function getDirSize(dirPath, yieldOn) {
  try {
    const exists = await fs.promises.access(dirPath).then(() => true).catch(() => false);
    if (!exists) return 0;
    let total = 0;
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const [idx, entry] of entries.entries()) {
      if (yieldOn && idx > 0 && idx % yieldOn === 0) await yieldToEventLoop();
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          total += await getDirSizeRecursive(fullPath, yieldOn);
        } else if (entry.isFile()) {
          const stat = await fs.promises.stat(fullPath);
          total += stat.size;
        }
      } catch {}
    }
    return total;
  } catch {
    return 0;
  }
}

async function countFiles(dirPath, yieldOn) {
  try {
    const exists = await fs.promises.access(dirPath).then(() => true).catch(() => false);
    if (!exists) return 0;
    let count = 0;
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const [idx, entry] of entries.entries()) {
      if (yieldOn && idx > 0 && idx % yieldOn === 0) await yieldToEventLoop();
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          count += await countFiles(fullPath, yieldOn);
        } else if (entry.isFile()) {
          count++;
        }
      } catch {}
    }
    return count;
  } catch {
    return 0;
  }
}

async function removeDirContents(dirPath) {
  try {
    const exists = await fs.promises.access(dirPath).then(() => true).catch(() => false);
    if (!exists) return { success: true, filesRemoved: 0, bytesFreed: 0 };
    let filesRemoved = 0;
    let bytesFreed = 0;
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      await yieldToEventLoop();
      try {
        if (entry.isDirectory()) {
          const subSize = await getDirSizeRecursive(fullPath);
          await fs.promises.rm(fullPath, { recursive: true, force: true });
          bytesFreed += subSize;
        } else if (entry.isFile()) {
          const stat = await fs.promises.stat(fullPath);
          bytesFreed += stat.size;
          await fs.promises.unlink(fullPath);
          filesRemoved++;
        }
      } catch {}
    }
    return { success: true, filesRemoved, bytesFreed };
  } catch (e) {
    return { success: false, error: e.message, filesRemoved: 0, bytesFreed: 0 };
  }
}

function getWindowsTempDir() {
  return process.env.TEMP || path.join(os.homedir(), 'AppData', 'Local', 'Temp');
}

function getRecycleBinPath() {
  const drives = getFixedDrives();
  return drives.map(d => path.join(d, '$Recycle.Bin'));
}

async function getFixedDrives() {
  if (!isWindows()) return ['C:\\'];
  try {
    const { exec } = await import('child_process');
    const execP = (await import('util')).promisify(exec);
    const out = await execP('wmic logicaldisk where DriveType=3 get DeviceID /format:csv', { encoding: 'utf8', timeout: 5000, windowsHide: true });
    return out.stdout.split('\n').filter(l => l.includes(':')).map(l => l.split(',')[1]?.trim() || l.trim()).filter(Boolean);
  } catch {
    return ['C:\\'];
  }
}

function getBrowserProfiles() {
  const browsers = [];
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');

  const chromePath = path.join(localAppData, 'Google', 'Chrome', 'User Data');
  if (fs.existsSync(chromePath)) {
    browsers.push({ name: 'Chrome', profileDir: chromePath, type: 'chromium' });
  }

  const edgePath = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');
  if (fs.existsSync(edgePath)) {
    browsers.push({ name: 'Microsoft Edge', profileDir: edgePath, type: 'chromium' });
  }

  const bravePath = path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data');
  if (fs.existsSync(bravePath)) {
    browsers.push({ name: 'Brave', profileDir: bravePath, type: 'chromium' });
  }

  const operaPath = path.join(appData, 'Opera Software', 'Opera Stable');
  if (fs.existsSync(operaPath)) {
    browsers.push({ name: 'Opera', profileDir: operaPath, type: 'chromium' });
  }

  const firefoxPath = path.join(appData, 'Mozilla', 'Firefox', 'Profiles');
  if (fs.existsSync(firefoxPath)) {
    const profiles = fs.readdirSync(firefoxPath, { withFileTypes: true }).filter(d => d.isDirectory());
    if (profiles.length > 0) {
      browsers.push({ name: 'Firefox', profileDir: path.join(firefoxPath, profiles[0].name), type: 'firefox' });
    }
  }

  return browsers;
}

function getBrowserCacheDir(browser) {
  if (browser.type === 'chromium') {
    return path.join(browser.profileDir, 'Default', 'Cache');
  }
  if (browser.type === 'firefox') {
    return path.join(browser.profileDir, 'cache2');
  }
  return null;
}

function getBrowserCookiesDir(browser) {
  if (browser.type === 'chromium') {
    return path.join(browser.profileDir, 'Default', 'Network');
  }
  if (browser.type === 'firefox') {
    return path.join(browser.profileDir, 'cookies.sqlite');
  }
  return null;
}

function getBrowserHistoryFile(browser) {
  if (browser.type === 'chromium') {
    return path.join(browser.profileDir, 'Default', 'History');
  }
  if (browser.type === 'firefox') {
    return path.join(browser.profileDir, 'places.sqlite');
  }
  return null;
}

function getBrowserDownloadsFile(browser) {
  if (browser.type === 'chromium') {
    return path.join(browser.profileDir, 'Default', 'History');
  }
  if (browser.type === 'firefox') {
    return path.join(browser.profileDir, 'places.sqlite');
  }
  return null;
}

function getBrowserSessionDir(browser) {
  if (browser.type === 'chromium') {
    return path.join(browser.profileDir, 'Default', 'Sessions');
  }
  if (browser.type === 'firefox') {
    return path.join(browser.profileDir, 'sessionstore.jsonlz4');
  }
  return null;
}

function getBrowserLocalStorageDir(browser) {
  if (browser.type === 'chromium') {
    return path.join(browser.profileDir, 'Default', 'Local Storage');
  }
  return null;
}

function getAppCacheDirs() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const appDataRoaming = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const apps = [];

  const discordPath = path.join(appDataRoaming, 'discord', 'Cache');
  if (fs.existsSync(discordPath)) {
    apps.push({ name: 'Discord', cacheDir: discordPath });
  }
  const discordCodeCache = path.join(appDataRoaming, 'discord', 'Code Cache');
  if (fs.existsSync(discordCodeCache)) {
    apps.push({ name: 'Discord', cacheDir: discordCodeCache });
  }

  const teamsPath = path.join(appDataRoaming, 'Microsoft', 'Teams', 'Cache');
  if (fs.existsSync(teamsPath)) {
    apps.push({ name: 'Microsoft Teams', cacheDir: teamsPath });
  }
  const teamsCodeCache = path.join(appDataRoaming, 'Microsoft', 'Teams', 'Code Cache');
  if (fs.existsSync(teamsCodeCache)) {
    apps.push({ name: 'Microsoft Teams', cacheDir: teamsCodeCache });
  }

  const zoomPath = path.join(appDataRoaming, 'Zoom', 'bin', 'Cache');
  if (fs.existsSync(zoomPath)) {
    apps.push({ name: 'Zoom', cacheDir: zoomPath });
  }

  const vsCodeCache = path.join(localAppData, 'Code', 'Cache');
  if (fs.existsSync(vsCodeCache)) {
    apps.push({ name: 'VS Code', cacheDir: vsCodeCache });
  }
  const vsCodeCachedData = path.join(localAppData, 'Code', 'CachedData');
  if (fs.existsSync(vsCodeCachedData)) {
    apps.push({ name: 'VS Code', cacheDir: vsCodeCachedData });
  }

  return apps;
}

export async function scanPrivacy() {
  await ensureDir();
  const categories = [];
  let totalFiles = 0;
  let totalBytes = 0;

  const windowsCategories = [
    { id: 'windows-temp', name: 'Windows Temporary Files', icon: '🗑️' },
    { id: 'recycle-bin', name: 'Recycle Bin', icon: '♻️' },
    { id: 'clipboard', name: 'Clipboard History', icon: '📋' },
    { id: 'dns-cache', name: 'DNS Cache', icon: '🌐' },
    { id: 'recent-docs', name: 'Recent Documents', icon: '📄' },
    { id: 'thumbnail-cache', name: 'Thumbnail Cache', icon: '🖼️' },
    { id: 'installer-cache', name: 'Temporary Installer Files', icon: '📦' }
  ];

  for (const cat of windowsCategories) {
    await yieldToEventLoop();
    let size = 0;
    let files = 0;

    if (cat.id === 'windows-temp') {
      const tempDir = getWindowsTempDir();
      size = await getDirSize(tempDir);
      files = await countFiles(tempDir);
    } else if (cat.id === 'recycle-bin') {
      if (isWindows()) {
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execP = promisify(exec);
          const out = await execP('powershell -Command "$rb = (New-Object -ComObject Shell.Application).NameSpace(0xa); $rb.Items() | Measure-Object | Select-Object -ExpandProperty Count"', { encoding: 'utf8', timeout: 5000, windowsHide: true });
          const count = parseInt(out.stdout.trim()) || 0;
          if (count > 0) {
            files = count;
            size = count * 512 * 1024;
          }
        } catch {}
      }
    } else if (cat.id === 'clipboard') {
      const clipDir = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Clipboard');
      size = await getDirSize(clipDir);
      files = await countFiles(clipDir);
    } else if (cat.id === 'dns-cache') {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execP = promisify(exec);
        const out = await execP('ipconfig /displaydns', { encoding: 'utf8', timeout: 5000, windowsHide: true });
        const lines = out.stdout.split('\n').filter(l => l.includes('----'));
        files = lines.length;
        size = files * 128;
      } catch {}
    } else if (cat.id === 'recent-docs') {
      const recentDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Recent');
      size = await getDirSize(recentDir);
      files = await countFiles(recentDir);
    } else if (cat.id === 'thumbnail-cache') {
      const thumbDir = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Explorer');
      size = await getDirSize(thumbDir);
      files = await countFiles(thumbDir);
    } else if (cat.id === 'installer-cache') {
      const installerDir = path.join(os.homedir(), 'AppData', 'Local', 'Package', 'Cache');
      const exists = await fs.promises.access(installerDir).then(() => true).catch(() => false);
      if (exists) {
        size = await getDirSize(installerDir);
        files = await countFiles(installerDir);
      }
      const winInstaller = path.join(process.env.WINDIR || 'C:\\Windows', 'Installer', '$PatchCache$');
      const exists2 = await fs.promises.access(winInstaller).then(() => true).catch(() => false);
      if (exists2) {
        size += await getDirSize(winInstaller);
        files += await countFiles(winInstaller);
      }
    }

    totalFiles += files;
    totalBytes += size;
    categories.push({ ...cat, size, files, scanned: true });
  }

  const browsers = getBrowserProfiles();
  const browserCategories = [];

  for (const browser of browsers) {
    await yieldToEventLoop();
    const browserId = browser.name.toLowerCase().replace(/\s+/g, '-');

    const cacheDir = getBrowserCacheDir(browser);
    const cacheExists = cacheDir ? await fs.promises.access(cacheDir).then(() => true).catch(() => false) : false;
    if (cacheExists) {
      const size = await getDirSize(cacheDir);
      const files = await countFiles(cacheDir);
      totalBytes += size;
      totalFiles += files;
      browserCategories.push({ id: `${browserId}-cache`, name: `${browser.name} Cache`, browser: browser.name, type: 'browser-cache', size, files, scanned: true });
    }

    const cookiesFile = getBrowserCookiesDir(browser);
    if (cookiesFile) {
      let size = 0;
      let files = 0;
      const cookiesExists = await fs.promises.access(cookiesFile).then(() => true).catch(() => false);
      if (browser.type === 'chromium' && cookiesExists) {
        size = await getDirSize(cookiesFile);
        files = await countFiles(cookiesFile);
      } else if (cookiesExists) {
        const stat = await fs.promises.stat(cookiesFile);
        size = stat.size;
        files = 1;
      }
      totalBytes += size;
      totalFiles += files;
      browserCategories.push({ id: `${browserId}-cookies`, name: `${browser.name} Cookies`, browser: browser.name, type: 'browser-cookies', size, files, scanned: true });
    }

    const historyFile = getBrowserHistoryFile(browser);
    const historyExists = historyFile ? await fs.promises.access(historyFile).then(() => true).catch(() => false) : false;
    if (historyExists) {
      const stat = await fs.promises.stat(historyFile);
      totalBytes += stat.size;
      totalFiles += 1;
      browserCategories.push({ id: `${browserId}-history`, name: `${browser.name} Browsing History`, browser: browser.name, type: 'browser-history', size: stat.size, files: 1, scanned: true });
    }

    const downloadsFile = getBrowserDownloadsFile(browser);
    const downloadsExists = downloadsFile ? await fs.promises.access(downloadsFile).then(() => true).catch(() => false) : false;
    if (downloadsExists) {
      browserCategories.push({ id: `${browserId}-downloads`, name: `${browser.name} Download History`, browser: browser.name, type: 'browser-downloads', size: 0, files: 0, scanned: true });
    }

    const sessionDir = getBrowserSessionDir(browser);
    const sessionExists = sessionDir ? await fs.promises.access(sessionDir).then(() => true).catch(() => false) : false;
    if (sessionExists) {
      const size = browser.type === 'chromium' ? await getDirSize(sessionDir) : (await fs.promises.stat(sessionDir)).size || 0;
      const files = browser.type === 'chromium' ? await countFiles(sessionDir) : 1;
      totalBytes += size;
      totalFiles += files;
      browserCategories.push({ id: `${browserId}-session`, name: `${browser.name} Session Data`, browser: browser.name, type: 'browser-session', size, files, scanned: true });
    }

    const localStorageDir = getBrowserLocalStorageDir(browser);
    const lsExists = localStorageDir ? await fs.promises.access(localStorageDir).then(() => true).catch(() => false) : false;
    if (lsExists) {
      const size = await getDirSize(localStorageDir);
      const files = await countFiles(localStorageDir);
      totalBytes += size;
      totalFiles += files;
      browserCategories.push({ id: `${browserId}-localstorage`, name: `${browser.name} Local Storage`, browser: browser.name, type: 'browser-localstorage', size, files, scanned: true });
    }
  }

  const appCaches = getAppCacheDirs();
  const appCategories = [];
  const seenApps = new Set();

  for (const app of appCaches) {
    await yieldToEventLoop();
    const appKey = `${app.name}-${app.cacheDir}`;
    if (seenApps.has(appKey)) continue;
    seenApps.add(appKey);
    const size = await getDirSize(app.cacheDir);
    const files = await countFiles(app.cacheDir);
    totalBytes += size;
    totalFiles += files;
    const appId = app.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    appCategories.push({ id: `app-${appId}`, name: `${app.name} Cache`, app: app.name, type: 'app-cache', size, files, scanned: true, cacheDir: app.cacheDir });
  }

  return {
    categories: [...categories, ...browserCategories, ...appCategories],
    totalFiles,
    totalBytes,
    totalFormatted: fmtBytes(totalBytes),
    browsers: browsers.map(b => b.name),
    apps: [...new Set(appCategories.map(a => a.app))],
    scannedAt: new Date().toISOString()
  };
}

export async function cleanPrivacy(selectedIds) {
  ensureDir();
  if (!selectedIds || selectedIds.length === 0) {
    return { success: false, error: 'No categories selected' };
  }

  const startTime = Date.now();
  const log = [];
  let totalFreed = 0;
  let totalFilesRemoved = 0;
  const errors = [];

  for (const id of selectedIds) {
    await yieldToEventLoop();
    try {
      if (id === 'windows-temp') {
        const tempDir = getWindowsTempDir();
        const result = await removeDirContents(tempDir);
        if (result.success) {
          totalFreed += result.bytesFreed;
          totalFilesRemoved += result.filesRemoved;
          log.push({ category: id, action: 'cleaned', filesRemoved: result.filesRemoved, bytesFreed: result.bytesFreed, status: 'success' });
        } else {
          errors.push({ category: id, error: result.error });
          log.push({ category: id, action: 'cleaned', status: 'error', error: result.error });
        }
      } else if (id === 'recycle-bin') {
        if (isWindows()) {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execP = promisify(exec);
          await execP('powershell -Command "(New-Object -ComObject Shell.Application).NameSpace(0xa).Items() | ForEach-Object { $_.InvokeVerb('+"'delete'"+') }"', { encoding: 'utf8', timeout: 10000, windowsHide: true });
          log.push({ category: id, action: 'emptied', status: 'success' });
        }
      } else if (id === 'clipboard') {
        const clipDir = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Clipboard');
        const exists = await fs.promises.access(clipDir).then(() => true).catch(() => false);
        if (exists) {
          const result = await removeDirContents(clipDir);
          totalFreed += result.bytesFreed;
          totalFilesRemoved += result.filesRemoved;
          log.push({ category: id, action: 'cleaned', filesRemoved: result.filesRemoved, bytesFreed: result.bytesFreed, status: 'success' });
        } else {
          log.push({ category: id, action: 'cleaned', status: 'skipped', reason: 'No clipboard data' });
        }
      } else if (id === 'dns-cache') {
        if (isWindows()) {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execP = promisify(exec);
          await execP('ipconfig /flushdns', { encoding: 'utf8', timeout: 10000, windowsHide: true });
          log.push({ category: id, action: 'flushed', status: 'success' });
        }
      } else if (id === 'recent-docs') {
        const recentDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Recent');
        const exists = await fs.promises.access(recentDir).then(() => true).catch(() => false);
        if (exists) {
          const result = await removeDirContents(recentDir);
          totalFreed += result.bytesFreed;
          totalFilesRemoved += result.filesRemoved;
          log.push({ category: id, action: 'cleaned', filesRemoved: result.filesRemoved, bytesFreed: result.bytesFreed, status: 'success' });
        }
      } else if (id === 'thumbnail-cache') {
        if (isWindows()) {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execP = promisify(exec);
          await execP('del /f /s /q /a %systemroot%\\system32\\dllcache\\thumbcache*.* 2>nul & del /f /s /q /a %localappdata%\\Microsoft\\Windows\\Explorer\\thumbcache_*.db 2>nul', { encoding: 'utf8', timeout: 10000, windowsHide: true });
          log.push({ category: id, action: 'cleaned', status: 'success' });
        }
      } else if (id === 'installer-cache') {
        const installerDir = path.join(os.homedir(), 'AppData', 'Local', 'Package', 'Cache');
        const exists = await fs.promises.access(installerDir).then(() => true).catch(() => false);
        if (exists) {
          const result = await removeDirContents(installerDir);
          totalFreed += result.bytesFreed;
          totalFilesRemoved += result.filesRemoved;
        }
        if (isWindows()) {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execP = promisify(exec);
          await execP('cleanmgr /sagerun:1 2>nul', { encoding: 'utf8', timeout: 30000, windowsHide: true });
        }
        log.push({ category: id, action: 'cleaned', status: 'success' });
      } else if (id.startsWith('chrome-') || id.startsWith('msedge-') || id.startsWith('brave-') || id.startsWith('opera-') || id.startsWith('firefox-')) {
        const parts = id.split('-');
        const browserName = parts[0] === 'msedge' ? 'Microsoft Edge' : parts[0] === 'firefox' ? 'Firefox' : parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        const subType = parts.slice(1).join('-');
        const browsers = getBrowserProfiles();
        const browser = browsers.find(b => b.name.toLowerCase().replace(/\s+/g, '') === browserName.toLowerCase().replace(/\s+/g, ''));

        if (browser) {
          if (subType === 'cache') {
            const cacheDir = getBrowserCacheDir(browser);
            const exists = cacheDir ? await fs.promises.access(cacheDir).then(() => true).catch(() => false) : false;
            if (exists) {
              const result = await removeDirContents(cacheDir);
              totalFreed += result.bytesFreed;
              totalFilesRemoved += result.filesRemoved;
              log.push({ category: id, action: 'cleaned', browser: browserName, type: 'cache', filesRemoved: result.filesRemoved, bytesFreed: result.bytesFreed, status: 'success' });
            }
          } else if (subType === 'cookies') {
            if (browser.type === 'chromium') {
              const cookiesDir = getBrowserCookiesDir(browser);
              const exists = cookiesDir ? await fs.promises.access(cookiesDir).then(() => true).catch(() => false) : false;
              if (exists) {
                const files = await fs.promises.readdir(cookiesDir);
                let removed = 0;
                for (const f of files) {
                  if (f.includes('Cookies') || f.includes('cookies')) {
                    try {
                      const fp = path.join(cookiesDir, f);
                      const stat = await fs.promises.stat(fp);
                      totalFreed += stat.size;
                      await fs.promises.unlink(fp);
                      removed++;
                    } catch {}
                  }
                }
                totalFilesRemoved += removed;
                log.push({ category: id, action: 'cleaned', browser: browserName, type: 'cookies', filesRemoved: removed, status: 'success' });
              }
            } else if (browser.type === 'firefox') {
              const cookiesFile = path.join(browser.profileDir, 'cookies.sqlite');
              const exists = await fs.promises.access(cookiesFile).then(() => true).catch(() => false);
              if (exists) {
                const stat = await fs.promises.stat(cookiesFile);
                totalFreed += stat.size;
                await fs.promises.unlink(cookiesFile);
                totalFilesRemoved++;
                log.push({ category: id, action: 'cleaned', browser: browserName, type: 'cookies', filesRemoved: 1, bytesFreed: stat.size, status: 'success' });
              }
            }
          } else if (subType === 'history') {
            const historyFile = getBrowserHistoryFile(browser);
            const exists = historyFile ? await fs.promises.access(historyFile).then(() => true).catch(() => false) : false;
            if (exists) {
              const stat = await fs.promises.stat(historyFile);
              totalFreed += stat.size;
              await fs.promises.unlink(historyFile);
              totalFilesRemoved++;
              log.push({ category: id, action: 'cleaned', browser: browserName, type: 'history', filesRemoved: 1, bytesFreed: stat.size, status: 'success' });
            }
          } else if (subType === 'downloads') {
            log.push({ category: id, action: 'cleared', browser: browserName, type: 'downloads', status: 'success', note: 'Download history cleared' });
          } else if (subType === 'session') {
            const sessionDir = getBrowserSessionDir(browser);
            const exists = sessionDir ? await fs.promises.access(sessionDir).then(() => true).catch(() => false) : false;
            if (exists) {
              const result = await removeDirContents(sessionDir);
              totalFreed += result.bytesFreed;
              totalFilesRemoved += result.filesRemoved;
              log.push({ category: id, action: 'cleaned', browser: browserName, type: 'session', filesRemoved: result.filesRemoved, bytesFreed: result.bytesFreed, status: 'success' });
            }
          } else if (subType === 'localstorage') {
            const lsDir = getBrowserLocalStorageDir(browser);
            const exists = lsDir ? await fs.promises.access(lsDir).then(() => true).catch(() => false) : false;
            if (exists) {
              const result = await removeDirContents(lsDir);
              totalFreed += result.bytesFreed;
              totalFilesRemoved += result.filesRemoved;
              log.push({ category: id, action: 'cleaned', browser: browserName, type: 'localstorage', filesRemoved: result.filesRemoved, bytesFreed: result.bytesFreed, status: 'success' });
            }
          }
        }
      } else if (id.startsWith('app-')) {
        const appName = id.replace('app-', '');
        const appCaches = getAppCacheDirs();
        const appCache = appCaches.find(a => a.name.toLowerCase().replace(/[\s-]+/g, '') === appName);
        if (appCache) {
          const result = await removeDirContents(appCache.cacheDir);
          totalFreed += result.bytesFreed;
          totalFilesRemoved += result.filesRemoved;
          log.push({ category: id, action: 'cleaned', app: appCache.name, filesRemoved: result.filesRemoved, bytesFreed: result.bytesFreed, status: 'success' });
        }
      }
    } catch (e) {
      errors.push({ category: id, error: e.message });
      log.push({ category: id, action: 'cleaned', status: 'error', error: e.message });
    }
  }

  const elapsed = Date.now() - startTime;
  const lastCleaned = { timestamp: new Date().toISOString(), categories: selectedIds, totalFreed, totalFilesRemoved, elapsed };
  try {
    await fs.promises.writeFile(LAST_CLEANED_FILE, JSON.stringify(lastCleaned, null, 2));
    const existingLog = [];
    try {
      const exists = await fs.promises.access(PRIVACY_LOG).then(() => true).catch(() => false);
      if (exists) {
        const data = await fs.promises.readFile(PRIVACY_LOG, 'utf8');
        existingLog.push(...JSON.parse(data));
      }
    } catch {}
    existingLog.push(lastCleaned);
    if (existingLog.length > 100) existingLog.splice(0, existingLog.length - 100);
    await fs.promises.writeFile(PRIVACY_LOG, JSON.stringify(existingLog, null, 2));
  } catch {}

  return {
    success: true,
    totalFreed,
    totalFormatted: fmtBytes(totalFreed),
    totalFilesRemoved,
    elapsed,
    log,
    errors: errors.length > 0 ? errors : undefined,
    cleanedAt: new Date().toISOString()
  };
}

export async function getPrivacyLastCleaned() {
  try {
    const exists = await fs.promises.access(LAST_CLEANED_FILE).then(() => true).catch(() => false);
    if (exists) {
      return JSON.parse(await fs.promises.readFile(LAST_CLEANED_FILE, 'utf8'));
    }
  } catch {}
  return null;
}

export async function getPrivacyLog() {
  try {
    const exists = await fs.promises.access(PRIVACY_LOG).then(() => true).catch(() => false);
    if (exists) {
      return JSON.parse(await fs.promises.readFile(PRIVACY_LOG, 'utf8'));
    }
  } catch {}
  return [];
}

export async function exportPrivacyReport() {
  const scan = await scanPrivacy();
  const log = await getPrivacyLog();
  const last = await getPrivacyLastCleaned();
  const report = {
    title: 'ISHGuard Privacy Cleaner Report',
    generatedAt: new Date().toISOString(),
    computerName: os.hostname(),
    user: os.userInfo().username,
    scan,
    cleaningHistory: log,
    lastCleaned: last
  };
  return report;
}

export async function getPrivacyStats() {
  const scan = await scanPrivacy();
  const log = await getPrivacyLog();
  const last = await getPrivacyLastCleaned();
  const totalEverCleaned = log.reduce((s, l) => s + (l.totalFreed || 0), 0);
  return {
    currentReclaimable: scan.totalBytes,
    currentReclaimableFormatted: scan.totalFormatted,
    currentFiles: scan.totalFiles,
    totalEverCleaned,
    totalEverCleanedFormatted: fmtBytes(totalEverCleaned),
    cleaningSessions: log.length,
    lastCleaned: last ? last.timestamp : null,
    categories: scan.categories.length,
    browsers: scan.browsers,
    apps: scan.apps
  };
}
