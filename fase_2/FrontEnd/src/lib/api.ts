import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "inventpro_access_token";

const resolveBaseUrl = () => {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
  const candidate = meta.env?.VITE_API_URL;
  return candidate && candidate.trim().length > 0 ? candidate : "http://localhost:3000/api";
};

const baseURL = resolveBaseUrl();

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const attachAuthToken = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
};

api.interceptors.request.use(attachAuthToken);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("Token expirado o invalido. Limpiando sesion localmente.");
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export function saveToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export default api;
