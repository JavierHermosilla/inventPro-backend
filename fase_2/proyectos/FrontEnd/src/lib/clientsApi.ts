import api from "./api";

export type ClientApiRecord = {
  id: string;
  rut: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  avatar?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ClientItem = {
  id: string;
  rut: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  avatar?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ClientListMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type ClientListResult = {
  items: ClientItem[];
  meta: ClientListMeta;
};

export type CreateClientPayload = {
  rut: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  avatar?: string | null;
};

export type UpdateClientPayload = Partial<CreateClientPayload>;

type ClientListDto = {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  clients?: ClientApiRecord[] | null;
};

const normalize = (record: ClientApiRecord): ClientItem => ({
  id: record.id,
  rut: record.rut,
  name: record.name,
  address: record.address,
  phone: record.phone,
  email: record.email,
  avatar: record.avatar ?? null,
  createdAt: record.createdAt ?? record.created_at ?? null,
  updatedAt: record.updatedAt ?? record.updated_at ?? null,
});

const sanitizeOptional = (value?: string | null) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const sanitizePhone = (value: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";

  return hasPlus ? `+${digits}` : digits;
};

export const clientsApi = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<ClientListResult> {
    const response = await api.get<ClientListDto | ClientApiRecord[]>("/clients", { params });
    const payload = response.data;

    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.clients)
        ? payload?.clients ?? []
        : [];

    const metaSource: ClientListDto = Array.isArray(payload) ? {} : payload ?? {};

    return {
      items: records.map(normalize),
      meta: {
        page: Number(metaSource.page ?? 1),
        limit: Number(metaSource.limit ?? (params?.limit ?? 10)),
        total: Number(metaSource.total ?? records.length),
        pages: Number(metaSource.pages ?? 1),
      },
    };
  },

  async create(payload: CreateClientPayload) {
    const sanitizedPhone = sanitizePhone(payload.phone);

    const body = {
      rut: payload.rut.trim().toUpperCase(),
      name: payload.name.trim(),
      address: payload.address.trim(),
      phone: sanitizedPhone,
      email: payload.email.trim().toLowerCase(),
      avatar: sanitizeOptional(payload.avatar),
    };
    const response = await api.post("/clients", body);
    return response.data;
  },

  async update(id: string, payload: UpdateClientPayload) {
    const sanitizedPhone = payload.phone !== undefined ? sanitizePhone(payload.phone) : undefined;

    const body = {
      ...(payload.rut !== undefined ? { rut: payload.rut.trim().toUpperCase() } : {}),
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.address !== undefined ? { address: payload.address.trim() } : {}),
      ...(payload.phone !== undefined ? { phone: sanitizedPhone } : {}),
      ...(payload.email !== undefined ? { email: payload.email.trim().toLowerCase() } : {}),
      ...(payload.avatar !== undefined ? { avatar: sanitizeOptional(payload.avatar) } : {}),
    };
    const response = await api.put(`/clients/${id}`, body);
    return response.data;
  },

  async remove(id: string) {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
};
