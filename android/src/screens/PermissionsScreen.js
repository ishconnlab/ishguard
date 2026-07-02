import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../components/Theme';

const mockApps = [
  { name: 'Camera App', permissions: ['CAMERA', 'RECORD_AUDIO', 'STORAGE'] },
  { name: 'Messaging App', permissions: ['READ_CONTACTS', 'READ_SMS', 'CAMERA', 'STORAGE'] },
  { name: 'Weather App', permissions: ['ACCESS_FINE_LOCATION', 'STORAGE'] },
  { name: 'Flashlight App', permissions: ['CAMERA', 'ACCESS_FINE_LOCATION'] },
];

const riskyPerms = ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'READ_SMS', 'ACCESS_FINE_LOCATION'];

const permIcons = {
  CAMERA: 'camera',
  RECORD_AUDIO: 'microphone',
  READ_CONTACTS: 'contacts',
  READ_SMS: 'message-text',
  ACCESS_FINE_LOCATION: 'map-marker',
  STORAGE: 'sd',
};

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Icon name="key-chain-variant" size={32} color={colors.primary} />
        <Text style={styles.title}>App Permission Audit</Text>
      </View>
      <Text style={styles.subtitle}>Review which apps have access to sensitive capabilities</Text>

      {mockApps.map((app, i) => (
        <View key={i} style={styles.appCard}>
          <View style={styles.appHeader}>
            <Icon name="application-brackets" size={20} color={colors.primary} />
            <Text style={styles.appName}>{app.name}</Text>
          </View>
          {app.permissions.map((perm, j) => {
            const isRisky = riskyPerms.includes(perm);
            return (
              <View key={j} style={styles.permRow}>
                <View style={styles.permInfo}>
                  <Icon name={permIcons[perm] || 'lock'} size={16} color={colors.onSurfaceVariant} />
                  <Text style={styles.permName}>{perm}</Text>
                </View>
                <View style={[styles.permBadge, { backgroundColor: isRisky ? `${colors.risk}20` : `${colors.safe}20` }]}>
                  <Icon name={isRisky ? 'alert-circle' : 'check-circle'} size={12} color={isRisky ? colors.risk : colors.safe} />
                  <Text style={[styles.permBadgeText, { color: isRisky ? colors.risk : colors.safe }]}>
                    {isRisky ? 'Risky' : 'Standard'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.infoBox}>
        <Icon name="information-outline" size={16} color={colors.info} style={{ marginRight: spacing.sm }} />
        <Text style={styles.infoText}>
          Permissions marked as "Risky" grant access to sensitive data or hardware. Review whether each app genuinely needs these permissions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  subtitle: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, marginBottom: spacing.lg },
  appCard: {
    backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.sm, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  appName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.onSurface },
  permRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  permInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  permName: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, marginLeft: 4 },
  permBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
  permBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surfaceVariant,
    borderRadius: 12, padding: spacing.md, marginTop: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.info,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  infoText: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, lineHeight: 18, flex: 1 },
});
