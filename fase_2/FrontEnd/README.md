# InventPro Frontend (React + Vite + TypeScript)

Aplicación web para la gestión de inventarios y órdenes, construida con React 19, Vite 7 y TypeScript. Incluye enrutamiento protegido, estado global con Zustand, formularios con React Hook Form y estilos con Tailwind CSS v4.

> Importante: antes de instalar/ejecutar el frontend, primero debes tener el backend funcionando. Sigue las instrucciones en `fase_2/BackEnd/README.md` y verifica que responde en tu entorno (por ejemplo, `http://localhost:3000/api-docs`).

---

## Requisitos

- Node.js 18.18+ (recomendado 20+)
- npm 9+ o pnpm/yarn (usa uno, no mezcles)
- Backend en ejecución y accesible (por defecto en `http://localhost:3000`)

---

## Tecnologías principales

- React 19 + React Router 7 (`react-router-dom`)
- Vite 7 (desarrollo y build)
- TypeScript 5.8
- Tailwind CSS 4 + `@tailwindcss/vite` + PostCSS
- Estado: Zustand
- Formularios: React Hook Form + Zod (validación)
- HTTP: Axios (con `withCredentials` y `Authorization: Bearer`)

---

## Estructura del proyecto (carpetas clave)

- `src/pages/` vistas: `Dashboard`, `Products`, `Suppliers`, `Clients`, `Users` (solo admin), `Categories`, `Orders`, `ManualInventory`, `Reports`, `Settings`.
- `src/components/` layout y UI compartida (por ejemplo, `Layout.tsx`).
- `src/routes/` utilidades de enrutamiento protegido (`Protected.tsx`).
- `src/store/` estado global (`auth.ts` con login/logout/profile).
- `src/lib/` clientes y utilidades de API (`api.ts`, `productsApi.ts`).

---

## Variables de entorno

Usadas por Vite (solo las que comienzan con `VITE_` se inyectan en el cliente):

- `VITE_API_URL` URL base de la API. Ej: `http://localhost:3000/api`.
- `VITE_ENVIRONMENT` ambiente (`development` | `production`).
- `VITE_APP_NAME`, `VITE_DEFAULT_LANGUAGE` metadatos de UI.

Archivos disponibles:

- `.env.development` (por defecto incluye `VITE_API_URL=http://localhost:3000/api`).
- `.env.production` (apunta a tu backend productivo).

Notas:

- Si cambias `.env*`, reinicia el servidor de desarrollo para que tome efecto.
- El cliente usa `withCredentials: true`; tu backend debe habilitar CORS con credenciales y permitir origen `http://localhost:5173` (ver `fase_2/BackEnd/.env` → `CORS_ORIGINS`).

---

## Instalación y ejecución (desarrollo)

1) Instala el backend y déjalo corriendo (ver `fase_2/BackEnd/README.md`).

2) Instala el frontend:

```bash
cd fase_2/FrontEnd
npm install
```

3) Configura entorno (opcional si usas valores por defecto):

```bash
# Asegúrate que apunte a tu backend
echo VITE_API_URL=http://localhost:3000/api >> .env.development
```

4) Inicia en modo desarrollo:

```bash
npm run dev
# Abre http://localhost:5173
```

Comandos útiles:

- `npm run dev` servidor de desarrollo (Vite)
- `npm run build` compila a producción
- `npm run preview` previsualiza el build localmente
- `npm run lint` revisa el código con ESLint

---

## Autenticación y autorización

- El token se guarda en `localStorage` con la clave `inventpro_access_token` (helpers en `src/lib/api.ts`).
- Interceptor Axios agrega `Authorization: Bearer <token>` y limpia sesión en `401/403`.
- Rutas protegidas con `src/routes/Protected.tsx` (opcionalmente por roles).
- Endpoints esperados en backend: `/auth/login`, `/auth/logout`, `/auth/profile`, y recursos como `/products`, `/categories`, `/suppliers`.

---

## Buenas prácticas

- Mantén un solo `BrowserRouter` en `src/App.tsx`.
- Centraliza llamadas HTTP en `src/lib` y evita duplicar lógica de mapeo: usa `productsApi` para transformar DTOs a objetos de UI.
- Usa `react-hook-form` + `zod` para formularios y validación.
- Reinicia `npm run dev` tras cambios en `.env*`.
- No mezcles gestores de paquetes (usa solo npm o pnpm o yarn).
- Ejecuta `npm run lint` antes de enviar cambios.
- Evita hardcodear URLs o secretos; usa `VITE_API_URL`.

---

## Errores comunes y soluciones

- CORS bloqueado / cookies: habilita `CORS_ORIGINS=http://localhost:5173` y `Access-Control-Allow-Credentials=true` en el backend.
- 401/403 después de iniciar: borra el token (`localStorage.removeItem('inventpro_access_token')`) y vuelve a iniciar sesión.
- 404 en endpoints: confirma que `VITE_API_URL` incluye el sufijo `/api` si tu backend lo usa.
- Conexión rechazada (`ECONNREFUSED`): backend apagado o URL incorrecta.
- Puerto 5173 ocupado: ejecuta `npm run dev -- --port 5174`.
- Cambié `.env` y no pasa nada: reinicia el servidor de Vite.
- Estilos Tailwind no aplican: `src/index.css` debe incluir `@tailwind base; @tailwind components; @tailwind utilities;` y revisar `postcss.config.js`.

---

## Estado actual del frontend

- Rutas y layout principales creados (Dashboard, Products, Suppliers, Clients, Users [admin], Categories, Orders, ManualInventory, Reports, Settings).
- Autenticación integrada (login/logout/profile) con Zustand y Axios.
- Cliente de API configurado con `VITE_API_URL` y manejo de token.
- Listado y mapeo de productos (`src/lib/productsApi.ts`) con estados de stock.
- Para ver datos reales, el backend debe estar corriendo y con CORS correcto.

---

## Build y despliegue

```bash
npm run build
npm run preview  # sirve el build localmente
```

Si sirves el build con otro servidor, habilita fallback a `index.html` para soportar `BrowserRouter` (SPA).

---

## Recordatorio importante

Primero instala/ejecuta el backend siguiendo `fase_2/BackEnd/README.md`. Sin backend activo, el frontend mostrará errores de red o autenticación.

