import { AxiosError } from 'axios';
import { create } from 'zustand';

import api, { clearToken, saveToken } from '@/lib/api';
import { useManualInventoryStore } from '@/store/manualInventory';

export type Role = 'admin' | 'vendedor' | 'bodeguero' | 'user';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  hydrated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  resetError: () => void;
  _profilePromise: Promise<void> | null;
};

const ALLOWED_ROLES: Role[] = ['admin', 'bodeguero'];
const ACCESS_DENIED_MESSAGE = 'Esta app es exclusiva para administradores y personal de bodega.';

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const messageFromResponse = error.response?.data as { message?: string } | undefined;
    const message = messageFromResponse?.message;
    if (typeof message === 'string' && message.trim().length > 0) return message;
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return fallback;
};

const mapUser = (payload: Partial<AuthUser> | undefined | null): AuthUser | null => {
  if (!payload?.id) return null;
  return {
    id: payload.id,
    name: payload.name ?? 'Usuario',
    email: payload.email ?? '',
    role: (payload.role ?? 'user') as Role,
  };
};

const resetManualInventoryStore = () => {
  try {
    useManualInventoryStore.getState().reset();
  } catch (error) {
    console.warn('[auth] No se pudo reiniciar el estado de inventario manual', error);
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  hydrated: false,
  error: null,
  _profilePromise: null,

  resetError: () => set({ error: null }),

  hydrate: async () => {
    if (get().hydrated && get().user) return;
    return get().fetchProfile();
  },

  fetchProfile: async () => {
    const { _profilePromise } = get();
    if (_profilePromise) return _profilePromise;

    const promise = (async () => {
      set({ loading: true, error: null });
      try {
        const response = await api.get<AuthUser>('/auth/profile');
        const user = mapUser(response.data);
        if (user && !ALLOWED_ROLES.includes(user.role)) {
          await clearToken();
          resetManualInventoryStore();
          set({
            user: null,
            loading: false,
            hydrated: true,
            error: ACCESS_DENIED_MESSAGE,
          });
          return;
        }
        set({ user, loading: false, hydrated: true });
      } catch (error) {
        console.warn('[auth] No se pudo recuperar la sesión', error);
        await clearToken();
        resetManualInventoryStore();
        set({ user: null, loading: false, hydrated: true, error: null });
      } finally {
        set({ _profilePromise: null });
      }
    })();

    set({ _profilePromise: promise });
    return promise;
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<{ token?: string; user?: AuthUser }>('/auth/login', {
        email,
        password,
      });

      if (response.data?.token) {
        await saveToken(response.data.token);
      }

      let user = mapUser(response.data?.user);
      if (!user) {
        try {
          const profile = await api.get<AuthUser>('/auth/profile');
          user = mapUser(profile.data);
        } catch (profileError) {
          console.error('[auth] Error al recuperar perfil después del login', profileError);
        }
      }

      if (user && !ALLOWED_ROLES.includes(user.role)) {
        await clearToken();
        resetManualInventoryStore();
        set({
          user: null,
          loading: false,
          hydrated: true,
          error: ACCESS_DENIED_MESSAGE,
        });
        throw new Error(ACCESS_DENIED_MESSAGE);
      }

      set({ user, loading: false, hydrated: true, error: null });
    } catch (error) {
      await clearToken();
      resetManualInventoryStore();
      set({
        user: null,
        loading: false,
        hydrated: true,
        error: extractErrorMessage(error, 'No se pudo iniciar sesión. Inténtalo nuevamente.'),
      });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('[auth] Error al cerrar sesión en backend', error);
    } finally {
      await clearToken();
      resetManualInventoryStore();
      set({ user: null, loading: false });
    }
  },
}));
