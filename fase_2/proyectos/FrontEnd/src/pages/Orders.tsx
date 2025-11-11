
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { confirmAction, showError, showSuccess } from "../lib/alerts";
import {
  ordersApi,
  type OrderSnapshot,
  allowedStatusTransitions,
  statusLabels,
  formatCurrencyCLP,
  formatDateCL,
  formatRut,
  calcVatBreakdown,
} from "../lib/ordersApi";
import { clientsApi, type ClientItem } from "../lib/clientsApi";
import { productsApi, type ProductItem } from "../lib/productsApi";

type ViewMode = "list" | "detail" | "create";

type OrderFormLine = {
  id: string;
  productId: string;
  quantity: number;
};

const buildTempId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `line-${Math.random().toString(36).slice(2, 10)}`;

const sanitizeRutValue = (value: string) => value.replace(/\./g, "").trim().toUpperCase();

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err !== null) {
    const maybeResponse = (err as {
      response?: { data?: { message?: unknown; errors?: Array<{ message?: unknown }> } };
    }).response;
    if (Array.isArray(maybeResponse?.data?.errors)) {
      const first = maybeResponse.data.errors.find(
        (item) => typeof item?.message === "string" && item.message.trim().length > 0,
      );
      if (first?.message) {
        return String(first.message);
      }
    }
    const message = maybeResponse?.data?.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }
  return fallback;
};

const statusToneClasses: Record<
  (typeof statusLabels)[keyof typeof statusLabels]["tone"],
  string
> = {
  warning: "border border-amber-200 bg-amber-50 text-amber-700",
  info: "border border-blue-200 bg-blue-50 text-blue-700",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border border-red-200 bg-red-50 text-red-600",
};

const createEmptyLine = (): OrderFormLine => ({
  id: buildTempId(),
  productId: "",
  quantity: 1,
});

const stringLowerIncludes = (haystack: string, needle: string) =>
  haystack.toLowerCase().includes(needle.toLowerCase());

const formatOrderCode = (index: number, total: number) => `OC-${String(total - index).padStart(3, "0")}`;

export default function OrdersPage() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [orders, setOrders] = useState<OrderSnapshot[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSnapshot | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>("");
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderSnapshot["status"] | "all">("all");

  const [clients, setClients] = useState<ClientItem[]>([]);
  const clientsLoadingRef = useRef(false);
  const clientsLoadPromiseRef = useRef<Promise<void> | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [catalogLoadingCount, setCatalogLoadingCount] = useState(0);
  const catalogLoading = catalogLoadingCount > 0;

  const [documentType, setDocumentType] = useState<"boleta" | "factura">("boleta");
  const [customerMode, setCustomerMode] = useState<"client" | "rut">("client");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [rutInput, setRutInput] = useState("");
  const [formLines, setFormLines] = useState<OrderFormLine[]>([createEmptyLine()]);
  const [creating, setCreating] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await ordersApi.list();
      setOrders(data);
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudieron obtener las ordenes.");
      setListError(message);
      await showError({ title: "Error al listar ordenes", text: message });
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadOrderDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const order = await ordersApi.get(id);
      setSelectedOrder(order);
      setStatusDraft(order.status);
      setMode("detail");
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo obtener la orden solicitada.");
      await showError({ title: "Error al cargar la orden", text: message });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const refreshClients = useCallback(async () => {
    if (clientsLoadingRef.current && clientsLoadPromiseRef.current) {
      return clientsLoadPromiseRef.current;
    }
    clientsLoadingRef.current = true;
    const promise = (async () => {
      try {
        const result = await clientsApi.list({ limit: 200 });
        setClients(result.items);
      } catch (err) {
        const message = extractErrorMessage(err, "No se pudieron cargar los clientes.");
        await showError({ title: "Error al cargar clientes", text: message });
      } finally {
        clientsLoadingRef.current = false;
        clientsLoadPromiseRef.current = null;
      }
    })();
    clientsLoadPromiseRef.current = promise;
    return promise;
  }, []);

  const refreshProducts = useCallback(async () => {
    setCatalogLoadingCount((prev) => prev + 1);
    try {
      const result = await productsApi.list({ limit: 200 });
      setProducts(result.items);
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudieron cargar los productos.");
      await showError({ title: "Error al actualizar inventario", text: message });
    } finally {
      setCatalogLoadingCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const ensureCatalogLoaded = useCallback(async () => {
    const needsClients = clients.length === 0;
    const needsProducts = products.length === 0;
    if (!needsClients && !needsProducts) return;

    if (needsClients) {
      await refreshClients();
    }
    if (needsProducts) {
      await refreshProducts();
    }
  }, [clients.length, products.length, refreshClients, refreshProducts]);

  useEffect(() => {
    loadOrders().catch(() => {});
  }, [loadOrders]);

  useEffect(() => {
    refreshClients().catch(() => {});
  }, [refreshClients]);

  useEffect(() => {
    if (mode === "detail" && selectedOrder) {
      setStatusDraft(selectedOrder.status);
    }
  }, [mode, selectedOrder]);

  useEffect(() => {
    if (mode === "create") {
      ensureCatalogLoaded().catch(() => {});
    }
  }, [mode, ensureCatalogLoaded]);

  const sortedOrders = useMemo(() => {
    const clone = [...orders];
    clone.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return clone;
  }, [orders]);

  const enrichedOrders = useMemo(
    () =>
      sortedOrders.map((order, index) => ({
        order,
        code: formatOrderCode(index, sortedOrders.length),
      })),
    [sortedOrders],
  );

  const clientIndex = useMemo(() => {
    const index = new Map<string, ClientItem>();
    clients.forEach((client) => {
      index.set(client.id, client);
    });
    return index;
  }, [clients]);

  const resolveOrderClientInfo = useCallback(
    (order: OrderSnapshot) => {
      const fallbackClient = order.clientId ? clientIndex.get(order.clientId) : undefined;
      return {
        name: order.clientName ?? fallbackClient?.name ?? null,
        rut: order.clientRut ?? fallbackClient?.rut ?? null,
      };
    },
    [clientIndex],
  );

  const filteredOrders = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return enrichedOrders.filter(({ order, code }) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!needle) return true;
      const clientInfo = resolveOrderClientInfo(order);
      const clientName = clientInfo.name ?? "";
      const clientRut = formatRut(clientInfo.rut);
      return (
        stringLowerIncludes(order.id, needle) ||
        stringLowerIncludes(code, needle) ||
        stringLowerIncludes(clientName, needle) ||
        stringLowerIncludes(clientRut, needle)
      );
    });
  }, [enrichedOrders, searchTerm, statusFilter, resolveOrderClientInfo]);

  const stats = useMemo(() => {
    return orders.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] += 1;
        acc.subtotal += item.subtotal;
        acc.iva += item.iva;
        acc.totalWithTax += item.totalWithTax;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        subtotal: 0,
        iva: 0,
        totalWithTax: 0,
      },
    );
  }, [orders]);

  const detailedFormLines = useMemo(() => {
    return formLines.map((line) => {
      const product = products.find((item) => String(item.id) === line.productId);
      const unitPrice = product ? Number(product.precio ?? 0) : 0;
      const safeQty = Number.isFinite(line.quantity) && line.quantity > 0 ? line.quantity : 0;
      const lineTotal = unitPrice * safeQty;
      return {
        ...line,
        product,
        unitPrice,
        lineTotal,
      };
    });
  }, [formLines, products]);

  const formTotals = useMemo(() => {
    const subtotal = detailedFormLines.reduce((acc, line) => acc + line.lineTotal, 0);
    return calcVatBreakdown(subtotal);
  }, [detailedFormLines]);

  const resetForm = () => {
    setCustomerMode("client");
    setSelectedClientId("");
    setRutInput("");
    setDocumentType("boleta");
    setFormLines([createEmptyLine()]);
  };

  const handleDelete = async (orderId: string) => {
    const confirmed = await confirmAction({
      title: "Eliminar orden",
      text: "Esta accion restaurara el stock y no se puede deshacer. Deseas continuar?",
      confirmButtonText: "Si, eliminar",
    });
    if (!confirmed) return;

    setDeletingId(orderId);
    try {
      await ordersApi.remove(orderId);
      setOrders((prev) => prev.filter((item) => item.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setMode("list");
      }
      if (products.length > 0) {
        await refreshProducts();
      }
      await showSuccess({ title: "Orden eliminada", text: "La orden se elimino correctamente." });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo eliminar la orden.");
      await showError({ title: "Error al eliminar", text: message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !statusDraft || statusDraft === selectedOrder.status) return;
    const nextStatus = statusDraft as OrderSnapshot["status"];
    setStatusUpdatingId(selectedOrder.id);
    try {
      const result = await ordersApi.updateStatus(selectedOrder.id, nextStatus);
      setSelectedOrder(result.order);
      setOrders((prev) =>
        prev.map((item) => (item.id === result.order.id ? result.order : item)),
      );
      if (products.length > 0 && (nextStatus === "completed" || nextStatus === "cancelled")) {
        await refreshProducts();
      }
      await showSuccess({ title: "Estado actualizado", text: result.message ?? "Estado modificado." });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo actualizar el estado.");
      await showError({ title: "Cambio de estado no aplicado", text: message });
      setStatusDraft(selectedOrder.status);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const addLine = () => setFormLines((prev) => [...prev, createEmptyLine()]);

  const updateLine = (id: string, changes: Partial<OrderFormLine>) => {
    setFormLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...changes } : line)),
    );
  };

  const removeLine = (id: string) => {
    setFormLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.id !== id)));
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const activeLines = detailedFormLines.filter(
      (line) => line.productId && Number.isFinite(line.quantity) && line.quantity > 0,
    );

    if (activeLines.length === 0) {
      await showError({ title: "Productos requeridos", text: "Agrega al menos un producto a la orden." });
      return;
    }

    if (customerMode === "client" && !selectedClientId) {
      await showError({ title: "Cliente requerido", text: "Selecciona un cliente para la orden." });
      return;
    }

    let sanitizedRut = "";
    if (customerMode === "rut") {
      sanitizedRut = sanitizeRutValue(rutInput);
      if (!sanitizedRut.includes("-") || sanitizedRut.length < 9) {
        await showError({
          title: "RUT invalido",
          text: "Ingresa un RUT valido en formato 12345678-9.",
        });
        return;
      }
    }

    if (documentType === "factura") {
      const rutFromClient =
        customerMode === "client"
          ? clients.find((client) => client.id === selectedClientId)?.rut ?? ""
          : sanitizedRut;

      if (!rutFromClient) {
        await showError({
          title: "RUT requerido",
          text: "Para emitir una factura es obligatorio contar con el RUT del contribuyente.",
        });
        return;
      }
    }

    const payload = {
      products: activeLines.map((line) => ({
        productId: line.productId,
        quantity: Math.trunc(line.quantity),
      })),
    } as {
      clientId?: string;
      rut?: string;
      products: Array<{ productId: string; quantity: number }>;
    };

    if (customerMode === "client") {
      payload.clientId = selectedClientId;
    } else {
      payload.rut = sanitizeRutValue(rutInput);
    }

    setCreating(true);
    try {
      const created = await ordersApi.create(payload);
      const detail = await ordersApi.get(created.id);
      setOrders((prev) => [detail, ...prev.filter((item) => item.id !== detail.id)]);
      setSelectedOrder(detail);
      setMode("detail");
      resetForm();
      if (products.length > 0) {
        await refreshProducts();
      }
      await showSuccess({
        title: "Orden creada",
        text: "La orden se registro correctamente. Recuerda generar la boleta o factura segun corresponda.",
      });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo crear la orden.");
      await showError({ title: "Error al crear la orden", text: message });
    } finally {
      setCreating(false);
    }
  };

  const renderStatusBadge = (status: OrderSnapshot["status"]) => {
    const config = statusLabels[status];
    const classes = statusToneClasses[config.tone];
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
        {config.label}
      </span>
    );
  };

  const listView = (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ordenes de compra y venta</h1>
          <p className="text-sm text-gray-500">
            Gestiona las solicitudes y emite documentos tributarios conforme a la normativa chilena.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setMode("create");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          Crear orden
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Total ordenes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Pendientes</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">IVA estimado</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrencyCLP(stats.iva)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Total con impuestos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrencyCLP(stats.totalWithTax)}</p>
        </div>
      </section>

      {listError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{listError}</div>
      )}

      <section className="rounded-xl bg-white p-4 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label htmlFor="order-search" className="text-xs font-semibold uppercase text-gray-500">
              Buscar orden
            </label>
            <input
              id="order-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por folio, cliente o RUT"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="md:w-60">
            <label htmlFor="order-status-filter" className="text-xs font-semibold uppercase text-gray-500">
              Estado
            </label>
            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value === "all" ? "all" : (event.target.value as OrderSnapshot["status"]))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="processing">En proceso</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Anulada</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                loadOrders().catch(() => {});
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Reiniciar
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Folio
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cliente
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total c/IVA
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredOrders.map(({ order, code }) => {
                const clientInfo = resolveOrderClientInfo(order);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-blue-600">
                      <span>#{code}</span>
                      <span className="ml-2 text-xs text-gray-400">({order.id.slice(0, 8)}...)</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{clientInfo.name ?? "Sin asignar"}</p>
                      <p className="text-xs text-gray-500">RUT: {formatRut(clientInfo.rut)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDateCL(order.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrencyCLP(order.totalWithTax)}</td>
                    <td className="px-4 py-3">{renderStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => loadOrderDetail(order.id).catch(() => {})}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === order.id}
                          onClick={() => handleDelete(order.id)}
                          className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-60"
                        >
                          {deletingId === order.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loadingList && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No se encontraron ordenes con los filtros seleccionados.
                  </td>
                </tr>
              )}
              {loadingList && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Cargando ordenes...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const selectedOrderClientInfo = selectedOrder ? resolveOrderClientInfo(selectedOrder) : null;

  const detailView = selectedOrder && (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("list");
              setSelectedOrder(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <span aria-hidden="true">←</span>
            Volver a listado
          </button>
          <span className="text-xs text-gray-400">ID: {selectedOrder.id}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              ensureCatalogLoaded().catch(() => {});
              setMode("create");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Generar nueva orden
          </button>
          {allowedStatusTransitions[selectedOrder.status].length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value={selectedOrder.status}>Estado actual: {statusLabels[selectedOrder.status].label}</option>
                {allowedStatusTransitions[selectedOrder.status].map((option) => (
                  <option key={option} value={option}>
                    Cambiar a: {statusLabels[option].label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={statusUpdatingId === selectedOrder.id || statusDraft === selectedOrder.status}
                onClick={() => handleStatusUpdate()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
              >
                {statusUpdatingId === selectedOrder.id ? "Actualizando..." : "Guardar estado"}
              </button>
            </div>
          )}
        </div>
      </div>

      {detailLoading ? (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">Cargando detalle...</div>
      ) : (
        <section className="space-y-6 rounded-xl bg-white p-6 shadow">
          <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalle de la orden</h2>
              <p className="text-sm text-gray-500">
                Fecha de emision: {formatDateCL(selectedOrder.createdAt)} · Documento tributario sujeto a IVA del 19%.
              </p>
            </div>
            {renderStatusBadge(selectedOrder.status)}
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700">Cliente</h3>
              <dl className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Nombre</dt>
                  <dd>{selectedOrderClientInfo?.name ?? "No disponible"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">RUT</dt>
                  <dd>{formatRut(selectedOrderClientInfo?.rut ?? null)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Backorder</dt>
                  <dd>{selectedOrder.isBackorder ? "Si" : "No"}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700">Totales tributarios</h3>
              <dl className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Subtotal (neto)</dt>
                  <dd>{formatCurrencyCLP(selectedOrder.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">IVA (19%)</dt>
                  <dd>{formatCurrencyCLP(selectedOrder.iva)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-semibold text-gray-800">Total bruto</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrencyCLP(selectedOrder.totalWithTax)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700">Lineas de la orden</h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Producto</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Cantidad</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Precio unitario</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id ?? `${item.productId}-${item.productName}`}>
                      <td className="px-4 py-2">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        {item.productSku && <p className="text-xs text-gray-400">SKU: {item.productSku}</p>}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-gray-600">{formatCurrencyCLP(item.unitPrice)}</td>
                      <td className="px-4 py-2 font-semibold text-gray-900">{formatCurrencyCLP(item.lineTotal)}</td>
                    </tr>
                  ))}
                  {selectedOrder.items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                        La orden no tiene lineas asociadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );

  const createView = (
    <form onSubmit={handleCreate} className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("list");
            resetForm();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <span aria-hidden="true">←</span>
          Volver
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Crear orden</h1>
      </div>

      <section className="rounded-xl bg-white p-6 shadow">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Identificacion tributaria</h2>
          <p className="text-sm text-gray-500">
            Completa la informacion necesaria para emitir boletas o facturas conforme al SII.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="document-type">
              Tipo de documento
            </label>
            <select
              id="document-type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as "boleta" | "factura")}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="boleta">Boleta electronica</option>
              <option value="factura">Factura electronica</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="customer-mode">
              Identificacion del cliente
            </label>
            <select
              id="customer-mode"
              value={customerMode}
              onChange={(event) => setCustomerMode(event.target.value as "client" | "rut")}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="client">Seleccionar cliente registrado</option>
              <option value="rut">Ingresar RUT manual</option>
            </select>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
            Recuerda validar el RUT y la razon social antes de emitir la boleta o factura en el portal del SII.
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {customerMode === "client" ? (
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="client-id">
                Cliente
              </label>
              <select
                id="client-id"
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
                disabled={catalogLoading}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
              >
                <option value="">Selecciona un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} · RUT {client.rut}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="rut-input">
                RUT del receptor
              </label>
              <input
                id="rut-input"
                type="text"
                value={rutInput}
                placeholder="12345678-9"
                onChange={(event) => setRutInput(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          )}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
            {documentType === "factura"
              ? "Las facturas requieren siempre el RUT valido del contribuyente y su giro comercial."
              : "Para boletas electronicas se recomienda registrar el RUT cuando exista."}
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lineas de la orden</h2>
            <p className="text-sm text-gray-500">Selecciona los productos que formaran parte del documento tributario.</p>
          </div>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Agregar producto
          </button>
        </header>

        <div className="space-y-4">
          {detailedFormLines.map((line) => (
            <div key={line.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-xs font-semibold uppercase text-gray-500">Producto</label>
                <select
                  value={line.productId}
                  onChange={(event) => updateLine(line.id, { productId: event.target.value })}
                  disabled={catalogLoading}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={String(product.id)}>
                      {product.nombre} · Stock {product.stock} · {formatCurrencyCLP(Number(product.precio ?? 0))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:w-32">
                <label className="text-xs font-semibold uppercase text-gray-500">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(event) => updateLine(line.id, { quantity: Math.max(1, Number(event.target.value)) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="md:w-40">
                <label className="text-xs font-semibold uppercase text-gray-500">Subtotal</label>
                <p className="mt-2 text-sm font-semibold text-gray-900">{formatCurrencyCLP(line.lineTotal)}</p>
              </div>
              <div className="flex items-center justify-end md:w-32">
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={formLines.length <= 1}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {formLines.length <= 1 ? "Minimo" : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 md:flex-row md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Totales</p>
            <p className="text-sm text-gray-600">
              Calculados con IVA vigente del 19% conforme a la normativa tributaria chilena.
            </p>
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            <p>
              Subtotal (neto): <span className="font-semibold text-gray-900">{formatCurrencyCLP(formTotals.subtotal)}</span>
            </p>
            <p>
              IVA (19%): <span className="font-semibold text-gray-900">{formatCurrencyCLP(formTotals.iva)}</span>
            </p>
            <p>
              Total con impuestos:{" "}
              <span className="font-semibold text-gray-900">{formatCurrencyCLP(formTotals.totalWithTax)}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setMode("list");
          }}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={creating || catalogLoading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {creating ? "Guardando..." : "Guardar orden"}
        </button>
      </section>
    </form>
  );

  if (mode === "create") {
    return createView;
  }
  if (mode === "detail" && selectedOrder) {
    return detailView;
  }
  return listView;
}
