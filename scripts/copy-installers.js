const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DESKTOP_RELEASE = path.join(ROOT, 'desktop', 'release');
const MOBILE_DIR = path.join(ROOT, 'android');
const MOBILE_NATIVE = path.join(MOBILE_DIR, 'android');
const WEBSITE_DOWNLOADS = path.join(ROOT, 'website', 'public', 'downloads');
const WEBSITE_BUILD_DOWNLOADS = path.join(ROOT, 'website', 'dist', 'downloads');
const APK_NAME = 'ISHGuard-Mobile-1.0.0.apk';

function copyInstallers() {
  console.log('[ISHGuard] Copying installers to website...');

  if (!fs.existsSync(WEBSITE_DOWNLOADS)) {
    fs.mkdirSync(WEBSITE_DOWNLOADS, { recursive: true });
  }

  let copiedCount = 0;

  // Desktop installers
  if (fs.existsSync(DESKTOP_RELEASE)) {
    const items = fs.readdirSync(DESKTOP_RELEASE);
    for (const item of items) {
      const src = path.join(DESKTOP_RELEASE, item);
      const dest = path.join(WEBSITE_DOWNLOADS, item);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest);
        console.log(`  ✓ ${item}`);
        copiedCount++;
      }
    }
  } else {
    console.log('[ISHGuard] No desktop release folder found. Skipping desktop installers.');
  }

  // Mobile APK — check various possible locations
  const apkCandidates = [
    path.join(MOBILE_NATIVE, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
    path.join(MOBILE_NATIVE, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
    path.join(MOBILE_DIR, 'build', 'app-release.apk'),
    path.join(MOBILE_DIR, APK_NAME),
  ];

  let apkSource = null;
  for (const candidate of apkCandidates) {
    if (fs.existsSync(candidate)) {
      apkSource = candidate;
      break;
    }
  }

  if (apkSource) {
    const apkDest = path.join(WEBSITE_DOWNLOADS, APK_NAME);
    fs.copyFileSync(apkSource, apkDest);
    console.log(`  ✓ ${APK_NAME} (from ${apkSource})`);
    copiedCount++;
  } else {
    console.log('[ISHGuard] No mobile APK found. Skipping.');
    console.log('[ISHGuard] Build mobile first: npm run build:mobile');
  }

  // Also copy to dist/downloads/ for production builds
  if (fs.existsSync(WEBSITE_BUILD_DOWNLOADS)) {
    // Desktop
    if (fs.existsSync(DESKTOP_RELEASE)) {
      const items = fs.readdirSync(DESKTOP_RELEASE);
      for (const item of items) {
        const src = path.join(DESKTOP_RELEASE, item);
        const dest = path.join(WEBSITE_BUILD_DOWNLOADS, item);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
        }
      }
    }
    // Mobile APK
    if (apkSource) {
      fs.copyFileSync(apkSource, path.join(WEBSITE_BUILD_DOWNLOADS, APK_NAME));
    }
    console.log(`  → Also copied to dist/downloads/ for production`);
  }

  console.log(`[ISHGuard] Done. ${copiedCount} installer files copied.`);
}

copyInstallers();
