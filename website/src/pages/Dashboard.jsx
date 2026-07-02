import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Activity, Cpu, HardDrive, Wifi, Globe, Server, AlertTriangle, Zap, Download, Eye, Lock, CheckCircle2, RefreshCw, Monitor, MapPin, User, Smartphone } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const now = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

const mockAlerts = [
  { id: 1, severity: 'critical', title: 'Suspicious outbound connection detected', time: '2 min ago', source: '192.168.1.105' },
  { id: 2, severity: 'high', title: 'Unusual process spawning from Office suite', time: '7 min ago', source: 'WIN-7X3A' },
  { id: 3, severity: 'medium', title: 'Failed login attempt — RDP port scan', time: '14 min ago', source: '45.33.32.156' },
  { id: 4, severity: 'low', title: 'DNS query to known tracking domain', time: '23 min ago', source: 'metrics.cdn' },
  { id: 5, severity: 'info', title: 'Firewall rule updated — inbound 443 allowed', time: '37 min ago', source: 'Policy Engine' },
];

const severityConfig = {
  critical: { color: 'danger', label: 'CRITICAL' },
  high: { color: 'danger', label: 'HIGH' },
  medium: { color: 'warning', label: 'MEDIUM' },
  low: { color: 'success', label: 'LOW' },
  info: { color: 'info', label: 'INFO' },
};

function detectDevice() {
  const ua = navigator.userAgent;
  let os = 'Unknown';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua) && !/Android/.test(ua)) os = 'Linux';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';

  let browser = 'Unknown';
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = 'Chrome';
  else if (/Firefox/.test(ua)) browser = 'Firefox';
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Edg/.test(ua)) browser = 'Edge';

  return {
    os,
    browser,
    cores: navigator.hardwareConcurrency || 'Unknown',
    memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown',
    language: navigator.language,
    platform: navigator.platform,
    screen: `${screen.width}x${screen.height}`,
  };
}

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastScan, setLastScan] = useState(now());
  const [device] = useState(detectDevice);
  const [geo, setGeo] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setGeoLoading(true);
    fetch('https://ip-api.com/json/?fields=query,city,region,country,isp,org,as,timezone')
      .then(r => r.json())
      .then(data => { if (!cancelled) { setGeo(data); setGeoLoading(false); } })
      .catch(() => { if (!cancelled) setGeoLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => ({
    cpu: Math.floor(Math.random() * 40) + 30,
    memory: Math.floor(Math.random() * 40) + 40,
    networkHealth: Math.random() > 0.8 ? 'Warning' : 'Secure',
    activeThreats: Math.floor(Math.random() * 4),
  }), []);

  const system = useMemo(() => ({
    firewall: Math.random() > 0.1 ? 'Active' : 'Inactive',
    antivirus: Math.random() > 0.15 ? 'Up to Date' : 'Update Needed',
    encryption: Math.random() > 0.2 ? 'Enabled' : 'Disabled',
    updateAgo: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m ago`,
  }), []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setLastScan(now());
      setRefreshing(false);
    }, 1200);
  }, []);

  const getStatusColor = (val) => {
    if (val <= 50) return 'text-success';
    if (val <= 75) return 'text-warning';
    return 'text-risk';
  };

  const getStatusBg = (val) => {
    if (val <= 50) return 'bg-success/20';
    if (val <= 75) return 'bg-warning/20';
    return 'bg-risk/20';
  };

  const statusTextColor = { Protected: 'text-safe', 'At Risk': 'text-risk', Unknown: 'text-warning' };
  const statusBgColor = { Protected: 'bg-safe/20', 'At Risk': 'bg-risk/20', Unknown: 'bg-warning/20' };
  const statusDotColor = { Protected: 'bg-safe', 'At Risk': 'bg-risk', Unknown: 'bg-warning' };
  const systemStatus = stats.activeThreats === 0 && stats.networkHealth === 'Secure' ? 'Protected' : stats.activeThreats > 2 ? 'At Risk' : 'Unknown';
  const systemIcon = systemStatus === 'Protected' ? ShieldCheck : systemStatus === 'At Risk' ? ShieldAlert : Shield;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-brand to-brand/60 bg-clip-text text-transparent">
              Security Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">Real-time system monitoring & threat analysis</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            disabled={refreshing}
            className={refreshing ? 'animate-spin' : ''}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Status Bar */}
        <Card variant="accent" className="mb-8 animate-slide-up delay-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {React.createElement(systemIcon, { className: `w-10 h-10 ${statusTextColor[systemStatus]}` })}
                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusDotColor[systemStatus]} animate-pulse ring-2 ring-dark-900`} />
              </div>
              <div>
                <div className="text-lg font-semibold text-white flex items-center gap-2">
                  System Status: <span className={statusTextColor[systemStatus]}>{systemStatus}</span>
                </div>
                <p className="text-sm text-gray-400">{device.os} &middot; {device.browser} &middot; {geo ? `${geo.city}, ${geo.country}` : 'Detecting location...'} &middot; {stats.activeThreats} active threats</p>
              </div>
            </div>
            <div className="flex gap-6 sm:ml-auto">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{stats.activeThreats}</div>
                <div className="text-xs text-gray-500">Threats Blocked</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">4</div>
                <div className="text-xs text-gray-500">Systems Online</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{lastScan}</div>
                <div className="text-xs text-gray-500">Last Scan</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats Grid */}
        <h2 className="text-lg font-semibold text-gradient mb-4 animate-slide-up delay-2">System Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up delay-2">
          <Card variant="glass">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${getStatusBg(stats.cpu)}`}>
                <Cpu className={`w-4 h-4 ${getStatusColor(stats.cpu)}`} />
              </div>
              <Badge variant={stats.cpu > 75 ? 'warning' : 'success'} size="sm">{stats.cpu > 75 ? 'Heavy' : 'Normal'}</Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.cpu}%</div>
            <div className="text-sm text-gray-400">CPU Usage</div>
            <div className="mt-3 w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${stats.cpu > 75 ? 'bg-warning' : stats.cpu > 50 ? 'bg-brand' : 'bg-success'}`} style={{ width: `${stats.cpu}%` }} />
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${getStatusBg(stats.memory)}`}>
                <HardDrive className={`w-4 h-4 ${getStatusColor(stats.memory)}`} />
              </div>
              <Badge variant={stats.memory > 80 ? 'warning' : 'success'} size="sm">{stats.memory > 80 ? 'High' : 'Normal'}</Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.memory}%</div>
            <div className="text-sm text-gray-400">Memory Usage</div>
            <div className="mt-3 w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${stats.memory > 80 ? 'bg-warning' : stats.memory > 60 ? 'bg-brand' : 'bg-success'}`} style={{ width: `${stats.memory}%` }} />
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stats.networkHealth === 'Secure' ? 'bg-success/20' : 'bg-warning/20'}`}>
                <Wifi className={`w-4 h-4 ${stats.networkHealth === 'Secure' ? 'text-success' : 'text-warning'}`} />
              </div>
              <Badge variant={stats.networkHealth === 'Secure' ? 'success' : 'warning'} size="sm">{stats.networkHealth}</Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.networkHealth}</div>
            <div className="text-sm text-gray-400">Network Health</div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${stats.networkHealth === 'Secure' ? 'bg-success' : 'bg-warning'}`} />
              <span className="text-xs text-gray-500">{stats.networkHealth === 'Secure' ? 'Encrypted connection' : 'Vulnerable service detected'}</span>
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stats.activeThreats > 0 ? 'bg-risk/20' : 'bg-success/20'}`}>
                <ShieldAlert className={`w-4 h-4 ${stats.activeThreats > 0 ? 'text-risk' : 'text-success'}`} />
              </div>
              <Badge variant={stats.activeThreats > 0 ? 'danger' : 'success'} size="sm">{stats.activeThreats > 0 ? 'Active' : 'Clear'}</Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.activeThreats}</div>
            <div className="text-sm text-gray-400">Active Threats</div>
            <div className="mt-3 text-xs text-gray-500">
              {stats.activeThreats === 0 ? 'No threats detected' : `${stats.activeThreats} threat${stats.activeThreats > 1 ? 's' : ''} requiring attention`}
            </div>
          </Card>
        </div>

        {/* System Security */}
        <h2 className="text-lg font-semibold text-gradient mb-4 animate-slide-up delay-3">System Security</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up delay-3">
          <Card variant="glass">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${system.firewall === 'Active' ? 'bg-success/20' : 'bg-risk/20'}`}>
                <Lock className={`w-4 h-4 ${system.firewall === 'Active' ? 'text-success' : 'text-risk'}`} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Firewall</div>
                <div className="text-white font-semibold">{system.firewall}</div>
              </div>
            </div>
            <Badge variant={system.firewall === 'Active' ? 'success' : 'danger'} size="sm">{system.firewall === 'Active' ? 'Secured' : 'Inactive'}</Badge>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${system.antivirus === 'Up to Date' ? 'bg-success/20' : 'bg-warning/20'}`}>
                <Shield className={`w-4 h-4 ${system.antivirus === 'Up to Date' ? 'text-success' : 'text-warning'}`} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Antivirus</div>
                <div className="text-white font-semibold">{system.antivirus}</div>
              </div>
            </div>
            <Badge variant={system.antivirus === 'Up to Date' ? 'success' : 'warning'} size="sm">{system.antivirus === 'Up to Date' ? 'Current' : 'Update'}</Badge>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${system.encryption === 'Enabled' ? 'bg-success/20' : 'bg-risk/20'}`}>
                <Eye className={`w-4 h-4 ${system.encryption === 'Enabled' ? 'text-success' : 'text-risk'}`} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Encryption</div>
                <div className="text-white font-semibold">{system.encryption}</div>
              </div>
            </div>
            <Badge variant={system.encryption === 'Enabled' ? 'success' : 'danger'} size="sm">{system.encryption === 'Enabled' ? 'On' : 'Off'}</Badge>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-brand/20">
                <RefreshCw className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Last Update</div>
                <div className="text-white font-semibold text-sm">{system.updateAgo}</div>
              </div>
            </div>
            <Badge variant="info" size="sm">Scheduled</Badge>
          </Card>
        </div>

        {/* Device Information — real detected data */}
        <h2 className="text-lg font-semibold text-gradient mb-4 animate-slide-up delay-3">Device Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up delay-3">
          <Card variant="glass">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-brand/20">
                <Monitor className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Operating System</div>
                <div className="text-white font-semibold">{device.os}</div>
              </div>
            </div>
            <Badge variant="info" size="sm">{device.platform}</Badge>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-brand/20">
                <Smartphone className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Browser</div>
                <div className="text-white font-semibold">{device.browser}</div>
              </div>
            </div>
            <Badge variant="info" size="sm">{device.language}</Badge>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-brand/20">
                <Cpu className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Hardware</div>
                <div className="text-white font-semibold">{device.cores} cores</div>
              </div>
            </div>
            <Badge variant="info" size="sm">{device.memory} RAM</Badge>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-brand/20">
                <MapPin className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Location</div>
                <div className="text-white font-semibold">
                  {geoLoading ? 'Detecting...' : geo ? `${geo.city}, ${geo.country}` : 'Unknown'}
                </div>
              </div>
            </div>
            <Badge variant="info" size="sm">{geoLoading ? '...' : geo ? geo.isp || geo.org || geo.as?.split(' ')[0] || 'Connected' : 'Offline'}</Badge>
          </Card>
        </div>

        {/* Recent Alerts + Threat Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Alerts */}
          <div className="animate-slide-up delay-4">
            <h2 className="text-lg font-semibold text-gradient mb-4">Recent Alerts</h2>
            <Card variant="glass">
              <div className="space-y-1">
                {mockAlerts.map((alert) => {
                  const cfg = severityConfig[alert.severity];
                  return (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${alert.severity === 'critical' || alert.severity === 'high' ? 'bg-risk' : alert.severity === 'medium' ? 'bg-warning' : alert.severity === 'low' ? 'bg-safe' : 'bg-brand'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{alert.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{alert.source} — {alert.time}</div>
                      </div>
                      <Badge variant={cfg.color} size="sm">{cfg.label}</Badge>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-500">{mockAlerts.length} alerts in last 24h</span>
                <Button variant="ghost" size="sm" icon={Eye}>View All</Button>
              </div>
            </Card>
          </div>

          {/* Threat Map Placeholder */}
          <div className="animate-slide-up delay-5">
            <h2 className="text-lg font-semibold text-gradient mb-4">Global Threat Intelligence</h2>
            <Card variant="glass" className="h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand" />
                  <span className="text-sm text-gray-400">Live threat feed</span>
                </div>
                <Badge variant="info" size="sm">LIVE</Badge>
              </div>
              <div className="grid grid-cols-10 grid-rows-6 gap-1 mb-4">
                {Array.from({ length: 60 }).map((_, i) => {
                  const intensity = Math.random();
                  const colors = intensity > 0.9 ? 'bg-risk/60' : intensity > 0.7 ? 'bg-warning/40' : intensity > 0.4 ? 'bg-brand/20' : 'bg-white/5';
                  return <div key={i} className={`aspect-square rounded-sm ${colors} transition-colors duration-300`} />;
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk/60" /> Critical</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning/40" /> Warning</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand/20" /> Info</span>
                </div>
                <span>42 countries monitored</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up delay-6">
          <Card variant="glass" className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/20">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">1,247</div>
              <div className="text-xs text-gray-400">Threats Neutralized Today</div>
            </div>
          </Card>
          <Card variant="glass" className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-brand/20">
              <Activity className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">99.8%</div>
              <div className="text-xs text-gray-400">Detection Rate</div>
            </div>
          </Card>
          <Card variant="glass" className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-info/20">
              <Server className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">14d 6h</div>
              <div className="text-xs text-gray-400">Uptime Since Last Incident</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
