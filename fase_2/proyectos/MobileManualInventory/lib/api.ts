import * as SecureStore from 'expo-secure-store';
import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig, type AxiosInstance } from 'axios';

import { Config } from '@/lib/config';

const TOKEN_KEY = 'inventpro:mobile-token';

let tokenCache: string | null = null;
let tokenLoaded = false;

const normalizeToken = (value?: string | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readTokenFromStorage = async () => {
  if (!tokenLoaded) {
    try {
      const raw = await SecureStore.getItemAsync(TOKEN_KEY);
      tokenCache = normalizeToken(raw);
    } catch (error) {
      console.warn('[api] No se pudo leer el token seguro', error);
      tokenCache = null;
    } finally {
      tokenLoaded = true;
    }
  }
  return tokenCache;
};

const persistToken = async (token: string | null) => {
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.warn('[api] No se pudo persistir el token seguro', error);
  }
};

const api: AxiosInstance = axios.create({
  baseURL: Config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

const applyDefaultAuthHeader = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const saveToken = async (token: string | null) => {
  const normalized = normalizeToken(token);
  tokenCache = normalized;
  tokenLoaded = true;
  await persistToken(normalized);
  applyDefaultAuthHeader(normalized);
};

export const getToken = async () => readTokenFromStorage();

export const clearToken = async () => {
  tokenCache = null;
  tokenLoaded = true;
  await persistToken(null);
  applyDefaultAuthHeader(null);
};

const attachAuthToken = async (config: InternalAxiosRequestConfig) => {
  const token = await readTokenFromStorage();
  if (token) {
    if (!config.headers) config.headers = new AxiosHeaders();
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
};

api.interceptors.request.use(attachAuthToken);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      await clearToken();
    }
    return Promise.reject(error);
  }
);

export default api;
