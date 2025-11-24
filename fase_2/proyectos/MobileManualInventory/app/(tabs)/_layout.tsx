import { Tabs, Redirect } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth';
import { useManualInventoryStore } from '@/store/manualInventory';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { user, hydrated } = useAuthStore();
  const alerts = useManualInventoryStore((state) => state.alerts);

  if (!hydrated) return null;
  if (!user) return <Redirect href="/login" />;

  const roleAllowed = user.role === 'admin' || user.role === 'bodeguero';
  if (!roleAllowed) return <Redirect href="/login" />;

  const unread = alerts.filter((alert) => !alert.read).length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Resumen',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.xaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="bell.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
