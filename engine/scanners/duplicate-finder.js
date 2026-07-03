import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { setImmediate as _setImmediate } from 'timers';

function yieldToEventLoop() {
  return new Promise(resolve => _setImmediate(resolve));
}

export async function findDuplicates(rootDir, onProgress) {
  const fileMap = new Map();
  const duplicates = [];
  let scanned = 0;
  let yieldCounter = 0;
  const visited = new Set();

  async function walk(dir) {
    if (visited.has(dir)) return;
    visited.add(dir);
    if (visited.size > 50000) return;

    let entries;
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const skipDirs = new Set(['.', 'System Volume Information', '$Recycle.Bin', 'Windows',
      'Program Files', 'Program Files (x86)', 'node_modules', '.git', 'appdata']);

    for (const entry of entries) {
      if (scanned > 50000) break;
      const fullPath = path.join(dir, entry.name);

      yieldCounter++;
      if (yieldCounter % 50 === 0) {
        await yieldToEventLoop();
      }

      try {
        if (entry.isDirectory()) {
          if (skipDirs.has(entry.name) || entry.name.startsWith('.')) continue;
          await walk(fullPath);
        } else if (entry.isFile()) {
          const stats = await fs.promises.stat(fullPath);
          scanned++;
          if (stats.size === 0) continue;

          const key = `${stats.size}:${path.extname(entry.name).toLowerCase()}`;
          if (!fileMap.has(key)) fileMap.set(key, []);
          fileMap.get(key).push({ path: fullPath, size: stats.size, mtime: stats.mtimeMs });

          if (onProgress && scanned % 100 === 0) {
            onProgress({ scanned, duplicatesFound: duplicates.length });
          }
        }
      } catch {
        continue;
      }
    }
  }

  await walk(rootDir);

  for (const [, files] of fileMap) {
    if (files.length < 2) continue;
    const hashGroups = new Map();

    for (const file of files) {
      try {
        const hash = await getFileHash(file.path);
        if (!hashGroups.has(hash)) hashGroups.set(hash, []);
        hashGroups.get(hash).push(file);
      } catch {
        continue;
      }
    }

    for (const [, group] of hashGroups) {
      if (group.length < 2) continue;
      group.sort((a, b) => a.path.localeCompare(b.path));
      const [original, ...dups] = group;
      for (const dup of dups) {
        duplicates.push({
          original: original.path,
          duplicate: dup.path,
          size: dup.size,
          hash: getHashForGroup(hashGroups, dup)
        });
      }
    }
  }

  return { duplicates, scanned, totalDuplicates: duplicates.length };
}

function getHashForGroup(hashGroups, file) {
  for (const [hash, files] of hashGroups) {
    if (files.some(f => f.path === file.path)) return hash;
  }
  return '';
}

async function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath, { highWaterMark: 65536 });
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}
