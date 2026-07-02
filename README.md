# ISHGuard Security Suite v3.0.0

**Enterprise AI Security Platform** — Advanced device protection, behavioral threat analysis, malware detection, security hardening, AI folder lock, version recovery, folder guardian, smart screen lock, emergency lock, content vault, AI reader & Bluetooth file transfer scanning — all running 100% on-device with zero data collection.

> AI-powered. Privacy-first. Offline by design.

---

## What's Included

| Component | Description | Tech Stack |
|-----------|-------------|------------|
| **Security Engine** | 39-validated-module rule-based engine: threat detection, malware scanning, BT transfer monitoring, behavioral AI analysis, AI folder lock, version recovery, folder guardian, smart screen lock, emergency lock, validation, hardening, smart vault, AI reader | Node.js (ESM) |
| **Website** | 15-page PWA landing site: live dashboard, product showcase, security tools hub, download hub, vault, documentation | React, Vite, Tailwind CSS |
| **Desktop Agent** | Full-featured Windows security app with premium modules (AI Folder Lock, Version Recovery, Folder AI Guardian, Smart Screen Lock, Lock Screen, Emergency Lock), AI panel, content vault, reader mode, Bluetooth security, local API server | Electron, Node.js |
| **Mobile App** | Android security companion with Bluetooth scan, vault, AI reader, app permission auditing | React Native |

### Core Capabilities

- Real system health monitoring (CPU, RAM, Disk, Uptime)
- Network security analysis (WiFi type, public network, firewall status)
- Process monitoring with behavioral threat scoring (10 detection rules)
- Malware & virus scanner (25 signature patterns)
- USB drive scanner (shortcut viruses, autorun.inf, hidden executables)
- SHA256 duplicate file finder and cleanup
- **Bluetooth file transfer monitor** — detect, scan & quarantine incoming BT files
- File integrity verification against trusted databases
- Quarantine management (isolate, restore, delete with audit trail)
- **AI Analysis Engine** — Behavioral analysis, ransomware/cryptominer/phishing/rootkit detection, anomaly alerts, auto-fix recommendations, score breakdown
- **Feature Validator** — Startup health check for all engine modules (39/39)
- **Security Hardening Assistant** — 10 Windows Group Policy checks with fix commands
- **AI Folder Lock** — AES-256 encrypted folder protection with password, PIN, recovery key, favorites, auto-lock triggers
- **Version Recovery Center** — Automatic file version history, snapshot creation, ransomware rollback, backup verification
- **Folder AI Guardian** — Real-time behavioral AI that detects mass rename, encryption, deletion, copying, hidden malware
- **Smart Screen Lock** — Face recognition, Windows Hello, PIN & password authentication with auto-lock timers
- **Lock Screen** — Premium full-screen lock display with animated background, time, date, security status
- **Emergency Lock Mode** — One-click maximum security: lock folders, lock desktop, stop unknown processes, disable USB, start security recording
- **Smart Vault** — Save, organize, analyze, search, and export content offline
- **AI Reader** — Summarize, key points, concepts, flashcards, study notes, translation, text comparison
- **Content Capture** — URL analysis, HTML extraction, content classification, DRM/paywall detection
- 100% offline — no backend, no cloud, no telemetry, no data collection

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm 9+

### Install & Run the Website

```bash
cd website
npm install
npm run dev
```

Open **http://localhost:5173**

### Run the Security Engine (standalone)

```bash
cd engine
node index.js
```

Performs a full system scan + AI analysis + validation (39/39 modules) + hardening check + Bluetooth device scan via OS commands — real CPU, RAM, disk, network, and process data.

### Run the Desktop Agent (development mode)

```bash
cd desktop
npm install
npm run dev
```

Launches the Electron app with full scanner UI, premium security modules (AI Folder Lock, Version Recovery, Folder Guardian, Screen Lock, Lock Screen, Emergency Lock), Bluetooth security, content vault, AI reader, and local API server on port 9721.

---

## Project Structure

```
ishguard/
├── engine/                    # Security engine (core logic)
│   ├── index.js               # Entry point — 75+ exports
│   ├── rules-engine.js        # SecurityEngine class, 10 threat rules
│   ├── ai-advisor.js          # AI analysis engine (offline behavioral)
│   ├── feature-validator.js   # Module health check on startup (39/39)
│   ├── hardening-advisor.js   # 10 Windows Group Policy hardening checks
│   ├── scanners/
│   │   ├── system-health.js   # CPU, RAM, disk, uptime
│   │   ├── network.js         # Interfaces, WiFi security, firewall
│   │   ├── process-monitor.js # Running process analysis
│   │   ├── file-checker.js    # SHA256 file verification
│   │   ├── malware-scanner.js # 25 signature-based malware detection
│   │   ├── duplicate-finder.js# SHA256 duplicate finder
│   │   ├── shortcut-virus.js  # USB drive scanner
│   │   ├── bluetooth-monitor.js# Bluetooth device scan + transfer monitoring
│   │   ├── quarantine.js      # Quarantine management with audit trail
│   │   ├── folder-lock.js     # AI Folder Lock: AES-256 encryption, password/PIN, favorites, recovery key
│   │   ├── version-recovery.js# Version Recovery: snapshots, history, ransomware rollback
│   │   ├── folder-guardian.js # Folder AI Guardian: behavioral analysis, threat detection
│   │   ├── screen-lock.js     # Smart Screen Lock: face, PIN, password, Windows Hello
│   │   └── emergency-lock.js  # Emergency Lock: one-click maximum security mode
│   └── readers/               # Smart Vault & AI Reader subsystem
│       ├── smart-vault.js     # Vault CRUD, search, organize, export
│       ├── ai-reader.js       # Summarize, key points, flashcards, notes
│       ├── content-capture.js # URL analysis, HTML extraction, classification
│       └── compliance.js      # URL validation, DRM/paywall detection
├── website/                   # React landing + download site
│   ├── src/
│   │   ├── pages/             # Home, Dashboard, Services, Agent, Download,
│   │   │                      # Vault, Documentation, SecurityTools, FAQ,
│   │   │                      # SecurityRules, Changelog, PrivacyPolicy,
│   │   │                      # TermsOfService, License, NotFound (15 pages)
│   │   └── components/        # UI (Button, Card, Badge, Modal, Skeleton),
│   │                          # layout (Header, Footer, Layout, AIChat),
│   │                          # home sections
│   ├── public/
│   │   ├── sw.js              # Service worker (cache-first)
│   │   ├── manifest.json      # PWA manifest (standalone display)
│   │   └── downloads/         # Built installer artifacts
│   └── dist/                  # Production build output
├── desktop/                   # Electron Windows app
│   ├── main.js                # Electron main process + API server (100+ IPC handles)
│   ├── preload.js             # IPC bridge — 100+ channels
│   ├── src/
│   │   ├── index.html         # App shell
│   │   └── app.js             # Full UI (vanilla JS, v3 premium UI with 15 views)
│   └── resources/             # Icons
├── android/                   # React Native mobile app
│   └── src/
│       ├── App.js             # 4-tab navigation
│       ├── components/        # Theme, SecurityEngine
│       └── screens/           # Dashboard, Scanner, Vault, Permissions
├── branding/                  # 11 SVG logos + colors.json with brand guidelines
├── scripts/                   # Build helpers
│   ├── copy-installers.js     # Copies builds to website
│   ├── generate-icon.js       # Generates .ico from brand
│   └── bump-version.js        # Version updater
├── AGENTS.md                  # AI assistant context (full module reference)
└── README.md
```

---

## Security Engine v3.0.0

### Architecture

```
Frontend (UI) → IPC/API → Engine → OS APIs → System
                        ↓
                  AI Advisor (offline behavioral analysis)
                        ↓
                  Feature Validator (module health check — 39/39)
                        ↓
                  Hardening Assistant (Group Policy check)
                        ↓
                  AI Folder Lock (AES-256 encryption)
                        ↓
                  Version Recovery (snapshots + ransomware rollback)
                        ↓
                  Folder AI Guardian (behavioral threat detection)
                        ↓
                  Smart Screen Lock (face/PIN/Windows Hello)
                        ↓
                  Emergency Lock (one-click maximum security)
                        ↓
                  Bluetooth Monitor (device scan + transfer detection)
                        ↓
                  Smart Vault & AI Reader (content analysis)
```

All scanning is performed by calling local OS commands and reading system files. The engine evaluates results against a rule set, then runs AI analysis, feature validation, hardening checks, premium security modules, Bluetooth monitoring, and vault/reader operations — all offline.

### What's New in v3.0.0

| Feature | Description |
|---------|-------------|
| **AI Folder Lock** (`scanners/folder-lock.js`) | AES-256 encrypted folder protection. Password & PIN authentication. Lock/unlock individual or all folders. Favorite folders, search, access history. Emergency recovery key generation. Backup/restore encrypted config. Secure delete on removal. Dashboard with protected/locked/unlocked counts and security score. |
| **Version Recovery Center** (`scanners/version-recovery.js`) | Automatic file version history with snapshot creation. Restore any previous version. Compare file versions. Restore deleted or encrypted files. Ransomware rollback detection (Shannon entropy analysis). Incremental & full backup. Backup verification. Scheduled snapshots. Timeline interface. |
| **Folder AI Guardian** (`scanners/folder-guardian.js`) | Real-time folder monitoring with behavioral AI. Detects suspicious file modifications, mass renaming (>5 files), mass encryption (entropy >7.5), unauthorized deletion, suspicious copying, hidden malware behavior. One-click restore from quarantine. Detailed activity timeline. |
| **Smart Screen Lock** (`scanners/screen-lock.js`) | Face recognition with encrypted template storage. Windows Hello biometric detection. PIN (6+ digits) and password authentication. Auto-lock timer (15-600s). Lock on logout/sleep/screen lock. Failed attempt tracking (3 strikes → permanent PIN lock). Camera privacy verification. |
| **Lock Screen** (desktop UI) | Premium full-screen lock overlay. ISHGuard shield branding. Live time and date display. "Protected by ISHGuard" status indicator. Animated background gradients. "Powered by ISHConnect" footer. Smooth unlock animation. |
| **Emergency Lock Mode** (`scanners/emergency-lock.js`) | One-click maximum security activation. Locks all protected folders. Locks workstation. Stops unknown/unauthorized processes. Disables USB storage (optional). Starts security event recording. Secure auth token generation for deactivation. Emergency history logging. |
| **Bluetooth Security** (`scanners/bluetooth-monitor.js`) | Enumerate Bluetooth devices via PowerShell/WMI, monitor BT transfer inbox directories (Downloads/BT, Documents/BT, TEMP/BT), scan incoming files with 25-signature malware engine, 3-action threat prompt (Delete / Quarantine / Cancel) |
| **AI Advisor Rewrite** (`ai-advisor.js`) | Advanced behavioral analysis: ransomware detection, cryptominer detection, process injection analysis, phishing/credential threat detection, rootkit/bootkit detection, memory injection analysis, browser extension risk, anomaly detection with risk spike alerts, auto-fix identification, priority-ranked recommendations, score breakdown by category (600+ lines) |
| **Smart Vault** (`readers/smart-vault.js`) | Save, organize, tag, search, analyze, and export content. Full CRUD with metadata, categories, favorites, timestamps. Singleton accessor via `getVault()`. |
| **AI Reader** (`readers/ai-reader.js`) | Summarize text, extract key points, identify concepts, generate flashcards, create study notes, translate, compare texts. All offline. Singleton via `getReader()`. |
| **Content Capture** (`readers/content-capture.js`) | URL content analysis, HTML sanitization, text extraction, metadata extraction (title/author/date/OG tags), image/link extraction, content classification with action suggestions. |
| **Compliance** (`readers/compliance.js`) | URL validation, DRM/paywall header detection, file type detection (30+ types), page type detection (article/video/image/pdf), direct download detection, article heuristics from HTML. |
| **Rules Engine Expansion** (`rules-engine.js`) | 10 detection rules (up from 5): added Firewall Disabled, Unsecured WiFi, Ransomware Activity, Cryptominer Detected, System Uptime Warning. Expanded suspicious/known-safe process lists. |
| **Website Security Tools Page** | New `/security-tools` route with Duplicate Finder, USB Scan, Bluetooth Security, Quarantine, Hardening sections. Sticky navigation with hash-based scrolling. Card-based layout using premium component system. |

### Engine Modules (75+ exports)

**System & Network**
| Module | Purpose |
|--------|---------|
| `scanSystemHealth` | CPU, RAM, disk, uptime, platform |
| `scanNetwork` | Network interfaces, public WiFi, firewall detection |
| `getWifiSecurity` | WiFi encryption check |
| `scanProcesses` | Running processes, threat scoring |
| `getStartupPrograms` | Enumerate Windows startup programs |

**File & Malware**
| Module | Purpose |
|--------|---------|
| `scanFile` | Malware scan of single file (25 signatures) |
| `scanDirectory` | Recursive directory threat scan |
| `checkFileHash` | SHA256 hash a file |
| `registerSafeHash` | Register known safe hash |
| `registerThreatHash` | Register known threat hash |

**Duplicates & USB**
| Module | Purpose |
|--------|---------|
| `findDuplicates` | SHA256 duplicate detection |
| `scanDrive` | USB drive shortcut virus scan |
| `listRemovableDrives` | Enumerate Windows drives |

**Bluetooth Security**
| Module | Purpose |
|--------|---------|
| `scanBluetoothDevices` | Enumerate paired/connected BT devices |
| `getBluetoothTransferDirs` | Locate BT transfer inbox folders |
| `scanBluetoothTransferDir` | Detect new files in BT transfer folder |
| `scanBluetoothFile` | Scan a BT-transferred file for threats |
| `handleBluetoothThreat` | Delete / Quarantine / Cancel an action |
| `quarantineBluetoothFile` | Move BT threat to quarantine |
| `runBluetoothScan` | Full BT scan: devices + dirs + transfers |

**Quarantine**
| Module | Purpose |
|--------|---------|
| `quarantineFile` | Move file to quarantine |
| `restoreFile` | Restore from quarantine |
| `deleteQuarantinedFile` | Permanently delete |
| `emptyQuarantine` | Clear entire quarantine |
| `getQuarantineList` | List quarantined items |
| `getQuarantineStats` | Quarantine statistics |
| `quarantineThreats` | Bulk quarantine threats |

**AI Folder Lock**
| Module | Purpose |
|--------|---------|
| `listProtectedFolders` | List all protected folders |
| `protectFolder` | Add folder with AES-256 encryption |
| `unlockFolder` | Unlock with password/PIN verification |
| `lockFolder` | Lock a protected folder |
| `lockAllFolders` | Lock all unlocked folders |
| `unlockAllFolders` | Unlock all with master password |
| `removeProtection` | Remove with optional secure delete |
| `getFolderLockStats` | Dashboard: total, locked, unlocked, score |
| `getFolderHistory` | Access history for a folder |
| `searchProtectedFolders` | Search by name/path |
| `toggleFavorite` | Toggle favorite status |
| `regenerateRecoveryKey` | Generate new recovery key |
| `verifyRecoveryKey` | Verify against stored key |
| `backupConfig` | Backup encrypted config |
| `restoreConfig` | Restore config from backup |
| `runFolderLockScan` | Comprehensive scan + stats |

**Version Recovery Center**
| Module | Purpose |
|--------|---------|
| `createSnapshot` | Create version snapshot |
| `createManualSnapshot` | Manual snapshot with label |
| `getVersionHistory` | File version history |
| `restoreVersion` | Restore any previous version |
| `compareVersions` | Compare two snapshots |
| `deleteSnapshot` | Remove a snapshot |
| `restoreDeletedFile` | Restore from most recent snapshot |
| `restoreEncryptedFile` | Restore pre-encryption version |
| `performRansomwareRollback` | Scan + restore encrypted files |
| `scheduleSnapshot` | Schedule auto snapshots |
| `runScheduledSnapshots` | Process scheduled snapshots |
| `getRecoveryStats` | Dashboard: snapshots, size, protected |
| `backupRecoveryDb` | Backup version database |
| `createIncrementalBackup` | Incremental backup |
| `createFullBackup` | Full backup copy |
| `verifyBackupIntegrity` | Check snapshot integrity |
| `runVersionRecoveryScan` | Full scan + new snapshots |

**Folder AI Guardian**
| Module | Purpose |
|--------|---------|
| `watchFolder` | Add folder to watch list |
| `unwatchFolder` | Remove from watch list |
| `getWatchedFolders` | List watched folders |
| `scanForSuspiciousActivity` | AI analysis: mass rename/encrypt/delete/copy |
| `getActivityTimeline` | Recent activity for a folder |
| `getAllActivityTimeline` | Activity across all folders |
| `quarantineThreat` | Move threat files to quarantine |
| `restoreFromQuarantine` | Restore from quarantine |
| `getGuardianStats` | Dashboard: watched, events, threats, score |
| `runGuardianScan` | Full scan on single folder |
| `runAllGuardianScans` | Scan all watched folders |
| `clearTimeline` | Clear old timeline events |

**Smart Screen Lock**
| Module | Purpose |
|--------|---------|
| `registerPin` | Register secure PIN |
| `verifyPin` | Verify PIN with attempt tracking |
| `registerPassword` | Register password |
| `verifyPassword` | Verify password |
| `checkWindowsHello` | Check Windows Hello availability |
| `registerFaceTemplate` | Store encrypted face template |
| `verifyFace` | Verify face with similarity scoring |
| `getAuthMethods` | Available authentication methods |
| `setAutoLockTimer` | Set inactivity timer |
| `getAutoLockTimer` | Get current timer |
| `setAutoLockTriggers` | Configure lock triggers |
| `getAutoLockTriggers` | Get trigger config |
| `recordFailedAttempt` | Record failed auth attempt |
| `getFailedAttempts` | Failed attempt history |
| `resetFailedAttempts` | Reset attempt counter |
| `checkCameraPrivacy` | Verify local-only processing |
| `getLockScreenConfig` | Lock screen display preferences |
| `setLockScreenConfig` | Update display preferences |
| `getScreenLockStatus` | Dashboard: locked, methods, timer, score |
| `runScreenLockScan` | Full readiness scan |

**Emergency Lock Mode**
| Module | Purpose |
|--------|---------|
| `activateEmergencyLock` | One-click emergency activation |
| `deactivateEmergencyLock` | Deactivate with auth token |
| `getEmergencyStatus` | Current emergency state |
| `getEmergencyHistory` | Past emergency events |
| `configureEmergencyOptions` | Set default actions |
| `getEmergencyOptions` | Current configuration |
| `generateAuthToken` | Generate deactivation token |
| `runEmergencyLockScan` | Readiness check |

**AI & Validation**
| Module | Purpose |
|--------|---------|
| `AIAdvisor` | Behavioral analysis (offline) |
| `validateAllModules` | Feature validation (39/39 modules) |
| `getSystemReadiness` | Readiness summary |
| `SecurityEngine` | Rules evaluation engine (10 rules) |

**Hardening**
| Module | Purpose |
|--------|---------|
| `hardeningChecks` | Hardening check list |
| `evaluateHardening` | Evaluate all checks |
| `getHardeningSummary` | Hardening summary |

**Smart Vault**
| Module | Purpose |
|--------|---------|
| `SmartVault` | Vault CRUD, search, organize, export |
| `getVault` | Singleton vault accessor |
| `analyzeContent` | URL content analysis with action suggestions |
| `extractMetadata` | Metadata extraction (title, author, date, OG tags) |
| `extractTextFromHtml` | Clean text extraction from HTML |
| `cleanHtml` | Sanitize HTML (remove scripts, styles, iframes) |
| `extractImagesFromHtml` | Extract image URLs from HTML |
| `classifyContent` | Content classification + tagging |

**AI Reader & Compliance**
| Module | Purpose |
|--------|---------|
| `AIReader` | Summarize, key points, concepts, flashcards, notes, translate, compare |
| `getReader` | Singleton reader accessor |
| `validateUrl` | URL validation, DRM/paywall detection |
| `detectFileType` | File type detection from URL + content-type |
| `detectPageType` | Page type detection (article/video/image/pdf) |
| `checkDrm` | DRM header check for protected content |
| `isDirectDownload` | Check if URL is a direct download |
| `isLikelyArticle` | Heuristic article detection from HTML |

**Convenience**
| Module | Purpose |
|--------|---------|
| `getAIAdvisor` | Singleton AI advisor accessor |
| `runFullScan` | Full system scan + AI + validation + hardening + BT |
| `runAIAnalysis` | Run AI on arbitrary results |
| `runThreatScan` | Directory malware scan |
| `runDuplicateScan` | Duplicate file scan |
| `runDriveScan` | USB drive scan |
| `runBluetoothScan` | Bluetooth device + transfer scan |
| `runFolderLockFullScan` | AI Folder Lock comprehensive scan |
| `runVersionRecoveryFullScan` | Version Recovery full scan |
| `runFolderGuardianFullScan` | Folder Guardian all-folder scan |
| `runScreenLockFullScan` | Screen Lock readiness scan |
| `runEmergencyFullScan` | Emergency Lock status scan |

### Threat Rules (10)

| Rule | Condition | Severity |
|------|-----------|----------|
| RULE-001 | CPU usage > 85% | Warning |
| RULE-002 | Memory usage > 90% | Warning |
| RULE-003 | Public/unsecured WiFi detected | Warning |
| RULE-004 | Suspicious process detected | Risk |
| RULE-005 | Disk space > 95% full | Warning |
| RULE-006 | Windows firewall disabled | Warning |
| RULE-007 | WiFi without encryption | Warning |
| RULE-008 | Ransomware behavior patterns detected | Risk |
| RULE-009 | Cryptominer process running | Risk |
| RULE-010 | System uptime > 72 hours (no restart) | Info |

### Malware Signatures (25 patterns)

- **EICAR test string** — Standard anti-virus test file
- **JS/Downloader** — eval-based obfuscated JavaScript downloaders
- **VBS/Obfuscated** — Visual Basic scripts with Execute/Replace patterns
- **PowerShell/Encoded** — Base64-encoded PowerShell commands
- **PowerShell/DownloadString** — WebClient download strings
- **JS/Obfuscated** — document.write(unescape()) patterns
- **HTML/IframeInject** — Zero-width iframe injections
- **AutoRun/Infector** — autorun.inf with Open directives
- **JS/Redirector** — window.location redirects to foreign domains
- **Batch/Encoded** — cmd.exe /c with encoded commands
- **PowerShell/Mimikatz** — Credential dumping tool invocation
- **PowerShell/Keylogger** — GetAsyncKeyState, SetWindowsHookEx
- **VBS/CryptoObfuscated** — Chr() based obfuscation with 10+ values
- **JS/CryptoMiner** — CoinHive, miner.start, CryptoNight in-browser mining
- **PowerShell/ReverseShell** — TCP client reverse shells
- **Batch/WormPropagation** — Copy-based drive propagation
- **JS/RansomwareNote** — "Your files have been encrypted" messages
- **PowerShell/Dropper** — Assembly.Load and Invoke-Expression droppers
- **VBS/FileSystemObject** — Scripting.FileSystemObject creation
- **JS/Beacon** — XMLHttpRequest to gate/command URLs
- **PowerShell/WMI** — WMI process creation for lateral movement
- **Batch/RegistryPersistence** — Run/RunOnce registry persistence
- **PowerShell/EncodedArgs** — -enc encoded argument patterns
- **JS/DataExfil** — fetch() with data exfiltration patterns
- **AutoRun/Persistence** — Shell= explorer/start to executable

### Quarantine System

- Files are copied to `~/ISHGuard/quarantine/` then deleted from origin
- Metadata maintained in `index.json` within quarantine directory
- Files can be restored to original location or permanently deleted
- Full audit trail with timestamps

---

## Desktop App v3.0.0

The Electron app provides a native Windows interface with premium security UI:

- **Dashboard** — Real-time CPU/Memory/Platform/Uptime metrics + **AI Risk Meter** (circular gauge with score/level) + **Feature Validation Panel** (39/39) + **Hardening Recommendations** + Alert Timeline
- **Threat Scanner** — Full recursive directory scan with circular animation ring, live threat feed, and **AI post-scan analysis**
- **USB Drive Scanner** — Detect and clean shortcut viruses from removable drives
- **Bluetooth Security** — Scan for BT devices, monitor transfer folders, scan incoming files with 3-button threat prompt (Delete / Quarantine / Cancel)
- **Duplicate Finder** — SHA256 hash comparison across selected folders
- **Quarantine Manager** — View, restore, or permanently delete isolated threats
- **AI Folder Lock** — AES-256 encrypted folder protection. Add folders with password/PIN. Lock/unlock with one click. Dashboard with stats, activity history, search, favorites.
- **Version Recovery Center** — Snapshot timeline, manual/automatic snapshots, ransomware rollback, backup verification, scheduled backups.
- **Folder AI Guardian** — Watch folders for suspicious activity. Real-time timeline. Threat detection with severity levels. One-click quarantine/restore.
- **Smart Screen Lock** — Face recognition, Windows Hello, PIN, password. Auto-lock timer (15-600s). Privacy verification. Failed attempt tracking.
- **Lock Screen** — Premium full-screen overlay with ISHGuard shield, live time/date, animated background, "Protected by ISHGuard" branding.
- **Emergency Lock Mode** — One-click activation with pulsing red button. Locks folders, desktop, stops processes, starts recording. Auth token deactivation.
- **Content Vault** — Save, organize, analyze, and export content offline with AI Reader
- **Reader Mode** — AI-powered content analysis: summary, key points, flashcards, study notes, translation
- **Floating Action Button** — Vault controls in reader mode (Save, Bookmark, Analyze)
- **System Tray** — Minimize to tray, quick scan from context menu
- **AI Badge** — Top bar indicator showing current risk level
- **Sidebar** — Real-time status indicator (AI-aware), emergency SOS button, "Powered by ISHConnect" branding, Premium Security section with 6 new module nav buttons
- **First-run auto-scan** — Triggers a full system scan 3 seconds after first launch

### IPC Channels

100+ channels via `preload.js` across scan, quarantine, AI, validation, hardening, bluetooth (7 channels), **folder-lock (16 channels)**, **version (15 channels)**, **guardian (12 channels)**, **screen-lock (18 channels)**, **emergency (8 channels)**, vault (20 channels), and reader (3 channels).

### Local API Server

The desktop agent starts an HTTP server on `localhost:9721` with endpoints:

| Endpoint | Returns |
|----------|---------|
| `/api/status` | System health (CPU, RAM, platform, uptime) |
| `/api/network` | Network interfaces, WiFi security |
| `/api/processes` | Running processes, threats |
| `/api/full` | Complete scan + AI analysis + validation + hardening |
| `/api/info` | Engine version info (v3, 75+ modules) |
| `/api/folder-lock/stats` | Folder lock dashboard statistics |
| `/api/version/stats` | Version recovery statistics |
| `/api/guardian/stats` | Folder guardian statistics |
| `/api/screen-lock/status` | Screen lock readiness status |
| `/api/emergency/status` | Emergency lock status |
| `/api/vault/items` | List/save vault items |
| `/api/vault/item/:id` | GET/DELETE vault item |
| `/api/vault/analyze/:id` | AI analyze vault item |

### Running the Desktop App

```bash
cd desktop
npm install
npm run dev            # Development mode
npm run build          # Production installer (Windows)
```

The built installer will be at `desktop/release/ISHGuard-Setup.exe` (NSIS) with `ISHGuard.exe` portable.

---

## Website & PWA

The website serves as the product showcase and download hub, built for Vercel deployment:

| Page | Description |
|------|-------------|
| **Home** | Hero with SOC dashboard mockup, 16 feature cards, trust indicators, philosophy, live stats |
| **Dashboard** | Real-time SOC dashboard (connects to localhost:9721), RiskGauge, MetricCards, AI findings. Detects device info (OS, browser, CPU cores, RAM) and IP geolocation (city, country, ISP). |
| **Services** | 3 categories, 12 feature cards with descriptions |
| **Agent** | 8 desktop features, app mockup |
| **Download** | 3 platform cards + live installer list |
| **Vault** | Full CRUD vault + AI Reader with text analysis |
| **Documentation** | 7 sections including Bluetooth Security, with developer API reference |
| **Security Tools** | Hub page: Duplicate Finder, USB Scan, Bluetooth Security, Quarantine, Hardening with feature lists and download links |
| **FAQ** | 10 accordion questions answering common queries |
| **Security Rules** | 10 detection rules, 25 malware signatures |
| **Changelog** | 3 release versions with feature breakdowns |
| **Privacy Policy** | Privacy-first data handling statement |
| **Terms of Service** | Usage terms |
| **License** | MIT license text |
| **NotFound (404)** | Custom 404 page |

### PWA Installation

1. Visit the site in Chrome or Edge
2. Click **"Install App"** in the header
3. Installs as a standalone desktop application
4. Works offline after first visit

```bash
cd website
npm install
npm run dev            # Development server on :5173
npm run build          # Production build → website/dist/
```

---

## Mobile App

The React Native companion app with Material Design 3 theming:

- **Dashboard** — Metric cards (battery, memory, network), 4 quick action buttons, pull-to-refresh
- **Scanner** — System Scan + Bluetooth Security tabs with animated progress, device discovery, transfer monitoring, 3-button threat prompts
- **Vault** — Full CRUD vault with category filter, search, AI Reader with text analysis
- **Permissions** — App permission audit with risk badges (dangerous/normal/signature)

```bash
cd android
npm install
npx react-native start
npx react-native run-android
```

---

## Design System

### Colors (v3 Enterprise)

| Token | Value | Usage |
|-------|-------|-------|
| Brand Orange | `#FF6B00` | Primary accent, CTAs, highlights |
| White | `#FFFFFF` | Text, icons on dark backgrounds |
| Light Gray | `#F5F5F5` | Subtle backgrounds, cards |
| Dark Gray | `#2F3437` | Body text, secondary backgrounds |
| Green (Safe) | `#18C964` | Positive status |
| Yellow (Warning) | `#F5A524` | Warning status |
| Red (Risk) | `#FF4D4F` | Critical status |
| Blue (Bluetooth) | `#3B82F6` | Bluetooth security elements |
| Background | `#050A12` | Deep navy page background |
| Glassmorphism | `rgba(255,255,255,0.05)` | Frosted glass surfaces |

### Principles

- AI-powered protection identity — circuit traces, shield geometry, intelligent UI
- Orange + Dark theme — energetic, trustworthy, enterprise feel
- Glassmorphism — modern depth without distraction
- Semantic status colors used sparingly for maximum impact
- Animated background gradients + glow effects for depth without clutter

---

## Production Build

```bash
# Full production pipeline
npm run build:all       # Engine test (39/39 modules) + website build + desktop build
npm run dist            # Build all + copy installers to website/public/downloads/

# Deploy website/dist/ to Vercel or any static host
```

### Individual Builds

```bash
npm run build:engine     # Validate engine (runs self-test)
npm run build:website    # website/dist/
npm run build:desktop    # desktop/release/*.exe
npm run dist:copy-installers  # Copy .exe to website/public/downloads/
```

---

## Engine Validation

```bash
cd engine
npm test
```

Outputs real system data, AI analysis, feature validation (39/39 modules), hardening summary, and Bluetooth status:

```
[ISHGuard v3.0] Enterprise AI Security Engine
[CPU] 12% usage — status: safe
[MEM] 93% usage — status: warning
[NET] Public WiFi: false | Firewall: active — status: safe
[PROC] 262 processes, 0 threats — status: safe
[STATUS] WARNING
[AI] Risk level: medium (score: 20/100)
[FINDINGS] 1 rules triggered, 1 AI observations
[VALIDATION] 39/39 modules passed
[HARDENING] 10 security checks available

  ── Bluetooth Security Check ──
  [BT] Devices: 0 (0 connected)
  [BT] Transfer dirs: 1
       • C:\Users\user\Downloads
```

---

## Privacy

ISHGuard operates entirely offline:

- No cloud services
- No telemetry
- No analytics
- No data collection
- All scans run locally on your device
- No files leave your machine
- No accounts or registration required
- AI analysis is rule-based with zero external API calls
- Bluetooth scanning only monitors local device state — no data transmitted
- Vault content stored in `~/ISHGuard/vault/` — never transmitted
- Face recognition templates stored encrypted at rest — never uploaded
- Emergency lock events logged locally only

---

## Contributing

Contributions that add detection rules, improve scanner performance, or extend platform support are welcome.

### Development Guidelines

1. All scanning must work offline with no external dependencies
2. Security rules must be transparent and explainable
3. No telemetry, analytics, or data collection
4. UI must follow the orange + dark design system
5. All system operations should have error handling for permission issues
6. Bluetooth features must respect device privacy and require user action
7. Premium security modules must maintain the enterprise-quality design language

---

## License

MIT — See [LICENSE](LICENSE) file.

---

*Built for privacy. Operates entirely offline. Enterprise-grade protection for everyone.*
