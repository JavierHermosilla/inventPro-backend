import { AxiosError } from 'axios';

import api from '@/lib/api';

export type ManualInventoryMovementType = 'increase' | 'decrease';

export type ProductApiRecord = {
  id?: string | number;
  name?: string | null;
  description?: string | null;
  stock?: number | string | null;
  categoryId?: string | number | null;
  supplierId?: string | number | null;
  category?: { id?: string | number; name?: string | null } | null;
  supplier?: { id?: string | number; name?: string | null } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ProductInventoryItem = {
  id: string;
  name: string;
  description?: string | null;
  stock: number;
  status: 'DISPONIBLE' | 'STOCK_BAJO' | 'AGOTADO';
  categoryName?: string | null;
  supplierName?: string | null;
  updatedAt?: string | null;
};

type ManualInventoryApiRecord = {
  id?: string;
  productId?: string;
  userId?: string | null;
  type?: ManualInventoryMovementType | string | null;
  quantity?: number | string | null;
  reason?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  product?: ProductApiRecord | null;
  performedBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

export type ManualInventoryMovement = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: ManualInventoryMovementType;
  reason?: string | null;
  performedBy?: string | null;
  performedByRole?: string | null;
  createdAt: string;
};

export type ManualInventoryHistory = {
  records: ManualInventoryMovement[];
  total: number;
};

export type DashboardRecentOrder = {
  id: string;
  clientName: string | null;
  status: string;
  createdAt: string | null;
};

type DashboardOrderApiRecord = {
  id?: string;
  createdAt?: string | null;
  status?: string | null;
  client?: { name?: string | null } | null;
  customer?: { name?: string | null } | null;
};

export type InventorySummary = {
  totals: {
    products: number | null;
    clients: number | null;
    orders: number | null;
  };
  lowStockProducts: ProductInventoryItem[];
  recentOrders: DashboardRecentOrder[];
};

export const LOW_STOCK_THRESHOLD = 10;

const asNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asString = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
};

const computeProductStatus = (stock: number): ProductInventoryItem['status'] => {
  if (stock <= 0) return 'AGOTADO';
  if (stock < LOW_STOCK_THRESHOLD) return 'STOCK_BAJO';
  return 'DISPONIBLE';
};

const mapProductRecord = (record: ProductApiRecord): ProductInventoryItem | null => {
  const id = asString(record.id);
  if (!id) return null;
  const stock = asNumber(record.stock, 0);
  return {
    id,
    name: record.name ?? 'Producto sin nombre',
    description: record.description ?? null,
    stock,
    status: computeProductStatus(stock),
    categoryName: record.category?.name ?? null,
    supplierName: record.supplier?.name ?? null,
    updatedAt: record.updatedAt ?? record.createdAt ?? null,
  };
};

const mapMovement = (record: ManualInventoryApiRecord): ManualInventoryMovement | null => {
  if (!record?.id || !record.productId) return null;
  const type =
    record.type === 'increase' || record.type === 'decrease'
      ? record.type
      : (record.type ?? 'increase') === 'decrease'
        ? 'decrease'
        : 'increase';

  const quantity = asNumber(record.quantity, 0);
  const productName = record.product?.name ?? 'Producto';

  return {
    id: record.id,
    productId: record.productId,
    productName,
    quantity,
    type,
    reason: record.reason ?? null,
    performedBy: record.performedBy?.name ?? null,
    performedByRole: record.performedBy?.role ?? null,
    createdAt: record.created_at ?? record.createdAt ?? new Date().toISOString(),
  };
};

const normalizeOrder = (record: DashboardOrderApiRecord): DashboardRecentOrder | null => {
  if (!record?.id) return null;
  return {
    id: record.id,
    clientName: record.client?.name ?? record.customer?.name ?? null,
    status: record.status ?? 'pending',
    createdAt: record.createdAt ?? null,
  };
};

const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  return [];
};

const fetchDashboard = async (path: string) => {
  const response = await api.get(path);
  return response.data as {
    totalProducts?: number | string | null;
    totalClients?: number | string | null;
    totalOrders?: number | string | null;
    lowStockProducts?: ProductApiRecord[] | null;
    recentOrders?: DashboardOrderApiRecord[] | null;
  };
};

export const fetchInventorySummary = async (): Promise<InventorySummary> => {
  try {
    const data = await fetchDashboard('/dashboard');
    return normalizeSummary(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      const fallback = await fetchDashboard('/dashboard/summary');
      return normalizeSummary(fallback);
    }
    throw error;
  }
};

const normalizeSummary = (payload: Awaited<ReturnType<typeof fetchDashboard>>): InventorySummary => {
  const totals = {
    products: payload.totalProducts !== undefined ? asNumber(payload.totalProducts, 0) : null,
    clients: payload.totalClients !== undefined ? asNumber(payload.totalClients, 0) : null,
    orders: payload.totalOrders !== undefined ? asNumber(payload.totalOrders, 0) : null,
  };

  const lowStockProducts = ensureArray<ProductApiRecord>(payload.lowStockProducts ?? [])
    .map(mapProductRecord)
    .filter((product): product is ProductInventoryItem => Boolean(product));

  const recentOrders = ensureArray<DashboardOrderApiRecord>(payload.recentOrders ?? [])
    .map(normalizeOrder)
    .filter((order): order is DashboardRecentOrder => Boolean(order));

  return {
    totals,
    lowStockProducts,
    recentOrders,
  };
};

export const fetchProductInventory = async (params?: { limit?: number }) => {
  const response = await api.get('/products', { params });
  const payload = response.data as { products?: ProductApiRecord[] } | ProductApiRecord[];
  const records = Array.isArray(payload) ? payload : payload?.products ?? [];

  return ensureArray<ProductApiRecord>(records)
    .map(mapProductRecord)
    .filter((product): product is ProductInventoryItem => Boolean(product));
};

export const fetchManualInventoryHistory = async (
  params?: { limit?: number }
): Promise<ManualInventoryHistory> => {
  const response = await api.get('/manual-inventory', { params });
  const payload = response.data as {
    total?: number;
    records?: ManualInventoryApiRecord[];
  };

  const records = ensureArray<ManualInventoryApiRecord>(payload.records ?? [])
    .map(mapMovement)
    .filter((movement): movement is ManualInventoryMovement => Boolean(movement));

  return {
    records,
    total: asNumber(payload.total, records.length),
  };
};

export type ManualAdjustmentPayload = {
  productId: string;
  type: ManualInventoryMovementType;
  quantity: number;
  reason?: string | null;
};

export const createManualAdjustment = async (payload: ManualAdjustmentPayload) => {
  const body = {
    productId: payload.productId,
    type: payload.type,
    quantity: payload.quantity,
    reason: payload.reason?.trim() || undefined,
  };

  const response = await api.post('/manual-inventory', body);
  return response.data as {
    adjustmentId?: string;
    newStock?: number;
    product?: ProductApiRecord;
    adjustment?: ManualInventoryApiRecord;
  };
};
