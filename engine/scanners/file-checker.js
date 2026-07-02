import fs from 'fs';
import crypto from 'crypto';

const knownSafeHashes = new Set([
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
]);

const knownThreatHashes = new Set([
  '691f3e6c7a8b9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
]);

const HASH_STORE_PATH = process.env.ISHGUARD_HASH_DB || '';

function loadPersistedHashes() {
  if (!HASH_STORE_PATH) return;
  try {
    if (fs.existsSync(HASH_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(HASH_STORE_PATH, 'utf8'));
      if (data.safe) data.safe.forEach(h => knownSafeHashes.add(h));
      if (data.threat) data.threat.forEach(h => knownThreatHashes.add(h));
    }
  } catch {}
}

function persistHashes() {
  if (!HASH_STORE_PATH) return;
  try {
    fs.writeFileSync(HASH_STORE_PATH, JSON.stringify({
      safe: [...knownSafeHashes],
      threat: [...knownThreatHashes]
    }));
  } catch {}
}

loadPersistedHashes();

export function checkFileHash(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { error: 'File not found', status: 'error' };
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return { error: 'Not a file', status: 'error' };
    }

    const hash = crypto.createHash('sha256');
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(65536);
    let bytesRead;

    try {
      while ((bytesRead = fs.readSync(fd, buffer, 0, 65536, null)) > 0) {
        hash.update(buffer.slice(0, bytesRead));
      }
    } finally {
      fs.closeSync(fd);
    }

    const hashDigest = hash.digest('hex');
    const result = {
      file: filePath,
      sha256: hashDigest,
      size: stat.size,
      status: 'unknown'
    };

    if (knownSafeHashes.has(hashDigest)) {
      result.status = 'safe';
      result.verdict = 'Known safe file — hash is in trusted database';
    } else if (knownThreatHashes.has(hashDigest)) {
      result.status = 'risk';
      result.verdict = 'KNOWN THREAT — file hash matches threat database';
    } else {
      result.status = 'unknown';
      result.verdict = 'File hash not in database — treat as suspicious until verified';
    }

    return result;
  } catch (err) {
    return { error: err.message, status: 'error' };
  }
}

export function registerSafeHash(hash) {
  knownSafeHashes.add(hash);
  persistHashes();
}

export function registerThreatHash(hash) {
  knownThreatHashes.add(hash);
  persistHashes();
}
