import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { ProductInventoryItem } from '@/lib/manualInventoryTasks';
import { usePalette } from '@/hooks/use-palette';

type ProductCardProps = {
  product: ProductInventoryItem;
  onAdjust?: (product: ProductInventoryItem) => void;
};

const withAlpha = (hex: string, alpha = '20') => `${hex}${alpha}`;

const statusStyles = (status: ProductInventoryItem['status'], palette: (typeof Colors)['light']) => {
  switch (status) {
    case 'AGOTADO':
      return { backgroundColor: withAlpha(palette.danger), color: palette.danger, label: 'Agotado' };
    case 'STOCK_BAJO':
      return { backgroundColor: withAlpha(palette.warning), color: palette.warning, label: 'Stock bajo' };
    default:
      return { backgroundColor: withAlpha(palette.success), color: palette.success, label: 'Disponible' };
  }
};

export const ProductCard = memo(({ product, onAdjust }: ProductCardProps) => {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const badge = statusStyles(product.status, palette);

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: palette.text }]}>{product.name}</Text>
          {product.categoryName ? <Text style={[styles.subtitle, { color: palette.muted }]}>{product.categoryName}</Text> : null}
        </View>
        <View style={[styles.status, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detail}>
          <Text style={[styles.detailLabel, { color: palette.muted }]}>Stock actual</Text>
          <Text style={[styles.detailValue, { color: palette.text }]}>{product.stock}</Text>
        </View>
        {product.supplierName ? (
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: palette.muted }]}>Proveedor</Text>
            <Text style={[styles.detailValue, { color: palette.text }]}>{product.supplierName}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: palette.tint }]}
        onPress={() => onAdjust?.(product)}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: palette.card }]}>Ajustar stock</Text>
      </Pressable>
    </View>
  );
});

ProductCard.displayName = 'ProductCard';

const createStyles = (palette: (typeof Colors)['light']) =>
  StyleSheet.create({
    card: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
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
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    buttonText: {
      fontWeight: '600',
    },
  });

export default ProductCard;
