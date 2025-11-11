import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "inventpro_access_token";

const resolveBaseUrl = () => {
  const candidate = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_URL;
  return candidate && candidate.trim().length > 0 ? candidate : "/api"; // ✅ fallback seguro
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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("Token expirado o invalido. Limpiando sesion localmente.");
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* noop: limpiar token es best effort */
        }
      }
      applyDefaultAuthHeader(null);
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
