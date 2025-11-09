import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { InventoryAlert } from '@/store/manualInventory';
import { useColorScheme } from '@/hooks/use-color-scheme';

type NotificationItemProps = {
  alert: InventoryAlert;
  onPress?: (alert: InventoryAlert) => void;
};

const typeColor = (severity: InventoryAlert['severity']) => {
  switch (severity) {
    case 'critical':
      return '#EF4444';
    case 'warning':
      return '#F97316';
    default:
      return '#0EA5E9';
  }
};

export const NotificationItemRow = memo(({ alert, onPress }: NotificationItemProps) => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: alert.read ? palette.card : '#EEF2FF',
          borderColor: alert.read ? palette.border : '#C7D2FE',
        },
      ]}
      onPress={() => onPress?.(alert)}
    >
      <View style={[styles.badge, { backgroundColor: typeColor(alert.severity) }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{alert.title}</Text>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.time}>{new Date(alert.createdAt).toLocaleString('es-CL')}</Text>
      </View>
    </Pressable>
  );
});

NotificationItemRow.displayName = 'NotificationItemRow';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  badge: {
    width: 8,
    borderRadius: 999,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#475467',
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default NotificationItemRow;
