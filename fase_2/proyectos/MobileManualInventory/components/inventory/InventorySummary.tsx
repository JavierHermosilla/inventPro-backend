import { StyleSheet, View, Text } from 'react-native';

import { Colors } from '@/constants/theme';
import type { InventorySummary } from '@/lib/manualInventoryTasks';
import { useColorScheme } from '@/hooks/use-color-scheme';

type InventorySummaryProps = {
  summary: InventorySummary | null;
};

const numberFormat = new Intl.NumberFormat('es-CL');

const SummaryCard = ({
  label,
  value,
  color,
  accent,
}: {
  label: string;
  value: number;
  color: string;
  accent: string;
}) => (
  <View style={[styles.card, { backgroundColor: color }]}>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={[styles.cardValue, { color: accent }]}>{numberFormat.format(value)}</Text>
  </View>
);

export const InventorySummaryGrid = ({ summary }: InventorySummaryProps) => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const cards = [
    { label: 'Productos', value: summary?.totals.products ?? 0, color: palette.card, accent: palette.tint },
    { label: 'Clientes', value: summary?.totals.clients ?? 0, color: palette.card, accent: palette.success },
    { label: 'Pedidos', value: summary?.totals.orders ?? 0, color: palette.card, accent: palette.danger },
    { label: 'Stock bajo', value: summary?.lowStockProducts.length ?? 0, color: palette.card, accent: palette.warning },
  ];

  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
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
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardLabel: {
    fontSize: 14,
    color: '#7A869A',
    marginBottom: 4,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
  },
});

export default InventorySummaryGrid;
