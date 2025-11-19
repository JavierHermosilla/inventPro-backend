import { useCallback, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { clientsApi, type CreateClientPayload } from "../lib/clientsApi";
import { confirmAction, showError, showSuccess, showWarning } from "../lib/alerts";

type FormState = {
  rut: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
};

const EMPTY_FORM: FormState = {
  rut: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  avatar: "",
};

const PHONE_PATTERN = /^\+?\d{7,15}$/;

const normalizePhone = (value: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
};

const cleanRut = (value: string) => String(value ?? "").replace(/\./g, "").replace(/-/g, "").trim().toUpperCase();

const computeRutDv = (digits: string) => {
  let sum = 0;
  let factor = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += Number(digits[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return "0";
  if (rest === 10) return "K";
  return String(rest);
};

const normalizeRut = (rut: string): string | null => {
  const cleaned = cleanRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(cleaned)) return null;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const computed = computeRutDv(body);
  if (computed !== dv) return null;
  return `${body}-${dv}`;
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

export default function CreateClientPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedRut = normalizeRut(form.rut);
    if (!normalizedRut) {
      const message = "RUT invalido. Usa el formato 12345678-9 con digito verificador correcto.";
      setFormError(message);
      await showWarning({ title: "RUT invalido", text: message });
      return;
    }

    const normalizedPhone = normalizePhone(form.phone);
    if (!normalizedPhone || !PHONE_PATTERN.test(normalizedPhone)) {
      const message = "Telefono invalido. Usa solo numeros y un '+' opcional al inicio.";
      setFormError(message);
      await showWarning({ title: "Telefono invalido", text: message });
      return;
    }

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.address.trim()
    ) {
      const message = "Completa todos los campos obligatorios.";
      setFormError(message);
      await showWarning({ title: "Campos requeridos", text: message });
      return;
    }

    const avatarValue = form.avatar.trim();

    const payload: CreateClientPayload = {
      rut: normalizedRut,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: normalizedPhone,
      address: form.address.trim(),
      avatar: avatarValue.length > 0 ? avatarValue : null,
    };

    const confirmed = await confirmAction({
      title: "Guardar cliente?",
      text: "Confirma para registrar al cliente.",
      confirmButtonText: "+ Guardar Cliente",
      confirmButtonColor: "#2563eb",
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await clientsApi.create(payload);
      await showSuccess({ title: "Cliente creado", text: `${payload.name} se registro correctamente.` });
      navigate("/clients", { replace: true });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo crear el cliente.");
      setFormError(message);
      await showError({ title: "Error al crear cliente", text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Crear Cliente</h1>
        <p className="text-sm text-gray-500">
          Completa el formulario para registrar un nuevo cliente en el sistema.
        </p>
      </header>

      <div className="rounded-2xl bg-white shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800">Informacion del Cliente</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-600" htmlFor="rut">
                RUT *
              </label>
              <input
                id="rut"
                type="text"
                required
                placeholder="Ej: 12345678-9"
                value={form.rut}
                onChange={(e) => updateFormField("rut", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600" htmlFor="name">
                Nombre completo *
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Ej: Juan Perez"
                value={form.name}
                onChange={(e) => updateFormField("name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600" htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={form.email}
                onChange={(e) => updateFormField("email", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600" htmlFor="phone">
                Telefono *
              </label>
              <input
                id="phone"
                type="tel"
                required
                placeholder="Ej: +56912345678"
                value={form.phone}
                onChange={(e) => updateFormField("phone", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600" htmlFor="address">
                Direccion *
              </label>
              <input
                id="address"
                type="text"
                required
                placeholder="Ej: Av. Las Condes 1234, Santiago"
                value={form.address}
                onChange={(e) => updateFormField("address", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600" htmlFor="avatar">
                Avatar (URL)
              </label>
              <input
                id="avatar"
                type="url"
                placeholder="https://..."
                value={form.avatar}
                onChange={(e) => updateFormField("avatar", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{formError}</p>
          )}

          <footer className="flex justify-end gap-2 pt-2">
            <Link
              to="/clients"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
            >
              {isSubmitting ? "Guardando..." : "+ Guardar Cliente"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
