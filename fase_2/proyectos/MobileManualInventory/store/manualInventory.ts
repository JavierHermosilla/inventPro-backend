import { AxiosError } from 'axios';
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
  sessionVersion: number;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  adjustStock: (payload: ManualAdjustmentPayload) => Promise<void>;
  markAlertRead: (alertId: string) => void;
  reset: () => void;
};

let sessionVersion = 0;
const nextSessionVersion = () => ++sessionVersion;

const createDefaultState = (session = nextSessionVersion()) => ({
  summary: null as InventorySummary | null,
  products: [] as ProductInventoryItem[],
  movements: [] as ManualInventoryMovement[],
  alerts: [] as InventoryAlert[],
  loading: false,
  refreshing: false,
  lastError: null as string | null,
  bootstrapped: false,
  sessionVersion: session,
});

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: unknown; errors?: Array<{ message?: unknown }> } | undefined;
    const fromMessage = typeof data?.message === 'string' ? data.message : null;
    const zodMessage =
      Array.isArray(data?.errors) && typeof data.errors[0]?.message === 'string'
        ? (data.errors[0].message as string)
        : null;
    return fromMessage || zodMessage || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

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
    const { loading, refreshing, bootstrapped, sessionVersion } = get();
    if (loading || refreshing || bootstrapped) return;
    set({ loading: true, lastError: null });
    const expectedSession = sessionVersion;
    try {
      const [summary, products, history] = await Promise.all([
        fetchInventorySummary(),
        fetchProductInventory({ limit: 200 }),
        fetchManualInventoryHistory({ limit: 50 }),
      ]);

      if (expectedSession !== get().sessionVersion) return;
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
      if (expectedSession !== get().sessionVersion) return;
      set({
        loading: false,
        lastError: error instanceof Error ? error.message : 'No se pudo sincronizar el inventario.',
        bootstrapped: true,
      });
    }
  },

  refresh: async () => {
    const { refreshing, sessionVersion } = get();
    if (refreshing) return;
    set({ refreshing: true, lastError: null });
    const expectedSession = sessionVersion;
    try {
      const [summary, products, history] = await Promise.all([
        fetchInventorySummary(),
        fetchProductInventory({ limit: 200 }),
        fetchManualInventoryHistory({ limit: 25 }),
      ]);

      if (expectedSession !== get().sessionVersion) return;
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
      if (expectedSession !== get().sessionVersion) return;
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
      const message = extractErrorMessage(error, 'No se pudo crear el ajuste.');
      set({ lastError: message });
      throw new Error(message);
    }
  },

  markAlertRead: (alertId) => {
    set({
      alerts: get().alerts.map((alert) => (alert.id === alertId ? { ...alert, read: true } : alert)),
    });
  },
}));

export default useManualInventoryStore;
