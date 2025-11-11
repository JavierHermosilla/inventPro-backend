import api from "./api";

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export type OrderItemApiRecord = {
  id?: string;
  orderId?: string;
  productId: string;
  quantity: number | string;
  price: number | string;
  createdAt?: string;
  updatedAt?: string;
  product?: {
    id?: string;
    name?: string;
    sku?: string | null;
    code?: string | null;
    price?: number | string | null;
  } | null;
};

export type OrderApiRecord = {
  id: string;
  clientId?: string | null;
  status: OrderStatus;
  totalAmount?: number | string | null;
  isBackorder?: boolean | null;
  stockRestored?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items?: OrderItemApiRecord[] | null;
  client?: {
    id?: string;
    name?: string | null;
    rut?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
};

export type OrderLine = {
  id: string | null;
  productId: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderSnapshot = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  clientRut: string | null;
  status: OrderStatus;
  createdAt: string | null;
  updatedAt: string | null;
  backendTotal: number;
  subtotal: number;
  iva: number;
  totalWithTax: number;
  isBackorder: boolean;
  items: OrderLine[];
};

export type CreateOrderProductInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  clientId?: string;
  rut?: string;
  products: CreateOrderProductInput[];
};

export type CreateOrderResponse = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  isBackorder: boolean;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    price?: number | string;
  }>;
};

export type OrderByRutResponse = {
  client: {
    id: string;
    rut: string;
    name: string;
  };
  orders: OrderApiRecord[];
};

export const CHILE_VAT_RATE = 0.19;

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed as number) ? Number(parsed) : fallback;
};

const ensurePositiveInt = (value: unknown, fallback = 0): number => {
  const n = Math.trunc(toNumber(value, fallback));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const roundCurrency = (value: number) => {
  return Math.round(value * 100) / 100;
};

export const calcVatBreakdown = (netAmount: number) => {
  const iva = roundCurrency(netAmount * CHILE_VAT_RATE);
  return {
    subtotal: roundCurrency(netAmount),
    iva,
    totalWithTax: roundCurrency(netAmount + iva),
  };
};

const normalizeLine = (item: OrderItemApiRecord): OrderLine => {
  const quantity = ensurePositiveInt(item.quantity, 0);
  const unitPrice = roundCurrency(toNumber(item.price, 0));
  const total = roundCurrency(quantity * unitPrice);
  return {
    id: item.id ?? null,
    productId: item.productId,
    productName: item.product?.name ?? "Producto sin nombre",
    productSku: item.product?.sku ?? item.product?.code ?? null,
    quantity,
    unitPrice,
    lineTotal: total,
  };
};

export const normalizeOrderRecord = (record: OrderApiRecord): OrderSnapshot => {
  const items = Array.isArray(record.items) ? record.items.map(normalizeLine) : [];
  const computedSubtotal =
    items.length > 0 ? roundCurrency(items.reduce((acc, line) => acc + line.lineTotal, 0)) : roundCurrency(toNumber(record.totalAmount, 0));

  const vat = calcVatBreakdown(computedSubtotal);

  return {
    id: record.id,
    clientId: record.clientId ?? record.client?.id ?? null,
    clientName: record.client?.name ?? null,
    clientRut: record.client?.rut ?? null,
    status: record.status,
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null,
    backendTotal: roundCurrency(toNumber(record.totalAmount, computedSubtotal)),
    subtotal: vat.subtotal,
    iva: vat.iva,
    totalWithTax: vat.totalWithTax,
    isBackorder: Boolean(record.isBackorder),
    items,
  };
};

const mapCreateOrderPayload = (data: unknown): CreateOrderResponse => {
  const order = (data as { order?: unknown })?.order ?? data;
  if (!order || typeof order !== "object") {
    throw new Error("Respuesta inválida al crear la orden.");
  }

  const payload = order as Partial<CreateOrderResponse> & { items?: OrderItemApiRecord[] };
  if (!payload.id) {
    throw new Error("El backend no devolvió el ID de la orden creada.");
  }

  return {
    id: String(payload.id),
    status: (payload.status ?? "pending") as OrderStatus,
    totalAmount: roundCurrency(toNumber(payload.totalAmount, 0)),
    isBackorder: Boolean(payload.isBackorder),
      items: Array.isArray(payload.items)
        ? payload.items.map((item) => ({
            productId: item.productId ?? "",
            quantity: ensurePositiveInt(item.quantity, 0),
            unitPrice: roundCurrency(
              toNumber(
                typeof item.unitPrice === "number" ? item.unitPrice : item.price,
                0,
              ),
            ),
          }))
        : [],
  };
};

export const ordersApi = {
  async list(): Promise<OrderSnapshot[]> {
    const response = await api.get<OrderApiRecord[]>("/orders");
    const records = Array.isArray(response.data) ? response.data : [];
    return records.map(normalizeOrderRecord);
  },

  async get(id: string): Promise<OrderSnapshot> {
    const response = await api.get<OrderApiRecord>(`/orders/${id}`);
    return normalizeOrderRecord(response.data);
  },

  async create(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    const body = {
      ...(payload.clientId ? { clientId: payload.clientId } : {}),
      ...(payload.rut ? { rut: payload.rut } : {}),
      products: payload.products.map((product) => ({
        productId: product.productId,
        quantity: Math.trunc(product.quantity),
      })),
    };
    const response = await api.post<CreateOrderResponse | { order: CreateOrderResponse }>("/orders", body);
    return mapCreateOrderPayload(response.data);
  },

  async createByRut(payload: { rut: string; products: CreateOrderProductInput[] }): Promise<CreateOrderResponse> {
    const body = {
      rut: payload.rut,
      products: payload.products.map((product) => ({
        productId: product.productId,
        quantity: Math.trunc(product.quantity),
      })),
    };
    const response = await api.post<CreateOrderResponse | { order: CreateOrderResponse }>("/orders/by-rut", body);
    return mapCreateOrderPayload(response.data);
  },

  async listByRut(rut: string): Promise<OrderByRutResponse> {
    const response = await api.get<OrderByRutResponse>(`/orders/by-rut/${encodeURIComponent(rut)}`);
    return response.data;
  },

  async updateStatus(id: string, status: OrderStatus) {
    const response = await api.patch<{ message: string; order: OrderApiRecord }>(`/orders/${id}`, { status });
    return {
      message: response.data?.message ?? "Estado actualizado",
      order: normalizeOrderRecord(response.data?.order ?? { id, status, items: [], totalAmount: 0 }),
    };
  },

  async remove(id: string) {
    const response = await api.delete<{ message?: string }>(`/orders/${id}`);
    return response.data;
  },
};

export const formatCurrencyCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(value);

export const formatDateCL = (value: string | null) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

export const formatRut = (rut: string | null) => {
  if (!rut) return "No informado";
  const clean = rut.replace(/\./g, "").toUpperCase();
  const [body, dv] = clean.split("-");
  if (!body || !dv) return clean;
  const reversed = body.split("").reverse();
  const grouped: string[] = [];
  for (let i = 0; i < reversed.length; i += 3) {
    grouped.push(reversed.slice(i, i + 3).join(""));
  }
  return `${grouped.map((chunk) => chunk.split("").reverse().join("")).reverse().join(".")}-${dv}`;
};

export const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const statusLabels: Record<OrderStatus, { label: string; tone: "warning" | "info" | "success" | "danger" }> = {
  pending: { label: "Pendiente", tone: "warning" },
  processing: { label: "En proceso", tone: "info" },
  completed: { label: "Completada", tone: "success" },
  cancelled: { label: "Anulada", tone: "danger" },
};
