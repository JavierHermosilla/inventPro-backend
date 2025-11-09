import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { ProductInventoryItem } from '@/lib/manualInventoryTasks';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ProductCardProps = {
  product: ProductInventoryItem;
  onAdjust?: (product: ProductInventoryItem) => void;
};

const statusStyles = (status: ProductInventoryItem['status']) => {
  switch (status) {
    case 'AGOTADO':
      return { backgroundColor: '#FEE2E2', color: '#B91C1C', label: 'Agotado' };
    case 'STOCK_BAJO':
      return { backgroundColor: '#FEF3C7', color: '#C2410C', label: 'Stock bajo' };
    default:
      return { backgroundColor: '#DCFCE7', color: '#15803D', label: 'Disponible' };
  }
};

export const ProductCard = memo(({ product, onAdjust }: ProductCardProps) => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const badge = statusStyles(product.status);

  return (
    <View style={[styles.card, { backgroundColor: palette.card }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{product.name}</Text>
          {product.categoryName ? <Text style={styles.subtitle}>{product.categoryName}</Text> : null}
        </View>
        <View style={[styles.status, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Stock actual</Text>
          <Text style={styles.detailValue}>{product.stock}</Text>
        </View>
        {product.supplierName ? (
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Proveedor</Text>
            <Text style={styles.detailValue}>{product.supplierName}</Text>
          </View>
        ) : null}
      </View>

      <Pressable style={styles.button} onPress={() => onAdjust?.(product)}>
        <Text style={styles.buttonText}>Ajustar stock</Text>
      </Pressable>
    </View>
  );
});

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#475467',
    marginTop: 2,
  },
  status: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ProductCard;
