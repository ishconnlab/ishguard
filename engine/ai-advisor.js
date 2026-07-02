export class AIAdvisor {
  constructor() {
    this.anomalyHistory = [];
  }

  analyze(scanResults) {
    const { health, network, processes, malware, verdict, fileIntegrity, registry, memory, browser, credentials } = scanResults;
    const findings = [];
    let riskScore = 0;

    this._analyzeDeviceHealth(health, findings, risk => riskScore += risk);
    this._analyzeNetwork(network, findings, risk => riskScore += risk);
    this._analyzeProcesses(processes, findings, risk => riskScore += risk);
    this._analyzeMalware(malware, findings, risk => riskScore += risk);
    this._analyzeRegistry(registry, findings, risk => riskScore += risk);
    this._analyzeMemory(memory, findings, risk => riskScore += risk);
    this._analyzeBrowser(browser, findings, risk => riskScore += risk);
    this._analyzeFileIntegrity(fileIntegrity, findings, risk => riskScore += risk);
    this._analyzeCredentials(credentials, findings, risk => riskScore += risk);

    riskScore = Math.min(100, Math.max(0, riskScore));
    const riskLevel = riskScore >= 70 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 15 ? 'medium' : 'low';

    this.anomalyHistory.push({ riskScore, riskLevel, timestamp: Date.now() });
    if (this.anomalyHistory.length > 100) this.anomalyHistory.shift();
    const anomaly = this._detectAnomaly(riskScore);

    return {
      riskScore,
      riskLevel,
      scoreBreakdown: this._getBreakdown(findings),
      summary: this._generateSummary(riskLevel, riskScore, findings, anomaly),
      findings: findings.filter(f => f.severity !== 'safe'),
      allFindings: findings,
      anomalyDetected: anomaly,
      autoFixAvailable: findings.some(f => f.autoFix && (f.severity === 'risk' || f.severity === 'warning')),
      autoFixCount: findings.filter(f => f.autoFix && (f.severity === 'risk' || f.severity === 'warning')).length,
      autoFixable: findings.filter(f => f.autoFix).map(f => ({ title: f.title, category: f.category, fixCommand: f.fixCommand })),
      recommendations: this._generateRecommendations(findings),
      analyzedAt: new Date().toISOString(),
      mode: 'ai-engine-v3'
    };
  }

  _analyzeDeviceHealth(health, findings, addRisk) {
    if (!health) return;
    if (health.cpu?.usagePercent > 85) {
      addRisk(25);
      findings.push(this._finding('warning', 'performance', 'High CPU Usage', `CPU at ${health.cpu.usagePercent}%`, 'Excessive CPU may indicate cryptomining, malware, or runaway processes. Check Task Manager for unknown processes consuming resources.', 'Sort processes by CPU usage in Process Monitor. Investigate and terminate unknown processes. Run a full malware scan.', true, 'tasklist /FI "CPUTIME gt 00:10:00" /FO LIST', 'wmic process where "PercentProcessorTime > 80" get Name,ProcessId /format:list', 'performance', '1. Press Ctrl+Shift+Esc to open Task Manager\n2. Click the CPU column to sort processes by highest CPU usage\n3. Look for any process name you don\'t recognize\n4. Right-click a suspicious process and select \"Search online\"\n5. If it\'s malware, right-click and choose \"End task\"\n6. Run a full system scan in ISHGuard afterwards', 2));
    }
    if (health.memory?.usagePercent > 90) {
      addRisk(20);
      findings.push(this._finding('warning', 'memory', 'Critical Memory Pressure', `Memory at ${health.memory.usagePercent}%`, 'Extreme memory usage forces disk swapping, severely degrading performance. Common causes: memory leaks, too many programs, or malware consuming RAM.', 'Close unused applications. Disable unnecessary startup programs. Check for memory leak patterns. Consider RAM upgrade if persistent.', true, 'wmic process where "WorkingSetSize > 500000000" get Name,ProcessId,WorkingSetSize /format:list', 'powershell -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select -First 10 Name,WorkingSet64 | Format-Table -AutoSize"', 'memory', '1. Press Ctrl+Shift+Esc to open Task Manager\n2. Click the Memory column to sort by highest usage\n3. Close programs using the most memory (select → \"End task\")\n4. Press Win+R, type \"msconfig\", go to Startup tab\n5. Disable programs you don\'t need starting automatically\n6. Restart your computer to clear memory', 2));
    }
    if (health.disk?.usagePercent > 95) {
      addRisk(20);
      findings.push(this._finding('warning', 'storage', 'Critical Disk Space', `Disk at ${health.disk.usagePercent}%`, 'Extremely low disk space prevents system updates, can cause data corruption, and degrades performance. Check for large temporary files or ransomware encryption activity.', 'Run duplicate file finder. Empty Recycle Bin. Use Disk Cleanup. Check for unusually large files that may indicate ransomware.', true, 'wmic logicaldisk get size,freespace,caption', 'cleanmgr /sagerun:1', 'storage', '1. Open File Explorer, right-click your C: drive → Properties\n2. Click \"Disk Cleanup\" and check all file categories to delete\n3. Empty your Recycle Bin by right-clicking it → \"Empty Recycle Bin\"\n4. Open Settings → Apps → Installed apps and uninstall unused programs\n5. Move large files (videos, backups) to an external drive or cloud storage', 2));
    }
    if (health.temperature && health.temperature > 80) {
      addRisk(15);
      findings.push(this._finding('warning', 'performance', 'Device Overheating', `Temperature at ${health.temperature}°C`, 'High operating temperatures can damage internal components, reduce performance, and shorten device lifespan. Common causes: dust buildup, failing fans, or malware mining cryptocurrency.', 'Check cooling system. Clean vents. Reduce computational load. Monitor with temperature tool.', false, '', '', 'performance', '1. Check that your laptop or PC fans are spinning (listen for noise)\n2. Place your device on a hard, flat surface — not on a bed or lap\n3. Close unnecessary programs to reduce the workload\n4. Use compressed air to gently clean dust from air vents\n5. Consider buying a cooling pad for your laptop\n6. If overheating continues, run a malware scan — cryptominers cause high heat', 2));
    }
    if (health.uptime && health.uptime > 259200) {
      addRisk(5);
      findings.push(this._finding('info', 'performance', 'System Uptime Warning', `Running for ${Math.round(health.uptime / 86400)} days`, 'Extended uptime can lead to memory fragmentation, unreleased file handles, and accumulated temporary files. Periodic reboots apply critical updates.', 'Restart your system to clear temporary memory and apply pending updates.', false, 'net stats workstation', '', 'performance', '1. Save all your open work and close programs\n2. Click the Start button → Power → Restart\n3. Wait for your computer to fully restart\n4. Check that any pending updates finish installing during restart', 3));
    }
    if (health.cpu?.usagePercent <= 60 && health.memory?.usagePercent <= 75 && health.disk?.usagePercent <= 85) {
      findings.push(this._finding('success', 'performance', 'Device Health OK', `CPU ${health.cpu?.usagePercent || '?'}% | MEM ${health.memory?.usagePercent || '?'}% | DISK ${health.disk?.usagePercent || '?'}%`, 'All system health metrics are within normal range.', 'No action needed.', false, '', '', '', '1. No action needed — your system is running well\n2. Continue regular maintenance like weekly restarts\n3. Keep your system clean of unnecessary files', 4));
    }
  }

  _analyzeNetwork(network, findings, addRisk) {
    if (!network) return;
    if (network.publicWifi) {
      addRisk(30);
      findings.push(this._finding('warning', 'network', 'Unsecured Network Detected', 'Public IP address detected — potential MITM risk', 'Public networks (airports, cafes, hotels) often lack encryption, exposing traffic to interception. Attackers can inject malware or steal credentials.', 'Enable VPN immediately. Ensure firewall is active. Avoid accessing sensitive accounts. Use HTTPS-only mode in browser.', true, 'netsh advfirewall show allprofiles', 'netsh advfirewall set allprofiles state on', 'network', '1. Click the network icon in your system tray (bottom-right)\n2. Disconnect from the current public network\n3. Connect to a trusted private network instead if available\n4. If you must use public WiFi, install a VPN app and turn it on first\n5. Enable \"Always use HTTPS\" in your browser security settings\n6. Avoid logging into banking or email while on public WiFi', 2));
    }
    if (network.wifiSecured === false) {
      addRisk(25);
      findings.push(this._finding('warning', 'network', 'Unsecured WiFi', 'WiFi without encryption detected', 'Open WiFi networks allow anyone within range to monitor your traffic, capture passwords, and inject malicious content.', 'Use a VPN. Connect only to WPA2/WPA3 encrypted networks. Consider using your phone as a hotspot with encryption.', false, 'netsh wlan show interfaces', '', 'network', '1. Click the network icon in your taskbar\n2. Look for networks with a lock icon — those are encrypted\n3. Select a secured network and enter its password\n4. Avoid connecting to networks that show \"No password needed\"\n5. Use a VPN for an extra layer of security on any network', 2));
    }
    if (network.vpnActive === false && network.publicWifi === true) {
      addRisk(20);
      findings.push(this._finding('warning', 'network', 'VPN Recommended on Public WiFi', 'Connected to public WiFi without VPN protection', 'Public WiFi without a VPN leaves all your internet traffic visible to others on the same network. Passwords, emails, and browsing data can be intercepted.', 'Install and activate a VPN immediately before browsing on public WiFi.', true, '', '', 'network', '1. Subscribe to a reputable VPN service (ExpressVPN, NordVPN, ProtonVPN)\n2. Download and install the VPN app on your computer\n3. Open the VPN app and click \"Connect\" to a server\n4. Verify you are connected — look for \"VPN On\" or a new IP address\n5. Keep the VPN running the entire time you are on public WiFi\n6. Turn off file sharing in Windows when on public networks', 2));
    }
    if ((network.interfaces?.length || 0) > 4) {
      addRisk(5);
      findings.push(this._finding('info', 'network', 'Multiple Network Interfaces', `${network.interfaces.length} active interfaces`, 'Multiple active network connections increase the attack surface. Each interface is a potential entry point.', 'Disable unused network adapters in Network Connections.', false, 'ipconfig /all', '', 'network', '1. Press Win+R, type \"ncpa.cpl\", and press Enter\n2. Look for network adapters that are disabled or not in use\n3. Right-click any unused adapter (like Bluetooth or virtual adapters)\n4. Select \"Disable\" to reduce your attack surface\n5. Keep only your main WiFi or Ethernet adapter enabled', 3));
    }
    if (network.firewallActive === false) {
      addRisk(20);
      findings.push(this._finding('warning', 'network', 'Firewall Disabled', 'Windows Firewall is not active', 'Without an active firewall, your device is exposed to unauthorized inbound connections, port scans, and network-based attacks.', 'Enable Windows Defender Firewall immediately for all network profiles.', true, 'netsh advfirewall show allprofiles', 'netsh advfirewall set allprofiles state on', 'network', '1. Press Win+R, type \"wf.msc\", and press Enter\n2. Click \"Turn Windows Defender Firewall on or off\" in the left panel\n3. Select \"Turn on Windows Defender Firewall\" for both private and public networks\n4. Click OK to save your changes\n5. Your firewall is now protecting your computer', 2));
    }
    if (!network.publicWifi && network.firewallActive !== false) {
      findings.push(this._finding('success', 'network', 'Network Secured', 'Private network with active firewall', 'Your network connection appears secure with proper encryption and firewall protection.', 'No action needed.', false, '', '', '', '1. No action needed — your network is properly secured\n2. Keep your firewall turned on at all times\n3. Avoid connecting to public WiFi without protection', 4));
    }
  }

  _analyzeProcesses(processes, findings, addRisk) {
    if (!processes) return;
    const threatCount = processes.threats?.length || 0;

    const ransomwareSignals = (processes.threats || []).filter(t =>
      /encrypt|ransom|crypto|locker|decrypt/i.test(t.name)
    );
    if (ransomwareSignals.length > 0) {
      addRisk(45);
      findings.push(this._finding('alert', 'ransomware', 'Ransomware Activity Detected', `${ransomwareSignals.length} ransomware-like process${ransomwareSignals.length > 1 ? 'es' : ''}`, 'Processes matching ransomware behavior patterns detected. These may be encrypting files or holding data for ransom.', 'IMMEDIATE ACTION: Disconnect from network. Do not pay ransom. Run full antivirus scan. Contact IT security team.', true, 'wmic process where "Name like \'%encrypt%\' or Name like \'%ransom%\'" get Name,ProcessId', 'taskkill /F /IM', 'ransomware', '1. Immediately disconnect from the internet (toggle WiFi off or unplug Ethernet)\n2. Do NOT pay any ransom demand — there is no guarantee you will get files back\n3. Press Ctrl+Shift+Esc, find the suspicious process, right-click → \"End task\"\n4. Open Windows Security → Virus & threat protection → \"Quick scan\"\n5. Disconnect any USB drives or external hard drives\n6. Contact IT support or a cybersecurity professional immediately', 1));
    }

    const minerSignals = (processes.threats || []).filter(t =>
      /miner|xmr|cryptonight|ethminer|excavator/i.test(t.name)
    );
    if (minerSignals.length > 0) {
      addRisk(35);
      findings.push(this._finding('alert', 'mining', 'Cryptominer Detected', `${minerSignals.length} mining process${minerSignals.length > 1 ? 'es' : ''} running`, 'Cryptocurrency miners consume system resources, increase electricity costs, and reduce device lifespan. Often installed without consent.', 'Terminate mining processes immediately. Check browser extensions for hidden miners. Run full malware scan.', true, 'wmic process where "Name like \'%miner%\' or Name like \'%crypt%\'" get Name,ProcessId,ExecutablePath', 'taskkill /F /IM', 'mining', '1. Press Ctrl+Shift+Esc to open Task Manager\n2. Look for processes using very high CPU (over 50%)\n3. Right-click the suspicious process → \"Open file location\"\n4. Search the filename online to see if it is a known miner\n5. Right-click the process → \"End task\" to stop it\n6. Run a full malware scan in ISHGuard to find related files', 1));
    }

    const injectSignals = (processes.threats || []).filter(t =>
      /inject|hook|reflect|process hollow|dll load/i.test(t.name)
    );
    if (injectSignals.length > 0) {
      addRisk(40);
      findings.push(this._finding('alert', 'injection', 'Process Injection Detected', `${injectSignals.length} injection technique${injectSignals.length > 1 ? 's' : ''} found`, 'Process injection is a sophisticated technique used by malware to hide malicious code inside legitimate processes. Indicates advanced persistent threat (APT).', 'Run deep system scan. Check for unsigned DLLs loaded into system processes. Consider forensic analysis.', false, 'tasklist /M', '', 'injection', '1. Press Ctrl+Shift+Esc and note any process names flagged in this alert\n2. Run Windows Security by clicking Start → typing \"Windows Security\"\n3. Click \"Virus & threat protection\" → \"Scan options\" → \"Microsoft Defender Offline Scan\"\n4. Click \"Scan now\" — your PC will restart and scan before Windows loads\n5. If threats persist, back up your files and consider reinstalling Windows', 1));
    }

    const phishingSignals = (processes.threats || []).filter(t =>
      /phish|credential|keylog|hook|spoof/i.test(t.name)
    );
    if (phishingSignals.length > 0) {
      addRisk(35);
      findings.push(this._finding('warning', 'phishing', 'Credential Theft Attempt', `${phishingSignals.length} credential-harvesting process${phishingSignals.length > 1 ? 'es' : ''}`, 'Processes attempting to capture keystrokes, form data, or credentials detected. May be part of phishing or identity theft campaign.', 'Change passwords immediately. Enable 2FA on all accounts. Run anti-keylogger scan. Monitor for unauthorized account access.', true, 'tasklist /FI "PID eq 0"', 'powershell -Command "Get-WmiObject Win32_Process | Where-Object {$_.Name -match \'keylog|hook|phish\'} | ForEach-Object {Stop-Process -Id $_.ProcessId -Force}"', 'phishing', '1. Press Ctrl+Shift+Esc → Details tab — find and end suspicious processes\n2. Immediately change your passwords using a different device (phone or tablet)\n3. Enable two-factor authentication (2FA) on your email and banking accounts\n4. Run a full antivirus scan on your computer\n5. Monitor your bank accounts and credit cards for unusual activity\n6. Consider freezing your credit if financial data may be at risk', 2));
    }

    if (processes.bootkitSignals?.length > 0) {
      addRisk(50);
      findings.push(this._finding('alert', 'rootkit', 'Rootkit/Bootkit Detected', `${processes.bootkitSignals.length} boot-level threat${processes.bootkitSignals.length > 1 ? 's' : ''}`, 'Rootkits operate at the kernel level, hiding from standard detection. They survive reboots and can reinfect cleaned systems.', 'Use specialized rootkit removal tools. Consider system restore from clean backup. Full OS reinstall may be necessary.', false, 'fltmc instances', '', 'rootkit', '1. Run Windows Defender Offline Scan (Settings → Update & Security → Windows Security → Virus & threat protection → Scan options → Microsoft Defender Offline Scan)\n2. Download and run Microsoft Safety Scanner from Microsoft\'s website\n3. Use specialized rootkit removal tools like Malwarebytes or Kaspersky TDSSKiller\n4. Check if you have a clean system restore point (Control Panel → Recovery → Open System Restore)\n5. If rootkit keeps coming back, back up personal files and do a clean Windows reinstall\n6. Change all passwords after the cleanup on a separate clean device', 1));
    }

    if (threatCount > 3) {
      addRisk(15);
      findings.push(this._finding('warning', 'processes', 'Multiple Suspicious Processes', `${threatCount} suspicious process${threatCount > 1 ? 'es' : ''}`, 'Multiple processes matching threat patterns. Cross-reference with known software.', 'Review and investigate each detected process.', false, '', '', '', '1. Open Task Manager (Ctrl+Shift+Esc)\n2. Review all processes listed under the Processes tab\n3. Right-click any unknown process and select \"Search online\"\n4. If search confirms it is malware, right-click → \"End task\"\n5. Run a full system scan in ISHGuard to clean up', 2));
    } else if (threatCount > 0) {
      addRisk(10);
      findings.push(this._finding('warning', 'processes', 'Suspicious Process', `${threatCount} potential threat${threatCount > 1 ? 's' : ''}`, 'Process activity requires investigation.', 'Verify process legitimacy. Quarantine if suspicious.', false, '', '', '', '1. Open Task Manager (Ctrl+Shift+Esc)\n2. Locate the suspicious process in the list\n3. Right-click it and choose \"Search online\" to check if it is safe\n4. If the search says it is malicious, right-click → \"End task\"\n5. Quarantine related files using ISHGuard Quarantine Manager', 2));
    }

    if (processes.total > 350) {
      addRisk(5);
      findings.push(this._finding('info', 'processes', 'High Process Count', `${processes.total} running processes`, 'Excessive processes consume resources and may indicate bloatware.', 'Review startup programs and background services.', false, '', '', '', '1. Press Ctrl+Shift+Esc to open Task Manager\n2. Go to the Startup tab\n3. Review all programs that start automatically\n4. Right-click unnecessary programs and select \"Disable\"\n5. Restart your computer for changes to take effect', 3));
    }

    if (threatCount === 0 && (!processes.bootkitSignals || processes.bootkitSignals.length === 0)) {
      findings.push(this._finding('success', 'processes', 'Processes Clean', `${processes.total || 0} processes — all legitimate`, 'No suspicious or malicious process activity detected.', 'No action needed.', false, '', '', '', '1. No action needed — all processes are legitimate\n2. Continue regular monitoring of running programs\n3. Run periodic scans to stay safe', 4));
    }
  }

  _analyzeMalware(malware, findings, addRisk) {
    if (!malware) return;
    const count = malware.threats?.length || 0;
    if (count > 0) {
      const hasRansomware = malware.threats.some(t => /ransom|encrypt|cryptolocker/i.test(JSON.stringify(t)));
      const hasTrojan = malware.threats.some(t => /trojan|backdoor|rat/i.test(JSON.stringify(t)));
      const hasWorm = malware.threats.some(t => /worm|spread|replicate/i.test(JSON.stringify(t)));

      addRisk(count * 15 + (hasRansomware ? 30 : 0) + (hasTrojan ? 20 : 0));

      if (hasRansomware) {
        findings.push(this._finding('alert', 'ransomware', 'Ransomware Files Detected', `${count} malware file${count > 1 ? 's' : ''} including ransomware`, 'Ransomware files found on your system. These can encrypt your documents and demand payment for decryption.', 'IMMEDIATE: Disconnect from network. Do not pay ransom. Quarantine all threats. Restore from verified backup if available.', true, '', 'quarantine', 'ransomware', '1. Immediately disconnect from the internet (toggle WiFi off or unplug cable)\n2. Do NOT pay any ransom — paying does not guarantee you will get your files back\n3. Open ISHGuard and go to the Quarantine Manager tab\n4. Select all detected threats and click \"Quarantine\"\n5. Restore your files from a backup if you have one (external drive or cloud)\n6. Run a full system scan after quarantine to ensure no traces remain', 1));
      }
      if (hasTrojan) {
        findings.push(this._finding('alert', 'trojan', 'Trojan/Backdoor Detected', 'Remote access trojan found on system', 'Trojans provide attackers with remote control of your device, enabling data theft, surveillance, and further malware installation.', 'Quarantine immediately. Change all passwords from a clean device. Monitor for data exfiltration.', true, '', 'quarantine', 'trojan', '1. Open ISHGuard → Quarantine Manager and click \"Quarantine All\"\n2. Use a different device (phone or tablet) to change all your passwords\n3. Start with your email password — attackers use email to reset other accounts\n4. Enable two-factor authentication on every account that supports it\n5. Check for unusual activity in your email, banking, and social media accounts\n6. Run a full system scan to find any remaining threats', 1));
      }

      findings.push(this._finding('alert', 'malware', `Malware Found (${count})`, `${count} malicious file${count > 1 ? 's' : ''} detected`, 'Files matching known malware signatures. Immediate action required to prevent system compromise.', 'Quarantine all threats immediately. Run full system scan after quarantine.', true, '', 'quarantine', 'malware', '1. Open ISHGuard and go to the Quarantine Manager\n2. Select all detected malware files in the list\n3. Click \"Quarantine\" to isolate them from your system\n4. After quarantine completes, click \"Run Full Scan\" to check for more threats\n5. Restart your computer once the full scan finishes\n6. Avoid opening any files or programs that were flagged', 1));
    } else {
      findings.push(this._finding('success', 'malware', 'No Malware Found', `Scanned ${malware.scanned || 0} files — clean`, 'No malware signatures detected in scanned files.', 'Regular scanning recommended for continued protection.', false, '', '', '', '1. No action needed — your files are clean\n2. Schedule regular weekly scans to stay protected\n3. Be careful when downloading files from unknown sources', 4));
    }
  }

  _analyzeRegistry(registry, findings, addRisk) {
    if (!registry?.entries) return;
    const suspicious = registry.entries.filter(e => /auto.?run|runonce|shell|open|command/i.test(e.key) && /temp|appdata|download/i.test(e.value));
    if (suspicious.length > 0) {
      addRisk(25);
      findings.push(this._finding('warning', 'registry', 'Suspicious Registry Entries', `${suspicious.length} auto-run entry${suspicious.length > 1 ? 's' : ''} from temp locations`, 'Registry entries configured to launch executables from temporary or download folders — common persistence mechanism for malware.', 'Review and remove suspicious registry entries. Run full malware scan.', true, 'reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', '', 'registry', '1. Press Win+R, type \"regedit\", and press Enter (click Yes if prompted)\n2. Navigate to HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\n3. Look for entries that point to Temp, AppData, or Downloads folders\n4. Right-click any suspicious entry and select \"Delete\"\n5. Also check HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\n6. Run a full malware scan after cleaning the registry', 2));
    }
    if (registry.entries?.length > 200) {
      addRisk(5);
      findings.push(this._finding('info', 'registry', 'Large Registry Run Key', `${registry.entries.length} auto-start entries`, 'A high number of auto-start entries slows boot time and increases attack surface.', 'Review and disable unnecessary startup programs.', false, '', '', '', '1. Open Task Manager (Ctrl+Shift+Esc)\n2. Go to the Startup tab\n3. Review all programs listed there\n4. Right-click any program you do not need at startup and select \"Disable\"\n5. This will speed up your boot time and reduce security risks', 3));
    }
  }

  _analyzeMemory(memory, findings, addRisk) {
    if (!memory?.sections) return;
    const injected = memory.sections.filter(s => s.type === 'injected' || s.isHidden);
    if (injected.length > 0) {
      addRisk(35);
      findings.push(this._finding('alert', 'memory', 'Memory Injection Detected', `${injected.length} injected section${injected.length > 1 ? 's' : ''} in memory`, 'Hidden or injected memory regions may indicate rootkits or advanced malware operating in memory only.', 'Run memory forensics scan. Check for unsigned drivers. Reboot may be required to clear memory-only threats.', false, '', '', 'memory', '1. Save any open work and close all applications\n2. Restart your computer — this clears the contents of memory\n3. After restart, run Windows Security → \"Scan options\" → \"Full scan\"\n4. Run a Microsoft Defender Offline Scan from the same menu\n5. Check for recently installed software you don\'t recognize in Settings → Apps\n6. Keep Windows and all drivers updated to patch known exploits', 1));
    }
  }

  _analyzeBrowser(browser, findings, addRisk) {
    if (!browser) return;

    if (browser.extensions) {
      const risky = browser.extensions.filter(e => e.permissions?.some(p => /nativeMessaging|debugger|tabs|<all_urls>/i.test(p)));
      if (risky.length > 0) {
        addRisk(15);
        findings.push(this._finding('warning', 'browser', 'Risky Browser Extensions', `${risky.length} extension${risky.length > 1 ? 's' : ''} with broad permissions`, 'Extensions with native messaging, debugging, or all-sites permissions can access browser data and system resources.', 'Review extension permissions. Remove extensions that don\'t need these permissions.', false, '', '', 'browser', '1. Open your browser\'s menu (three dots) → Extensions → Manage Extensions\n2. Review every extension in the list\n3. Look for extensions with permissions like \"Read and change all data on websites\"\n4. Remove any extension you don\'t recognize or no longer use\n5. For extensions you keep, check if they really need broad permissions\n6. Reset your browser settings if problems persist', 2));
      }
    }

    if (browser.phishingSites?.length > 0) {
      addRisk(25);
      findings.push(this._finding('warning', 'phishing', 'Phishing Sites in History', `${browser.phishingSites.length} known phishing site${browser.phishingSites.length > 1 ? 's' : ''} in browsing history`, 'Visits to known phishing websites may have exposed credentials or installed malware.', 'Change passwords for affected sites. Enable phishing protection. Clear browser data.', false, '', '', 'phishing', '1. Change passwords for any sites you visited recently — especially email and banking\n2. Enable phishing protection in your browser (usually in Privacy & Security settings)\n3. Clear your browsing history, cookies, and saved passwords in browser settings\n4. Turn on two-factor authentication for your email account immediately\n5. Check your email and bank accounts for any unusual activity\n6. Run a full malware scan to check for any infections from those sites', 2));
    }

    if (browser.dangerousSettings?.length > 0) {
      addRisk(20);
      findings.push(this._finding('warning', 'browser', 'Dangerous Browser Settings', `${browser.dangerousSettings.length} unsafe setting${browser.dangerousSettings.length > 1 ? 's' : ''} detected`, 'Your browser has security settings that increase the risk of attacks, such as allowing insecure content or disabling popup blocking.', 'Reset browser security settings to default recommendations.', false, '', '', 'browser', '1. Open your browser\'s Settings or Preferences menu\n2. Go to the Privacy & Security section\n3. Look for any settings labeled as insecure or dangerous\n4. Reset browser settings to default if you are unsure what to change\n5. Check for extensions that may have changed your settings without permission\n6. Restart your browser after making changes', 2));
    }
  }

  _analyzeFileIntegrity(integrity, findings, addRisk) {
    if (!integrity?.changes) return;
    const critical = integrity.changes.filter(c => c.severity === 'critical');
    if (critical.length > 0) {
      addRisk(30);
      findings.push(this._finding('alert', 'integrity', 'Critical File Changes Detected', `${critical.length} critical system file${critical.length > 1 ? 's' : ''} modified`, 'Unauthorized changes to system files may indicate malware infection or tampering.', 'Run System File Checker (sfc /scannow). Restore from trusted backup if needed.', true, 'sigverif', 'sfc /scannow', 'integrity', '1. Press Win+R, type \"cmd\", and press Ctrl+Shift+Enter (run as administrator)\n2. Type \"sfc /scannow\" and press Enter — this checks system file integrity\n3. Wait for the scan to finish (it may take 10-15 minutes)\n4. If corrupted files are found, type \"DISM /Online /Cleanup-Image /RestoreHealth\" and press Enter\n5. Restart your computer after the repairs complete\n6. Run a full malware scan to ensure no infection caused the changes', 1));
    }
  }

  _analyzeCredentials(credentials, findings, addRisk) {
    if (!credentials) return;
    if (credentials.reusedPasswords?.length > 0) {
      addRisk(20);
      findings.push(this._finding('warning', 'credentials', 'Reused Passwords Found', `${credentials.reusedPasswords.length} reused password${credentials.reusedPasswords.length > 1 ? 's' : ''} across accounts`, 'Using the same password across multiple sites means one breach compromises all your accounts.', 'Change each reused password to a unique one. Use a password manager to generate and store strong passwords.', true, '', '', 'credentials', '1. Install a password manager like Bitwarden (free) or 1Password\n2. Generate a unique 12+ character password for each account\n3. Start with your most important accounts: email, banking, social media\n4. Update each reused password one by one — do not reuse the old one\n5. Enable two-factor authentication on every account that supports it\n6. Store all your new passwords in the password manager so you never forget them', 2));
    }
    if (credentials.weakPasswords?.length > 0) {
      addRisk(15);
      findings.push(this._finding('warning', 'credentials', 'Weak Passwords Detected', `${credentials.weakPasswords.length} weak password${credentials.weakPasswords.length > 1 ? 's' : ''} found`, 'Short or simple passwords can be cracked in seconds using brute force or dictionary attacks.', 'Change weak passwords to strong passphrases with uppercase, lowercase, numbers, and symbols.', true, '', '', 'credentials', '1. Create a strong passphrase like \"Correct-Horse-Battery-Staple\" — easy to remember, hard to crack\n2. Include at least one uppercase letter, number, and special character\n3. Make every password at least 12 characters long\n4. Never use personal information like birthdays or pet names\n5. Use a password manager to generate and store strong passwords for each site', 2));
    }
    if (credentials.exposedPasswords?.length > 0) {
      addRisk(30);
      findings.push(this._finding('alert', 'credentials', 'Exposed Passwords Found', `${credentials.exposedPasswords.length} password${credentials.exposedPasswords.length > 1 ? 's' : ''} found in known breaches`, 'These passwords have appeared in data breaches and are publicly known. Attackers actively try compromised credentials.', 'Change exposed passwords immediately on all affected accounts. Enable two-factor authentication.', true, '', '', 'credentials', '1. Change affected passwords immediately — start with your email account (attackers use it to reset others)\n2. Change your banking passwords next, then all other affected accounts\n3. Use unique, strong passwords for every site — never reuse the breached ones\n4. Enable two-factor authentication (2FA) on every account that offers it\n5. Visit haveibeenpwned.com to check if your email appears in other breaches\n6. Consider placing a credit freeze if your financial passwords were exposed', 1));
    }
  }

  _detectAnomaly(currentRisk) {
    if (this.anomalyHistory.length < 5) return null;
    const recent = this.anomalyHistory.slice(-5);
    const avgRisk = recent.reduce((s, r) => s + r.riskScore, 0) / recent.length;
    const spike = currentRisk - avgRisk;
    if (spike > 30) {
      return {
        type: 'risk_spike',
        severity: 'critical',
        detail: `Risk score jumped ${Math.round(spike)} points in the last scan`,
        baseline: Math.round(avgRisk),
        current: currentRisk,
        lastStable: recent[recent.length - 2]?.riskLevel || 'unknown'
      };
    }
    return null;
  }

  _finding(type, category, title, detail, explanation, recommendation, autoFix, command, fixCommand, subcategory, userGuide, severityOrder) {
    const severityMap = { alert: 'risk', warning: 'warning', info: 'info', success: 'safe' };
    return {
      type,
      subcategory: subcategory || category,
      category,
      title,
      detail,
      explanation,
      recommendation,
      userGuide: userGuide || '',
      severityOrder: severityOrder ?? (type === 'alert' ? 1 : type === 'warning' ? 2 : type === 'info' ? 3 : 4),
      severity: severityMap[type] || 'info',
      command: command || undefined,
      autoFix: !!autoFix,
      fixCommand: autoFix ? (fixCommand || undefined) : undefined
    };
  }

  _generateSummary(riskLevel, score, findings, anomaly) {
    const alerts = findings.filter(f => f.type === 'alert');
    const warnings = findings.filter(f => f.type === 'warning');
    const infos = findings.filter(f => f.type === 'info');
    let summary = '';

    if (anomaly) {
      summary = `⚠️ ANOMALY DETECTED: ${anomaly.detail}. `;
    }

    if (riskLevel === 'critical') {
      summary += `CRITICAL THREAT LEVEL: Score ${score}/100. `;
      if (alerts.length > 0) summary += `${alerts.length} critical issue${alerts.length > 1 ? 's' : ''} require immediate action. `;
      if (warnings.length > 0) summary += `${warnings.length} warning${warnings.length > 1 ? 's' : ''} found. `;
      summary += 'System integrity at risk. Run full remediation now.';
    } else if (riskLevel === 'high') {
      summary += `HIGH RISK: Score ${score}/100. `;
      if (alerts.length > 0) summary += `${alerts.length} threat${alerts.length > 1 ? 's' : ''} and `;
      summary += `${warnings.length} warning${warnings.length > 1 ? 's' : ''} detected. Review and resolve promptly.`;
    } else if (riskLevel === 'medium') {
      summary += `MEDIUM RISK: Score ${score}/100. ${warnings.length} area${warnings.length > 1 ? 's' : ''} need attention. `;
      summary += 'Review recommendations to improve security posture.';
    } else {
      summary += `LOW RISK — Your system is in good health. Score ${score}/100. `;
      if (findings.length > 0) summary += `${findings.length} item${findings.length > 1 ? 's' : ''} reviewed — all clear.`;
      else summary += 'All security checks passed successfully.';
    }
    return summary;
  }

  _generateRecommendations(findings) {
    const priority = ['risk', 'warning', 'info'];
    return findings
      .filter(f => f.severity !== 'safe')
      .sort((a, b) => {
        const pDiff = priority.indexOf(a.severity) - priority.indexOf(b.severity);
        if (pDiff !== 0) return pDiff;
        return (a.severityOrder || 99) - (b.severityOrder || 99);
      })
      .slice(0, 10)
      .map(f => ({
        priority: f.severity,
        title: f.title,
        action: f.recommendation,
        autoFix: f.autoFix
      }));
  }

  _getBreakdown(findings) {
    const categories = {};
    for (const f of findings) {
      if (!categories[f.category]) categories[f.category] = { total: 0, warnings: 0, risks: 0, safes: 0 };
      categories[f.category].total++;
      if (f.severity === 'risk') categories[f.category].risks++;
      else if (f.severity === 'warning') categories[f.category].warnings++;
      else if (f.severity === 'safe') categories[f.category].safes++;
    }
    return categories;
  }
}
