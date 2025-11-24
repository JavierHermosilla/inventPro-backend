import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
  type AxiosInstance,
} from 'axios';

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
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    tokenCache = normalizeToken(raw);
    tokenLoaded = true;
  }
  return tokenCache;
};

const persistToken = async (token: string | null) => {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
};

const api: AxiosInstance = axios.create({
  baseURL: Config.apiUrl,
  withCredentials: true,
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
