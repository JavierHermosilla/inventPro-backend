import { StyleSheet, View, Text } from 'react-native';

import type { InventorySummary } from '@/lib/manualInventoryTasks';
import { usePalette, type Palette } from '@/hooks/use-palette';

type InventorySummaryProps = {
  summary: InventorySummary | null;
  alertsCount?: number;
  adjustmentsToday?: number;
};

const numberFormat = new Intl.NumberFormat('es-CL');

const SummaryCard = ({
  label,
  value,
  color,
  accent,
  palette,
}: {
  label: string;
  value: number;
  color: string;
  accent: string;
  palette: Palette;
}) => (
  <View style={[styles.card, { backgroundColor: color, borderColor: palette.border }]}>
    <Text style={[styles.cardLabel, { color: palette.muted }]}>{label}</Text>
    <Text style={[styles.cardValue, { color: accent }]}>{numberFormat.format(value)}</Text>
  </View>
);

export const InventorySummaryGrid = ({ summary, alertsCount = 0, adjustmentsToday = 0 }: InventorySummaryProps) => {
  const palette = usePalette();

  const cards = [
    { label: 'Productos monitoreados', value: summary?.totals.products ?? 0, color: palette.card, accent: palette.tint },
    { label: 'Stock bajo', value: summary?.lowStockProducts.length ?? 0, color: palette.card, accent: palette.warning },
    { label: 'Alertas activas', value: alertsCount, color: palette.card, accent: palette.danger },
    { label: 'Ajustes hoy', value: adjustmentsToday, color: palette.card, accent: palette.success },
  ];

  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} palette={palette} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexBasis: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
  },
});

export default InventorySummaryGrid;
