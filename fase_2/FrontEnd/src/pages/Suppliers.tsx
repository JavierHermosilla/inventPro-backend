import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import DataTable, { type Column } from "../components/DataTable";
import {
  suppliersApi,
  SUPPLIER_STATUS_LABELS,
  type SupplierItem,
  type SupplierStatus,
} from "../lib/suppliersApi";

const formatDate = (value?: string | null) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value ?? "Sin registro";
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

type FormState = {
  name: string;
  rut: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  paymentTerms: string;
  notes: string;
  status: SupplierStatus;
};

const EMPTY_FORM: FormState = {
  name: "",
  rut: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  paymentTerms: "",
  notes: "",
  status: "active",
};

const statusStyles: Record<SupplierStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-amber-100 text-amber-700",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 4000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const updateFormField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setFormError(null);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await suppliersApi.list();
      setSuppliers(result.items);
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudieron obtener los proveedores.");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers().catch(() => {});
  }, [fetchSuppliers]);

  const handleSearchSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleCreateSupplier = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await suppliersApi.create({
        name: form.name,
        rut: form.rut,
        contactName: form.contactName || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        website: form.website || null,
        paymentTerms: form.paymentTerms || null,
        status: form.status,
        notes: form.notes || null,
      });

      setFlash(`Proveedor ${form.name} creado correctamente.`);
      setIsModalOpen(false);
      resetForm();
      fetchSuppliers().catch(() => {});
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo crear el proveedor.");
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchSuppliers, form, resetForm]);

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length === 0) return suppliers;
    return suppliers.filter((supplier) => {
      const statusLabel = SUPPLIER_STATUS_LABELS[supplier.status] ?? supplier.status;
      return [
        supplier.name,
        supplier.contactName ?? "",
        supplier.email ?? "",
        supplier.phone ?? "",
        supplier.rut,
        supplier.paymentTerms ?? "",
        statusLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [suppliers, searchTerm]);

  const totalSuppliers = suppliers.length;
  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.status === "active").length,
    [suppliers],
  );
  const inactiveSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.status === "inactive").length,
    [suppliers],
  );

  const columns = useMemo<Column<SupplierItem>[]>(() => [
    {
      key: "name",
      header: "Proveedor",
      render: (supplier) => (
        <div>
          <p className="font-semibold text-gray-900">{supplier.name}</p>
          {supplier.contactName && (
            <p className="text-xs text-gray-500">Contacto: {supplier.contactName}</p>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Contacto",
      render: (supplier) => (
        <div className="space-y-1 text-sm text-gray-600">
          <p>{supplier.email ?? "Sin correo"}</p>
          <p>{supplier.phone ?? "Sin telefono"}</p>
        </div>
      ),
    },
    {
      key: "rut",
      header: "RUT y sitio",
      render: (supplier) => (
        <div className="space-y-1 text-sm text-gray-600">
          <p className="font-medium text-gray-800">{supplier.rut}</p>
          {supplier.website ? (
            <a
              href={supplier.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              {supplier.website}
            </a>
          ) : (
            <p className="text-xs text-gray-400">Sin sitio web</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (supplier) => {
        const label = SUPPLIER_STATUS_LABELS[supplier.status] ?? supplier.status;
        return (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[supplier.status]}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: "paymentTerms",
      header: "Terminos y notas",
      render: (supplier) => (
        <div className="space-y-1 text-sm text-gray-600">
          <p>{supplier.paymentTerms ?? "Sin terminos registrados"}</p>
          <p className="text-xs text-gray-400">{supplier.notes ?? "Sin notas"}</p>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Ultima actualizacion",
      render: (supplier) => (
        <div className="text-sm text-gray-500">
          <p>Creado: {formatDate(supplier.createdAt)}</p>
          <p>Actualizado: {formatDate(supplier.updatedAt)}</p>
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion de proveedores</h1>
          <p className="text-sm text-gray-500">
            Registra y controla la informacion clave de tus proveedores.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          Nuevo proveedor
        </button>
      </header>

      {flash && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {flash}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Total proveedores</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalSuppliers}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Activos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{activeSuppliers}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Inactivos</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{inactiveSuppliers}</p>
        </div>
      </section>

      <section className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="supplier-search">
              Buscar proveedores
            </label>
            <input
              id="supplier-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nombre, RUT, contacto..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              Limpiar
            </button>
          </div>
        </form>

        <DataTable
          columns={columns}
          data={filteredSuppliers}
          loading={loading}
          emptyMessage={searchTerm ? "No hay proveedores que coincidan con la busqueda." : "Aun no hay proveedores registrados."}
        />
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Nuevo proveedor</h2>
                <p className="text-sm text-gray-500">Completa los datos requeridos para registrar el proveedor.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ?
              </button>
            </header>

            <form onSubmit={handleCreateSupplier} className="px-6 py-4" noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-name">Nombre *</label>
                  <input
                    id="supplier-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) => updateFormField("name", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-rut">RUT *</label>
                  <input
                    id="supplier-rut"
                    type="text"
                    required
                    value={form.rut}
                    onChange={(event) => updateFormField("rut", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="12345678-9"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-contact">Nombre de contacto</label>
                  <input
                    id="supplier-contact"
                    type="text"
                    value={form.contactName}
                    onChange={(event) => updateFormField("contactName", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Persona de contacto"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-email">Correo</label>
                  <input
                    id="supplier-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateFormField("email", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="contacto@empresa.cl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-phone">Telefono</label>
                  <input
                    id="supplier-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateFormField("phone", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Ej: +56 9 1234 5678"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-address">Direccion</label>
                  <input
                    id="supplier-address"
                    type="text"
                    value={form.address}
                    onChange={(event) => updateFormField("address", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-website">Sitio web</label>
                  <input
                    id="supplier-website"
                    type="url"
                    value={form.website}
                    onChange={(event) => updateFormField("website", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-terms">Terminos de pago</label>
                  <input
                    id="supplier-terms"
                    type="text"
                    value={form.paymentTerms}
                    onChange={(event) => updateFormField("paymentTerms", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Ej: 30 dias"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-status">Estado *</label>
                  <select
                    id="supplier-status"
                    required
                    value={form.status}
                    onChange={(event) => updateFormField("status", event.target.value as SupplierStatus)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="active">{SUPPLIER_STATUS_LABELS.active}</option>
                    <option value="inactive">{SUPPLIER_STATUS_LABELS.inactive}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600" htmlFor="supplier-notes">Notas</label>
                  <textarea
                    id="supplier-notes"
                    value={form.notes}
                    onChange={(event) => updateFormField("notes", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={3}
                    placeholder="Observaciones importantes, productos destacados, etc."
                  />
                </div>
              </div>

              {formError && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <footer className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar proveedor"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
