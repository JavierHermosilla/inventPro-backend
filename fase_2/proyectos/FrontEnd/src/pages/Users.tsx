import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import DataTable, { type Column } from "../components/DataTable";
import {
  usersApi,
  USER_ROLE_LABELS,
  USER_ROLE_OPTIONS,
  type UserItem,
  type UserListMeta,
} from "../lib/usersApi";
import { confirmAction, showError, showSuccess, showWarning } from "../lib/alerts";
import { useAuthStore, type Role } from "../store/auth";

type FormState = {
  username: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
  address: string;
  avatar: string;
};

const EMPTY_FORM: FormState = {
  username: "",
  name: "",
  email: "",
  password: "",
  role: "user",
  phone: "",
  address: "",
  avatar: "",
};

type PasswordRule = { test: (value: string) => boolean; message: string };

const PASSWORD_RULES: PasswordRule[] = [
  { test: (value) => value.length >= 8, message: "Debe tener al menos 8 caracteres" },
  { test: (value) => /[A-Z]/.test(value), message: "Debe incluir una letra mayúscula" },
  { test: (value) => /[a-z]/.test(value), message: "Debe incluir una letra minúscula" },
  { test: (value) => /[0-9]/.test(value), message: "Debe incluir un número" },
  { test: (value) => /[^A-Za-z0-9]/.test(value), message: "Debe incluir un símbolo" },
];

const roleStyles: Record<Role, { className: string }> = {
  admin: { className: "bg-blue-100 text-blue-700" },
  vendedor: { className: "bg-amber-100 text-amber-700" },
  bodeguero: { className: "bg-emerald-100 text-emerald-700" },
  user: { className: "bg-slate-100 text-slate-700" },
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
};

const extractErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null) {
    const maybeResponse = (err as { response?: { data?: { message?: unknown } } }).response;
    const message = maybeResponse?.data?.message;
    if (typeof message === "string" && message.trim().length > 0) return message;
  }
  if (err instanceof Error && err.message.trim().length > 0) return err.message;
  return fallback;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [meta, setMeta] = useState<UserListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";

  const updateFormField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditingUserId(null);
  }, []);

  const fetchUsers = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const trimmedSearch = search ? search.trim() : "";
      const result = await usersApi.list({ search: trimmedSearch.length > 0 ? trimmedSearch : undefined, limit: 200 });
      setUsers(result.items);
      setMeta(result.meta);
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudieron obtener los usuarios.");
      setError(message);
      await showError({ title: "Error al listar usuarios", text: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers().catch(() => {});
  }, [fetchUsers]);

  const handleSearchSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchUsers(searchTerm).catch(() => {});
  }, [fetchUsers, searchTerm]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    fetchUsers().catch(() => {});
  }, [fetchUsers]);

  const validatePassword = useCallback((password: string) => {
    const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
    return failedRule?.message ?? null;
  }, []);

  const handleSubmitUser = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = form.name.trim();
    const trimmedUsername = form.username.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPassword = form.password.trim();
    const isEditing = Boolean(editingUserId);

    if (!trimmedName) {
      const message = "El nombre del usuario es obligatorio.";
      setFormError(message);
      await showWarning({ title: "Nombre requerido", text: message });
      return;
    }
    if (!trimmedUsername) {
      const message = "El usuario es obligatorio.";
      setFormError(message);
      await showWarning({ title: "Usuario requerido", text: message });
      return;
    }
    if (!trimmedEmail) {
      const message = "El correo electrónico es obligatorio.";
      setFormError(message);
      await showWarning({ title: "Correo requerido", text: message });
      return;
    }

    if (!isEditing || trimmedPassword.length > 0) {
      if (!trimmedPassword) {
        const message = "La contraseña es obligatoria.";
        setFormError(message);
        await showWarning({ title: "Contraseña requerida", text: message });
        return;
      }
      const passwordIssue = validatePassword(trimmedPassword);
      if (passwordIssue) {
        setFormError(passwordIssue);
        await showWarning({ title: "Contraseña inválida", text: passwordIssue });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        username: trimmedUsername,
        name: trimmedName,
        email: trimmedEmail,
        ...(trimmedPassword.length > 0 ? { password: trimmedPassword } : {}),
        role: form.role,
        phone: form.phone.trim().length > 0 ? form.phone.trim() : null,
        address: form.address.trim().length > 0 ? form.address.trim() : null,
        avatar: form.avatar.trim().length > 0 ? form.avatar.trim() : null,
      };

      if (isEditing && editingUserId) {
        await usersApi.update(editingUserId, payload);
        await showSuccess({ title: "Usuario actualizado", text: `${payload.name} fue actualizado correctamente.` });
      } else {
        await usersApi.create(payload as typeof payload & { password: string });
        await showSuccess({ title: "Usuario creado", text: `${payload.name} se registró correctamente.` });
      }
      setIsModalOpen(false);
      resetForm();
      fetchUsers(searchTerm).catch(() => {});
    } catch (err) {
      const message = extractErrorMessage(err, isEditing ? "No se pudo actualizar el usuario." : "No se pudo crear el usuario.");
      setFormError(message);
      await showError({ title: isEditing ? "Error al actualizar usuario" : "Error al crear usuario", text: message });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingUserId, fetchUsers, form, resetForm, searchTerm, validatePassword]);

  const handleEditUser = useCallback((user: UserItem) => {
    setForm({
      username: user.username,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone ?? "",
      address: user.address ?? "",
      avatar: user.avatar ?? "",
    });
    setEditingUserId(user.id);
    setIsModalOpen(true);
  }, []);

  const handleDeleteUser = useCallback(
    async (user: UserItem) => {
      if (!isAdmin) return;
      const confirmed = await confirmAction({
        title: "Eliminar usuario",
        text: `¿Deseas eliminar a ${user.name}?`,
        confirmButtonText: "Si, eliminar",
      });
      if (!confirmed) return;
      try {
        await usersApi.remove(user.id);
        await showSuccess({ title: "Usuario eliminado", text: `${user.name} fue eliminado.` });
        fetchUsers(searchTerm).catch(() => {});
      } catch (err) {
        const message = extractErrorMessage(err, "No se pudo eliminar el usuario.");
        await showError({ title: "Error al eliminar", text: message });
      }
    },
    [fetchUsers, isAdmin, searchTerm]
  );

  const columns = useMemo<Column<UserItem>[]>(() => [
    {
      key: "name",
      header: "Nombre",
      render: (user) => (
        <div>
          <p className="font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">@{user.username}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Correo",
      render: (user) => (
        <div>
          <p className="text-gray-700">{user.email}</p>
          {user.phone ? <p className="text-xs text-gray-400">{user.phone}</p> : null}
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      render: (user) => {
        const style = roleStyles[user.role] ?? roleStyles.user;
        const label = USER_ROLE_LABELS[user.role] ?? user.role;
        return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}>{label}</span>;
      },
    },
    { key: "createdAt", header: "Registrado", render: (user) => <span className="text-sm text-gray-600">{formatDate(user.createdAt)}</span> },
    {
      key: "address",
      header: "Dirección",
      render: (user) => <span className="text-sm text-gray-600">{user.address?.trim() ? user.address : "Sin registro"}</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right",
      render: (user) =>
        isAdmin ? (
          <div className="flex justify-end gap-2 text-xs">
            <button type="button" onClick={() => handleEditUser(user)} className="text-blue-600 hover:underline">
              Editar
            </button>
            <button type="button" onClick={() => void handleDeleteUser(user)} className="text-rose-600 hover:underline">
              Eliminar
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Solo admins</span>
        ),
    },
  ], [handleDeleteUser, handleEditUser, isAdmin]);

  const totalUsers = meta?.total ?? users.length;
  const adminCount = useMemo(() => users.filter((user) => user.role === "admin").length, [users]);
  const staffCount = useMemo(() => users.filter((user) => user.role !== "admin").length, [users]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de usuarios</h1>
          <p className="text-sm text-gray-500">Crea y administra cuentas con sus roles correspondientes.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          disabled={!isAdmin}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          Nuevo usuario
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Usuarios totales</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totalUsers}</p>
        </article>
        <article className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Administradores</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{adminCount}</p>
        </article>
        <article className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Equipo operativo</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{staffCount}</p>
        </article>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex-1 text-sm text-gray-700">
            Buscar usuario
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Busca por nombre, correo o usuario"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={clearFilters} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Limpiar
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
              Buscar
            </button>
          </div>
        </form>
      </section>

      {error && !loading ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : null}

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No encontramos usuarios con los filtros actuales." />

      {isModalOpen ? (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{editingUserId ? "Editar usuario" : "Nuevo usuario"}</p>
                <h2 className="text-lg font-bold text-gray-900">Completa los datos para guardar</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">
                Cerrar
              </button>
            </header>

            <form onSubmit={handleSubmitUser} className="px-6 py-4" noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  Nombre completo
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => updateFormField("name", event.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  Usuario
                  <input
                    type="text"
                    value={form.username}
                    onChange={(event) => updateFormField("username", event.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  Correo electrónico
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateFormField("email", event.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  Rol
                  <select
                    value={form.role}
                    onChange={(event) => updateFormField("role", event.target.value as Role)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {USER_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  Contraseña {editingUserId ? "(dejar vacío si no cambias)" : ""}
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => updateFormField("password", event.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder={editingUserId ? "Nueva contraseña opcional" : "Ingresa una contraseña segura"}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  Teléfono
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateFormField("phone", event.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700 md:col-span-2">
                  Dirección
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) => updateFormField("address", event.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700 md:col-span-2">
                  Avatar (URL)
                  <input
                    type="url"
                    value={form.avatar}
                    onChange={(event) => updateFormField("avatar", event.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              {formError ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formError}</p> : null}

              <div className="mt-4 flex justify-end gap-2">
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
                  disabled={isSubmitting || !isAdmin}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Guardando..." : editingUserId ? "Guardar cambios" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
