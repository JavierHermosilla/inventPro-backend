import api from "./api";
import type { Role } from "../store/auth";

export type UserApiRecord = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserItem = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UserListMeta = {
  total: number;
  page: number;
  pages: number;
};

export type UserListResult = {
  items: UserItem[];
  meta: UserListMeta;
};

type UserListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CreateUserPayload = {
  username: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
  password?: string | null;
};

type UserCreateResponse = {
  message?: string;
  user?: UserApiRecord;
};

type UserListDto = {
  total?: number;
  page?: number;
  pages?: number;
  users?: UserApiRecord[];
};

export const USER_ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  bodeguero: "Bodeguero",
  user: "Usuario",
};

export const USER_ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: "admin", label: USER_ROLE_LABELS.admin },
  { value: "vendedor", label: USER_ROLE_LABELS.vendedor },
  { value: "bodeguero", label: USER_ROLE_LABELS.bodeguero },
  { value: "user", label: USER_ROLE_LABELS.user },
];

const normalizeUserRecord = (record: UserApiRecord): UserItem => ({
  id: record.id,
  username: record.username,
  name: record.name,
  email: record.email,
  role: record.role,
  phone: record.phone ?? null,
  address: record.address ?? null,
  avatar: record.avatar ?? null,
  createdAt: record.createdAt ?? record.created_at ?? null,
  updatedAt: record.updatedAt ?? record.updated_at ?? null,
});

const sanitizeOptional = (value?: string | null) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const usersApi = {
  async list(params?: UserListParams): Promise<UserListResult> {
    const response = await api.get<UserListDto | UserApiRecord[]>("/users", { params });
    const payload = response.data;

    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.users)
        ? payload.users
        : [];

    const metaSource: UserListDto = Array.isArray(payload) ? {} : payload ?? {};

    return {
      items: records.map(normalizeUserRecord),
      meta: {
        total: metaSource.total ?? records.length,
        page: metaSource.page ?? 1,
        pages: metaSource.pages ?? 1,
      },
    };
  },

  async create(payload: CreateUserPayload) {
    const body = {
      username: payload.username.trim(),
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      role: payload.role,
      phone: sanitizeOptional(payload.phone),
      address: sanitizeOptional(payload.address),
      avatar: sanitizeOptional(payload.avatar),
    };

    const response = await api.post<UserCreateResponse>("/users", body);
    return response.data;
  },

  async update(id: string, payload: UpdateUserPayload) {
    const body = {
      ...(payload.username !== undefined ? { username: payload.username.trim() } : {}),
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.email !== undefined ? { email: payload.email.trim().toLowerCase() } : {}),
      ...(payload.password ? { password: payload.password } : {}),
      ...(payload.role !== undefined ? { role: payload.role } : {}),
      ...(payload.phone !== undefined ? { phone: sanitizeOptional(payload.phone) } : {}),
      ...(payload.address !== undefined ? { address: sanitizeOptional(payload.address) } : {}),
      ...(payload.avatar !== undefined ? { avatar: sanitizeOptional(payload.avatar) } : {}),
    };

    const response = await api.put(`/users/${id}`, body);
    return response.data;
  },

  async remove(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
