import { create } from 'zustand';

import {
  createManualAdjustment,
  fetchInventorySummary,
  fetchManualInventoryHistory,
  fetchProductInventory,
  type InventorySummary,
  type ManualAdjustmentPayload,
  type ManualInventoryMovement,
  type ProductInventoryItem,
} from '@/lib/manualInventoryTasks';

export type InventoryAlertSeverity = 'info' | 'warning' | 'critical';

export type InventoryAlert = {
  id: string;
  productId: string;
  title: string;
  message: string;
  severity: InventoryAlertSeverity;
  createdAt: string;
  read: boolean;
};

type ManualInventoryState = {
  summary: InventorySummary | null;
  products: ProductInventoryItem[];
  movements: ManualInventoryMovement[];
  alerts: InventoryAlert[];
  loading: boolean;
  refreshing: boolean;
  lastError: string | null;
  bootstrapped: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  adjustStock: (payload: ManualAdjustmentPayload) => Promise<void>;
  markAlertRead: (alertId: string) => void;
  reset: () => void;
};

const createDefaultState = () => ({
  summary: null as InventorySummary | null,
  products: [] as ProductInventoryItem[],
  movements: [] as ManualInventoryMovement[],
  alerts: [] as InventoryAlert[],
  loading: false,
  refreshing: false,
  lastError: null as string | null,
  bootstrapped: false,
});

const buildAlerts = (products: ProductInventoryItem[]): InventoryAlert[] =>
  products
    .filter((product) => product.status !== 'DISPONIBLE')
    .map((product) => ({
      id: `${product.id}-${product.updatedAt ?? product.status}`,
      productId: product.id,
      title: product.status === 'AGOTADO' ? 'Stock agotado' : 'Stock bajo',
      message:
        product.status === 'AGOTADO'
          ? `${product.name} se quedo sin unidades.`
          : `${product.name} tiene solo ${product.stock} unidades disponibles.`,
      severity: product.status === 'AGOTADO' ? 'critical' : 'warning',
      createdAt: product.updatedAt ?? new Date().toISOString(),
      read: false,
    }));

const mergeAlerts = (products: ProductInventoryItem[], existing: InventoryAlert[]): InventoryAlert[] => {
  const fresh = buildAlerts(products);
  const seen = new Set(fresh.map((alert) => alert.id));

  const preserved = existing.filter((alert) => {
    if (seen.has(alert.id)) return false;
    // Drop alerts for products that recovered stock
    return products.some((product) => product.id === alert.productId && product.status !== 'DISPONIBLE')
      ? false
      : alert.read === false;
  });

  return [...fresh, ...preserved];
};

export const useManualInventoryStore = create<ManualInventoryState>((set, get) => ({
  ...createDefaultState(),

  reset: () => set(createDefaultState()),

  hydrate: async () => {
    const { loading, refreshing, bootstrapped } = get();
    if (loading || refreshing || bootstrapped) return;
    set({ loading: true, lastError: null });
    try {
      const [summary, products, history] = await Promise.all([
        fetchInventorySummary(),
        fetchProductInventory({ limit: 200 }),
        fetchManualInventoryHistory({ limit: 50 }),
      ]);

      set({
        summary,
        products,
        movements: history.records,
        alerts: mergeAlerts([...(summary?.lowStockProducts ?? []), ...products], get().alerts),
        loading: false,
        lastError: null,
        bootstrapped: true,
      });
    } catch (error) {
      console.error('[manual-inventory] hydrate error', error);
      set({
        loading: false,
        lastError: error instanceof Error ? error.message : 'No se pudo sincronizar el inventario.',
        bootstrapped: true,
      });
    }
  },

  refresh: async () => {
    if (get().refreshing) return;
    set({ refreshing: true, lastError: null });
    try {
      const [summary, products, history] = await Promise.all([
        fetchInventorySummary(),
        fetchProductInventory({ limit: 200 }),
        fetchManualInventoryHistory({ limit: 25 }),
      ]);

      set({
        summary,
        products,
        movements: history.records,
        alerts: mergeAlerts([...(summary?.lowStockProducts ?? []), ...products], get().alerts),
        refreshing: false,
        bootstrapped: true,
      });
    } catch (error) {
      console.error('[manual-inventory] refresh error', error);
      set({
        refreshing: false,
        lastError: error instanceof Error ? error.message : 'No se pudo actualizar el inventario.',
        bootstrapped: true,
      });
    }
  },

  adjustStock: async (payload) => {
    set({ lastError: null });
    try {
      await createManualAdjustment(payload);
      await get().refresh();
    } catch (error) {
      console.error('[manual-inventory] adjust error', error);
      set({
        lastError: error instanceof Error ? error.message : 'No se pudo crear el ajuste.',
      });
      throw error;
    }
  },

  markAlertRead: (alertId) => {
    set({
      alerts: get().alerts.map((alert) => (alert.id === alertId ? { ...alert, read: true } : alert)),
    });
  },
}));

export default useManualInventoryStore;
