import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { NotificationItemRow } from '@/components/notifications/NotificationItemRow';
import { useManualInventoryStore } from '@/store/manualInventory';

export default function AlertsScreen() {
  const alerts = useManualInventoryStore((state) => state.alerts);
  const markAsRead = useManualInventoryStore((state) => state.markAlertRead);
  const refresh = useManualInventoryStore((state) => state.refresh);
  const refreshing = useManualInventoryStore((state) => state.refreshing);

  return (
    <View style={styles.container}>
      <SectionHeader title="Alertas y avisos" subtitle="Control de stock en tiempo real" />
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        renderItem={({ item }) => <NotificationItemRow alert={item} onPress={() => markAsRead(item.id)} />}
        ListEmptyComponent={<EmptyState title="Sin alertas" description="Todo esta bajo control." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  list: {
    paddingVertical: 16,
  },
});
