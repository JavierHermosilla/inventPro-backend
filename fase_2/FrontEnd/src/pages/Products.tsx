import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import api from "../lib/api";
import { showError, showSuccess, showWarning, confirmAction } from "../lib/alerts";
import {
  productsApi,
  LOW_STOCK_THRESHOLD,
  type ProductItem,
  type ProductListMeta,
  type ProductPayload,
} from "../lib/productsApi";
import { useAuthStore } from "../store/auth";

type CategoryOption = { id: string; label: string };
type CategoryDto = { id: string | number; name?: string | null };
type SupplierOption = { id: string; label: string };
type SupplierDto = { id: string | number; name?: string | null };
type FilterState = {
  search: string;
  status: "all" | ProductItem["estado"];
  category: "all" | string;
};

const EMPTY_FORM: ProductPayload = {
  nombre: "",
  descripcion: "",
  stock: 0,
  precio: 0,
  categoryId: null,
  supplierId: null,
  supplierRut: null,
};

const statusStyles: Record<ProductItem["estado"], { label: string; className: string }> = {
  DISPONIBLE: { label: "Disponible", className: "bg-green-100 text-green-700" },
  STOCK_BAJO: { label: "Stock bajo", className: "bg-amber-100 text-amber-700" },
  AGOTADO: { label: "Agotado", className: "bg-red-100 text-red-700" },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatCategoryName = (label?: string | null) => {
  if (!label) return "Sin categoría";
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const extractErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null) {
    const maybeResponse = (err as { response?: { data?: { message?: unknown } } }).response;
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
const shortId = (id: string | number) => {
  const raw = String(id);
  if (raw.length <= 8) return raw.toUpperCase();
  return raw.slice(0, 4).toUpperCase() + "..." + raw.slice(-4).toUpperCase();
};

const parseCurrencyInput = (value: string) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

const parseStockInput = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.trunc(numeric);
};

export default function Products() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [meta, setMeta] = useState<ProductListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const [filters, setFilters] = useState<FilterState>({ search: "", status: "all", category: "all" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [form, setForm] = useState<ProductPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const currentUser = useAuthStore((state) => state.user);
  const updateFormField = useCallback(<K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, [setForm]);

  const updateFilters = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, [setFilters]);

  const resetFilters = useCallback(() => {
    setFilters({ search: "", status: "all", category: "all" });
  }, [setFilters]);


  /**
   * Obtiene el listado de productos desde el backend y actualiza resumenes.
   */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsApi.list({ limit: 100 });
      setItems(result.items);
      setMeta(result.meta);
    } catch (err: unknown) {
      console.error("[products] error al listar", err);
      const message = extractErrorMessage(err, "No se pudieron cargar los productos.");
      setError(message);
      await showError({
        title: "Error al cargar productos",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carga categorías y proveedores para los selectores del formulario.
   */
  const fetchLookups = useCallback(async () => {
    try {
      const [categoriesRes, suppliersRes] = await Promise.allSettled([
        api.get<{ categories?: CategoryDto[] }>("/categories", { params: { limit: 100 } }),
        api.get<{ suppliers?: SupplierDto[] }>("/suppliers"),
      ]);

      if (categoriesRes.status === "fulfilled") {
        const raw = categoriesRes.value.data?.categories;
        if (Array.isArray(raw)) {
          setCategories(raw.map((category) => ({ id: String(category.id), label: formatCategoryName(category.name) })));
        }
      }

      if (suppliersRes.status === "fulfilled") {
        const raw = suppliersRes.value.data?.suppliers;
        if (Array.isArray(raw)) {
          setSuppliers(raw.map((supplier) => ({ id: String(supplier.id), label: supplier.name ?? "Proveedor sin nombre" })));
        }
      }
    } catch (err) {
      console.error("[products] error al cargar catalogos", err);
      await showError({
        title: "Error al cargar catalogos",
        text: "No se pudieron cargar categorías o proveedores.",
      });
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
    void fetchLookups();
  }, [fetchProducts, fetchLookups]);

  const summary = useMemo(() => {
    const total = meta?.total ?? items.length;
    const lowStock = items.filter((item) => item.estado === "STOCK_BAJO").length;
    const outOfStock = items.filter((item) => item.estado === "AGOTADO").length;
    const available = items.filter((item) => item.estado === "DISPONIBLE").length;
    return { total, lowStock, outOfStock, available };
  }, [items, meta]);

  const filteredItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        query.length === 0 ||
        item.nombre.toLowerCase().includes(query) ||
        (item.descripcion ?? "").toLowerCase().includes(query) ||
        (item.categoryName ?? "").toLowerCase().includes(query) ||
        (item.supplierName ?? "").toLowerCase().includes(query);

      const matchesStatus = filters.status === "all" || item.estado === filters.status;
      const matchesCategory =
        filters.category === "all" || String(item.categoryId ?? "") === String(filters.category);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, filters]);

  const emptyMessage = items.length === 0 ? "No productos disponibles." : "No se encontraron productos con los filtros actuales.";

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setFormError(null);
  }, [setForm, setFormError]);

  /**
   * Abre el modal en modo creacion y limpia el formulario.
   */
  const openCreate = () => {
    setEditing(null);
    resetForm();
    setIsModalOpen(true);
  };

  /**
   * Abre el modal con la información del producto para editarla.
   */
  const openEdit = (product: ProductItem) => {
    setEditing(product);
    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion ?? "",
      stock: product.stock,
      precio: product.precio,
      categoryId: product.categoryId ?? null,
      supplierId: product.supplierId ?? null,
      supplierRut: null,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  /**
   * Envia el formulario al backend para crear o actualizar el producto.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = form.nombre.trim();
    const trimmedDescription = (form.descripcion ?? "").trim();

    if (trimmedName.length === 0) {
      const message = "El nombre del producto es obligatorio.";
      setFormError(message);
      await showWarning({
        title: "Nombre requerido",
        text: message,
      });
      return;
    }

    if (!form.categoryId) {
      const message = "Selecciona una categoría para continuar.";
      setFormError(message);
      await showWarning({
        title: "Categoría requerida",
        text: message,
      });
      return;
    }

    if (!form.supplierId) {
      const message = "Selecciona un proveedor para continuar.";
      setFormError(message);
      await showWarning({
        title: "Proveedor requerido",
        text: message,
      });
      return;
    }

    const payload: ProductPayload = {
      ...form,
      nombre: trimmedName,
      descripcion: trimmedDescription.length > 0 ? trimmedDescription : "",
    };

    setIsSubmitting(true);
    try {
      if (editing) {
        await productsApi.update(editing.id, payload);
        await showSuccess({
          title: "Producto actualizado",
          text: `${trimmedName} se actualizo correctamente.`,
        });
      } else {
        await productsApi.create(payload);
        await showSuccess({
          title: "Producto creado",
          text: `${trimmedName} se registro correctamente.`,
        });
      }
      setIsModalOpen(false);
      resetForm();
      await fetchProducts();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "No se pudo guardar el producto.");
      setFormError(message);
      await showError({
        title: "Error al guardar",
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  /**
   * Solicita confirmacion y elimina el producto seleccionado.
   */
  const handleDelete = async (product: ProductItem) => {
    const productName = product.nombre?.trim().length ? product.nombre : "este producto";
    const confirmed = await confirmAction({
      title: `Eliminar ${productName}?`,
      text: "Esta acción no se puede deshacer.",
      confirmButtonText: "Si, eliminar",
    });
    if (!confirmed) return;

    setDeletingId(product.id);
    try {
      await productsApi.remove(product.id);
      setItems((state) => state.filter((item) => String(item.id) !== String(product.id)));
      await showSuccess({
        title: "Producto eliminado",
        text: `${productName} se elimino correctamente.`,
      });
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "No se pudo eliminar el producto.");
      await showError({
        title: "Error al eliminar",
        text: message,
      });
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Gestión de productos</h1>
          <p className="text-sm text-gray-500">Administra tu catalogo, revisa el stock y coordina con proveedores.</p>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm text-gray-500 md:items-end">
          <span>Usuario conectado: <strong>{currentUser?.name ?? currentUser?.email ?? "Invitado"}</strong></span>
          {meta && <span>Total registrado en el sistema: <strong>{meta.total}</strong></span>}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl bg-white p-5 shadow-lg border border-blue-100">
          <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Productos totales</h2>
          <p className="mt-3 text-3xl font-black text-blue-700">{summary.total}</p>
        </article>
        <article className="rounded-xl bg-white p-5 shadow-lg border border-amber-100">
          <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Stock bajo (&lt;= {LOW_STOCK_THRESHOLD})</h2>
          <p className="mt-3 text-3xl font-black text-amber-700">{summary.lowStock}</p>
        </article>
        <article className="rounded-xl bg-white p-5 shadow-lg border border-red-100">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide">Agotados</h2>
          <p className="mt-3 text-3xl font-black text-red-700">{summary.outOfStock}</p>
        </article>
        <article className="rounded-xl bg-white p-5 shadow-lg border border-emerald-100">
          <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Disponibles</h2>
          <p className="mt-3 text-3xl font-black text-emerald-700">{summary.available}</p>
        </article>
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-lg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:flex-1">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600" htmlFor="search">Buscador</label>
              <input
                id="search"
                type="search"
                placeholder="Busca por nombre, categoría o proveedor"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={filters.search}
                onChange={(event) => updateFilters({ search: event.target.value })}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600" htmlFor="status">Estado</label>
              <select
                id="status"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={filters.status}
                onChange={(event) => updateFilters({ status: event.target.value as FilterState["status"] })}
              >
                <option value="all">Todos</option>
                <option value="DISPONIBLE">Disponibles</option>
                <option value="STOCK_BAJO">Stock bajo</option>
                <option value="AGOTADO">Agotados</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600" htmlFor="category">Categoría</label>
              <select
                id="category"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={filters.category}
                onChange={(event) => updateFilters({ category: event.target.value as FilterState["category"] })}
              >
                <option value="all">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-100"
              onClick={resetFilters}
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
            >
              Nuevo producto
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              className="mt-2 rounded-md border border-red-300 px-3 py-1 text-sm font-medium hover:bg-red-100"
              onClick={() => void fetchProducts()}
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Cargando productos...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">{emptyMessage}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white text-sm text-gray-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{shortId(item.id)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.nombre}</td>
                    <td className="px-4 py-3">{formatCategoryName(item.categoryName)}</td>
                    <td className="px-4 py-3">{item.supplierName ?? "Sin proveedor"}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(item.precio)}</td>
                    <td className="px-4 py-3">{item.stock}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.estado].className}`}>
                        {statusStyles[item.estado].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-md bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setIsModalOpen(false); resetForm(); }} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <header className="mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">{editing ? "Editar producto" : "Nuevo producto"}</h2>
              <p className="text-sm text-gray-500">Completa los datos obligatorios para mantener tu inventario actualizado.</p>
            </header>

            {formError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="nombre">Nombre *</label>
                  <input
                    id="nombre"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.nombre}
                    onChange={(event) => updateFormField("nombre", event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="precio">Precio unitario *</label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">$</span>
                    <input
                      id="precio"
                      type="number"
                      min={0}
                      step={1}
                      className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={form.precio}
                      onChange={(event) => updateFormField("precio", parseCurrencyInput(event.target.value))}
                      required
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">CLP</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="stock">Stock *</label>
                  <input
                    id="stock"
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.stock}
                    onChange={(event) => updateFormField("stock", parseStockInput(event.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="categoria">Categoría *</label>
                  <select
                    id="categoria"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.categoryId ?? ""}
                    onChange={(event) => updateFormField("categoryId", event.target.value ? event.target.value : null)}
                    required
                  >
                    <option value="" disabled>
                      Selecciona una categoría
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="proveedor">Proveedor *</label>
                  <select
                    id="proveedor"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.supplierId ?? ""}
                    onChange={(event) => updateFormField("supplierId", event.target.value ? event.target.value : null)}
                    required
                  >
                    <option value="" disabled>
                      Selecciona un proveedor
                    </option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="descripcion">Descripción</label>
                  <textarea
                    id="descripcion"
                    className="mt-1 h-24 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.descripcion ?? ""}
                    onChange={(event) => updateFormField("descripcion", event.target.value)}
                  />
                </div>
              </div>

              <footer className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
