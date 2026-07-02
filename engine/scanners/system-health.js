import os from 'os';
import { execSync } from 'child_process';

function getDiskInfo() {
  try {
    if (process.platform === 'win32') {
      const output = execSync('wmic logicaldisk where drivetype=3 get size,freespace /format:csv', { encoding: 'utf8', timeout: 3000 });
      const lines = output.trim().split('\n').filter(l => l.trim());
      let total = 0, free = 0;
      for (const line of lines.slice(1)) {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const sz = parseInt(parts[2], 10);
          const fr = parseInt(parts[1], 10);
          if (!isNaN(sz) && !isNaN(fr)) {
            total += sz;
            free += fr;
          }
        }
      }
      return { total, free };
    }
    const output = execSync('df -k --total 2>/dev/null || df -k /', { encoding: 'utf8', timeout: 3000 });
    const lines = output.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const parts = lastLine.split(/\s+/);
    if (parts.length >= 4) {
      return {
        total: (parseInt(parts[1], 10) || 0) * 1024,
        free: (parseInt(parts[3], 10) || 0) * 1024
      };
    }
  } catch {}
  return { total: 0, free: 0 };
}

function getCpuStats() {
  const load = os.loadavg();
  const cpus = os.cpus() || [];
  const cpuCount = Math.max(1, cpus.length);
  try {
    if (process.platform === 'win32') {
      const out = execSync('wmic cpu get loadpercentage /format:csv', { encoding: 'utf8', timeout: 3000 });
      const lines = out.trim().split('\n').filter(l => l.trim());
      if (lines.length >= 2) {
        const parts = lines[1].split(',');
        const val = parseInt(parts[1], 10);
        if (!isNaN(val)) return { usagePercent: val, load1m: load[0], load5m: load[1], load15m: load[2] };
      }
    } else {
      return { usagePercent: Math.min(100, Math.round((load[0] / cpuCount) * 100)), load1m: load[0], load5m: load[1], load15m: load[2] };
    }
  } catch {}
  return { usagePercent: 0, load1m: load[0], load5m: load[1], load15m: load[2] };
}

export function scanSystemHealth() {
  const cpuStats = getCpuStats();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;
  const disk = getDiskInfo();
  const diskPercent = disk.total > 0 ? Math.round(((disk.total - disk.free) / disk.total) * 100) : 0;

  const results = {
    cpu: {
      cores: os.cpus().length,
      load1m: cpuStats.load1m,
      load5m: cpuStats.load5m,
      load15m: cpuStats.load15m,
      usagePercent: cpuStats.usagePercent,
      status: cpuStats.usagePercent > 85 ? 'warning' : 'safe'
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usagePercent: memPercent,
      status: memPercent > 95 ? 'risk' : memPercent > 85 ? 'warning' : 'safe'
    },
    disk: {
      total: disk.total,
      free: disk.free,
      usagePercent: diskPercent,
      status: diskPercent > 95 ? 'risk' : diskPercent > 85 ? 'warning' : diskPercent > 0 ? 'safe' : 'unknown'
    },
    uptime: os.uptime(),
    hostname: os.hostname(),
    platform: process.platform,
    arch: os.arch()
  };
  return results;
}

export async function getStartupPrograms() {
  const homedir = os.homedir();
  const startupPaths = [];

  if (process.platform === 'win32') {
    startupPaths.push(
      `${homedir}\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup`,
      'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup'
    );
    try {
      const items = [];
      for (const p of startupPaths) {
        const { readdirSync, statSync } = fs;
        try {
          const files = readdirSync(p);
          for (const f of files) {
            const fp = `${p}\\${f}`;
            try { items.push({ name: f, path: fp, size: statSync(fp).size }); } catch {}
          }
        } catch {}
      }
      return { paths: startupPaths, items, count: items.length };
    } catch {
      return { paths: startupPaths, items: [], note: 'Could not read startup folders' };
    }
  }
  return { paths: startupPaths, items: [], note: 'Startup detection only available on Windows' };
}
