import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardScreen from './screens/DashboardScreen';
import ScannerScreen from './screens/ScannerScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import VaultScreen from './screens/VaultScreen';
import { colors } from './components/Theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { focused: 'shield-check', unfocused: 'shield-outline' },
  Scanner: { focused: 'magnify-scan', unfocused: 'magnify' },
  Vault: { focused: 'book-lock-open', unfocused: 'book-lock-outline' },
  Permissions: { focused: 'key-chain-variant', unfocused: 'key-chain' },
};

const TabIcon = ({ label, focused }) => {
  const icon = TAB_ICONS[label];
  return (
    <View style={styles.tabIconContainer}>
      <Icon name={focused ? icon.focused : icon.unfocused} size={24} color={focused ? colors.primary : colors.onSurfaceMuted} />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.onSurfaceMuted,
            tabBarLabelStyle: styles.tabBarLabel,
            headerStyle: styles.header,
            headerTintColor: colors.onSurface,
            headerTitleStyle: styles.headerTitle,
            headerShadowVisible: false,
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerTitle: 'ISHGuard' }} />
          <Tab.Screen name="Scanner" component={ScannerScreen} options={{ headerTitle: 'Security Scan' }} />
          <Tab.Screen name="Vault" component={VaultScreen} options={{ headerTitle: 'Smart Vault' }} />
          <Tab.Screen name="Permissions" component={PermissionsScreen} options={{ headerTitle: 'App Permissions' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: { alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.outline,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    height: 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabBarLabel: { fontSize: 11, fontWeight: '500' },
  header: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.outline,
    borderBottomWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: { fontWeight: '700', fontSize: 18 },
});
