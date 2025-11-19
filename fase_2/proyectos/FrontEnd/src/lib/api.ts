import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from "axios";

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/refresh"];

const resolveBaseUrl = () => {
  const candidate = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_URL;
  return candidate && candidate.trim().length > 0 ? candidate : "/api"; // fallback seguro
};

const normalizeToken = (value?: string | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const TOKEN_KEY = "auth_token";

const loadStoredToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return normalizeToken(window.localStorage.getItem(TOKEN_KEY));
  } catch {
    return null;
  }
};

const persistToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // silenciosamente ignora problemas de storage (modo incógnito, etc.)
  }
};

const baseURL = resolveBaseUrl();

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
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

let inMemoryToken: string | null = loadStoredToken();
applyDefaultAuthHeader(inMemoryToken);

let refreshPromise: Promise<string | null> | null = null;

const shouldSkipAuth = (url?: string) => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((path) => url.includes(path));
};

const requestRefreshToken = async (): Promise<string | null> => {
  try {
    const response = await refreshClient.post<{ token?: string }>("/auth/refresh");
    const token = normalizeToken(response.data?.token ?? null);
    setToken(token);
    return token;
  } catch {
    setToken(null);
    return null;
  }
};

const ensureAccessToken = async (force = false): Promise<string | null> => {
  if (!force && inMemoryToken) return inMemoryToken;
  if (force) {
    inMemoryToken = null;
    refreshPromise = null;
  }
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        return await requestRefreshToken();
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

const attachAuthToken = async (config: InternalAxiosRequestConfig) => {
  if (shouldSkipAuth(config.url)) {
    return config;
  }

  const token = await ensureAccessToken();

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

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequest | undefined;

    if ((status === 401 || status === 403) && originalRequest && !shouldSkipAuth(originalRequest.url)) {
      saveToken(null);

      if (!originalRequest._retry) {
        originalRequest._retry = true;
        const newToken = await ensureAccessToken(true);
        if (newToken) {
          return api(originalRequest);
        }
      }
    }

    return Promise.reject(error);
  }
);

const setToken = (token: string | null) => {
  inMemoryToken = token;
  applyDefaultAuthHeader(token);
  persistToken(token);
};

export function saveToken(token: string | null) {
  const normalized = normalizeToken(token);
  setToken(normalized);
}

export function getToken() {
  return inMemoryToken;
}

export default api;
