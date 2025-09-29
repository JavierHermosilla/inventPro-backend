// src/lib/api.ts
import axios, { type AxiosRequestConfig } from "axios";

const TOKEN_KEY = "inventpro_access_token";
const baseURL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000/api";

const api = axios.create({
  baseURL,
  withCredentials: true, // mantiene cookies si el backend las usa
  headers: {
    "Content-Type": "application/json",
  },
});

// Adjunto Authorization header si hay token en localStorage
api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    if (!config.headers) config.headers = {};
    (config.headers as any)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export function saveToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export default api;
