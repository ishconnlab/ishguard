import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../components/Theme';
import { scanDevicePerformance } from '../components/SecurityEngine';

function MetricCard({ label, value, status, icon }) {
  const statusColor = status === 'safe' ? colors.safe : status === 'warning' ? colors.warning : colors.risk;
  return (
    <View style={[styles.metricCard, { borderLeftColor: statusColor }]}>
      <Icon name={icon} size={22} color={statusColor} style={styles.metricIcon} />
      <Text style={[styles.metricValue, { color: statusColor }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={[styles.skeletonBadge, { width: 120, height: 32 }]} />
        <View style={[styles.skeletonBadge, { width: 100, height: 24 }]} />
      </View>
      <View style={styles.metricsRow}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.skeletonCard, { flex: 1 }]} />
        ))}
      </View>
      <View style={styles.quickActions}>
        <View style={[styles.skeletonBadge, { width: 160, height: 24, marginBottom: 12 }]} />
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.skeletonAction, { height: 72 }]} />
        ))}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    battery: { level: 85, status: 'safe' },
    memory: { available: 2048, total: 6144, usagePercent: 67, status: 'safe' },
    overall: 'safe',
  });

  React.useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = scanDevicePerformance(metrics.battery.level, metrics.memory);
      setMetrics(prev => ({ ...prev, ...result }));
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [metrics.battery.level, metrics.memory]);

  const runQuickScan = () => {
    const result = scanDevicePerformance(metrics.battery.level, metrics.memory);
    setMetrics(prev => ({ ...prev, ...result }));
    Alert.alert('Quick Scan Complete', `Status: ${result.overall === 'safe' ? 'All systems normal' : 'Issues found'}\nBattery: ${metrics.battery.level}%\nMemory: ${metrics.memory.usagePercent}%`);
  };

  const showPermissionTip = () => {
    Alert.alert('App Permission Audit', 'Navigate to Permissions tab to review app permissions and identify potentially risky access.');
  };

  const showBatteryTips = () => {
    Alert.alert('Battery Optimization Tips', '• Reduce screen brightness\n• Close unused background apps\n• Disable unused location services\n• Use dark mode on AMOLED screens\n• Limit background app refresh');
  };

  if (loading) return <LoadingSkeleton />;

  const isProtected = metrics.overall === 'safe';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: isProtected ? `${colors.safe}20` : `${colors.warning}20` }]}>
          <Icon name={isProtected ? 'shield-check' : 'shield-alert'} size={18} color={isProtected ? colors.safe : colors.warning} />
          <Text style={[styles.statusText, { color: isProtected ? colors.safe : colors.warning, marginLeft: 6 }]}>
            {isProtected ? 'PROTECTED' : 'ATTENTION'}
          </Text>
        </View>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>AI v3 — Offline</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Battery" value={`${metrics.battery.level}%`} status={metrics.battery.status} icon="battery-charging-80" />
        <MetricCard label="Memory" value={`${metrics.memory.usagePercent}%`} status={metrics.memory.status} icon="memory" />
        <MetricCard label="Network" value="Secured" status="safe" icon="wifi-check" />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton} onPress={runQuickScan}>
          <View style={styles.actionIconWrap}><Icon name="magnify-scan" size={22} color={colors.primary} /></View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Quick Device Scan</Text>
            <Text style={styles.actionDesc}>Check system health & threats</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={showPermissionTip}>
          <View style={styles.actionIconWrap}><Icon name="key-chain-variant" size={22} color={colors.primary} /></View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>App Permission Audit</Text>
            <Text style={styles.actionDesc}>Review app permissions</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={showBatteryTips}>
          <View style={styles.actionIconWrap}><Icon name="lightning-bolt" size={22} color={colors.primary} /></View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Battery Optimization</Text>
            <Text style={styles.actionDesc}>Tips to extend battery life</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20 },
  statusText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  versionBadge: { backgroundColor: `${colors.primary}20`, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 12 },
  versionText: { fontSize: typography.sizes.xs, color: colors.primary },
  metricsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  metricCard: {
    flex: 1, backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: spacing.md,
    borderLeftWidth: 3, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  metricIcon: { marginBottom: spacing.xs },
  metricValue: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  metricLabel: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, marginTop: 2 },
  quickActions: { gap: spacing.sm },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.onSurface, marginBottom: spacing.xs },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceVariant, borderRadius: 12,
    padding: spacing.md, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3,
  },
  actionIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.onSurface },
  actionDesc: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, marginTop: 2 },
  skeletonBadge: { backgroundColor: colors.surfaceVariant, borderRadius: 12 },
  skeletonCard: { backgroundColor: colors.surfaceVariant, borderRadius: 12, height: 100 },
  skeletonAction: { backgroundColor: colors.surfaceVariant, borderRadius: 12 },
});
