import api from "./api";

export type ProductApiRecord = {
  id: string | number;
  name: string;
  description?: string | null;
  price?: number | string | null;
  stock: number;
  categoryId?: string | number | null;
  supplierId?: string | number | null;
  category?: { id: string | number; name?: string | null } | null;
  supplier?: { id: string | number; name?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductItem = {
  id: string | number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  estado: "DISPONIBLE" | "STOCK_BAJO" | "AGOTADO";
  categoryName?: string | null;
  supplierName?: string | null;
  categoryId?: string | number | null;
  supplierId?: string | number | null;
  creadoEn?: string;
  actualizadoEn?: string;
};

export type ProductListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductListResult = {
  items: ProductItem[];
  meta: ProductListMeta;
};

export type ProductPayload = {
  nombre: string;
  descripcion?: string | null;
  stock: number;
  precio: number;
  categoryId?: string | number | null;
  supplierId?: string | number | null;
  supplierRut?: string | null;
};
type ProductListDto = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  products?: ProductApiRecord[] | null;
};
/**
 * Umbral usado para marcar un stock como bajo.
 */
export const LOW_STOCK_THRESHOLD = 10;

const parseNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed as number) ? Number(parsed) : fallback;
};

const parseMetaNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const computeEstado = (stock: number): ProductItem["estado"] => {
  if (stock <= 0) return "AGOTADO";
  if (stock < LOW_STOCK_THRESHOLD) return "STOCK_BAJO";
  return "DISPONIBLE";
};

const mapApiRecordToItem = (record: ProductApiRecord): ProductItem => {
  const stock = parseNumber(record.stock, 0);
  return {
    id: record.id,
    nombre: record.name,
    descripcion: record.description ?? null,
    precio: parseNumber(record.price, 0),
    stock,
    estado: computeEstado(stock),
    categoryName: record.category?.name ?? null,
    supplierName: record.supplier?.name ?? null,
    categoryId: record.categoryId ?? record.category?.id ?? null,
    supplierId: record.supplierId ?? record.supplier?.id ?? null,
    creadoEn: record.createdAt ?? undefined,
    actualizadoEn: record.updatedAt ?? undefined,
  };
};

const sanitizeId = (value?: string | number | null) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
};

const mapFormToApiPayload = (payload: ProductPayload) => ({
  name: payload.nombre.trim(),
  description: payload.descripcion?.trim() || undefined,
  price: parseNumber(payload.precio, 0),
  stock: Math.max(0, Math.trunc(parseNumber(payload.stock, 0))),
  categoryId: sanitizeId(payload.categoryId),
  supplierId: sanitizeId(payload.supplierId),
  supplierRut: payload.supplierRut?.trim() || undefined,
});

const ensureArray = <T,>(maybe: unknown): T[] => {
  if (Array.isArray(maybe)) return maybe as T[];
  return [];
};

export const productsApi = {
  /**
   * Obtiene el listado de productos desde el backend con su paginacion.
   */
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<ProductListResult> {
    const response = await api.get<ProductListDto | ProductApiRecord[]>("/products", { params });
    const payload = response.data;

    const defaultLimit = params?.limit ? Number(params.limit) : 10;
    const isArrayPayload = Array.isArray(payload);
    const metaSource: ProductListDto = isArrayPayload || !payload ? {} : (payload as ProductListDto);
    const records = isArrayPayload
      ? ensureArray<ProductApiRecord>(payload as ProductApiRecord[])
      : ensureArray<ProductApiRecord>(metaSource.products ?? []);

    return {
      items: records.map(mapApiRecordToItem),
      meta: {
        page: parseMetaNumber(metaSource.page, 1),
        limit: parseMetaNumber(metaSource.limit, defaultLimit),
        total: parseMetaNumber(metaSource.total, records.length),
        totalPages: parseMetaNumber(metaSource.totalPages, 1),
      },
    };
  },

  /**
   * Obtiene un producto especifico y lo mapea al formato de la UI.
   */
  async get(id: string | number): Promise<ProductItem> {
    const response = await api.get(`/products/${id}`);
    return mapApiRecordToItem(response.data as ProductApiRecord);
  },

  /**
   * Crea un nuevo producto en el backend.
   */
  async create(payload: ProductPayload) {
    const body = mapFormToApiPayload(payload);
    const response = await api.post("/products", body);
    return response.data;
  },

  /**
   * Actualiza un producto existente.
   */
  async update(id: string | number, payload: ProductPayload) {
    const body = mapFormToApiPayload(payload);
    const response = await api.put(`/products/${id}`, body);
    return response.data;
  },

  /**
   * Elimina un producto por su identificador.
   */
  async remove(id: string | number) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};






