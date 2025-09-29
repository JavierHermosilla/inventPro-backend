import { create } from "zustand";   // 👈 así debe ir
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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    set({ loading: true });
    try {
      // intenta login
      const res = await api.post("/auth/login", { email, password });

      // 1) Si backend devuelve token en body -> guardarlo
      if (res.data?.token) {
        saveToken(res.data.token);
        // si backend devolvió user en la misma respuesta:
        if (res.data?.user) {
          set({ user: res.data.user, loading: false });
          return;
        }
      }

      // 2) En caso de usar cookies o si user no vino en la respuesta,
      // pedimos el profile al endpoint del backend
      const profile = await api.get("/auth/profile");
      set({ user: profile.data, loading: false });
    } catch (err) {
      set({ user: null, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore
    } finally {
      saveToken(null);
      set({ user: null });
    }
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      // si hay token local se adjunta automáticamente; si backend usa cookie
      // axios envía cookie por withCredentials: true
      const res = await api.get("/auth/profile");
      set({ user: res.data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));
