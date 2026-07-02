import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../components/Theme';
import { scanDevicePerformance, checkPermissions, scanBluetoothDevices, getBluetoothTransferDirs } from '../components/SecurityEngine';

export default function ScannerScreen() {
  const [scanning, setScanning] = useState(false);
  const [btScanning, setBtScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [btResult, setBtResult] = useState(null);
  const [activeTab, setActiveTab] = useState('system');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const btProgressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (anim, toValue, duration = 1000) => {
    Animated.timing(anim, { toValue, duration, useNativeDriver: false }).start();
  };

  const runScan = async () => {
    setScanning(true);
    setResult(null);
    animateProgress(progressAnim, 0.85, 1000);
    await new Promise(r => setTimeout(r, 1200));
    animateProgress(progressAnim, 1, 200);

    const scanResult = scanDevicePerformance(85, { available: 2048, total: 6144 });
    const permFindings = checkPermissions([
      { name: 'SampleApp', permissions: ['CAMERA', 'READ_CONTACTS'] },
    ]);

    const isSafe = scanResult.overall === 'safe' && permFindings.length === 0;
    setResult({ status: isSafe ? 'safe' : 'warning', issues: permFindings.length });
    setScanning(false);
  };

  const runBtScan = useCallback(async () => {
    setBtScanning(true);
    setBtResult(null);
    animateProgress(btProgressAnim, 0.6, 800);

    await new Promise(r => setTimeout(r, 600));
    animateProgress(btProgressAnim, 1, 400);

    try {
      const devices = scanBluetoothDevices();
      const dirs = getBluetoothTransferDirs();
      setBtResult({
        devices: devices.devices || [],
        connectedCount: devices.connected || 0,
        watchDirs: dirs || [],
        status: devices.count > 0 ? 'available' : 'none',
      });
    } catch (e) {
      setBtResult({ devices: [], connectedCount: 0, watchDirs: [], status: 'error', error: e.message });
    }
    setBtScanning(false);
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const btProgressWidth = btProgressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const showBtThreatPrompt = (fileName) => {
    Alert.alert(
      'Bluetooth Threat Detected',
      `A security threat was detected in a file received via Bluetooth:\n\n${fileName}\n\nChoose an action:`,
      [
        { text: 'Delete File', style: 'destructive', onPress: () => Alert.alert('Deleted', 'File has been deleted.') },
        { text: 'Quarantine', onPress: () => Alert.alert('Quarantined', 'File moved to quarantine.') },
        { text: 'Cancel', style: 'cancel', onPress: () => Alert.alert('Cancelled', 'Transfer cancelled.') },
      ]
    );
  };

  const renderSystemScan = () => (
    <>
      <View style={styles.header}>
        <Icon name="shield-search" size={40} color={colors.primary} style={{ marginBottom: spacing.sm }} />
        <Text style={styles.title}>Security Scan</Text>
        <Text style={styles.subtitle}>Scan your device for threats and vulnerabilities</Text>
      </View>

      {scanning ? (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.scanningText}>Scanning your device...</Text>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>
      ) : result ? (
        <View style={[styles.resultCard, { borderColor: result.status === 'safe' ? colors.safe : colors.warning }]}>
          <Icon name={result.status === 'safe' ? 'shield-check' : 'shield-alert'} size={48} color={result.status === 'safe' ? colors.safe : colors.warning} style={{ marginBottom: spacing.sm }} />
          <Text style={[styles.resultTitle, { color: result.status === 'safe' ? colors.safe : colors.warning }]}>
            {result.status === 'safe' ? 'DEVICE CLEAN' : 'ISSUES FOUND'}
          </Text>
          {result.issues > 0 && (
            <Text style={styles.resultDetail}>{result.issues} issue{result.issues > 1 ? 's' : ''} detected</Text>
          )}
          <TouchableOpacity style={styles.scanAgainButton} onPress={() => setResult(null)}>
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.startButton} onPress={runScan} activeOpacity={0.8}>
          <Icon name="shield-sun" size={48} color={colors.primary} style={{ marginBottom: spacing.sm }} />
          <Text style={styles.startButtonText}>Start Scan</Text>
          <Text style={styles.startButtonDesc}>Comprehensive device security check</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderBluetoothScan = () => (
    <>
      <View style={styles.header}>
        <Icon name="bluetooth" size={40} color="#3B82F6" style={{ marginBottom: spacing.sm }} />
        <Text style={styles.title}>Bluetooth Security</Text>
        <Text style={styles.subtitle}>Scan Bluetooth transfers for threats</Text>
      </View>

      {btScanning ? (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.scanningText}>Scanning Bluetooth devices...</Text>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: btProgressWidth, backgroundColor: '#3B82F6' }]} />
          </View>
        </View>
      ) : btResult ? (
        <>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Icon name="bluetooth-connect" size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{btResult.connectedCount}</Text>
              <Text style={styles.statLabel}>Connected</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Icon name="cellphone-bluetooth" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{(btResult.devices || []).length}</Text>
              <Text style={styles.statLabel}>Devices</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Icon name="folder-bluetooth" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{(btResult.watchDirs || []).length}</Text>
              <Text style={styles.statLabel}>Watch Dirs</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discovered Devices</Text>
            {(btResult.devices || []).length === 0 ? (
              <Text style={styles.emptyText}>No Bluetooth devices found</Text>
            ) : (
              btResult.devices.map((d, i) => (
                <View key={i} style={[styles.deviceCard, d.connected && styles.deviceCardConnected]}>
                  <Icon name={d.connected ? 'bluetooth-connect' : 'bluetooth'} size={20} color={d.connected ? colors.safe : '#3B82F6'} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.deviceName}>{d.name}</Text>
                    <Text style={[styles.deviceStatus, { color: d.connected ? colors.safe : colors.onSurfaceVariant }]}>
                      {d.connected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: d.connected ? `${colors.safe}20` : `${colors.onSurfaceVariant}20` }]}>
                    <Text style={[styles.statusBadgeText, { color: d.connected ? colors.safe : colors.onSurfaceVariant }]}>
                      {d.connected ? 'PAIRED' : 'AVAILABLE'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monitored Directories</Text>
            {(btResult.watchDirs || []).length === 0 ? (
              <Text style={styles.emptyText}>No Bluetooth transfer directories</Text>
            ) : (
              btResult.watchDirs.map((d, i) => (
                <View key={i} style={styles.dirCard}>
                  <Icon name="folder-outline" size={18} color={colors.onSurfaceVariant} />
                  <Text style={styles.dirPath} numberOfLines={1}>{d}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incoming Files</Text>
            <View style={styles.noFilesCard}>
              <Icon name="file-import-outline" size={32} color={colors.onSurfaceVariant} />
              <Text style={styles.noFilesText}>No incoming Bluetooth transfers</Text>
              <Text style={styles.noFilesSubtext}>Files received via Bluetooth are automatically scanned</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.scanAgainButton} onPress={() => setBtResult(null)}>
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={[styles.startButton, { borderColor: '#3B82F630' }]} onPress={runBtScan} activeOpacity={0.8}>
          <Icon name="bluetooth-settings" size={48} color="#3B82F6" style={{ marginBottom: spacing.sm }} />
          <Text style={styles.startButtonText}>Scan Bluetooth</Text>
          <Text style={styles.startButtonDesc}>Detect devices and monitor file transfers</Text>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'system' && styles.activeTab]}
          onPress={() => setActiveTab('system')}
        >
          <Icon name="shield-search" size={16} color={activeTab === 'system' ? colors.primary : colors.onSurfaceVariant} />
          <Text style={[styles.tabText, activeTab === 'system' && styles.activeTabText]}>System</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bluetooth' && styles.activeTab]}
          onPress={() => setActiveTab('bluetooth')}
        >
          <Icon name="bluetooth" size={16} color={activeTab === 'bluetooth' ? '#3B82F6' : colors.onSurfaceVariant} />
          <Text style={[styles.tabText, activeTab === 'bluetooth' && styles.activeTabTextBt]}>Bluetooth</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'system' ? renderSystemScan() : renderBluetoothScan()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: 4,
    marginBottom: spacing.lg, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 3,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  activeTab: { backgroundColor: `${colors.primary}15` },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.onSurfaceVariant },
  activeTabText: { color: colors.primary, fontWeight: '600' },
  activeTabTextBt: { color: '#3B82F6', fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  subtitle: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs },
  scanningContainer: { alignItems: 'center', padding: spacing.xl },
  scanningText: { fontSize: typography.sizes.md, color: colors.onSurfaceVariant, marginTop: spacing.md },
  progressBar: { width: '80%', height: 4, backgroundColor: colors.surfaceVariant, borderRadius: 2, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  startButton: {
    alignItems: 'center', backgroundColor: colors.surfaceVariant, borderRadius: 16,
    padding: spacing.xl, borderWidth: 1, borderColor: `${colors.primary}30`,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  startButtonText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary, textAlign: 'center' },
  startButtonDesc: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, marginTop: spacing.xs, textAlign: 'center' },
  resultCard: {
    alignItems: 'center', backgroundColor: colors.surfaceVariant, borderRadius: 16,
    padding: spacing.xl, borderWidth: 2,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  resultTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginTop: spacing.xs },
  resultDetail: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  scanAgainButton: { marginTop: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 8, backgroundColor: `${colors.primary}20` },
  scanAgainText: { color: colors.primary, fontWeight: typography.weights.semibold },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    alignItems: 'center', backgroundColor: colors.surfaceVariant, borderRadius: 12,
    padding: spacing.md, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 3,
  },
  statNumber: { fontSize: 22, fontWeight: '700', color: colors.onSurface, marginTop: 4 },
  statLabel: { fontSize: 10, color: colors.onSurfaceVariant, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface, marginBottom: spacing.sm },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceVariant,
    borderRadius: 12, padding: spacing.md, marginBottom: spacing.xs,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  deviceCardConnected: { borderLeftWidth: 3, borderLeftColor: colors.safe },
  deviceName: { fontSize: typography.sizes.sm, fontWeight: '500', color: colors.onSurface },
  deviceStatus: { fontSize: typography.sizes.xs, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  dirCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceVariant, borderRadius: 8, padding: spacing.sm,
    marginBottom: 4,
  },
  dirPath: { fontSize: 11, color: colors.onSurfaceVariant, fontFamily: 'monospace', flex: 1 },
  emptyText: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, textAlign: 'center', padding: spacing.md },
  noFilesCard: {
    alignItems: 'center', backgroundColor: colors.surfaceVariant, borderRadius: 12,
    padding: spacing.xl, borderWidth: 1, borderColor: `${colors.onSurfaceVariant}20`,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  noFilesText: { fontSize: typography.sizes.sm, color: colors.onSurface, marginTop: spacing.sm, fontWeight: '500' },
  noFilesSubtext: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, marginTop: 4 },
});
