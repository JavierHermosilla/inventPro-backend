import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { InventorySummaryGrid } from '@/components/inventory/InventorySummary';
import { Config } from '@/lib/config';
import { usePolling } from '@/hooks/use-polling';
import { useManualInventoryStore } from '@/store/manualInventory';
import { usePalette, type Palette } from '@/hooks/use-palette';

export default function DashboardScreen() {
  const summary = useManualInventoryStore((state) => state.summary);
  const movements = useManualInventoryStore((state) => state.movements);
  const alerts = useManualInventoryStore((state) => state.alerts);
  const hydrate = useManualInventoryStore((state) => state.hydrate);
  const refresh = useManualInventoryStore((state) => state.refresh);
  const loading = useManualInventoryStore((state) => state.loading);
  const refreshing = useManualInventoryStore((state) => state.refreshing);
  const lastError = useManualInventoryStore((state) => state.lastError);
  const bootstrapped = useManualInventoryStore((state) => state.bootstrapped);
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);

  useEffect(() => {
    if (!bootstrapped && !loading) {
      void hydrate();
    }
  }, [bootstrapped, hydrate, loading]);

  const onRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  usePolling(() => refresh(), Config.tasksPollingMs, Boolean(summary));

  const lowStock = summary?.lowStockProducts ?? [];
  const recentMovements = movements.slice(0, 3);
  const highlightedAlerts = alerts.slice(0, 3);
  const adjustmentsToday = useMemo(() => {
    const today = new Date();
    return movements.filter((movement) => {
      const when = new Date(movement.createdAt);
      return (
        when.getFullYear() === today.getFullYear() &&
        when.getMonth() === today.getMonth() &&
        when.getDate() === today.getDate()
      );
    }).length;
  }, [movements]);
  const activeAlerts = alerts.filter((alert) => !alert.read).length;

  if (loading && !summary) {
    return <LoadingState message="Sincronizando inventario..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={palette.tint}
          colors={[palette.tint]}
        />
      }
    >
      <SectionHeader title="Control diario de bodega" subtitle="KPIs esenciales para ajustes manuales" />
      <InventorySummaryGrid summary={summary} alertsCount={activeAlerts} adjustmentsToday={adjustmentsToday} />

      {lastError ? <ErrorState message={lastError} onRetry={onRefresh} /> : null}

      <View style={styles.section}>
        <SectionHeader
          title="Productos sensibles"
          subtitle="Top 3 con stock mas bajo"
          trailing={
            <Link href="/alerts" asChild>
              <Pressable>
                <Text style={styles.link}>Ver alertas</Text>
              </Pressable>
            </Link>
          }
        />
        {lowStock.length === 0 ? (
          <EmptyState title="Sin alertas" description="Todos los productos tienen stock saludable." />
        ) : (
          lowStock.slice(0, 3).map((product) => (
            <View key={product.id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{product.name}</Text>
              <Text style={styles.notificationMessage}>
                Stock actual: {product.stock} - Estado: {product.status === 'STOCK_BAJO' ? 'Bajo' : 'Agotado'}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Movimientos recientes"
          subtitle="Ultimos ajustes manuales"
          trailing={
            <Link href="/inventory" asChild>
              <Pressable>
                <Text style={styles.link}>Registrar ajuste</Text>
              </Pressable>
            </Link>
          }
        />
        {recentMovements.length === 0 ? (
          <EmptyState title="Sin movimientos" description="Aun no se registran ajustes manuales." />
        ) : (
          recentMovements.map((movement) => (
            <View key={movement.id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{movement.productName}</Text>
              <Text style={styles.notificationMessage}>
                {movement.type === 'increase' ? 'Ingreso' : 'Salida'} de {movement.quantity} unidades
              </Text>
              <Text style={styles.notificationTime}>
                {movement.performedBy ? `${movement.performedBy} - ` : ''}
                {new Date(movement.createdAt).toLocaleString('es-CL')}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Alertas registradas"
          subtitle="Cambios de stock pendientes de revisar"
          trailing={
            <Link href="/alerts" asChild>
              <Pressable>
                <Text style={styles.link}>Ver todas</Text>
              </Pressable>
            </Link>
          }
        />
        {highlightedAlerts.length === 0 ? (
          <EmptyState title="Sin pendientes" description="No hay alertas nuevas." />
        ) : (
          highlightedAlerts.map((alert) => (
            <View key={alert.id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{alert.title}</Text>
              <Text style={styles.notificationMessage}>{alert.message}</Text>
              <Text style={styles.notificationTime}>{new Date(alert.createdAt).toLocaleString('es-CL')}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      padding: 20,
      gap: 24,
      paddingBottom: 32,
    },
    section: {
      gap: 12,
    },
    link: {
      color: palette.tint,
      fontWeight: '600',
    },
    notificationCard: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 4,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
    },
    notificationMessage: {
      color: palette.muted,
    },
    notificationTime: {
      fontSize: 12,
      color: palette.muted,
    },
  });

