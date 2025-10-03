// src/store/auth.ts
import { create } from "zustand";
import api, { saveToken } from "../lib/api";

export type Role = "admin" | "vendedor" | "bodeguero" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthState = {
  user: User | null;
  loading: boolean;      // mientras hay alguna acción en curso
  hydrated: boolean;     // ya intentamos recuperar sesión al menos una vez
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  // interno para evitar llamadas paralelas
  _fetchPromise: Promise<void> | null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  hydrated: false,
  _fetchPromise: null,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.post("/auth/login", { email, password });

      if (res.data?.token) {
        saveToken(res.data.token);
      }
      // si el backend devuelve usuario en login, úsalo;
      // si no, consulta profile una vez más
      let user: User | null = res.data?.user ?? null;
      if (!user) {
        const prof = await api.get<User>("/auth/profile");
        user = prof.data;
      }

      set({ user, loading: false, hydrated: true });
    } catch (err) {
      saveToken(null);
      set({ user: null, loading: false, hydrated: true });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await api.post("/auth/logout");
      saveToken(null);
      set({ user: null, loading: false, hydrated: true });
    } catch (err) {
      saveToken(null);
      set({ user: null, loading: false, hydrated: true });
      throw err;
    }
  },

  fetchMe: async () => {
    // ✅ evita ráfagas y llamadas paralelas
    const current = get()._fetchPromise;
    if (current) return current;

    const p = (async () => {
      set({ loading: true });
      try {
        const res = await api.get<User>("/auth/profile");
        set({ user: res.data, loading: false, hydrated: true });
      } catch {
        set({ user: null, loading: false, hydrated: true });
      } finally {
        // limpia la promesa para futuros intentos
        const g = get();
        if (g._fetchPromise) set({ _fetchPromise: null });
      }
    })();

    set({ _fetchPromise: p });
    return p;
  },
}));
