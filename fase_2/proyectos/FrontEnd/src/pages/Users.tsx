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

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [meta, setMeta] = useState<UserListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentUserRole = useAuthStore((state) => state.user?.role);
  const canManageUsers = currentUserRole === "admin";

  const [searchTerm, setSearchTerm] = useState("");

  const updateFormField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setFormError(null);
  }, []);

  const fetchUsers = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const trimmedSearch = search ? search.trim() : "";
      const result = await usersApi.list({ search: trimmedSearch.length > 0 ? trimmedSearch : undefined, limit: 100 });
      setUsers(result.items);
      setMeta(result.meta);
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudieron obtener los usuarios.");
      setError(message);
      await showError({
        title: "Error al listar usuarios",
        text: message,
      });
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

  const openCreateModal = useCallback(() => {
    setEditingUser(null);
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((user: UserItem) => {
    setEditingUser(user);
    setForm({
      username: user.username ?? "",
      name: user.name ?? "",
      email: user.email ?? "",
      password: "",
      role: user.role ?? "user",
      phone: user.phone ?? "",
      address: user.address ?? "",
      avatar: user.avatar ?? "",
    });
    setFormError(null);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!canManageUsers) {
      const message = "Solo un administrador puede gestionar usuarios.";
      setFormError(message);
      await showWarning({
        title: "Permiso denegado",
        text: message,
      });
      return;
    }

    const trimmedName = form.name.trim();
    const trimmedUsername = form.username.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPassword = form.password.trim();
    const isEditing = Boolean(editingUser);

    if (!trimmedName) {
      const message = "El nombre del usuario es obligatorio.";
      setFormError(message);
      await showWarning({
        title: "Nombre requerido",
        text: message,
      });
      return;
    }

    if (!trimmedUsername) {
      const message = "El usuario es obligatorio.";
      setFormError(message);
      await showWarning({
        title: "Usuario requerido",
        text: message,
      });
      return;
    }

    if (!trimmedEmail) {
      const message = "El correo electr?nico es obligatorio.";
      setFormError(message);
      await showWarning({
        title: "Correo requerido",
        text: message,
      });
      return;
    }

    if (!isEditing && !trimmedPassword) {
      const message = "La contrase?a es obligatoria.";
      setFormError(message);
      await showWarning({
        title: "Contrase��a requerida",
        text: message,
      });
      return;
    }

    const passwordIssue = trimmedPassword ? validatePassword(trimmedPassword) : null;
    if (passwordIssue) {
      setFormError(passwordIssue);
      await showWarning({
        title: "Contrase��a invǭlida",
        text: passwordIssue,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingUser) {
        const payload = {
          username: trimmedUsername,
          name: trimmedName,
          email: trimmedEmail,
          role: form.role,
          phone: form.phone.trim().length > 0 ? form.phone.trim() : null,
          address: form.address.trim().length > 0 ? form.address.trim() : null,
          avatar: form.avatar.trim().length > 0 ? form.avatar.trim() : null,
          ...(trimmedPassword.length > 0 ? { password: trimmedPassword } : {}),
        };

        await usersApi.update(editingUser.id, payload);
        await showSuccess({
          title: "Usuario actualizado",
          text: `${payload.name} se actualizo correctamente.`,
        });
      } else {
        const payload = {
          username: trimmedUsername,
          name: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          role: form.role,
          phone: form.phone.trim().length > 0 ? form.phone.trim() : null,
          address: form.address.trim().length > 0 ? form.address.trim() : null,
          avatar: form.avatar.trim().length > 0 ? form.avatar.trim() : null,
        };

        await usersApi.create(payload);
        await showSuccess({
          title: "Usuario creado",
          text: `${payload.name} se registro correctamente.`,
        });
      }
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers(searchTerm).catch(() => {});
    } catch (err) {
      const message = extractErrorMessage(
        err,
        isEditing ? "No se pudo actualizar el usuario." : "No se pudo crear el usuario.",
      );
      setFormError(message);
      await showError({
        title: isEditing ? "Error al actualizar usuario" : "Error al crear usuario",
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [canManageUsers, editingUser, fetchUsers, form, resetForm, searchTerm, validatePassword]);

  const handleDeleteUser = useCallback(async (user: UserItem) => {
    if (!canManageUsers) {
      await showWarning({
        title: "Permiso denegado",
        text: "Solo un administrador puede eliminar usuarios.",
      });
      return;
    }

    const targetLabel = user.name?.trim().length ? user.name : user.username;
    const confirmed = await confirmAction({
      title: `Eliminar ${targetLabel}?`,
      text: "Esta acci?n no se puede deshacer.",
      confirmButtonText: "Si, eliminar",
    });
    if (!confirmed) return;

    setDeletingId(user.id);
    try {
      await usersApi.remove(user.id);
      await showSuccess({
        title: "Usuario eliminado",
        text: `${targetLabel} se elimino correctamente.`,
      });
      fetchUsers(searchTerm).catch(() => {});
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo eliminar el usuario.");
      await showError({
        title: "Error al eliminar usuario",
        text: message,
      });
    } finally {
      setDeletingId(null);
    }
  }, [canManageUsers, fetchUsers, searchTerm]);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingUser(null);
    resetForm();
    setFormError(null);
  }, [isSubmitting, resetForm]);

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
          {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      render: (user) => {
        const style = roleStyles[user.role] ?? roleStyles.user;
        const label = USER_ROLE_LABELS[user.role] ?? user.role;
        return (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Registrado",
      render: (user) => <span className="text-sm text-gray-600">{formatDate(user.createdAt)}</span>,
    },
    {
      key: "address",
      header: "Direcci?n",
      render: (user) => (
        <span className="text-sm text-gray-600">
          {user.address && user.address.trim().length > 0 ? user.address : "Sin registro"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right",
      render: (user) => {
        if (!canManageUsers) {
          return <span className="text-xs text-gray-400">Acciones solo para admin</span>;
        }
        const isBusy = isSubmitting || deletingId === user.id;

        return (
          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => openEditModal(user)}
              className="font-semibold text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteUser(user)}
              className="font-semibold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
            >
              {deletingId === user.id ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        );
      },
    },
  ], [canManageUsers, deletingId, handleDeleteUser, isSubmitting, openEditModal]);

  const totalUsers = meta?.total ?? users.length;
  const adminCount = useMemo(() => users.filter((user) => user.role === "admin").length, [users]);
  const staffCount = useMemo(
    () => users.filter((user) => user.role !== "admin").length,
    [users],
  );
  const isEditingMode = Boolean(editingUser);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gesti?n de usuarios</h1>
          <p className="text-sm text-gray-500">Crea y administra cuentas con sus roles correspondientes.</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!canManageUsers}
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
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totalUsers}</p>
        </article>
        <article className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Administradores</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{adminCount}</p>
        </article>
        <article className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Equipo operativo</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{staffCount}</p>
        </article>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="user-search">
              Buscar usuario
            </label>
            <input
              id="user-search"
              type="search"
              placeholder="Busca por nombre, correo o usuario"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Buscar
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="A?n no hay usuarios registrados."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="absolute inset-0" onClick={closeModal} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <header className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditingMode ? "Editar usuario" : "Registrar nuevo usuario"}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEditingMode
                    ? "Actualiza los datos segun el rol. Deja la contrase�a vacia para mantenerla igual."
                    : "Ingresa los datos segun el mockup. El rol determinara los permisos en la plataforma."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </header>

            <form onSubmit={handleSubmit} className="px-6 py-4" noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="name">Nombre completo *</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) => updateFormField("name", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="username">Usuario *</label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={form.username}
                    onChange={(event) => updateFormField("username", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="email">Correo electr?nico *</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => updateFormField("email", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="password">
                    Contrasena {isEditingMode ? "(opcional)" : "*"}
                  </label>
                  <input
                    id="password"
                    type="password"
                    required={!isEditingMode}
                    value={form.password}
                    onChange={(event) => updateFormField("password", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder={isEditingMode ? "Deja vacio para no cambiarla" : "Usa mayusculas, numeros y simbolos"}
                  />
                  {isEditingMode && (
                    <p className="mt-1 text-xs text-gray-500">Si dejas el campo vacio la contrasena se mantendra igual.</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="role">Rol *</label>
                  <select
                    id="role"
                    required
                    value={form.role}
                    onChange={(event) => updateFormField("role", event.target.value as Role)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {USER_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="phone">Tel?fono</label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateFormField("phone", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="address">Direcci?n</label>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(event) => updateFormField("address", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600" htmlFor="avatar">URL de avatar</label>
                  <input
                    id="avatar"
                    type="url"
                    value={form.avatar}
                    onChange={(event) => updateFormField("avatar", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="https://..."
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
                  onClick={closeModal}
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
                  {isSubmitting ? "Guardando..." : isEditingMode ? "Guardar cambios" : "Guardar usuario"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



