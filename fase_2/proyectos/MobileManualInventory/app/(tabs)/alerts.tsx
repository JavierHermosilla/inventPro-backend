import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useMemo } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { NotificationItemRow } from '@/components/notifications/NotificationItemRow';
import { useManualInventoryStore } from '@/store/manualInventory';
import { usePalette, type Palette } from '@/hooks/use-palette';

export default function AlertsScreen() {
  const alerts = useManualInventoryStore((state) => state.alerts);
  const markAsRead = useManualInventoryStore((state) => state.markAlertRead);
  const refresh = useManualInventoryStore((state) => state.refresh);
  const refreshing = useManualInventoryStore((state) => state.refreshing);
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View style={styles.container}>
      <SectionHeader title="Alertas y avisos" subtitle="Control de stock en tiempo real" />
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={palette.tint}
            colors={[palette.tint]}
          />
        }
        renderItem={({ item }) => <NotificationItemRow alert={item} onPress={() => markAsRead(item.id)} />}
        ListEmptyComponent={<EmptyState title="Sin alertas" description="Todo esta bajo control." />}
      />
    </View>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: palette.background,
    },
    list: {
      paddingVertical: 16,
    },
  });
