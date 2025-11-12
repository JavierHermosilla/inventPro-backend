import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  manualInventoryApi,
  type ManualInventoryItem,
  type ManualInventoryMovementType,
} from "../lib/manualInventoryApi";
import { productsApi, LOW_STOCK_THRESHOLD, type ProductItem } from "../lib/productsApi";
import { showError, showSuccess } from "../lib/alerts";
import { useAuthStore } from "../store/auth";

type Stats = {
  totalProducts: number;
  totalStock: number;
  lowStock: number;
  totalEntries: number;
  totalOutputs: number;
  latestMovement: ManualInventoryItem | null;
};

const MOVEMENT_LABELS: Record<ManualInventoryMovementType, { label: string; hint: string; className: string }> = {
  increase: {
    label: "Ingreso (+)",
    hint: "Añade unidades al stock disponible.",
    className: "bg-green-50 text-green-600 ring-1 ring-inset ring-green-200",
  },
  decrease: {
    label: "Salida (-)",
    hint: "Descuenta unidades por ajustes, ventas u otras salidas.",
    className: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
  },
};

const PRODUCT_STATUS: Record<ProductItem["estado"], { label: string; className: string }> = {
  DISPONIBLE: { label: "Disponible", className: "bg-green-100 text-green-700" },
  STOCK_BAJO: { label: "Stock bajo", className: "bg-amber-100 text-amber-700" },
  AGOTADO: { label: "Agotado", className: "bg-red-100 text-red-700" },
};

const numberFormatter = new Intl.NumberFormat("es-CL");
const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });

const extractErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null) {
    const maybeResponse = (err as { response?: { data?: { message?: unknown } } }).response;
    const candidate = maybeResponse?.data?.message;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  if (err instanceof Error && err.message.trim().length > 0) return err.message;
  return fallback;
};

export default function ManualInventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [movements, setMovements] = useState<ManualInventoryItem[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [movementType, setMovementType] = useState<ManualInventoryMovementType>("increase");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRole = useAuthStore((state) => state.user?.role);
  const canAdjust = userRole === "admin" || userRole === "bodeguero";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productResult, movementsResult] = await Promise.all([
        productsApi.list({ limit: 200 }),
        manualInventoryApi.list({ limit: 50 }),
      ]);

      setProducts(productResult.items);
      setMovements(movementsResult.records);

      if (!selectedProductId && productResult.items.length > 0) {
        setSelectedProductId(String(productResult.items[0].id));
      }
    } catch (err) {
      console.error("[manual-inventory] error al cargar datos", err);
      const message = extractErrorMessage(err, "No se pudo cargar el inventario manual.");
      setError(message);
      void showError({
        title: "Error al cargar inventario",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProductId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const nameMatch = product.nombre.toLowerCase().includes(term);
      const idMatch = String(product.id).toLowerCase().includes(term);
      return nameMatch || idMatch;
    });
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((product) => String(product.id) === selectedProductId) ?? null;
  }, [products, selectedProductId]);

  const stats: Stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((acc, product) => acc + (Number(product.stock) || 0), 0);
    const lowStock = products.filter((product) => product.stock < LOW_STOCK_THRESHOLD).length;
    const totalEntries = movements
      .filter((movement) => movement.type === "increase")
      .reduce((acc, movement) => acc + movement.quantity, 0);
    const totalOutputs = movements
      .filter((movement) => movement.type === "decrease")
      .reduce((acc, movement) => acc + movement.quantity, 0);

    return {
      totalProducts,
      totalStock,
      lowStock,
      totalEntries,
      totalOutputs,
      latestMovement: movements.length > 0 ? movements[0] : null,
    };
  }, [movements, products]);

  const openModal = useCallback((productId?: string | number) => {
    setMovementType("increase");
    setQuantity(1);
    setReason("");
    setFormError(null);

    if (productId) {
      setSelectedProductId(String(productId));
    } else if (!selectedProductId && products.length > 0) {
      setSelectedProductId(String(products[0].id));
    }

    setIsModalOpen(true);
  }, [products, selectedProductId]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setIsSubmitting(false);
  }, []);

  const onSubmitAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!selectedProductId) {
      setFormError("Selecciona un producto para ajustar.");
      return;
    }

    const selected = selectedProduct;
    if (!selected) {
      setFormError("No se encontró la información del producto seleccionado.");
      return;
    }

    const safeQuantity = Number(quantity);
    if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) {
      setFormError("Ingresa una cantidad válida (mayor a 0).");
      return;
    }

    if (movementType === "decrease" && reason.trim().length === 0) {
      setFormError("Debes indicar un motivo para una salida de stock.");
      return;
    }

    if (!canAdjust) {
      setFormError("No tienes permisos para registrar ajustes manuales.");
      return;
    }

    setIsSubmitting(true);
    try {
      await manualInventoryApi.create({
        productId: selectedProductId,
        type: movementType,
        quantity: safeQuantity,
        reason: reason.trim() || undefined,
      });

      void showSuccess({
        title: "Ajuste registrado",
        text: "El movimiento fue registrado exitosamente.",
      });

      closeModal();
      await fetchData();
    } catch (err) {
      console.error("[manual-inventory] error al crear ajuste", err);
      const message = extractErrorMessage(err, "No se pudo registrar el ajuste.");
      setFormError(message);
      void showError({
        title: "Error al registrar ajuste",
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewStock = useMemo(() => {
    if (!selectedProduct) return null;
    const qty = Number.isFinite(quantity) ? quantity : 0;
    return movementType === "increase" ? selectedProduct.stock + qty : selectedProduct.stock - qty;
  }, [movementType, quantity, selectedProduct]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-lg font-semibold text-gray-700">Inventario Manual</h1>
        <p className="mt-2 text-sm text-gray-500">Cargando datos de inventario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-lg font-semibold text-gray-700">Inventario Manual</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Inventario Manual <span aria-hidden>📦</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Realiza ajustes de stock para tus productos y revisa el historial de movimientos relevantes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          disabled={!canAdjust || products.length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          + Ajustar stock
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Productos con stock" value={numberFormatter.format(stats.totalProducts)} />
        <StatCard
          title="Unidades disponibles"
          value={numberFormatter.format(stats.totalStock)}
          subtitle="Stock total actualizado"
        />
        <StatCard
          title="Movimientos de ingreso"
          value={numberFormatter.format(stats.totalEntries)}
          subtitle="Últimos 50 registros"
        />
        <StatCard
          title="Movimientos de salida"
          value={numberFormatter.format(stats.totalOutputs)}
          subtitle={
            stats.lowStock > 0
              ? `${stats.lowStock} producto(s) con stock bajo`
              : "Todos los productos con stock saludable"
          }
        />
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Productos disponibles</h2>
            <p className="text-sm text-gray-500">Filtra y revisa el stock antes de aplicar un ajuste.</p>
          </div>
          <div className="relative w-full md:w-72">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o ID..."
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <path
                d="M21 21l-4.35-4.35m1.02-4.3a6.05 6.05 0 11-12.1 0 6.05 6.05 0 0112.1 0z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
              />
            </svg>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Stock actual</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No encontramos productos para tu búsqueda.
                  </td>
                </tr>
              )}
              {filteredProducts.map((product) => {
                const status = PRODUCT_STATUS[product.estado];
                return (
                  <tr key={product.id} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{product.nombre}</div>
                      {product.descripcion ? (
                        <p className="text-xs text-gray-500">{product.descripcion}</p>
                      ) : (
                        <p className="text-xs text-gray-400">Sin descripción</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {product.categoryName ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                          {product.categoryName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin categoría</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{numberFormatter.format(product.stock)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(product.id)}
                        disabled={!canAdjust}
                        className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        Ajustar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Historial de movimientos</h2>
            <p className="text-sm text-gray-500">Registros recientes de ingresos y salidas de stock.</p>
          </div>
          {stats.latestMovement && (
            <div className="rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-500">
              Último movimiento registrado el{" "}
              <span className="font-medium text-gray-700">{dateFormatter.format(new Date(stats.latestMovement.createdAt))}</span>
              .
            </div>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Movimiento</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Aún no existen ajustes manuales registrados.
                  </td>
                </tr>
              )}

              {movements.map((movement) => {
                const badge = MOVEMENT_LABELS[movement.type];
                return (
                  <tr key={movement.id} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {dateFormatter.format(new Date(movement.createdAt))}
                      </div>
                      <div className="text-xs text-gray-400">ID #{movement.id.slice(0, 8).toUpperCase()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{movement.productName}</div>
                      <div className="text-xs text-gray-500">
                        Stock actual: {numberFormatter.format(movement.productStock)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                      <p className="mt-1 text-xs text-gray-400">{badge.hint}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {numberFormatter.format(movement.quantity)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {movement.reason ? (
                        <Fragment>
                          <p className="text-sm">{movement.reason}</p>
                        </Fragment>
                      ) : (
                        <span className="text-sm text-gray-400">Sin registro</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {movement.performedBy ? (
                        <div>
                          <div className="font-semibold text-gray-800">{movement.performedBy}</div>
                          <div className="text-xs text-gray-400">
                            {movement.performedByRole ?? "Rol no informado"}
                            {movement.performedByEmail ? ` · ${movement.performedByEmail}` : ""}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No disponible</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/50 px-4 py-8">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Ajustar stock manualmente</h2>
                <p className="text-sm text-gray-500">
                  Registra un movimiento de entrada o salida para mantener el stock al día.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth={1.5}
                  />
                </svg>
              </button>
            </header>

            <form onSubmit={onSubmitAdjustment} className="space-y-5 px-6 py-6">
              <div>
                <label htmlFor="productId" className="text-sm font-medium text-gray-600">
                  Producto
                </label>
                <select
                  id="productId"
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                >
                  <option value="" disabled>
                    Selecciona un producto
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nombre} (Stock: {numberFormatter.format(product.stock)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-700">Detalle actual:</span>
                    <span>Stock disponible: {numberFormatter.format(selectedProduct.stock)}</span>
                    <span>
                      Estado:{" "}
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRODUCT_STATUS[selectedProduct.estado].className}`}
                      >
                        {PRODUCT_STATUS[selectedProduct.estado].label}
                      </span>
                    </span>
                    {selectedProduct.categoryName && <span>Categoría: {selectedProduct.categoryName}</span>}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="movementType" className="text-sm font-medium text-gray-600">
                    Tipo de movimiento
                  </label>
                  <select
                    id="movementType"
                    value={movementType}
                    onChange={(event) => setMovementType(event.target.value as ManualInventoryMovementType)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="increase">{MOVEMENT_LABELS.increase.label}</option>
                    <option value="decrease">{MOVEMENT_LABELS.decrease.label}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="quantity" className="text-sm font-medium text-gray-600">
                    Cantidad
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      setQuantity(!Number.isFinite(parsed) || parsed < 0 ? 0 : Math.trunc(parsed));
                    }}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="text-sm font-medium text-gray-600">
                  Motivo {movementType === "decrease" ? "(requerido para salidas)" : "(opcional)"}
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ej: Ajuste por conteo físico, producto dañado, devolución, etc."
                  className="mt-1 h-24 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {selectedProduct && (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-600">
                  <div className="font-semibold text-gray-700">Resumen del ajuste</div>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>
                      Stock actual: <strong>{numberFormatter.format(selectedProduct.stock)}</strong>
                    </li>
                    <li>
                      Cantidad a {movementType === "increase" ? "ingresar" : "descontar"}:{" "}
                      <strong>{numberFormatter.format(quantity || 0)}</strong>
                    </li>
                    <li>
                      Stock proyectado:{" "}
                      <strong
                        className={
                          previewStock !== null && previewStock < 0
                            ? "text-red-600"
                            : "text-gray-800"
                        }
                      >
                        {previewStock !== null ? numberFormatter.format(previewStock) : "—"}
                      </strong>
                    </li>
                  </ul>
                  {movementType === "decrease" && selectedProduct.stock < (quantity || 0) && (
                    <p className="mt-2 text-xs text-red-500">
                      Atención: la salida supera el stock disponible. El backend permitirá stock negativo si corresponde,
                      pero revisa que el movimiento sea correcto.
                    </p>
                  )}
                </div>
              )}

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <footer className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !canAdjust}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSubmitting ? "Guardando..." : "Guardar ajuste"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</div>
      <div className="mt-2 text-2xl font-bold text-gray-800">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}
