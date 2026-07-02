import fs from 'fs';
import path from 'path';

export function scanDrive(drivePath) {
  const results = {
    drive: drivePath,
    threats: [],
    suspiciousFiles: [],
    autorunFound: false,
    hiddenExecutables: [],
    status: 'safe'
  };

  try {
    if (!fs.existsSync(drivePath)) {
      return { ...results, status: 'error', error: 'Drive not found' };
    }
    const stat = fs.statSync(drivePath);
    if (!stat.isDirectory()) {
      return { ...results, status: 'error', error: 'Not a directory' };
    }

    let entries;
    try {
      entries = fs.readdirSync(drivePath, { withFileTypes: true });
    } catch {
      return { ...results, status: 'error', error: 'Cannot read drive' };
    }

    const hasAutorun = entries.some(e => e.name.toLowerCase() === 'autorun.inf');
    results.autorunFound = hasAutorun;

    if (hasAutorun) {
      try {
        const autorunContent = fs.readFileSync(path.join(drivePath, 'autorun.inf'), 'utf8');
        if (/open\s*=\s*/i.test(autorunContent) || /action\s*=\s*/i.test(autorunContent) ||
            /shell\s*\\\s*open\s*\\\s*command/i.test(autorunContent)) {
          results.threats.push({
            name: 'AutoRun Infector',
            severity: 'risk',
            detail: 'autorun.inf with Open/Action/Shell directive — potential USB virus autorun',
            file: path.join(drivePath, 'autorun.inf')
          });
        }
      } catch {}
    }

    const lnkFiles = entries.filter(e => e.name.toLowerCase().endsWith('.lnk') && e.isFile());
    const suspiciousLnks = [];

    for (const lnk of lnkFiles) {
      const lnkPath = path.join(drivePath, lnk.name);
      try {
        const content = fs.readFileSync(lnkPath);
        const targetMatch = content.toString('utf16le').match(/[a-zA-Z]:\\[^\x00]{5,}/g);
        const targets = targetMatch || [];
        const hasExecTarget = targets.some(t =>
          /\.(exe|vbs|ps1|bat|cmd|scr|pif|jar)$/i.test(t)
        );
        if (hasExecTarget) {
          suspiciousLnks.push({
            file: lnkPath,
            size: content.length,
            reason: 'Shortcut targeting executable file'
          });
        }
      } catch {}
    }

    results.suspiciousFiles = suspiciousLnks;
    if (suspiciousLnks.length > 0) {
      results.threats.push({
        name: 'Shortcut Virus',
        severity: 'risk',
        detail: `${suspiciousLnks.length} suspicious shortcut${suspiciousLnks.length > 1 ? 's' : ''} found — common USB worm pattern`,
        count: suspiciousLnks.length
      });
    }

    const hiddenExes = [];
    for (const entry of entries) {
      try {
        if (process.platform === 'win32') {
          const attrs = fs.statSync(path.join(drivePath, entry.name));
          const isHidden = (attrs.mode & fs.constants.S_IFMT) === 0 ||
            entry.name.startsWith('~') || entry.name.startsWith('.');
          if (isHidden || (attrs.isFile && false)) {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.exe', '.vbs', '.bat', '.cmd', '.ps1', '.scr', '.pif'].includes(ext)) {
              hiddenExes.push(path.join(drivePath, entry.name));
            }
          }
        } else {
          if (entry.name.startsWith('.') && !['.', '..'].includes(entry.name)) {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.exe', '.vbs', '.bat', '.cmd', '.ps1', '.scr', '.pif'].includes(ext)) {
              hiddenExes.push(path.join(drivePath, entry.name));
            }
          }
        }
      } catch {}
    }
    results.hiddenExecutables = hiddenExes;

    if (hiddenExes.length > 0) {
      results.threats.push({
        name: 'Hidden Executable',
        severity: 'risk',
        detail: `${hiddenExes.length} hidden executable${hiddenExes.length > 1 ? 's' : ''} found on drive root`
      });
    }

    const normalEntries = entries.filter(e => e.isFile() || e.isDirectory());
    const nonLnkEntries = normalEntries.filter(e => {
      const ext = path.extname(e.name).toLowerCase();
      return ext !== '.lnk' && !e.name.startsWith('.') && !e.name.startsWith('~');
    });

    if (lnkFiles.length > nonLnkEntries.length && lnkFiles.length > 3) {
      results.threats.push({
        name: 'Mass Shortcut Infection',
        severity: 'risk',
        detail: `Drive has ${lnkFiles.length} shortcuts but only ${nonLnkEntries.length} real files — shortcut virus indicator`
      });
    }

    if (results.threats.length > 0) results.status = 'risk';

    return results;
  } catch (err) {
    return { ...results, status: 'error', error: err.message };
  }
}

export function listRemovableDrives() {
  if (process.platform !== 'win32') return [];

  const drives = [];
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const drivePath = `${letter}:\\`;
    try {
      const stats = fs.statSync(drivePath);
      let type = 'fixed';
      try {
        const output = fs.readFileSync(null, { encoding: '' });
      } catch {}
      drives.push({
        path: drivePath,
        letter,
        label: `Drive ${letter}:`,
        isReady: true,
        type
      });
    } catch {
      continue;
    }
  }
  return drives;
}
