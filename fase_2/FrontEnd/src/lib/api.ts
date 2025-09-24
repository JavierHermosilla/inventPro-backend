// src/lib/api.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  withCredentials: true, // si tu backend usa cookies HttpOnly
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
