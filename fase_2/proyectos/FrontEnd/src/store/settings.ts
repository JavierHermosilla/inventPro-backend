import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LOW_STOCK_THRESHOLD } from "../lib/productsApi";
import { SETTINGS_STORAGE_KEY } from "../lib/constants";
import { applyDocumentTheme, type ThemeName } from "../lib/theme";

const MAX_NOTIFICATIONS = 50;

const safeNowIso = () => new Date().toISOString();
const toId = (value: string | number) => String(value);

export type NotificationType = "low-stock" | "system" | "security" | "integration";
export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  createdAt: string;
  read: boolean;
  meta?: Record<string, unknown>;
};

export type NotificationPreferences = {
  lowStockEnabled: boolean;
  lowStockThreshold: number;
  checkEveryMinutes: number;
  repeatMinutes: number;
  pushEnabled: boolean;
  soundEnabled: boolean;
  emailDigestEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
};

export type CompanyProfile = {
  displayName: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
};

export type SecuritySettings = {
  twoFactorEnabled: boolean;
  loginAlertsEnabled: boolean;
  passwordPolicy: "standard" | "strict";
  sessionTimeoutMinutes: number;
  failedAttemptsLimit: number;
};

export type PermissionMatrixRow = {
  module: string;
  admin: boolean;
  supervisor: boolean;
  staff: boolean;
};

export type IntegrationSettings = {
  slack: {
    enabled: boolean;
    webhookUrl: string | null;
  };
  whatsapp: {
    enabled: boolean;
    phone: string | null;
  };
  shopify: {
    enabled: boolean;
    apiKey: string | null;
  };
  quickbooks: {
    enabled: boolean;
    companyId: string | null;
  };
};

export type AppearanceSettings = {
  theme: "light" | "dark";
};

type NotificationState = {
  items: NotificationItem[];
  unreadCount: number;
  preferences: NotificationPreferences;
  lowStockRegistry: Record<string, string>;
};

type SettingsState = {
  company: CompanyProfile;
  security: SecuritySettings;
  permissions: PermissionMatrixRow[];
  integrations: IntegrationSettings;
  notifications: NotificationState;
  appearance: AppearanceSettings;
  updateCompany: (patch: Partial<CompanyProfile>) => void;
  updateSecurity: (patch: Partial<SecuritySettings>) => void;
  togglePermission: (module: string, role: keyof Omit<PermissionMatrixRow, "module">) => void;
  resetPermissions: () => void;
  updateIntegration: <K extends keyof IntegrationSettings>(key: K, patch: Partial<IntegrationSettings[K]>) => void;
  updateNotificationPreferences: (patch: Partial<NotificationPreferences>) => void;
  addNotification: (payload: Omit<NotificationItem, "id" | "createdAt" | "read">) => NotificationItem;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  registerLowStockAlert: (productId: string | number, repeatMinutes: number) => boolean;
  releaseLowStockAlert: (productId: string | number) => void;
  setTheme: (theme: AppearanceSettings["theme"]) => void;
  toggleTheme: () => void;
};

const defaultCompany: CompanyProfile = {
  displayName: "Invent Pro",
  legalName: "Invent Pro SpA",
  taxId: "76.123.456-7",
  email: "contacto@inventpro.cl",
  phone: "+56 2 2345 6789",
  address: "Av. Apoquindo 3000",
  city: "Santiago",
  country: "Chile",
  timezone: "America/Santiago",
};

const defaultSecurity: SecuritySettings = {
  twoFactorEnabled: true,
  loginAlertsEnabled: true,
  passwordPolicy: "strict",
  sessionTimeoutMinutes: 30,
  failedAttemptsLimit: 5,
};

const defaultPermissions: PermissionMatrixRow[] = [
  { module: "Productos", admin: true, supervisor: true, staff: true },
  { module: "Inventario", admin: true, supervisor: true, staff: false },
  { module: "Proveedores", admin: true, supervisor: true, staff: false },
  { module: "Clientes", admin: true, supervisor: true, staff: true },
  { module: "Categorias", admin: true, supervisor: false, staff: false },
  { module: "Ordenes de compra", admin: true, supervisor: true, staff: true },
  { module: "Reportes", admin: true, supervisor: true, staff: false },
  { module: "Configuracion", admin: true, supervisor: false, staff: false },
];

const defaultIntegrations: IntegrationSettings = {
  slack: { enabled: false, webhookUrl: null },
  whatsapp: { enabled: false, phone: null },
  shopify: { enabled: false, apiKey: null },
  quickbooks: { enabled: false, companyId: null },
};

const defaultAppearance: AppearanceSettings = {
  theme: "light",
};

const defaultNotificationPreferences: NotificationPreferences = {
  lowStockEnabled: true,
  lowStockThreshold: LOW_STOCK_THRESHOLD,
  checkEveryMinutes: 10,
  repeatMinutes: 60,
  pushEnabled: false,
  soundEnabled: false,
  emailDigestEnabled: true,
  quietHours: {
    enabled: true,
    start: "22:00",
    end: "07:00",
  },
};

const defaultNotificationState: NotificationState = {
  items: [],
  unreadCount: 0,
  preferences: defaultNotificationPreferences,
  lowStockRegistry: {},
};

const randomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      company: defaultCompany,
      security: defaultSecurity,
      permissions: defaultPermissions,
      integrations: defaultIntegrations,
      notifications: defaultNotificationState,
      appearance: defaultAppearance,

      updateCompany: (patch) => set((state) => ({
        company: { ...state.company, ...patch },
      })),

      updateSecurity: (patch) => set((state) => ({
        security: { ...state.security, ...patch },
      })),

      togglePermission: (module, role) => set((state) => ({
        permissions: state.permissions.map((row) =>
          row.module === module ? { ...row, [role]: !row[role] } : row
        ),
      })),

      resetPermissions: () => set({ permissions: defaultPermissions }),

      updateIntegration: (key, patch) => set((state) => ({
        integrations: {
          ...state.integrations,
          [key]: { ...state.integrations[key], ...patch },
        },
      })),

      updateNotificationPreferences: (patch) => set((state) => ({
        notifications: {
          ...state.notifications,
          preferences: {
            ...state.notifications.preferences,
            ...patch,
            quietHours: {
              ...state.notifications.preferences.quietHours,
              ...(patch.quietHours ?? {}),
            },
          },
        },
      })),

      addNotification: (payload) => {
        const item: NotificationItem = {
          id: randomId(),
          title: payload.title,
          message: payload.message,
          type: payload.type,
          severity: payload.severity,
          meta: payload.meta,
          createdAt: safeNowIso(),
          read: false,
        };

        set((state) => {
          const nextItems = [item, ...state.notifications.items].slice(0, MAX_NOTIFICATIONS);

          return {
            notifications: {
              ...state.notifications,
              items: nextItems,
              unreadCount: state.notifications.unreadCount + 1,
            },
          };
        });

        return item;
      },

      markNotificationAsRead: (id) => set((state) => {
        const nextItems = state.notifications.items.map((item) =>
          item.id === id ? { ...item, read: true } : item
        );
        const unreadCount = nextItems.filter((item) => !item.read).length;
        return {
          notifications: {
            ...state.notifications,
            items: nextItems,
            unreadCount,
          },
        };
      }),

      markAllNotificationsAsRead: () => set((state) => ({
        notifications: {
          ...state.notifications,
          items: state.notifications.items.map((item) => ({ ...item, read: true })),
          unreadCount: 0,
        },
      })),

      clearNotifications: () => set((state) => ({
        notifications: {
          ...state.notifications,
          items: [],
          unreadCount: 0,
          lowStockRegistry: {},
        },
      })),

      registerLowStockAlert: (productId, repeatMinutes) => {
        const key = toId(productId);
        const nowIso = safeNowIso();
        const registry = get().notifications.lowStockRegistry;
        const last = registry[key];
        if (last) {
          const diff = Date.now() - new Date(last).getTime();
          if (diff < repeatMinutes * 60 * 1000) {
            return false;
          }
        }
        set((state) => ({
          notifications: {
            ...state.notifications,
            lowStockRegistry: {
              ...state.notifications.lowStockRegistry,
              [key]: nowIso,
            },
          },
        }));
        return true;
      },

      releaseLowStockAlert: (productId) =>
        set((state) => {
          const key = toId(productId);
          if (!(key in state.notifications.lowStockRegistry)) {
            return state;
          }
          const rest = { ...state.notifications.lowStockRegistry };
          delete rest[key];
          return {
            notifications: {
              ...state.notifications,
              lowStockRegistry: rest,
            },
          };
        }),

      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          applyDocumentTheme(theme);
        }
        set((state) => ({
          appearance: {
            ...state.appearance,
            theme,
          },
        }));
      },

      toggleTheme: () => set((state) => {
        const nextTheme: ThemeName = state.appearance.theme === "dark" ? "light" : "dark";
        if (typeof document !== "undefined") {
          applyDocumentTheme(nextTheme);
        }
        return {
          appearance: {
            ...state.appearance,
            theme: nextTheme,
          },
        };
      }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        company: state.company,
        security: state.security,
        permissions: state.permissions,
        integrations: state.integrations,
        notifications: {
          ...state.notifications,
          // evita guardar arrays gigantes inválidos
          items: state.notifications.items.slice(0, MAX_NOTIFICATIONS),
        },
        appearance: state.appearance,
      }),
    }
  )
);

export const useNotificationCenter = () =>
  useSettingsStore((state) => state.notifications);
