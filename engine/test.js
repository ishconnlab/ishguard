import { runFullScan, scanBluetoothDevices, getBluetoothTransferDirs } from './index.js';

console.log('=' .repeat(60));
console.log('  ISHGuard v3.0 — Enterprise AI Security Engine');
console.log('  Self-Test Suite');
console.log('=' .repeat(60));

try {
  const result = await runFullScan();

  console.log('\n  ── Bluetooth Security Check ──');
  const btDevices = scanBluetoothDevices();
  console.log(`  [BT] Devices: ${btDevices.count} (${btDevices.connected} connected)`);
  const btDirs = getBluetoothTransferDirs();
  console.log(`  [BT] Transfer dirs: ${btDirs.length}`);
  btDirs.forEach(d => console.log(`       • ${d}`));

  console.log('\n' + '=' .repeat(60));
  console.log(`  Scan Verdict: ${result.verdict.status.toUpperCase()}`);
  console.log(`  Risk Score:   ${result.analysis.riskScore}/100 (${result.analysis.riskLevel})`);
  console.log(`  Modules:      ${result.validation.passed}/${result.validation.modules.length} passed`);
  console.log(`  Hardening:    ${result.hardening.total} checks`);
  console.log(`  Timestamp:    ${result.timestamp}`);
  console.log(`  Engine:       ${result.version}`);
  console.log('=' .repeat(60));
  console.log('\n  ✓ Self-test completed successfully');
} catch (err) {
  console.error('\n  ✗ Self-test failed:', err.message);
  process.exit(1);
}
