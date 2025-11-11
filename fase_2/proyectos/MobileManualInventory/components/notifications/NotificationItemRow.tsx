import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { InventoryAlert } from '@/store/manualInventory';
import { usePalette, type Palette } from '@/hooks/use-palette';

type NotificationItemProps = {
  alert: InventoryAlert;
  onPress?: (alert: InventoryAlert) => void;
};

const typeColor = (severity: InventoryAlert['severity'], palette: Palette) => {
  switch (severity) {
    case 'critical':
      return palette.danger;
    case 'warning':
      return palette.warning;
    default:
      return palette.tint;
  }
};

export const NotificationItemRow = memo(({ alert, onPress }: NotificationItemProps) => {
  const palette = usePalette();
  const badgeColor = typeColor(alert.severity, palette);
  const unread = !alert.read;
  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: unread ? palette.tint + '22' : palette.card,
          borderColor: unread ? palette.tint : palette.border,
        },
      ]}
      onPress={() => onPress?.(alert)}
    >
      <View style={[styles.badge, { backgroundColor: badgeColor }]} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: palette.text }]}>{alert.title}</Text>
        <Text style={[styles.message, { color: palette.muted }]}>{alert.message}</Text>
        <Text style={[styles.time, { color: palette.muted }]}>
          {new Date(alert.createdAt).toLocaleString('es-CL')}
        </Text>
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
  },
  time: {
    fontSize: 12,
  },
});

export default NotificationItemRow;
