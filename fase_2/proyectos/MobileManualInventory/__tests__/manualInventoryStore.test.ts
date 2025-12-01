import { act } from '@testing-library/react-native';

import { useManualInventoryStore, type InventoryAlert } from '@/store/manualInventory';
import {
  createManualAdjustment,
  fetchInventorySummary,
  fetchManualInventoryHistory,
  fetchProductInventory,
  type InventorySummary,
  type ManualInventoryHistory,
  type ManualInventoryMovement,
  type ProductInventoryItem,
} from '@/lib/manualInventoryTasks';

jest.mock('@/lib/manualInventoryTasks');

const mockSummary = jest.mocked(fetchInventorySummary);
const mockProducts = jest.mocked(fetchProductInventory);
const mockHistory = jest.mocked(fetchManualInventoryHistory);
const mockCreateAdjustment = jest.mocked(createManualAdjustment);

const today = new Date().toISOString();

const lowStock: ProductInventoryItem = {
  id: 'p-low',
  name: 'Etiquetas',
  description: null,
  stock: 2,
  status: 'STOCK_BAJO',
  categoryName: 'Insumos',
  supplierName: 'Proveedor 1',
  updatedAt: today,
};

const depleted: ProductInventoryItem = {
  id: 'p-zero',
  name: 'Cinta de embalaje',
  description: null,
  stock: 0,
  status: 'AGOTADO',
  categoryName: 'Insumos',
  supplierName: 'Proveedor 2',
  updatedAt: today,
};

const summary: InventorySummary = {
  totals: { products: 2, clients: 1, orders: 0 },
  lowStockProducts: [],
  recentOrders: [],
};

const history: ManualInventoryHistory = {
  records: [
    {
      id: 'm-1',
      productId: lowStock.id,
      productName: lowStock.name,
      quantity: 3,
      type: 'increase',
      createdAt: today,
      performedBy: 'Bodega',
      performedByRole: 'bodeguero',
      reason: 'Ajuste inicial',
    } satisfies ManualInventoryMovement,
  ],
  total: 1,
};

const products: ProductInventoryItem[] = [
  { ...lowStock },
  { ...depleted, status: 'AGOTADO' },
];

const resetStore = () => useManualInventoryStore.getState().reset();

describe('useManualInventoryStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    mockSummary.mockResolvedValue(summary);
    mockProducts.mockResolvedValue(products);
    mockHistory.mockResolvedValue(history);
  });

  it('hydrates inventory data and generates alerts for productos críticos', async () => {
    await act(async () => {
      await useManualInventoryStore.getState().hydrate();
    });

    const state = useManualInventoryStore.getState();
    expect(state.summary).toEqual(summary);
    expect(state.products).toEqual(products);
    expect(state.movements).toEqual(history.records);
    expect(state.bootstrapped).toBe(true);
    expect(state.lastError).toBeNull();
    expect(state.loading).toBe(false);

    expect(state.alerts).toHaveLength(2);
    const severities = state.alerts.map((alert) => alert.severity);
    expect(severities).toContain('warning');
    expect(severities).toContain('critical');
    expect(state.alerts.every((alert) => alert.read === false)).toBe(true);
  });

  it('adjustStock ejecuta el ajuste y refresca los listados en éxito', async () => {
    mockCreateAdjustment.mockResolvedValue({ adjustmentId: 'm-2' });

    await act(async () => {
      await useManualInventoryStore
        .getState()
        .adjustStock({ productId: lowStock.id, type: 'increase', quantity: 5, reason: 'Reproceso' });
    });

    expect(mockCreateAdjustment).toHaveBeenCalledWith({
      productId: lowStock.id,
      type: 'increase',
      quantity: 5,
      reason: 'Reproceso',
    });
    expect(mockSummary).toHaveBeenCalled();
    expect(mockProducts).toHaveBeenCalled();
    expect(mockHistory).toHaveBeenCalled();
    expect(useManualInventoryStore.getState().lastError).toBeNull();
  });

  it('propaga el error de backend y deja lastError seteado', async () => {
    mockCreateAdjustment.mockRejectedValue(new Error('No se pudo crear el ajuste.'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        useManualInventoryStore.getState().adjustStock({
          productId: depleted.id,
          type: 'decrease',
          quantity: 1,
          reason: 'Prueba',
        })
      ).rejects.toThrow('No se pudo crear el ajuste.');
    } finally {
      errorSpy.mockRestore();
    }

    expect(useManualInventoryStore.getState().lastError).toBe('No se pudo crear el ajuste.');
  });

  it('markAlertRead marca solo la alerta solicitada', () => {
    const alerts: InventoryAlert[] = [
      {
        id: 'a-1',
        productId: lowStock.id,
        title: 'Stock bajo',
        message: 'Revisar etiquetas',
        severity: 'warning',
        createdAt: today,
        read: false,
      },
      {
        id: 'a-2',
        productId: depleted.id,
        title: 'Sin stock',
        message: 'Cinta agotada',
        severity: 'critical',
        createdAt: today,
        read: false,
      },
    ];

    useManualInventoryStore.setState({ alerts });
    useManualInventoryStore.getState().markAlertRead('a-1');

    const result = useManualInventoryStore.getState().alerts;
    expect(result.find((alert) => alert.id === 'a-1')?.read).toBe(true);
    expect(result.find((alert) => alert.id === 'a-2')?.read).toBe(false);
  });
});
