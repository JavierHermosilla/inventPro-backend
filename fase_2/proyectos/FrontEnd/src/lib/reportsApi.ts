import api from "./api";

export type ReportFormat = "pdf" | "xls" | "dashboard";
export type ReportStatus = "active" | "draft" | "archived";

export type ReportFilters = {
  startDate?: string | null;
  endDate?: string | null;
  productIds?: string[] | null;
  userIds?: string[] | null;
};

export type ReportApiRecord = {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  filters?: ReportFilters | null;
  format: ReportFormat;
  status: ReportStatus;
  deliveryMethod?: string | null;
  delivery_method?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  lastRunAt?: string | null;
  last_run_at?: string | null;
  executionTimeMs?: number | null;
  execution_time_ms?: number | null;
  creator?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
  createdBy?: string | null;
  created_by?: string | null;
};

export type ReportItem = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  filters: ReportFilters;
  format: ReportFormat;
  status: ReportStatus;
  deliveryMethod: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdById: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  lastRunAt: string | null;
  executionTimeMs: number | null;
};

export type ReportListResult = {
  items: ReportItem[];
  meta: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
};

export type ReportListParams = {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  type?: string;
  search?: string;
};

export type CreateReportPayload = {
  name: string;
  description?: string;
  type: string;
  filters?: ReportFilters;
  format: ReportFormat;
  status?: ReportStatus;
  schedule?: unknown;
  deliveryMethod?: string;
  sharedWith?: string[];
};

export type UpdateReportPayload = Partial<CreateReportPayload>;

type ReportListDto = {
  page?: number;
  totalPages?: number;
  totalItems?: number;
  reports?: ReportApiRecord[] | null;
};

const ensureArray = <T,>(maybe: unknown): T[] => {
  if (Array.isArray(maybe)) return maybe as T[];
  return [];
};

const normalizeFilters = (filters?: ReportFilters | null): ReportFilters => {
  if (!filters) return {};
  const productIds = filters.productIds ? ensureArray<string>(filters.productIds) : [];
  const userIds = filters.userIds ? ensureArray<string>(filters.userIds) : [];
  return {
    startDate: filters.startDate ?? null,
    endDate: filters.endDate ?? null,
    productIds: productIds.length > 0 ? productIds : null,
    userIds: userIds.length > 0 ? userIds : null,
  };
};

const normalize = (record: ReportApiRecord): ReportItem => ({
  id: record.id,
  name: record.name,
  description: record.description?.trim() || null,
  type: record.type,
  filters: normalizeFilters(record.filters),
  format: record.format,
  status: record.status,
  deliveryMethod: record.deliveryMethod ?? record.delivery_method ?? null,
  createdAt: record.createdAt ?? record.created_at ?? null,
  updatedAt: record.updatedAt ?? record.updated_at ?? null,
  createdById: record.createdBy ?? record.created_by ?? record.creator?.id ?? null,
  createdByName: record.creator?.name ?? null,
  createdByEmail: record.creator?.email ?? null,
  lastRunAt: record.lastRunAt ?? record.last_run_at ?? null,
  executionTimeMs: typeof record.executionTimeMs === "number" ? record.executionTimeMs : record.execution_time_ms ?? null,
});

export const reportsApi = {
  async list(params?: ReportListParams): Promise<ReportListResult> {
    const response = await api.get<ReportListDto | ReportApiRecord[]>("reports", { params });
    const payload = response.data;

    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.reports)
        ? payload.reports ?? []
        : [];

    const metaSource: ReportListDto = Array.isArray(payload) ? {} : payload ?? {};

    return {
      items: records.map(normalize),
      meta: {
        page: Number(metaSource.page ?? 1),
        totalPages: Number(metaSource.totalPages ?? 1),
        totalItems: Number(metaSource.totalItems ?? records.length),
      },
    };
  },

  async get(id: string): Promise<ReportItem> {
    const response = await api.get<ReportApiRecord>(`reports/${id}`);
    return normalize(response.data);
  },

  async create(payload: CreateReportPayload): Promise<ReportItem> {
    const body = {
      name: payload.name.trim(),
      ...(payload.description ? { description: payload.description.trim() } : {}),
      type: payload.type,
      format: payload.format,
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.deliveryMethod ? { deliveryMethod: payload.deliveryMethod } : {}),
      ...(payload.filters ? { filters: prepareFiltersForSubmit(payload.filters) } : {}),
      ...(payload.schedule ? { schedule: payload.schedule } : {}),
      ...(Array.isArray(payload.sharedWith) ? { sharedWith: payload.sharedWith } : {}),
    };
    const response = await api.post<ReportApiRecord>("reports", body);
    return normalize(response.data);
  },

  async update(id: string, payload: UpdateReportPayload): Promise<ReportItem> {
    const body = {
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.description !== undefined ? { description: payload.description?.trim() ?? null } : {}),
      ...(payload.type ? { type: payload.type } : {}),
      ...(payload.format ? { format: payload.format } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.deliveryMethod !== undefined ? { deliveryMethod: payload.deliveryMethod } : {}),
      ...(payload.filters ? { filters: prepareFiltersForSubmit(payload.filters) } : {}),
      ...(payload.schedule ? { schedule: payload.schedule } : {}),
      ...(Array.isArray(payload.sharedWith) ? { sharedWith: payload.sharedWith } : {}),
    };
    const response = await api.put<ReportApiRecord>(`reports/${id}`, body);
    return normalize(response.data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`reports/${id}`);
  },
};

function prepareFiltersForSubmit(filters: ReportFilters) {
  const output: Record<string, unknown> = {};
  if (filters.startDate) output.startDate = filters.startDate;
  if (filters.endDate) output.endDate = filters.endDate;
  if (filters.productIds && filters.productIds.length > 0) output.productIds = filters.productIds;
  if (filters.userIds && filters.userIds.length > 0) output.userIds = filters.userIds;
  return output;
}
