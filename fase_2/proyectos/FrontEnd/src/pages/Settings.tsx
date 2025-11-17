import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { showSuccess, showWarning } from "../lib/alerts";
import { useAuthStore } from "../store/auth";
import {
  useNotificationCenter,
  useSettingsStore,
  type NotificationPreferences,
} from "../store/settings";

type SectionProps = {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
};

const Section = ({ title, description, children, action }: SectionProps) => (
  <section className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <header className="flex flex-col gap-2 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between dark:border-slate-700">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-300">{description}</p>
      </div>
      {action ? <div className="mt-2 md:mt-0">{action}</div> : null}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border transition ${
      checked
        ? "border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-500"
        : "border-gray-300 bg-gray-200 dark:border-slate-600 dark:bg-slate-700"
    }`}
    onClick={() => onChange(!checked)}
    aria-pressed={checked}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
        checked ? "translate-x-5" : "translate-x-1"
      }`}
    />
    <span className="sr-only">{label}</span>
  </button>
);

const numberFromInput = (value: string, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
};

const SettingsPage = () => {
  const role = useAuthStore((state) => state.user?.role ?? "user");
  const canReceiveStockAlerts = role === "admin" || role === "bodeguero";

  const notificationState = useNotificationCenter();
  const updateNotificationPreferences = useSettingsStore((state) => state.updateNotificationPreferences);
  const markAllNotificationsAsRead = useSettingsStore((state) => state.markAllNotificationsAsRead);
  const clearNotifications = useSettingsStore((state) => state.clearNotifications);

  const theme = useSettingsStore((state) => state.appearance.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);

  const [prefsDraft, setPrefsDraft] = useState<NotificationPreferences>(notificationState.preferences);

  const latestAlerts = useMemo(() => notificationState.items.slice(0, 5), [notificationState.items]);

  const handleSaveNotifications = async (event: FormEvent) => {
    event.preventDefault();
    if (!canReceiveStockAlerts) {
      await showWarning({
        title: "Sin permisos",
        text: "Solo los roles admin y bodeguero reciben y configuran alertas de stock.",
      });
      return;
    }
    updateNotificationPreferences(prefsDraft);
    await showSuccess({
      title: "Preferencias guardadas",
      text: "Ajustamos la frecuencia y el umbral para las alertas de stock.",
    });
  };

  const handleThemeChange = async (next: "light" | "dark") => {
    setTheme(next);
    await showSuccess({
      title: "Tema actualizado",
      text: next === "dark" ? "Modo oscuro activado." : "Modo claro activado.",
      timer: 1200,
    });
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Configuración</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          Simplificamos este módulo para dejar visibles solo las opciones activas hoy.
        </p>
      </header>

      <Section
        title="Alertas de stock"
        description={
          canReceiveStockAlerts
            ? "Controla la frecuencia y el umbral para las notificaciones de inventario."
            : "Solo bodega y administración reciben alertas de stock."
        }
        action={
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-100">
            Monitoreo {prefsDraft.lowStockEnabled ? "activo" : "pausado"}
          </span>
        }
      >
        <form className="space-y-4" onSubmit={handleSaveNotifications}>
          <div className="flex items-center justify-between rounded-lg border border-dashed border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            <div>
              <p className="font-semibold">Monitoreo de stock</p>
              <p className="text-xs text-blue-600/80 dark:text-blue-200/80">Revisa el inventario automáticamente.</p>
            </div>
            <Toggle
              checked={prefsDraft.lowStockEnabled}
              onChange={(value) => setPrefsDraft((prev) => ({ ...prev, lowStockEnabled: value }))}
              label="Activar monitoreo"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Umbral de stock (unidades)
              <input
                type="number"
                min={0}
                value={prefsDraft.lowStockThreshold}
                onChange={(event) =>
                  setPrefsDraft((prev) => ({
                    ...prev,
                    lowStockThreshold: numberFromInput(event.target.value, prev.lowStockThreshold),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Revisar cada (min)
              <input
                type="number"
                min={1}
                value={prefsDraft.checkEveryMinutes}
                onChange={(event) =>
                  setPrefsDraft((prev) => ({
                    ...prev,
                    checkEveryMinutes: Math.max(1, numberFromInput(event.target.value, prev.checkEveryMinutes)),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Repetir alerta cada (min)
              <input
                type="number"
                min={5}
                value={prefsDraft.repeatMinutes}
                onChange={(event) =>
                  setPrefsDraft((prev) => ({
                    ...prev,
                    repeatMinutes: Math.max(5, numberFromInput(event.target.value, prev.repeatMinutes)),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Notificaciones push</p>
                <p className="text-xs text-gray-500 dark:text-slate-300">Requieren permisos del navegador.</p>
              </div>
              <Toggle
                checked={prefsDraft.pushEnabled}
                onChange={(value) => setPrefsDraft((prev) => ({ ...prev, pushEnabled: value }))}
                label="Activar notificaciones push"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Sonido</p>
                <p className="text-xs text-gray-500 dark:text-slate-300">Pequeño beep al detectar faltantes.</p>
              </div>
              <Toggle
                checked={prefsDraft.soundEnabled}
                onChange={(value) => setPrefsDraft((prev) => ({ ...prev, soundEnabled: value }))}
                label="Activar sonido"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPrefsDraft(notificationState.preferences)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Deshacer cambios
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              Guardar alertas
            </button>
          </div>
        </form>
      </Section>

      <Section
        title="Apariencia"
        description="Elije el tema que prefieras para la interfaz."
        action={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Tema actual: {theme === "dark" ? "Oscuro" : "Claro"}
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${
              theme === "light"
                ? "border-blue-500 text-blue-700 ring-2 ring-blue-200"
                : "border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-100"
            }`}
          >
            Tema claro
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${
              theme === "dark"
                ? "border-blue-500 text-blue-200 ring-2 ring-blue-500/40"
                : "border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-100"
            }`}
          >
            Tema oscuro
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Alternar tema
          </button>
        </div>
      </Section>

      <Section
        title="Últimas alertas"
        description="Un vistazo rápido a las notificaciones registradas en este dispositivo."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => markAllNotificationsAsRead()}
              className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Marcar leídas
            </button>
            <button
              type="button"
              onClick={() => clearNotifications()}
              className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-200 dark:hover:bg-red-500/10"
            >
              Limpiar
            </button>
          </div>
        }
      >
        {latestAlerts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-300">Aún no hay notificaciones registradas.</p>
        ) : (
          <ul className="space-y-3">
            {latestAlerts.map((alert) => (
              <li
                key={alert.id}
                className="rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{alert.title}</p>
                  <span
                    className={`text-xs font-semibold ${
                      alert.type === "low-stock" ? "text-amber-600 dark:text-amber-200" : "text-blue-600 dark:text-blue-200"
                    }`}
                  >
                    {alert.type}
                  </span>
                </div>
                <p className="mt-1 text-gray-600 dark:text-slate-200">{alert.message}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-400">
                  {new Date(alert.createdAt).toLocaleString("es-CL")}
                  {alert.read ? " · leído" : " · sin leer"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};

export default SettingsPage;
