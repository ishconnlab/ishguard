import * as fs from 'fs';
import * as path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';

const CONFIG_DIR = path.join(os.homedir(), '.ishguard');
const CONFIG_FILE = path.join(CONFIG_DIR, 'screen-lock.json');
const USER_CONFIG_FILE = path.join(CONFIG_DIR, 'screen-lock-user.json');
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function hashData(data) {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
}

function generateId() {
  return crypto.randomUUID();
}

function loadConfig() {
  ensureDir();
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function saveConfig(config) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadUserConfig() {
  ensureDir();
  try {
    if (fs.existsSync(USER_CONFIG_FILE)) {
      const raw = fs.readFileSync(USER_CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return { failedAttempts: [], locked: false, faceLocked: false };
}

function saveUserConfig(config) {
  ensureDir();
  fs.writeFileSync(USER_CONFIG_FILE, JSON.stringify(config, null, 2));
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

function getOrCreateEncryptionKey() {
  const config = loadConfig();
  if (!config.encryptionKey) {
    config.encryptionKey = generateEncryptionKey();
    saveConfig(config);
  }
  return Buffer.from(config.encryptionKey, 'hex');
}

function encryptData(plaintext, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

function decryptData(encrypted, ivHex, key) {
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function execPowerShell(script) {
  try {
    const out = execSync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`, { encoding: 'utf8', timeout: 10000 });
    return out.trim();
  } catch {
    return '';
  }
}

function computeSimilarity(a, b) {
  const bigrams = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
  }
  let intersection = 0;
  let union = 0;
  const bBigrams = new Map();
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    bBigrams.set(bg, (bBigrams.get(bg) || 0) + 1);
  }
  const allKeys = new Set([...bigrams.keys(), ...bBigrams.keys()]);
  for (const k of allKeys) {
    const ca = bigrams.get(k) || 0;
    const cb = bBigrams.get(k) || 0;
    intersection += Math.min(ca, cb);
    union += Math.max(ca, cb);
  }
  return union > 0 ? intersection / union : 0;
}

function getDefaultLockScreenConfig() {
  return {
    showTime: true,
    showDate: true,
    showStatus: true,
    showBattery: true,
    showNetwork: true,
    showWeather: false,
    animatedBg: true,
    glassEffect: true
  };
}

export function registerPin(pin) {
  if (!pin || typeof pin !== 'string') {
    return { error: 'PIN must be a string' };
  }
  if (!/^\d{6,}$/.test(pin)) {
    return { error: 'PIN must be at least 6 digits' };
  }
  try {
    const config = loadConfig();
    config.pinHash = hashData(pin);
    config.pinRegisteredAt = new Date().toISOString();
    config.pinId = generateId();
    saveConfig(config);
    return { success: true, message: 'PIN registered successfully', id: config.pinId };
  } catch (err) {
    return { error: err.message };
  }
}

export function verifyPin(pin) {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, attempts: 0, error: 'PIN must be a string' };
  }
  try {
    const config = loadConfig();
    if (!config.pinHash) {
      return { valid: false, attempts: 0, error: 'No PIN registered' };
    }
    const userConfig = loadUserConfig();
    if (!Array.isArray(userConfig.failedAttempts)) {
      userConfig.failedAttempts = [];
    }
    const recentAttempts = userConfig.failedAttempts.filter(a => {
      return a.type === 'pin' && (Date.now() - new Date(a.timestamp).getTime()) < 300000;
    });
    const valid = hashData(pin) === config.pinHash;
    if (!valid) {
      userConfig.failedAttempts.push({ type: 'pin', timestamp: new Date().toISOString(), id: generateId() });
    } else {
      userConfig.locked = false;
      userConfig.faceLocked = false;
      config.lastUnlock = new Date().toISOString();
      saveConfig(config);
    }
    saveUserConfig(userConfig);
    return { valid, attempts: recentAttempts.length + 1 };
  } catch (err) {
    return { valid: false, attempts: 0, error: err.message };
  }
}

export function registerPassword(password) {
  if (!password || typeof password !== 'string') {
    return { error: 'Password must be a string' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }
  try {
    const config = loadConfig();
    config.passwordHash = hashData(password);
    config.passwordRegisteredAt = new Date().toISOString();
    config.passwordId = generateId();
    saveConfig(config);
    return { success: true, message: 'Password registered successfully', id: config.passwordId };
  } catch (err) {
    return { error: err.message };
  }
}

export function verifyPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, attempts: 0, error: 'Password must be a string' };
  }
  try {
    const config = loadConfig();
    if (!config.passwordHash) {
      return { valid: false, attempts: 0, error: 'No password registered' };
    }
    const userConfig = loadUserConfig();
    if (!Array.isArray(userConfig.failedAttempts)) {
      userConfig.failedAttempts = [];
    }
    const recentAttempts = userConfig.failedAttempts.filter(a => {
      return a.type === 'password' && (Date.now() - new Date(a.timestamp).getTime()) < 300000;
    });
    const valid = hashData(password) === config.passwordHash;
    if (!valid) {
      userConfig.failedAttempts.push({ type: 'password', timestamp: new Date().toISOString(), id: generateId() });
    } else {
      userConfig.locked = false;
      userConfig.faceLocked = false;
      config.lastUnlock = new Date().toISOString();
      saveConfig(config);
    }
    saveUserConfig(userConfig);
    return { valid, attempts: recentAttempts.length + 1 };
  } catch (err) {
    return { valid: false, attempts: 0, error: err.message };
  }
}

export function checkWindowsHello() {
  try {
    if (process.platform !== 'win32') {
      return { available: false, type: 'none', error: 'Windows Hello is only available on Windows' };
    }
    const script = `
      $biometric = Get-WmiObject -Namespace "root\\wmi" -Class "Win32_Biometric" 2>$null;
      if ($biometric) {
        $types = @();
        foreach ($b in $biometric) {
          if ($b.Type -eq 1) { $types += "face" }
          elseif ($b.Type -eq 2) { $types += "fingerprint" }
        }
        if ($types.Count -gt 0) { Write-Output ($types -join ",") }
        else { Write-Output "none" }
      } else {
        $cap = Get-WmiObject -Namespace "root\\SecurityCenter2" -Class "AntivirusProduct" 2>$null;
        $hello = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Authentication\\LogonUI" -Name "BioCredential" -ErrorAction SilentlyContinue;
        if ($hello -and $hello.BioCredential -eq 1) { Write-Output "fingerprint" }
        else { Write-Output "none" }
      }
    `;
    const result = execPowerShell(script);
    if (result.includes('face')) {
      return { available: true, type: 'face' };
    }
    if (result.includes('fingerprint')) {
      return { available: true, type: 'fingerprint' };
    }
    return { available: false, type: 'none' };
  } catch {
    return { available: false, type: 'none' };
  }
}

export function registerFaceTemplate(templateData) {
  if (!templateData || typeof templateData !== 'string') {
    return { error: 'Face template data must be a base64 string' };
  }
  try {
    const key = getOrCreateEncryptionKey();
    const { encrypted, iv } = encryptData(templateData, key);
    const config = loadConfig();
    config.faceTemplate = encrypted;
    config.faceIv = iv;
    config.faceRegisteredAt = new Date().toISOString();
    config.faceId = generateId();
    saveConfig(config);
    return { success: true, message: 'Face template registered and encrypted at rest', id: config.faceId };
  } catch (err) {
    return { error: err.message };
  }
}

export function verifyFace(templateData) {
  if (!templateData || typeof templateData !== 'string') {
    return { match: false, confidence: 0, error: 'Face template data must be a base64 string' };
  }
  try {
    const config = loadConfig();
    if (!config.faceTemplate || !config.faceIv) {
      return { match: false, confidence: 0, error: 'No face template registered' };
    }
    const userConfig = loadUserConfig();
    if (userConfig.faceLocked) {
      return { match: false, confidence: 0, locked: true, error: 'Face authentication locked — use PIN to unlock' };
    }
    const key = getOrCreateEncryptionKey();
    let storedTemplate;
    try {
      storedTemplate = decryptData(config.faceTemplate, config.faceIv, key);
    } catch {
      return { match: false, confidence: 0, error: 'Failed to decrypt stored template' };
    }
    const similarity = computeSimilarity(storedTemplate, templateData);
    const confidence = Math.round(similarity * 10000) / 100;
    const match = confidence >= 70;
    if (!match) {
      userConfig.failedAttempts.push({ type: 'face', timestamp: new Date().toISOString(), id: generateId() });
      const faceFails = userConfig.failedAttempts.filter(a => {
        return a.type === 'face' && (Date.now() - new Date(a.timestamp).getTime()) < 300000;
      });
      if (faceFails.length >= 3) {
        userConfig.faceLocked = true;
      }
      saveUserConfig(userConfig);
    } else {
      userConfig.faceLocked = false;
      config.lastUnlock = new Date().toISOString();
      saveConfig(config);
      saveUserConfig(userConfig);
    }
    return { match, confidence };
  } catch (err) {
    return { match: false, confidence: 0, error: err.message };
  }
}

export function getAuthMethods() {
  try {
    const config = loadConfig();
    const methods = [];
    if (config.pinHash) {
      methods.push({ type: 'pin', registered: true, registeredAt: config.pinRegisteredAt });
    } else {
      methods.push({ type: 'pin', registered: false });
    }
    if (config.passwordHash) {
      methods.push({ type: 'password', registered: true, registeredAt: config.passwordRegisteredAt });
    } else {
      methods.push({ type: 'password', registered: false });
    }
    if (config.faceTemplate) {
      methods.push({ type: 'face', registered: true, registeredAt: config.faceRegisteredAt });
    } else {
      methods.push({ type: 'face', registered: false });
    }
    const hello = checkWindowsHello();
    methods.push({ type: 'windowsHello', registered: hello.available, available: hello.available, helloType: hello.type });
    return { methods, count: methods.length };
  } catch (err) {
    return { error: err.message, methods: [], count: 0 };
  }
}

export function setAutoLockTimer(seconds) {
  const allowedValues = [15, 30, 60, 120, 300, 600];
  const val = parseInt(seconds, 10);
  if (isNaN(val) || val < 10) {
    return { error: 'Timer must be at least 10 seconds' };
  }
  if (allowedValues.includes(val) || val >= 10) {
    try {
      const config = loadConfig();
      config.autoLockTimer = val;
      config.autoLockTimerUpdatedAt = new Date().toISOString();
      saveConfig(config);
      return { success: true, timer: val };
    } catch (err) {
      return { error: err.message };
    }
  }
  return { error: 'Invalid timer value' };
}

export function getAutoLockTimer() {
  try {
    const config = loadConfig();
    return { timer: config.autoLockTimer || 300 };
  } catch (err) {
    return { error: err.message, timer: 300 };
  }
}

export function setAutoLockTriggers(triggers) {
  if (!triggers || typeof triggers !== 'object') {
    return { error: 'Triggers must be an object' };
  }
  const validKeys = ['onLeave', 'onLogout', 'onShutdown', 'onSleep', 'onScreenLock'];
  const cleaned = {};
  for (const key of validKeys) {
    cleaned[key] = typeof triggers[key] === 'boolean' ? triggers[key] : true;
  }
  try {
    const config = loadConfig();
    config.autoLockTriggers = cleaned;
    config.autoLockTriggersUpdatedAt = new Date().toISOString();
    saveConfig(config);
    return { success: true, triggers: cleaned };
  } catch (err) {
    return { error: err.message };
  }
}

export function getAutoLockTriggers() {
  try {
    const config = loadConfig();
    return {
      triggers: config.autoLockTriggers || {
        onLeave: true,
        onLogout: true,
        onShutdown: true,
        onSleep: true,
        onScreenLock: true
      }
    };
  } catch (err) {
    return { error: err.message, triggers: {} };
  }
}

export function recordFailedAttempt(type) {
  const validTypes = ['pin', 'password', 'face'];
  if (!validTypes.includes(type)) {
    return { error: 'Invalid attempt type. Must be pin, password, or face' };
  }
  try {
    const userConfig = loadUserConfig();
    if (!Array.isArray(userConfig.failedAttempts)) {
      userConfig.failedAttempts = [];
    }
    userConfig.failedAttempts.push({ type, timestamp: new Date().toISOString(), id: generateId() });
    if (type === 'face') {
      const faceFails = userConfig.failedAttempts.filter(a => {
        return a.type === 'face' && (Date.now() - new Date(a.timestamp).getTime()) < 300000;
      });
      if (faceFails.length >= 3) {
        userConfig.faceLocked = true;
      }
    }
    saveUserConfig(userConfig);
    return { success: true, recorded: true, type };
  } catch (err) {
    return { error: err.message };
  }
}

export function getFailedAttempts() {
  try {
    const userConfig = loadUserConfig();
    const attempts = Array.isArray(userConfig.failedAttempts) ? userConfig.failedAttempts : [];
    const now = Date.now();
    const recent = attempts.filter(a => (now - new Date(a.timestamp).getTime()) < 300000);
    const pinFails = recent.filter(a => a.type === 'pin').length;
    const passwordFails = recent.filter(a => a.type === 'password').length;
    const faceFails = recent.filter(a => a.type === 'face').length;
    return {
      attempts,
      recent: recent,
      counts: { pin: pinFails, password: passwordFails, face: faceFails, total: recent.length },
      faceLocked: !!userConfig.faceLocked,
      totalAttempts: attempts.length
    };
  } catch (err) {
    return { error: err.message, attempts: [], counts: { pin: 0, password: 0, face: 0, total: 0 } };
  }
}

export function resetFailedAttempts() {
  try {
    const userConfig = loadUserConfig();
    userConfig.failedAttempts = [];
    userConfig.faceLocked = false;
    userConfig.locked = false;
    saveUserConfig(userConfig);
    return { success: true, message: 'Failed attempts reset' };
  } catch (err) {
    return { error: err.message };
  }
}

export function checkCameraPrivacy() {
  try {
    const config = loadConfig();
    const hasFaceTemplate = !!config.faceTemplate;
    const usingEncryption = hasFaceTemplate && !!config.faceIv && !!config.encryptionKey;
    return {
      localOnly: true,
      noCloud: true,
      templatesEncrypted: usingEncryption,
      indicatorActive: hasFaceTemplate
    };
  } catch {
    return { localOnly: true, noCloud: true, templatesEncrypted: false, indicatorActive: false };
  }
}

export function getLockScreenConfig() {
  try {
    const userConfig = loadUserConfig();
    const display = userConfig.lockScreenConfig || getDefaultLockScreenConfig();
    return display;
  } catch (err) {
    return { error: err.message, ...getDefaultLockScreenConfig() };
  }
}

export function setLockScreenConfig(config) {
  if (!config || typeof config !== 'object') {
    return { error: 'Lock screen config must be an object' };
  }
  const validKeys = ['showTime', 'showDate', 'showStatus', 'showBattery', 'showNetwork', 'showWeather', 'animatedBg', 'glassEffect'];
  const existing = getLockScreenConfig();
  const merged = { ...existing };
  for (const key of validKeys) {
    if (typeof config[key] === 'boolean') {
      merged[key] = config[key];
    }
  }
  try {
    const userConfig = loadUserConfig();
    userConfig.lockScreenConfig = merged;
    saveUserConfig(userConfig);
    return { success: true, config: merged };
  } catch (err) {
    return { error: err.message };
  }
}

export function getScreenLockStatus() {
  try {
    const config = loadConfig();
    const userConfig = loadUserConfig();
    const pinRegistered = !!config.pinHash;
    const passwordRegistered = !!config.passwordHash;
    const faceRegistered = !!config.faceTemplate;
    const hello = checkWindowsHello();
    const authMethods = [];
    if (pinRegistered) authMethods.push('pin');
    if (passwordRegistered) authMethods.push('password');
    if (faceRegistered) authMethods.push('face');
    if (hello.available) authMethods.push('windowsHello');
    const failedAttemptsData = getFailedAttempts();
    const cameraPrivacy = checkCameraPrivacy();
    let securityScore = 0;
    if (pinRegistered || passwordRegistered) securityScore += 30;
    if (faceRegistered) securityScore += 20;
    if (authMethods.length >= 2) securityScore += 15;
    if (config.autoLockTimer && config.autoLockTimer <= 120) securityScore += 15;
    if (cameraPrivacy.templatesEncrypted) securityScore += 10;
    if (hello.available) securityScore += 10;
    return {
      locked: userConfig.locked || false,
      faceLocked: userConfig.faceLocked || false,
      authMethods,
      authMethodsCount: authMethods.length,
      timer: config.autoLockTimer || 300,
      failedAttempts: failedAttemptsData.counts,
      totalFailedAttempts: failedAttemptsData.totalAttempts,
      lastUnlock: config.lastUnlock || null,
      securityScore: Math.min(100, securityScore),
      securityLevel: securityScore >= 80 ? 'strong' : securityScore >= 50 ? 'moderate' : 'weak',
      cameraPrivacy,
      hasPin: pinRegistered,
      hasPassword: passwordRegistered,
      hasFace: faceRegistered,
      windowsHello: hello.available ? hello.type : null
    };
  } catch (err) {
    return { error: err.message };
  }
}

export function runScreenLockScan() {
  try {
    const config = loadConfig();
    const userConfig = loadUserConfig();
    const pinRegistered = !!config.pinHash;
    const passwordRegistered = !!config.passwordHash;
    const faceRegistered = !!config.faceTemplate;
    const hello = checkWindowsHello();
    const hasAuthMethod = pinRegistered || passwordRegistered || faceRegistered || hello.available;
    const hasTimer = !!config.autoLockTimer;
    const triggers = config.autoLockTriggers || {};
    const triggersCount = Object.values(triggers).filter(Boolean).length;
    const displayConfig = getLockScreenConfig();
    let readiness = 'ready';
    const issues = [];
    if (!hasAuthMethod) {
      readiness = 'incomplete';
      issues.push('No authentication method registered');
    }
    if (!hasTimer) {
      issues.push('No auto-lock timer configured');
    }
    if (triggersCount === 0) {
      issues.push('No auto-lock triggers enabled');
    }
    if (faceRegistered && !config.faceIv) {
      issues.push('Face template encryption may be incomplete');
    }
    if (userConfig.faceLocked) {
      issues.push('Face authentication is locked — requires PIN to unlock');
    }
    return {
      ready: readiness === 'ready',
      readiness,
      issues,
      timestamp: new Date().toISOString(),
      scanId: generateId(),
      summary: {
        authMethods: {
          pin: pinRegistered,
          password: passwordRegistered,
          face: faceRegistered,
          windowsHello: hello.available ? hello.type : false
        },
        hasTimer,
        timerValue: config.autoLockTimer || 300,
        activeTriggers: triggersCount,
        triggers,
        displayConfig,
        faceLocked: userConfig.faceLocked || false,
        windowsHelloAvailable: hello.available
      }
    };
  } catch (err) {
    return { error: err.message, ready: false, readiness: 'error', issues: [err.message] };
  }
}
