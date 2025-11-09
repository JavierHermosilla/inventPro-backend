import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { AdjustmentSheet } from '@/components/inventory/AdjustmentSheet';
import { ProductCard } from '@/components/inventory/ProductCard';
import type { ProductInventoryItem } from '@/lib/manualInventoryTasks';
import { useManualInventoryStore } from '@/store/manualInventory';

export default function InventoryScreen() {
  const products = useManualInventoryStore((state) => state.products);
  const hydrate = useManualInventoryStore((state) => state.hydrate);
  const refresh = useManualInventoryStore((state) => state.refresh);
  const refreshing = useManualInventoryStore((state) => state.refreshing);
  const adjustStock = useManualInventoryStore((state) => state.adjustStock);
  const lastError = useManualInventoryStore((state) => state.lastError);
  const bootstrapped = useManualInventoryStore((state) => state.bootstrapped);

  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductInventoryItem | null>(null);

  useEffect(() => {
    if (!bootstrapped) {
      void hydrate();
    }
  }, [bootstrapped, hydrate]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        (product.categoryName?.toLowerCase().includes(term) ?? false) ||
        product.id.toLowerCase().includes(term)
      );
    });
  }, [products, search]);

  return (
    <View style={styles.container}>
      <SectionHeader title="Control de inventario" subtitle="Ajusta stock directo desde bodega" />

      <TextInput
        style={styles.search}
        placeholder="Buscar por nombre o categoria"
        value={search}
        onChangeText={setSearch}
      />

      {lastError ? <ErrorState message={lastError} onRetry={refresh} /> : null}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} onAdjust={setSelectedProduct} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <EmptyState
            title="Sin resultados"
            description={
              search ? 'No encontramos coincidencias.' : 'No hay productos cargados para inventario.'
            }
          />
        }
      />

      <AdjustmentSheet
        product={selectedProduct}
        visible={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onSubmit={async (payload) => {
          try {
            await adjustStock(payload);
          } finally {
            setSelectedProduct(null);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  search: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  list: {
    paddingVertical: 12,
  },
});
