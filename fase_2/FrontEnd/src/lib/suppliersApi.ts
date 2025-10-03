import api from "./api";

export type SupplierStatus = "active" | "inactive";

export type SupplierApiRecord = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  rut: string;
  paymentTerms?: string | null;
  status?: SupplierStatus | null;
  notes?: string | null;
  categories?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SupplierItem = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  rut: string;
  paymentTerms?: string | null;
  status: SupplierStatus;
  notes?: string | null;
  categories: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SupplierListResult = {
  items: SupplierItem[];
  total: number;
};

type SupplierListDto = {
  suppliers?: SupplierApiRecord[] | null;
  message?: string;
};

type SupplierMutationResponse = {
  message?: string;
  supplier?: SupplierApiRecord;
};

export type CreateSupplierPayload = {
  name: string;
  rut: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  paymentTerms?: string | null;
  status?: SupplierStatus | null;
  notes?: string | null;
};

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

const normalizeSupplierRecord = (record: SupplierApiRecord): SupplierItem => ({
  id: record.id,
  name: record.name,
  contactName: record.contactName ?? null,
  email: record.email ?? null,
  phone: record.phone ?? null,
  address: record.address ?? null,
  website: record.website ?? null,
  rut: record.rut,
  paymentTerms: record.paymentTerms ?? null,
  status: (record.status ?? "active") as SupplierStatus,
  notes: record.notes ?? null,
  categories: Array.isArray(record.categories) ? record.categories : [],
  createdAt: record.createdAt ?? record.created_at ?? null,
  updatedAt: record.updatedAt ?? record.updated_at ?? null,
});

const sanitizeString = (value?: string | null) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const mapPayload = (payload: CreateSupplierPayload | UpdateSupplierPayload) => ({
  ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
  ...(payload.rut !== undefined ? { rut: payload.rut.trim() } : {}),
  ...(payload.contactName !== undefined ? { contactName: sanitizeString(payload.contactName) } : {}),
  ...(payload.email !== undefined ? { email: sanitizeString(payload.email)?.toLowerCase() } : {}),
  ...(payload.phone !== undefined ? { phone: sanitizeString(payload.phone) } : {}),
  ...(payload.address !== undefined ? { address: sanitizeString(payload.address) } : {}),
  ...(payload.website !== undefined ? { website: sanitizeString(payload.website) } : {}),
  ...(payload.paymentTerms !== undefined ? { paymentTerms: sanitizeString(payload.paymentTerms) } : {}),
  ...(payload.status !== undefined && payload.status !== null ? { status: payload.status } : {}),
  ...(payload.notes !== undefined ? { notes: sanitizeString(payload.notes) } : {}),
});

export const suppliersApi = {
  async list(): Promise<SupplierListResult> {
    const response = await api.get<SupplierListDto | SupplierApiRecord[]>("/suppliers");
    const data = response.data;

    const records = Array.isArray(data)
      ? data
      : Array.isArray(data?.suppliers)
        ? data.suppliers
        : [];

    return {
      items: records.map(normalizeSupplierRecord),
      total: records.length,
    };
  },

  async create(payload: CreateSupplierPayload) {
    const body = mapPayload(payload as CreateSupplierPayload);
    const response = await api.post<SupplierMutationResponse>("/suppliers", body);
    return response.data;
  },

  async update(id: string, payload: UpdateSupplierPayload) {
    const body = mapPayload(payload);
    const response = await api.put<SupplierMutationResponse>(`/suppliers/${id}`, body);
    return response.data;
  },

  async remove(id: string) {
    const response = await api.delete<SupplierMutationResponse>(`/suppliers/${id}`);
    return response.data;
  },
};
