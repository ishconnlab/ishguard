const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = [
  path.join(ROOT, 'package.json'),
  path.join(ROOT, 'website', 'package.json'),
  path.join(ROOT, 'desktop', 'package.json'),
  path.join(ROOT, 'android', 'package.json'),
  path.join(ROOT, 'engine', 'package.json'),
];

const newVersion = process.argv[2];
if (!newVersion) {
  console.error('Usage: node scripts/bump-version.js <version>');
  process.exit(1);
}

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  pkg.version = newVersion;
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`  ✓ ${path.relative(ROOT, file)} → ${newVersion}`);
}

console.log(`[ISHGuard] Version bumped to ${newVersion}`);
