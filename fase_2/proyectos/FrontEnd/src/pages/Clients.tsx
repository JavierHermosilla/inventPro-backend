import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import DataTable, { type Column } from "../components/DataTable";
import { clientsApi, type ClientItem } from "../lib/clientsApi";
import { confirmAction, showError, showSuccess } from "../lib/alerts";
import { useAuthStore } from "../store/auth";

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

export default function ClientsPage() {
  const role = useAuthStore((state) => state.user?.role ?? "user");
  const canCreateClient = role === "admin" || role === "vendedor";
  const canDeleteClient = role === "admin";

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchClients = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await clientsApi.list({ limit: 100, search: (search ?? "").trim() || undefined });
      setClients(result.items);
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudieron obtener los clientes.");
      setError(message);
      await showError({ title: "Error al listar clientes", text: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients().catch(() => {});
  }, [fetchClients]);

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      fetchClients(searchTerm).catch(() => {});
    },
    [fetchClients, searchTerm]
  );

  const handleClear = () => {
    setSearchTerm("");
    fetchClients("").catch(() => {});
  };

  const handleDelete = useCallback(async (client: ClientItem) => {
    const confirmed = await confirmAction({
      title: `Eliminar cliente "${client.name}"?`,
      text: "Esta acción no se puede deshacer.",
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirmed) return;

    setDeletingId(client.id);
    try {
      await clientsApi.remove(client.id);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      await showSuccess({ title: "Cliente eliminado", text: `${client.name} fue eliminado correctamente.` });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo eliminar el cliente.");
      await showError({ title: "Error al eliminar", text: message });
    } finally {
      setDeletingId(null);
    }
  }, []);

  const columns = useMemo<Column<ClientItem>[]>(() => {
    const base: Column<ClientItem>[] = [
      {
        key: "name",
        header: "Nombre",
        render: (row) => (
          <div>
            <p className="font-semibold text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-400">RUT: {row.rut}</p>
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        render: (row) => (
          <div>
            <p className="text-gray-700">{row.email}</p>
            <p className="text-xs text-gray-400">{row.phone}</p>
          </div>
        ),
      },
      {
        key: "address",
        header: "Dirección",
        render: (row) => <span className="text-sm text-gray-600">{row.address}</span>,
      },
      {
        key: "createdAt",
        header: "Registro",
        render: (row) => (
          <div className="text-sm text-gray-500">
            <p>Creado: {formatDate(row.createdAt)}</p>
            <p>Actualizado: {formatDate(row.updatedAt)}</p>
          </div>
        ),
      },
    ];

    if (canDeleteClient) {
      base.push({
        key: "actions",
        header: "Acciones",
        render: (row) => (
          <div className="flex gap-2">
            <span className="cursor-not-allowed text-blue-600 text-xs">Editar</span>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              disabled={deletingId === row.id}
              className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {deletingId === row.id ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        ),
      });
    }

    return base;
  }, [canDeleteClient, deletingId, handleDelete]);

  const total = clients.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Clientes</h1>
          <p className="text-sm text-gray-500">Administra la información de todos los clientes de tu negocio.</p>
        </div>
        {canCreateClient ? (
          <Link
            to="/clients/create"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            Agregar Cliente
          </Link>
        ) : (
          <p className="text-xs text-gray-400">
            Solo los administradores o vendedores pueden crear clientes nuevos.
          </p>
        )}
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Total clientes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Con email</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{clients.filter(c => c.email).length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Con teléfono</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{clients.filter(c => c.phone).length}</p>
        </div>
      </section>

      <section className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="client-search">
              Buscar clientes
            </label>
            <input
              id="client-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, RUT, email..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Limpiar
            </button>
          </div>
        </form>

        <DataTable
          columns={columns}
          data={clients}
          loading={loading}
          emptyMessage={loading ? "Cargando clientes..." : "Aún no hay clientes registrados."}
        />
      </section>
    </div>
  );
}
