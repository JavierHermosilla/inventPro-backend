import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "inventpro_access_token";

const resolveBaseUrl = () => {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const candidate = env?.VITE_API_URL;
  if (candidate && candidate.trim().length > 0) return candidate;

  if (import.meta.env?.DEV) {
    console.warn("[api] VITE_API_URL no configurado; usando fallback /api (puede causar 404 en produccion).");
  }
  return "/api";
};

const normalizeToken = (value?: string | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return normalizeToken(window.localStorage.getItem(TOKEN_KEY));
  } catch {
    return null;
  }
};

const baseURL = resolveBaseUrl();

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// (opcional) log en dev
if (import.meta.env?.DEV) {
  console.log("[api] baseURL:", baseURL);
}

const applyDefaultAuthHeader = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

const attachAuthToken = (config: InternalAxiosRequestConfig) => {
  const token = readStoredToken();
  if (token) {
    if (!config.headers) config.headers = new AxiosHeaders();

    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  } else if (config.headers instanceof AxiosHeaders) {
    config.headers.delete("Authorization");
  } else if (config.headers) {
    delete (config.headers as Record<string, string>)["Authorization"];
  }
  return config;
};

api.interceptors.request.use(attachAuthToken);

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path !== "/" && path !== "/login") {
    window.location.replace("/");
  }
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const isAuthEndpoint = typeof error.config?.url === "string" && error.config.url.includes("/auth/");

    if (status === 401 || status === 403 || (status === 404 && isAuthEndpoint)) {
      console.error("Token expirado o invalido. Limpiando sesion localmente.");
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* noop: limpiar token es best effort */
        }
      }
      applyDefaultAuthHeader(null);
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

const initialToken = readStoredToken();
if (initialToken) applyDefaultAuthHeader(initialToken);

export function saveToken(token: string | null) {
  const normalized = normalizeToken(token);
  if (typeof window !== "undefined") {
    try {
      if (normalized) window.localStorage.setItem(TOKEN_KEY, normalized);
      else window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop: almacenamiento local puede fallar por quota */
    }
  }
  applyDefaultAuthHeader(normalized);
}

export function getToken() {
  return readStoredToken();
}

export default api;
