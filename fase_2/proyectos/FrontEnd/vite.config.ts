import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Permite servir la app en subrutas (e.g., Nginx /inventpro/ o file://)
const basePath = process.env.VITE_BASE_PATH ?? "./";

export default defineConfig({
  base: basePath.endsWith("/") ? basePath : `${basePath}/`,
  plugins: [react(), tailwindcss()],
});
