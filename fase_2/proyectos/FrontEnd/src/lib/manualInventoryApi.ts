import api from "./api";

export type ManualInventoryMovementType = "increase" | "decrease";

type ManualInventoryApiRecord = {
  id: string;
  productId: string;
  userId: string;
  type: ManualInventoryMovementType;
  quantity: number;
  reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  product?: {
    id: string;
    name?: string | null;
    description?: string | null;
    stock?: number | null;
    categoryId?: string | null;
    supplierId?: string | null;
    category?: { id: string; name?: string | null } | null;
  } | null;
  performedBy?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

export type ManualInventoryItem = {
  id: string;
  productId: string;
  productName: string;
  productStock: number;
  productCategory?: string | null;
  quantity: number;
  type: ManualInventoryMovementType;
  reason?: string | null;
  userId: string;
  performedBy?: string | null;
  performedByRole?: string | null;
  performedByEmail?: string | null;
  createdAt: string;
};

export type ManualInventoryListResult = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  records: ManualInventoryItem[];
};

export type ManualInventoryPayload = {
  productId: string;
  type: ManualInventoryMovementType;
  quantity: number;
  reason?: string | null;
};

const parseDate = (record: ManualInventoryApiRecord) => {
  const date = record.createdAt ?? record.created_at ?? null;
  return date ?? new Date().toISOString();
};

const mapRecordToItem = (record: ManualInventoryApiRecord): ManualInventoryItem => {
  const rawStock = record.product?.stock;
  const numericStock =
    typeof rawStock === "string"
      ? Number(rawStock)
      : typeof rawStock === "number"
        ? rawStock
        : 0;

  return {
    id: record.id,
    productId: record.productId,
    productName: record.product?.name ?? "Producto desconocido",
    productStock: Number.isFinite(numericStock) ? numericStock : 0,
    productCategory: record.product?.category?.name ?? null,
    quantity: record.quantity,
    type: record.type,
    reason: record.reason ?? null,
    userId: record.userId ?? "",
    performedBy: record.performedBy?.name ?? null,
    performedByRole: record.performedBy?.role ?? null,
    performedByEmail: record.performedBy?.email ?? null,
    createdAt: parseDate(record),
  };
};

export const manualInventoryApi = {
  async list(params?: { page?: number; limit?: number; productId?: string }) {
    const response = await api.get<ManualInventoryListResult | { records: ManualInventoryApiRecord[] }>(
      "/manual-inventory",
      { params }
    );

    const payload = response.data as ManualInventoryListResult & { records?: ManualInventoryApiRecord[] };
    const records = Array.isArray(payload.records) ? payload.records : [];

    return {
      page: typeof payload.page === "number" ? payload.page : 1,
      limit: typeof payload.limit === "number" ? payload.limit : params?.limit ?? 10,
      total: typeof payload.total === "number" ? payload.total : records.length,
      pages: typeof payload.pages === "number" ? payload.pages : 1,
      records: records.map(mapRecordToItem),
    } satisfies ManualInventoryListResult;
  },

  async create(payload: ManualInventoryPayload) {
    const body = {
      ...payload,
      quantity: Number(payload.quantity),
      reason: payload.reason?.trim() || undefined,
    };
    const response = await api.post("/manual-inventory", body);
    return response.data;
  },
};

export default manualInventoryApi;
