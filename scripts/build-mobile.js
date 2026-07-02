/**
 * ISHGuard Mobile APK Build Script
 *
 * Builds the Android APK and copies it to the website downloads directory.
 *
 * Prerequisites:
 *   - Android SDK installed with ANDROID_HOME set
 *   - Java JDK 17+
 *   - Gradle (or use the wrapper)
 *
 * Usage:
 *   node scripts/build-mobile.js
 *
 * This script will:
 *   1. Check prerequisites
 *   2. Initialize the Android native project if missing
 *   3. Build the release APK
 *   4. Copy the APK to website/public/downloads/
 *   5. Copy the APK to website/dist/downloads/ (if exists)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const ANDROID_NATIVE_DIR = path.join(ANDROID_DIR, 'android');
const WEBSITE_DOWNLOADS = path.join(ROOT, 'website', 'public', 'downloads');
const WEBSITE_BUILD_DOWNLOADS = path.join(ROOT, 'website', 'dist', 'downloads');
const APK_NAME = 'ISHGuard-Mobile-1.0.0.apk';

function log(msg) {
  console.log(`[Mobile Build] ${msg}`);
}

function checkPrerequisites() {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!androidHome || !fs.existsSync(androidHome)) {
    log('WARNING: ANDROID_HOME not set or SDK not found.');
    log('Set ANDROID_HOME to your Android SDK path (e.g. C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk)');
    log('Continuing in fallback mode — will create placeholder APK info.');
    return false;
  }
  log(`Android SDK found at: ${androidHome}`);
  return true;
}

function initNativeProject() {
  if (fs.existsSync(path.join(ANDROID_NATIVE_DIR, 'build.gradle'))) {
    log('Android native project already exists.');
    return true;
  }

  log('Generating Android native project...');
  try {
    execSync('npx react-native eject', {
      cwd: ANDROID_DIR,
      stdio: 'inherit',
      timeout: 120000,
    });
    log('Android native project generated.');
    return true;
  } catch (err) {
    log('Failed to generate native project: ' + err.message);
    log('Try running: cd android && npx react-native eject');
    log('Then manually copy android/ folder contents to android/android/');
    return false;
  }
}

function buildApk() {
  log('Building release APK...');
  try {
    execSync('./gradlew assembleRelease', {
      cwd: ANDROID_NATIVE_DIR,
      stdio: 'inherit',
      timeout: 600000,
    });
    return path.join(ANDROID_NATIVE_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  } catch (err) {
    log('Build failed: ' + err.message);
    log('Check Android SDK setup and try: cd android/android && ./gradlew assembleRelease');
    return null;
  }
}

function findExistingApk() {
  const patterns = [
    path.join(ANDROID_NATIVE_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
    path.join(ANDROID_NATIVE_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
    path.join(ANDROID_DIR, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
    path.join(ANDROID_DIR, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
  ];
  for (const p of patterns) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function copyApk(sourcePath) {
  if (!fs.existsSync(WEBSITE_DOWNLOADS)) {
    fs.mkdirSync(WEBSITE_DOWNLOADS, { recursive: true });
  }

  const dest = path.join(WEBSITE_DOWNLOADS, APK_NAME);
  fs.copyFileSync(sourcePath, dest);
  log(`APK copied to: ${dest}`);

  // Also copy to dist/ for production builds
  if (fs.existsSync(WEBSITE_BUILD_DOWNLOADS)) {
    const buildDest = path.join(WEBSITE_BUILD_DOWNLOADS, APK_NAME);
    fs.copyFileSync(sourcePath, buildDest);
    log(`APK also copied to: ${buildDest}`);
  }

  return dest;
}

function createPlaceholder() {
  // Create a placeholder file so the download link exists
  // User must replace with a real APK before deploying
  if (!fs.existsSync(WEBSITE_DOWNLOADS)) {
    fs.mkdirSync(WEBSITE_DOWNLOADS, { recursive: true });
  }

  const placeholderPath = path.join(WEBSITE_DOWNLOADS, APK_NAME);

  if (fs.existsSync(placeholderPath)) {
    log(`Placeholder APK already exists at: ${placeholderPath}`);
    log('Replace with a real build before production deployment.');
    return;
  }

  // Write a small placeholder text file renamed as .apk
  // This lets the website link work during development
  const info = JSON.stringify({
    name: 'ISHGuard Mobile',
    version: '1.0.0',
    note: 'Placeholder file. Replace with a real APK build.',
    buildInstructions: 'Run: npm run build:mobile',
    downloadUrl: '/downloads/' + APK_NAME,
    lastUpdated: new Date().toISOString(),
  }, null, 2);

  fs.writeFileSync(placeholderPath, info, 'utf8');
  log(`Placeholder APK created at: ${placeholderPath}`);
  log('IMPORTANT: Replace with a real APK before deploying to production.');
  log('Build the APK: npm run build:mobile');
}

function main() {
  log('ISHGuard Mobile APK Builder');
  log('=' .repeat(40));

  const hasSdk = checkPrerequisites();
  if (!hasSdk) {
    log('\nSDK not found — creating placeholder APK for development.');
    createPlaceholder();
    return;
  }

  const apkFound = findExistingApk();
  if (apkFound) {
    log(`Existing APK found at: ${apkFound}`);
    copyApk(apkFound);
    return;
  }

  const initOk = initNativeProject();
  if (!initOk) {
    log('\nCannot build APK automatically.');
    log('1. Run: cd android && npx react-native eject');
    log('2. Set ANDROID_HOME environment variable');
    log('3. Run: cd android/android && ./gradlew assembleRelease');
    log('4. Then re-run: node scripts/build-mobile.js');
    createPlaceholder();
    return;
  }

  const builtApk = buildApk();
  if (builtApk && fs.existsSync(builtApk)) {
    copyApk(builtApk);
  } else {
    log('Build failed. Check the Android project setup.');
    log('Make sure ANDROID_HOME is set and Java JDK 17+ is installed.');
    createPlaceholder();
  }
}

main();
