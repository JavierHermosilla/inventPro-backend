import { AxiosError } from "axios";
import api from "./api";
import type { OrderStatus } from "./ordersApi";
import type { ProductApiRecord, ProductItem } from "./productsApi";
import { mapProductRecordToItem } from "./productsApi";

type DashboardOrderApiRecord = {
  id?: string;
  clientId?: string | null;
  status?: OrderStatus | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  client?: { id?: string; name?: string | null; rut?: string | null } | null;
  customer?: { id?: string; name?: string | null } | null;
};

type DashboardSummaryApiResponse = {
  totalClients?: number | string | null;
  totalOrders?: number | string | null;
  totalProducts?: number | string | null;
  lowStockProducts?: ProductApiRecord[] | null;
  recentOrders?: DashboardOrderApiRecord[] | null;
};

export type DashboardRecentOrder = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  clientRut: string | null;
  createdAt: string | null;
  status: OrderStatus;
};

export type DashboardSummary = {
  totals: {
    clients: number | null;
    orders: number | null;
    products: number | null;
  };
  lowStockProducts: ProductItem[];
  recentOrders: DashboardRecentOrder[];
};

const asNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed as number) ? Number(parsed) : null;
};

const normalizeOrderRecord = (record: DashboardOrderApiRecord): DashboardRecentOrder | null => {
  if (!record?.id) return null;
  const statusRaw = record.status ?? "pending";
  const status = (typeof statusRaw === "string" ? statusRaw : "pending") as OrderStatus;
  const clientName = record.client?.name?.trim() || record.customer?.name?.trim() || null;
  const clientRut = record.client?.rut?.trim() || null;
  return {
    id: record.id,
    clientId: record.clientId ?? record.client?.id ?? record.customer?.id ?? null,
    clientRut,
    clientName,
    createdAt: record.createdAt ?? record.updatedAt ?? null,
    status,
  };
};

const normalizeSummary = (payload: DashboardSummaryApiResponse): DashboardSummary => {
  const lowStock = Array.isArray(payload.lowStockProducts) ? payload.lowStockProducts : [];
  const recentOrders = Array.isArray(payload.recentOrders) ? payload.recentOrders : [];

  return {
    totals: {
      clients: asNumberOrNull(payload.totalClients),
      orders: asNumberOrNull(payload.totalOrders),
      products: asNumberOrNull(payload.totalProducts),
    },
    lowStockProducts: lowStock.map(mapProductRecordToItem),
    recentOrders: recentOrders
      .map(normalizeOrderRecord)
      .filter((order): order is DashboardRecentOrder => Boolean(order)),
  };
};

const fetchSummaryFrom = async (path: string) => {
  const response = await api.get<DashboardSummaryApiResponse>(path);
  return response.data;
};

export const dashboardApi = {
  async summary(): Promise<DashboardSummary> {
    try {
      const data = await fetchSummaryFrom("/dashboard");
      return normalizeSummary(data);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        const fallback = await fetchSummaryFrom("/dashboard/summary");
        return normalizeSummary(fallback);
      }
      throw err;
    }
  },
};

export default dashboardApi;
