import api from "./api";

export type CategoryApiRecord = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CategoryItem = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CategoryListResult = {
  items: CategoryItem[];
  total: number;
  page?: number;
  pages?: number;
};

type CategoryListDto = {
  total?: number;
  page?: number;
  pages?: number;
  categories?: CategoryApiRecord[] | null;
};

type CategoryMutationResponse = {
  message?: string;
  category?: CategoryApiRecord;
};

const normalizeCategory = (record: CategoryApiRecord): CategoryItem => ({
  id: record.id,
  // El backend guarda en minúsculas; mostramos capitalizado simple
  name: record.name,
  description: record.description ?? null,
  createdAt: record.createdAt ?? record.created_at ?? null,
  updatedAt: record.updatedAt ?? record.updated_at ?? null,
});

const sanitizeString = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

export type CreateCategoryPayload = {
  name: string;
  description?: string | null;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

const mapPayload = (payload: CreateCategoryPayload | UpdateCategoryPayload) => {
  const body: Partial<CreateCategoryPayload> = {};

  if (payload.name !== undefined) {
    body.name = payload.name.trim();
  }

  if (payload.description !== undefined) {
    const sanitized = sanitizeString(payload.description);
    body.description = sanitized ?? "";
  }

  return body;
};

export const categoriesApi = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<CategoryListResult> {
    const response = await api.get<CategoryListDto | CategoryApiRecord[]>("/categories", { params });
    const data = response.data;

    const records = Array.isArray(data)
      ? data
      : Array.isArray(data?.categories)
        ? data.categories
        : [];

    return {
      items: records.map(normalizeCategory),
      total: (Array.isArray(data) ? records.length : Number(data?.total) || records.length),
      page: Array.isArray(data) ? 1 : data?.page ?? 1,
      pages: Array.isArray(data) ? 1 : data?.pages ?? 1,
    };
  },

  async get(id: string): Promise<CategoryItem> {
    const response = await api.get<CategoryApiRecord>(`/categories/${id}`);
    return normalizeCategory(response.data);
  },

  async create(payload: CreateCategoryPayload) {
    const body = mapPayload(payload);
    const response = await api.post<CategoryMutationResponse>("/categories", body);
    return response.data;
  },

  async update(id: string, payload: UpdateCategoryPayload) {
    const body = mapPayload(payload);
    const response = await api.put<CategoryMutationResponse>(`/categories/${id}`, body);
    return response.data;
  },

  async remove(id: string) {
    const response = await api.delete<{ message?: string }>(`/categories/${id}`);
    return response.data;
  },
};

