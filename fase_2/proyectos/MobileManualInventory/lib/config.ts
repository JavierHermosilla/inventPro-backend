import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ExtraConfig = {
  apiUrl?: string;
  useMocks?: boolean | string;
  tasksPollingMs?: number | string;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
};

const asNumberOrNull = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extra = (Constants?.expoConfig?.extra ?? {}) as ExtraConfig;

const detectDefaultApiUrl = () =>
  Platform.select({
    ios: 'http://localhost:3000/api',
    android: 'http://10.0.2.2:3000/api',
    default: 'http://localhost:3000/api',
  }) ?? 'http://localhost:3000/api';

const envApiUrl = normalizeString(process.env.EXPO_PUBLIC_API_URL);
const extraApiUrl = normalizeString(extra.apiUrl);

const envUseMocks = process.env.EXPO_PUBLIC_USE_API_MOCKS;
const extraUseMocks = extra.useMocks;

const envPolling = process.env.EXPO_PUBLIC_TASKS_POLLING_MS;
const extraPolling = extra.tasksPollingMs;

export const Config = {
  apiUrl: envApiUrl ?? extraApiUrl ?? detectDefaultApiUrl(),
  useMocks: asBoolean(envUseMocks ?? extraUseMocks ?? false),
  tasksPollingMs: asNumberOrNull(envPolling ?? extraPolling) ?? 20_000,
} as const;

export type AppConfig = typeof Config;
