import { execSync } from 'child_process';
import { suspiciousProcesses, knownSafeProcesses } from '../rules-engine.js';

export function scanProcesses() {
  try {
    let processes = [];

    if (process.platform === 'win32') {
      const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf8', timeout: 5000 });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.replace(/"/g, '').split(',');
        if (parts.length >= 5) {
          const pid = parseInt(parts[1], 10);
          const memStr = parts[4].replace(/[^0-9]/g, '');
          processes.push({
            name: parts[0],
            pid: isNaN(pid) ? 0 : pid,
            sessionName: parts[2],
            sessionNum: parts[3],
            memUsage: parseInt(memStr, 10) || 0
          });
        }
      }
    } else {
      const output = execSync('ps aux --sort=-%cpu | head -50', { encoding: 'utf8', timeout: 5000 });
      const lines = output.trim().split('\n').slice(1);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 11) {
          processes.push({
            name: parts[10],
            pid: parseInt(parts[1], 10),
            cpuPercent: parseFloat(parts[2]),
            memPercent: parseFloat(parts[3]),
            memUsage: parseInt(parts[5], 10) || 0
          });
        }
      }
    }

    return analyzeProcesses(processes);
  } catch (err) {
    return {
      processes: [],
      threats: [],
      total: 0,
      threatCount: 0,
      status: 'error',
      error: err.message
    };
  }
}

function analyzeProcesses(processes) {
  const threats = [];
  const warnings = [];

  for (const proc of processes) {
    const nameLower = proc.name.toLowerCase();

    const exactMatch = suspiciousProcesses.some(sp => nameLower === sp.toLowerCase());
    const substringMatch = exactMatch ? false : suspiciousProcesses.some(sp =>
      nameLower.includes(sp.toLowerCase()) && sp.length > 4
    );

    const isSafe = knownSafeProcesses.some(sp => {
      const safeLower = sp.toLowerCase();
      return nameLower === safeLower;
    });
    const isSafePrefix = !isSafe && knownSafeProcesses.some(sp => {
      const safeLower = sp.toLowerCase();
      return safeLower.length > 4 && (nameLower.startsWith(safeLower) || nameLower.endsWith(safeLower));
    });

    if ((exactMatch || substringMatch) && !isSafe) {
      threats.push({
        ...proc,
        reason: substringMatch ? 'Partial name match with known suspicious pattern' : 'Exact match with known suspicious process',
        severity: exactMatch ? 'risk' : 'warning'
      });
    }

    if (proc.cpuPercent && proc.cpuPercent > 80 && !isSafe && threats.length < 50) {
      warnings.push({
        ...proc,
        reason: `High CPU usage: ${proc.cpuPercent}%`,
        severity: 'info'
      });
    }
  }

  const allIssues = [...threats, ...warnings];

  return {
    processes,
    threats: allIssues,
    total: processes.length,
    threatCount: allIssues.length,
    status: allIssues.length === 0 ? 'safe' :
            threats.length > 0 ? 'risk' : 'warning'
  };
}
