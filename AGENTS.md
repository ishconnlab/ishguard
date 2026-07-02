# ISHGuard Security Suite v2.0 — Agent Context

## Project Structure
- `engine/` — Rule-based security engine (Node.js, 100% offline)
  - `scanners/` — 8 scanner modules (malware, duplicate, shortcut, quarantine, health, network, process, file)
  - **`ai-advisor.js`** — Offline behavioral AI: scan analysis → riskScore, explanations, ransomware/cryptominer/phishing/rootkit detection
  - **`feature-validator.js`** — Validates all 10 engine modules at startup
  - **`hardening-advisor.js`** — 10 Windows Group Policy checks with fix commands
  - `rules-engine.js` — Security rules evaluation
  - **`readers/`** — Smart Vault & AI Reader subsystem
    - **`smart-vault.js`** — `SmartVault` class: save, organize, analyze, search, export content offline
    - **`ai-reader.js`** — `AIReader` class: summarize, key points, concepts, flashcards, study notes, translation, text comparison
    - **`content-capture.js`** — URL analysis, HTML extraction, image/link extraction, content classification
    - **`compliance.js`** — URL validation, DRM/paywall detection, file type detection, page type detection
- `website/` — React + Vite + Tailwind landing site (PWA, 13 pages + Vault + 404)
- `desktop/` — Electron Windows security agent (full scanner UI + AI panel + Vault)
- `android/` — React Native mobile app (4 tabs: Dashboard, Scanner, Vault, Permissions)
- `branding/` — Logo variants (light/dark/favicon/app icon)
- `scripts/` — Build helpers

## Key Commands
```bash
npm run dev              # Start website dev server
npm run build:website    # Build static site to website/dist/
npm run build:desktop    # Build .exe installer to desktop/release/ (ISHGuard-Setup.exe + ISHGuard.exe portable)
npm run build:all        # Build engine + website + desktop
npm run dist             # Build all + copy installers to website
npm run start            # Run Electron app in dev mode
npm run serve            # Preview built website
npm run build:engine     # Validate engine (runs self-test)
```

---

## Engine Modules (49 exports)

## Engine Modules (49 exports)

| Module | Purpose |
|--------|---------|
| `scanSystemHealth` | CPU, RAM, disk, uptime, platform |
| `scanNetwork` | Network interfaces, public WiFi, firewall detection |
| `scanProcesses` | Running processes, threat scoring |
| `scanFile` | Malware scan of single file (5MB chunked) |
| `scanDirectory` | Recursive directory threat scan |
| `findDuplicates` | SHA256 duplicate detection |
| `scanDrive` | USB drive shortcut virus scan |
| `listRemovableDrives` | Enumerate Windows drives |
| `quarantineFile` | Move file to quarantine |
| `restoreFile` | Restore from quarantine |
| `deleteQuarantinedFile` | Permanently delete |
| `emptyQuarantine` | Clear entire quarantine |
| `getQuarantineList` | List quarantined items |
| `getQuarantineStats` | Quarantine statistics |
| `quarantineThreats` | Bulk quarantine threats |
| `checkFileHash` | SHA256 hash a file |
| `registerSafeHash` | Register known safe hash |
| `registerThreatHash` | Register known threat hash |
| `getStartupPrograms` | Enumerate startup programs |
| `getWifiSecurity` | Check WiFi encryption |
| `SecurityEngine` | Rules evaluation engine (10 rules) |
| **`AIAdvisor`** | **Behavioral AI analysis (offline): ransomware, cryptominer, phishing, rootkit detection** |
| **`validateAllModules`** | **Validates all 49 engine modules** |
| **`getSystemReadiness`** | **Readiness summary** |
| **`hardeningChecks`** | **10 hardening checks with live evaluation** |
| **`evaluateHardening`** | **Execute and evaluate all checks** |
| **`getHardeningSummary`** | **Hardening summary** |
| `getAIAdvisor` | Singleton accessor |
| `runFullScan` | Full system scan + AI + validation + hardening |
| `runAIAnalysis` | Run AI on arbitrary results |
| `runThreatScan` | Directory malware scan |
| `runDuplicateScan` | Duplicate file scan |
| `runDriveScan` | USB drive scan |
| **`SmartVault`** | **Full vault: save/get/delete/list/search/analyze/export content** |
| **`AIReader`** | **AI summarize, key points, concepts, flashcards, study notes, translate, compare** |
| **`validateUrl`** | **URL validation, DRM/paywall detection** |
| **`detectFileType`** | **File type detection from URL + content-type** |
| **`detectPageType`** | **Page type detection (article/video/image/pdf)** |
| **`checkDrm`** | **DRM header check for protected content** |
| **`isDirectDownload`** | **Check if URL is a direct download** |
| **`isLikelyArticle`** | **Heuristic article detection from HTML** |
| **`analyzeContent`** | **Full URL content analysis with action suggestions** |
| **`extractMetadata`** | **Metadata extraction (title, author, date, OG tags)** |
| **`extractTextFromHtml`** | **Clean text extraction from HTML** |
| **`cleanHtml`** | **Sanitize HTML (remove scripts, styles, iframes)** |
| **`extractImagesFromHtml`** | **Extract image URLs from HTML** |
| **`classifyContent`** | **Content classification + tagging** |
| `getVault` | Singleton vault accessor |
| `getReader` | Singleton reader accessor |

## Malware Signatures (25)
25 signatures across JS/PowerShell/VBS/Batch malware patterns, including EICAR test string, downloaders, cryptominers, ransomware notes, reverse shells, keyloggers, beacons, data exfiltration.

## Risk Levels (4)
- Low (0-14), Medium (15-39), High (40-69), Critical (70-100)

## Malware Signatures (10)
1. EICAR test string
2. JS/PowerShell downloaders
3. VBS/Obfuscated scripts
4. AutoRun infectors
5. Shortcut viruses (.lnk → .exe/.vbs)
6. Hidden executables on drive roots
7. Obfuscated/batch encoded commands
8. Suspicious process names (powershell.exe, cmd.exe, wscript, etc.)
9. Known threat hash database
10. High-entropy (potentially obfuscated) strings

## AI Advisor Capabilities
- Analyzes CPU, memory, network, process scan results
- Produces risk score (0-100) and risk level (low/medium/high)
- Generates natural language summary with per-finding explanations
- Provides actionable recommendations for each finding
- Covers device health, network security, process threats, overall verdict
- 100% offline, rule-based (no LLM dependency)

## Desktop App UI Features (v2.0)
- **Dashboard** — System metrics + **AI Risk Meter** + **Feature Validation** + **Hardening Recommendations** + Alert Timeline
- **Threat Scanner** — Full malware scan with AI post-analysis
- **USB Drive Scan** — Shortcut virus detection on removable drives
- **Duplicate Finder** — SHA256-based deduplication
- **Quarantine Manager** — View/restore/delete isolated threats
- **Content Vault** — Save, organize, analyze, and export content offline with AI Reader
- **Reader Mode** — AI-powered content analysis: summary, key points, flashcards, study notes, translation
- **Floating Action Button** — Vault controls in reader mode (Save, Bookmark, Analyze)
- **Sidebar** — Real-time status indicator (AI-aware)
- **AI Badge** — Shows current risk level in top bar

## IPC Channels (preload.js)
48 channels total: scan, quarantine, AI, validation, hardening, vault (20 channels), reader (3 channels), dialog.

## Desktop API Server (localhost:9721)
- `/api/status` — System health
- `/api/network` — Network info
- `/api/processes` — Process info
- `/api/full` — Full scan + AI data + validation + hardening
- `/api/info` — Engine info (v2, 48 modules)
- `/api/vault/items` — List/save vault items
- `/api/vault/item/:id` — GET/DELETE vault item
- `/api/vault/analyze/:id` — AI analyze vault item

## Vercel Deployment Config
- `vercel.json` at website root with SPA rewrite rules, security headers, cache headers
- `vite.config.js` with `base: '/'`, code splitting (vendor + ui chunks), esbuild minify
- All routes work on deep link reload via `vercel.json` rewrites

## Design Colors
- Background: #050A12 (deep navy)
- Sidebar/header: #0B1F3B
- Accent: #F97316 (orange)
- Safe: #4ade80 (green)
- Warning: #facc15 (yellow)
- Risk: #ef4444 (red)

## Build Order (production)
1. `npm run build:engine` — validates engine
2. `npm run build:website` — builds static site to `website/dist/`
3. `npm run build:desktop` — builds `ISHGuard-Setup.exe` + `ISHGuard.exe` portable to `desktop/release/`
4. `npm run dist:copy-installers` — copies installers to `website/public/downloads/`
5. Deploy `website/dist/` to Vercel or any static host
