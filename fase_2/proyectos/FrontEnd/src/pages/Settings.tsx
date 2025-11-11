import { Fragment, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { showError, showInfo, showSuccess, showWarning } from "../lib/alerts";
import {
  useSettingsStore,
  type CompanyProfile,
  type IntegrationSettings,
  type NotificationItem,
  type NotificationPreferences,
  type PermissionMatrixRow,
  type SecuritySettings,
} from "../store/settings";

type SectionCardProps = {
  title: string;
  description: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
};

const SectionCard = ({ title, description, hint, action, children }: SectionCardProps) => (
  <section className="rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
    <header className="flex flex-col gap-2 border-b border-gray-100 p-5 transition-colors md:flex-row md:items-center md:justify-between dark:border-slate-700">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">{description}</p>
        {hint ? <p className="mt-1 text-xs text-blue-500 dark:text-blue-300">{hint}</p> : null}
      </div>
      {action ? <div className="mt-2 md:mt-0">{action}</div> : null}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) => (
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
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white keep-light shadow transition ${
        checked ? "translate-x-5" : "translate-x-1"
      }`}
    />
    <span className="sr-only">{label}</span>
  </button>
);

const formatNotificationTimestamp = (value: string) =>
  new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const hasBrowserNotifications = typeof window !== "undefined" && "Notification" in window;

const ensureBrowserPermission = async () => {
  if (!hasBrowserNotifications) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

const notifyBrowser = (title: string, body: string) => {
  if (!hasBrowserNotifications) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/vite.svg", tag: `inventpro-${Date.now()}` });
  } catch {
    // ignored
  }
};

const initialCompanyDraft = (company: CompanyProfile): CompanyProfile => ({ ...company });

const quietHoursLabel = (prefs: NotificationPreferences) => {
  const { enabled, start, end } = prefs.quietHours;
  if (!enabled) return "Quiet hours disabled";
  return `Quiet hours ${start} - ${end}`;
};

const rolesColumns: Array<keyof Omit<PermissionMatrixRow, "module">> = ["admin", "supervisor", "staff"];

const sessionTimeoutOptions = [15, 30, 45, 60, 90];
const themeButtonBase = "rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";
const themeButtonActive = "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200 ring-offset-1 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/40 dark:ring-offset-slate-900";
const themeButtonInactive = "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800";

const SettingsPage = () => {
  const company = useSettingsStore((state) => state.company);
  const updateCompany = useSettingsStore((state) => state.updateCompany);
  const security = useSettingsStore((state) => state.security);
  const updateSecurity = useSettingsStore((state) => state.updateSecurity);
  const permissions = useSettingsStore((state) => state.permissions);
  const togglePermission = useSettingsStore((state) => state.togglePermission);
  const resetPermissions = useSettingsStore((state) => state.resetPermissions);
  const integrations = useSettingsStore((state) => state.integrations);
  const updateIntegration = useSettingsStore((state) => state.updateIntegration);
  const notifications = useSettingsStore((state) => state.notifications);
  const updateNotificationPreferences = useSettingsStore((state) => state.updateNotificationPreferences);
  const addNotification = useSettingsStore((state) => state.addNotification);
  const markAllNotificationsAsRead = useSettingsStore((state) => state.markAllNotificationsAsRead);
  const clearNotifications = useSettingsStore((state) => state.clearNotifications);
  const appearance = useSettingsStore((state) => state.appearance);
  const setTheme = useSettingsStore((state) => state.setTheme);

  const [companyDraft, setCompanyDraft] = useState<CompanyProfile>(() => initialCompanyDraft(company));
  useEffect(() => {
    setCompanyDraft(initialCompanyDraft(company));
  }, [company]);

  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  const latestNotifications = useMemo(() => notifications.items.slice(0, 5), [notifications.items]);
  const integrationEntries: Array<
    ["slack", IntegrationSettings["slack"]] |
    ["whatsapp", IntegrationSettings["whatsapp"]] |
    ["shopify", IntegrationSettings["shopify"]] |
    ["quickbooks", IntegrationSettings["quickbooks"]]
  > = [
    ["slack", integrations.slack],
    ["whatsapp", integrations.whatsapp],
    ["shopify", integrations.shopify],
    ["quickbooks", integrations.quickbooks],
  ];
  const isDarkMode = appearance.theme === "dark";
  const heroClass = isDarkMode
    ? "bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800"
    : "bg-gradient-to-r from-blue-50 to-indigo-50";

  const handleCompanySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingCompany(true);
    try {
      updateCompany(companyDraft);
      await showSuccess({
        title: "Datos actualizados",
        text: "La informacion de la compania fue guardada correctamente.",
      });
    } catch (err) {
      console.error("[settings] company update failed", err);
      await showError({
        title: "No se pudo guardar",
        text: "Revisa los datos ingresados e intenta nuevamente.",
      });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleSecuritySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingSecurity(true);
    try {
      updateSecurity(security);
      await showSuccess({
        title: "Seguridad actualizada",
        text: "Se aplicaron los cambios de seguridad para la cuenta.",
      });
    } catch (err) {
      console.error("[settings] security update failed", err);
      await showError({
        title: "No se guardaron los cambios",
        text: "Ocurrio un problema al intentar guardar los ajustes de seguridad.",
      });
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handlePushToggle = async (nextValue: boolean) => {
    if (nextValue) {
      if (!hasBrowserNotifications) {
        await showWarning({
          title: "Sin soporte en el navegador",
          text: "Este navegador no permite notificaciones push.",
        });
        return;
      }
      const granted = await ensureBrowserPermission();
      if (!granted) {
        await showInfo({
          title: "Permiso requerido",
          text: "Activa las notificaciones del navegador para recibir alertas push.",
        });
        return;
      }
    }

    updateNotificationPreferences({ pushEnabled: nextValue });
    if (nextValue) {
      notifyBrowser("Invent Pro", "Notificaciones push activadas correctamente.");
    }
  };

  const handleTestNotification = async () => {
    const record = addNotification({
      title: "Prueba de notificacion",
      message: "Esta es una notificacion de prueba desde configuracion.",
      type: "system",
      severity: "info",
      meta: { source: "settings:test" },
    });
    if (notifications.preferences.pushEnabled) {
      notifyBrowser(record.title, record.message);
    }
    await showSuccess({
      title: "Notificacion enviada",
      text: "La alerta se agrego al historial y aparecera en la campana.",
    });
  };

  const handleIntegrationToggle = async <K extends keyof IntegrationSettings>(key: K, enabled: boolean) => {
    updateIntegration(key, { enabled } as Partial<IntegrationSettings[K]>);
    if (enabled) {
      await showInfo({
        title: "Recuerda completar la configuracion",
        text: "Ingresa las credenciales del servicio para activar el envio de alertas.",
      });
    }
  };

  const handleQuietHoursChange = (field: "enabled" | "start" | "end", value: string | boolean) => {
    if (field === "enabled" && typeof value === "boolean") {
      updateNotificationPreferences({
        quietHours: {
          ...notifications.preferences.quietHours,
          enabled: value,
        },
      });
      return;
    }
    if (typeof value === "string") {
      updateNotificationPreferences({
        quietHours: {
          ...notifications.preferences.quietHours,
          [field]: value,
        },
      });
    }
  };

  const handleNumberPreference = (key: keyof NotificationPreferences, raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    updateNotificationPreferences({ [key]: parsed } as Partial<NotificationPreferences>);
  };

  const handleThresholdChange = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    updateNotificationPreferences({ lowStockThreshold: Math.max(0, Math.trunc(parsed)) });
  };

  const handleSecurityToggle = (key: keyof SecuritySettings, value: boolean) => {
    updateSecurity({ ...security, [key]: value });
  };

  const handlePasswordPolicy = (value: SecuritySettings["passwordPolicy"]) => {
    updateSecurity({ ...security, passwordPolicy: value });
  };

  const handleFailedAttempts = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1) return;
    updateSecurity({ ...security, failedAttemptsLimit: Math.trunc(parsed) });
  };

  const handleSessionTimeout = (value: number) => {
    updateSecurity({ ...security, sessionTimeoutMinutes: value });
  };

  const renderNotificationItem = (item: NotificationItem) => (
    <li key={item.id} className="flex flex-col gap-1 rounded-lg border border-gray-100 p-3 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">{item.title}</span>
        <span className="text-xs text-gray-400">{formatNotificationTimestamp(item.createdAt)}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-slate-300">{item.message}</p>
      <span
        className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
          item.severity === "critical"
            ? "bg-red-100 text-red-600"
            : item.severity === "warning"
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-600"
        }`}
      >
        {item.type === "low-stock" ? "Stock" : item.type}
      </span>
    </li>
  );

  return (
    <div className="space-y-6">
      <header className={`flex flex-col gap-4 rounded-2xl p-6 transition-colors md:flex-row md:items-center md:justify-between ${heroClass}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Configuracion del sistema</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Administra los datos de tu compania, las alertas en tiempo real y los accesos del equipo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-gray-200 bg-white px-4 py-2 shadow-inner dark:border-slate-700 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Alertas</span>
            <span className="ml-2 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-600">
              {notifications.unreadCount} sin leer
            </span>
          </div>
          <button
            type="button"
            onClick={handleTestNotification}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 dark:hover:bg-blue-500"
          >
            Enviar prueba
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-400 dark:text-slate-400">Info de la compania</p>
              <p className="text-base font-semibold text-gray-700 dark:text-slate-100">{company.displayName}</p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">{company.city}</span>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-slate-300">{company.address}</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase text-gray-400 dark:text-slate-400">Notificaciones</p>
          <p className="text-base font-semibold text-gray-700 dark:text-slate-100">
            {notifications.preferences.lowStockEnabled ? "Monitoreo activo" : "Monitoreo desactivado"}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-300">{quietHoursLabel(notifications.preferences)}</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase text-gray-400 dark:text-slate-400">Integraciones</p>
          <p className="text-base font-semibold text-gray-700 dark:text-slate-100">
            {Object.values(integrations).filter((item) => item.enabled).length} servicios activos
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-300">Sincroniza alertas con canales externos</p>
        </div>
      </div>

      <SectionCard
        title="Apariencia del sistema"
        description="Elige el tema de color que prefieras para la plataforma."
        hint="La preferencia se guarda incluso si cierras sesion o cambias de dispositivo."
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md space-y-1">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              {isDarkMode
                ? "El modo oscuro reduce el brillo y ayuda a trabajar en espacios con poca luz."
                : "El modo claro mantiene un fondo limpio ideal para ambientes bien iluminados."}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Se aplica de inmediato a toda la interfaz.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
            <Toggle
              checked={isDarkMode}
              onChange={(value) => setTheme(value ? "dark" : "light")}
              label="Activar modo oscuro"
            />
            <div className="text-sm font-semibold text-gray-700 dark:text-slate-100">
              {isDarkMode ? "Modo oscuro" : "Modo claro"}
            </div>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Selector de tema">
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={!isDarkMode}
              className={`${themeButtonBase} ${isDarkMode ? themeButtonInactive : themeButtonActive}`}
            >
              Claro
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={isDarkMode}
              className={`${themeButtonBase} ${isDarkMode ? themeButtonActive : themeButtonInactive}`}
            >
              Oscuro
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Informacion de la compania"
        description="Actualiza los datos que se muestran en reportes, facturas y correos."
      >
        <form onSubmit={handleCompanySubmit} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
            Nombre comercial
            <input
              type="text"
              required
              value={companyDraft.displayName}
              onChange={(event) => setCompanyDraft((prev) => ({ ...prev, displayName: event.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
            Razon social
            <input
              type="text"
              required
              value={companyDraft.legalName}
              onChange={(event) => setCompanyDraft((prev) => ({ ...prev, legalName: event.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
            RUT / Tax ID
            <input
              type="text"
              required
              value={companyDraft.taxId}
              onChange={(event) => setCompanyDraft((prev) => ({ ...prev, taxId: event.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
            Correo de contacto
            <input
              type="email"
              required
              value={companyDraft.email}
              onChange={(event) => setCompanyDraft((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
            Telefono
            <input
              type="tel"
              value={companyDraft.phone}
              onChange={(event) => setCompanyDraft((prev) => ({ ...prev, phone: event.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 md:col-span-2">
            Direccion
            <input
              type="text"
              value={companyDraft.address}
              onChange={(event) => setCompanyDraft((prev) => ({ ...prev, address: event.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
            Ciudad
            <input
              type="text"
              value={companyDraft.city}
              onChange={(event) => setCompanyDraft((prev) => ({ ...prev, city: event.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
            Pais
            <input
              type="text"
              value={companyDraft.country}
              onChange={(event) => setCompanyDraft((prev) => ({ ...prev, country: event.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
            Zona horaria
            <input
              type="text"
              value={companyDraft.timezone}
              onChange={(event) => setCompanyDraft((prev) => ({ ...prev, timezone: event.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="md:col-span-2 flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setCompanyDraft(initialCompanyDraft(company))}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              disabled={isSavingCompany}
            >
              Deshacer cambios
            </button>
            <button
              type="submit"
              disabled={isSavingCompany}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingCompany ? "Guardando..." : "Guardar informacion"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Notificaciones y alertas"
        description="Configura los criterios de stock bajo y las notificaciones push."
        hint={`Verificacion cada ${notifications.preferences.checkEveryMinutes} min. Umbral ${notifications.preferences.lowStockThreshold} unidades.`}
        action={
          <div className="flex items-center gap-3">
            <Toggle
              checked={notifications.preferences.lowStockEnabled}
              onChange={(value) => updateNotificationPreferences({ lowStockEnabled: value })}
              label="Activar monitoreo de stock"
            />
            <span className="text-sm text-gray-600 dark:text-slate-300">
              {notifications.preferences.lowStockEnabled ? "Monitoreo activo" : "Desactivado"}
            </span>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
              Umbral de stock bajo (unidades)
              <input
                type="number"
                min={0}
                value={notifications.preferences.lowStockThreshold}
                onChange={(event) => handleThresholdChange(event.target.value)}
                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
              Repetir alerta cada (min)
              <input
                type="number"
                min={5}
                value={notifications.preferences.repeatMinutes}
                onChange={(event) => handleNumberPreference("repeatMinutes", event.target.value)}
                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
              Intervalo de verificacion (min)
              <input
                type="number"
                min={5}
                value={notifications.preferences.checkEveryMinutes}
                onChange={(event) => handleNumberPreference("checkEveryMinutes", event.target.value)}
                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-slate-300">
              Canal push
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <Toggle
                  checked={notifications.preferences.pushEnabled}
                  onChange={handlePushToggle}
                  label="Notificaciones push"
                />
                <div>
                  <p className="font-medium text-gray-700">Push del navegador</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {hasBrowserNotifications ? "Se enviaran alertas incluso si estas fuera de la app." : "No disponible en este navegador."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <Toggle
                checked={notifications.preferences.emailDigestEnabled}
                onChange={(value) => updateNotificationPreferences({ emailDigestEnabled: value })}
                label="Resumen diario"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Resumen diario por correo</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Recibe un informe con movimientos y alertas.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <Toggle
                checked={notifications.preferences.soundEnabled}
                onChange={(value) => updateNotificationPreferences({ soundEnabled: value })}
                label="Sonido de alerta"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Sonido de alerta</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Reproduce un sonido breve cuando llegue una alerta.</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Horario silencioso</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {notifications.preferences.quietHours.enabled
                    ? `Las notificaciones push se silencian entre ${notifications.preferences.quietHours.start} y ${notifications.preferences.quietHours.end}.`
                    : "Las alertas push se enviaran a cualquier hora."}
                </p>
              </div>
              <Toggle
                checked={notifications.preferences.quietHours.enabled}
                onChange={(value) => handleQuietHoursChange("enabled", value)}
                label="Horario silencioso"
              />
            </div>
            {notifications.preferences.quietHours.enabled ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
                  Inicio
                  <input
                    type="time"
                    value={notifications.preferences.quietHours.start}
                    onChange={(event) => handleQuietHoursChange("start", event.target.value)}
                    className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
                  Fin
                  <input
                    type="time"
                    value={notifications.preferences.quietHours.end}
                    onChange={(event) => handleQuietHoursChange("end", event.target.value)}
                    className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Marcar como leidas
            </button>
            <button
              type="button"
              onClick={clearNotifications}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Limpiar historial
            </button>
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title="Seguridad de la cuenta"
        description="Controla el doble factor, alertas de acceso y politicas de contrasena."
      >
        <form onSubmit={handleSecuritySubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <Toggle
                checked={security.twoFactorEnabled}
                onChange={(value) => handleSecurityToggle("twoFactorEnabled", value)}
                label="Doble factor"
              />
              <div>
                <p className="text-sm font-semibold text-gray-700">Autenticacion de dos factores</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Solicita un codigo adicional al iniciar sesion desde dispositivos nuevos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <Toggle
                checked={security.loginAlertsEnabled}
                onChange={(value) => handleSecurityToggle("loginAlertsEnabled", value)}
                label="Alertas de acceso"
              />
              <div>
                <p className="text-sm font-semibold text-gray-700">Alertas de inicio de sesion</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Te enviaremos una notificacion al detectar accesos sospechosos.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
              Politica de contrasena
              <select
                value={security.passwordPolicy}
                onChange={(event) => handlePasswordPolicy(event.target.value as SecuritySettings["passwordPolicy"])}
                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="standard">Estandar (8 caracteres)</option>
                <option value="strict">Estricta (12 caracteres + simbolos)</option>
              </select>
            </label>
            <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
              Tiempo de sesion (min)
              <select
                value={security.sessionTimeoutMinutes}
                onChange={(event) => handleSessionTimeout(Number(event.target.value))}
                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {sessionTimeoutOptions.map((value) => (
                  <option key={value} value={value}>
                    {value} minutos
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-gray-600 dark:text-slate-300">
              Intentos fallidos antes de bloqueo
              <input
                type="number"
                min={1}
                value={security.failedAttemptsLimit}
                onChange={(event) => handleFailedAttempts(event.target.value)}
                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <footer className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => updateSecurity(security)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              disabled={isSavingSecurity}
            >
              Deshacer cambios
            </button>
            <button
              type="submit"
              disabled={isSavingSecurity}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingSecurity ? "Guardando..." : "Guardar seguridad"}
            </button>
          </footer>
        </form>
      </SectionCard>
      <SectionCard
        title="Roles y permisos"
        description="Define el acceso que tendra cada perfil dentro de la plataforma."
        action={
          <button
            type="button"
            onClick={resetPermissions}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Restaurar valores
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-slate-200">Modulo</th>
                {rolesColumns.map((col) => (
                  <th key={col} className="px-4 py-2 text-center font-semibold text-gray-600 capitalize dark:text-slate-200">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((row, index) => {
                const isEven = index % 2 === 0;
                const rowClass = isDarkMode
                  ? isEven
                    ? "bg-slate-900"
                    : "bg-slate-800/80"
                  : isEven
                    ? "bg-white"
                    : "bg-gray-50";
                return (
                  <tr key={row.module} className={rowClass}>
                    <td className={`px-4 py-2 font-medium ${isDarkMode ? "text-slate-100" : "text-gray-700"}`}>{row.module}</td>
                    {rolesColumns.map((col) => (
                      <td key={col} className="px-4 py-2 text-center">
                        <Toggle checked={row[col]} onChange={() => togglePermission(row.module, col)} label={`Permiso ${col}`} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Conexiones e integraciones"
        description="Sincroniza Invent Pro con tus canales de comunicacion y comercio electronico."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {integrationEntries.map(([key, config]) => (
            <div
              key={key}
              className={`rounded-lg border p-4 transition-colors ${
                isDarkMode ? "border-slate-700 bg-slate-900/40" : "border-gray-100 bg-gray-50"
              }`}
            >
              <header className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-700"}`}>{key.toUpperCase()}</h3>
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                    {config.enabled ? "Activo" : "Disabled"} {config.enabled ? " - revisar credenciales" : ""}
                  </p>
                </div>
                <Toggle checked={config.enabled} onChange={(value) => handleIntegrationToggle(key, value)} label={`Toggle ${key}`} />
              </header>
                <div className="mt-3 space-y-3 text-sm text-gray-600 dark:text-slate-300">
                  {config.enabled ? (
                    <Fragment>
                      {key === "slack" ? (
                        <label className="flex flex-col gap-1">
                          Webhook URL
                          <input
                            type="url"
                            value={config.webhookUrl ?? ""}
                            placeholder="https://hooks.slack.com/..."
                            onChange={(event) => updateIntegration("slack", { webhookUrl: event.target.value })}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                      ) : null}
                      {key === "whatsapp" ? (
                        <label className="flex flex-col gap-1">
                          Numero de contacto
                          <input
                            type="tel"
                            value={config.phone ?? ""}
                            placeholder="+56 9 1234 5678"
                            onChange={(event) => updateIntegration("whatsapp", { phone: event.target.value })}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                      ) : null}
                      {key === "shopify" ? (
                        <label className="flex flex-col gap-1">
                          API key
                          <input
                            type="text"
                            value={config.apiKey ?? ""}
                            placeholder="shpca_..."
                            onChange={(event) => updateIntegration("shopify", { apiKey: event.target.value })}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                      ) : null}
                      {key === "quickbooks" ? (
                        <label className="flex flex-col gap-1">
                          Company ID
                          <input
                            type="text"
                            value={config.companyId ?? ""}
                            placeholder="1234567890"
                            onChange={(event) => updateIntegration("quickbooks", { companyId: event.target.value })}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                      ) : null}
                    </Fragment>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-slate-400">Activa la integracion para configurar credenciales.</p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Historial rapido"
        description="Ultimas alertas registradas. Revisa el detalle completo desde la campana."
        action={<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{notifications.items.length} alertas totales</span>}
      >
        {latestNotifications.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-300">Aun no se han registrado notificaciones.</p>
        ) : (
          <ul className="space-y-3">{latestNotifications.map(renderNotificationItem)}</ul>
        )}
      </SectionCard>
    </div>
  );
};

export default SettingsPage;
