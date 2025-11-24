import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import DataTable, { type Column } from "../components/DataTable";
import {
  categoriesApi,
  type CategoryItem,
  type CreateCategoryPayload,
} from "../lib/categoriesApi";
import { showError, showSuccess, showWarning, confirmAction } from "../lib/alerts";

type FormState = {
  name: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
};

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

const prettifyName = (value: string) => {
  if (!value) return "(sin nombre)";
  return value
    .split(" ")
    .map((chunk) => (chunk.length === 0 ? chunk : chunk[0]?.toUpperCase() + chunk.slice(1)))
    .join(" ");
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditing(null);
  }, []);

  const updateFormField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const fetchCategories = useCallback(
    async (filters?: { search?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await categoriesApi.list({ limit: 100, search: filters?.search });
        setCategories(result.items);
      } catch (err) {
        const message = extractErrorMessage(err, "No se pudieron obtener las categorías.");
        setError(message);
        await showError({
          title: "Error al listar categorías",
          text: message,
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, [fetchCategories]);

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      fetchCategories({ search: searchTerm.trim() }).catch(() => {});
    },
    [fetchCategories, searchTerm]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    fetchCategories({ search: "" }).catch(() => {});
  }, [fetchCategories]);

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryItem) => {
    setEditing(category);
    setForm({
      name: prettifyName(category.name),
      description: category.description ?? "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = form.name.trim();
    const trimmedDescription = form.description.trim();

    if (trimmedName.length < 3) {
      const message = "El nombre debe tener al menos 3 caracteres.";
      setFormError(message);
      await showWarning({
        title: "Nombre inválido",
        text: message,
      });
      return;
    }

    const payload: CreateCategoryPayload = {
      name: trimmedName,
      description: trimmedDescription.length > 0 ? trimmedDescription : "",
    };

    setIsSubmitting(true);
    try {
      if (editing) {
        await categoriesApi.update(editing.id, payload);
        await showSuccess({
          title: "Categoría actualizada",
          text: "La categoría se guardó correctamente.",
        });
      } else {
        await categoriesApi.create(payload);
        await showSuccess({
          title: "Categoría creada",
          text: "La categoría se guardó correctamente.",
        });
      }
      setIsModalOpen(false);
      resetForm();
      await fetchCategories({ search: searchTerm.trim() });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo guardar la categoría.");
      setFormError(message);
      await showError({
        title: "No se pudo guardar",
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: CategoryItem) => {
    const confirmed = await confirmAction({
      title: `Eliminar la categoría "${prettifyName(category.name)}"?`,
      text: "Esta acción no se puede deshacer.",
      confirmButtonText: "Si, eliminar",
    });
    if (!confirmed) return;

    setDeletingId(category.id);
    try {
      await categoriesApi.remove(category.id);
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      await showSuccess({
        title: "Categoría eliminada",
        text: `Se elimino ${prettifyName(category.name)} correctamente.`,
      });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo eliminar la categoría.");
      await showError({
        title: "Error al eliminar",
        text: message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const summary = useMemo(() => {
    const total = categories.length;
    const withDescription = categories.filter((item) => (item.description ?? "").trim().length > 0).length;
    const withoutDescription = total - withDescription;
    const recent = categories.slice(0, 5);
    return { total, withDescription, withoutDescription, recent };
  }, [categories]);

  const columns = useMemo<Column<CategoryItem>[]>(
    () => [
      {
        key: "name",
        header: "Categoría",
        render: (category) => (
          <div>
            <p className="font-semibold text-gray-900">{prettifyName(category.name)}</p>
            <p className="text-xs text-gray-400">ID: {category.id}</p>
          </div>
        ),
      },
      {
        key: "description",
        header: "Descripción",
        render: (category) => (
          <p className="text-sm text-gray-600">{category.description ?? "Sin descripcion"}</p>
        ),
      },
      {
        key: "createdAt",
        header: "Registro",
        render: (category) => (
          <div className="text-sm text-gray-500">
            <p>Creado: {formatDate(category.createdAt)}</p>
            <p>Actualizado: {formatDate(category.updatedAt)}</p>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Acciones",
        render: (category) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openEditModal(category)}
              className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(category)}
              disabled={deletingId === category.id}
              className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {deletingId === category.id ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        ),
      },
    ],
    [deletingId]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestón de categorías</h1>
          <p className="text-sm text-gray-500">
            Organiza tus productos en grupos claros y mantiene el catalogo ordenado.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          Nueva categoría
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-blue-100 bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase text-blue-500">Total categorías</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{summary.total}</p>
        </article>
        <article className="rounded-xl border border-emerald-100 bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase text-emerald-500">Con descripcion</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{summary.withDescription}</p>
        </article>
        <article className="rounded-xl border border-amber-100 bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase text-amber-500">Sin descripcion</p>
          <p className="mt-2 text-3xl font-black text-amber-600">{summary.withoutDescription}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow">
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-600" htmlFor="category-search">
                  Buscar categoría
                </label>
                <input
                  id="category-search"
                  type="search"
                  placeholder="Ej: electronica, hogar..."
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </form>

          <DataTable
            columns={columns}
            data={categories}
            loading={loading}
            emptyMessage={
              loading
                ? "Cargando categorías..."
                : "No se encontraron categorías con los filtros actuales."
            }
          />
        </div>

        <aside className="space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-gray-800">Categorías recientes</h2>
          {summary.recent.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay categorías registradas.</p>
          ) : (
            <ul className="space-y-3">
              {summary.recent.map((category) => (
                <li key={category.id} className="rounded-lg border border-gray-100 p-3">
                  <p className="font-medium text-gray-800">{prettifyName(category.name)}</p>
                  <p className="text-xs text-gray-500">{category.description ?? "Sin descripcion"}</p>
                  <p className="mt-1 text-xs text-gray-400">Creada el {formatDate(category.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editing ? "Editar categoría" : "Nueva categoría"}
                </h2>
                <p className="text-sm text-gray-500">
                  Define un nombre único y una descripción opcional para la categoría.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <span className="sr-only">Cerrar</span>
                X
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600" htmlFor="category-name">
                  Nombre de la categoría *
                </label>
                <input
                  id="category-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) => updateFormField("name", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Ej: Electronica, hogar, muebles"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600" htmlFor="category-description">
                  Descripción (opcional)
                </label>
                <textarea
                  id="category-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) => updateFormField("description", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Describe brevemente que productos se agrupan aqui"
                />
              </div>

              {formError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <footer className="flex justify-end gap-2">
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
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : editing ? "Guardar cambios" : "Crear categoría"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
