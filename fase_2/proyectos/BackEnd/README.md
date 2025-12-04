# InventPro – Backend (Node.js + Express + PostgreSQL)

Sistema de **Gestión de Inventarios y Órdenes de Compra** para PyMEs. Este README está pensado para que **cualquiera** (sí, incluso si es tu primera vez) pueda **levantar el servidor** paso a paso y además entender cómo está armado el proyecto.

> Tecnologías clave: **Node.js (ES Modules) + Express.js + Sequelize (PostgreSQL)**, JWT, Zod, Winston, Swagger/OpenAPI.

---

## 🧭 TL;DR – Arranca en minutos

```bash
# 1) Clona el proyecto
git clone https://github.com/JavierHermosilla/inventPro-backend.git
cd inventPro-backend/fase_2/BackEnd

# 2) Instala dependencias
npm install

# 3) Crea el archivo .env (usa la plantilla de abajo)
#    Ajusta credenciales de PostgreSQL

# 4) Prepara la base de datos
# Opción A (SQL completo):
psql -h 127.0.0.1 -U postgres -d postgres -f scripts/script.sql
# Opción B (migraciones con Sequelize CLI):
npx sequelize-cli db:migrate --config config/config.cjs

# 5) Crea el usuario admin (elige 1 método)
# A) Seeder CLI:
npx sequelize-cli db:seed --seed 20250923153907-seed-admin.cjs
# B) Script Node (usa variables del .env):
node scripts/seedAdmin.js

# 6) Ejecuta el servidor
npm run dev
# Abre: http://localhost:3000/api-docs  (Swagger)
```

---

## ✅ Requisitos previos

* **Node.js** 20+ (recomendado **v22**) y **npm**.
* **PostgreSQL** 13+ (recomendado 14 o superior).
* **Git** (para clonar el repo).
* (Opcional) **cURL** o **Postman/Insomnia** para probar la API.

> En Windows puedes usar **PowerShell**. En Linux/Mac, usa tu terminal habitual.

---

## 🗂️ Estructura (carpetas principales)

```
├─ config/                 # Configuración de Sequelize CLI (config.cjs)
├─ migrations/             # Migraciones de BD (Sequelize)
├─ seeders/                # Seeders (ej. admin inicial)
├─ scripts/                # Scripts SQL/Node (script.sql, seedAdmin.js, createAdmin.js)
├─ src/
│  ├─ config/              # Config runtime: roles, swagger, variables, allowedFields
│  ├─ controllers/         # Controladores HTTP (auth, users, products, etc.)
│  ├─ db/                  # Inicialización de Sequelize (db.js)
│  ├─ docs/                # Swagger/OpenAPI (JS/YAML)
│  ├─ libs/                # Librerías (jwt, etc.)
│  ├─ middleware/          # Middlewares (auth, roles, validación, rate limit, XSS)
│  ├─ models/ o model/     # Modelos Sequelize + associations
│  ├─ routes/              # Rutas Express por dominio
│  ├─ schemas/             # Esquemas Zod (validaciones)
│  └─ utils/               # Logger, RUT helpers, IP, etc.
├─ .env.example            # Plantilla de variables de entorno
├─ package.json            # Scripts y dependencias
└─ README.md               # Este documento
```

---

## 🔐 Variables de entorno (.env)

Crea un archivo `.env` en la raíz del proyecto. Puedes usar **.env.example** como referencia. **Nunca** subas tu `.env` real a GitHub.

```ini
# 🌐 Node
NODE_ENV=development
PORT=3000

# 🔐 JWT (usa claves largas y aleatorias; NO pegues un token aquí)
JWT_SECRET=pon-aqui-una-clave-larga-y-segura
REFRESH_TOKEN_SECRET=otra-clave-larga-y-segura
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# 🌍 CORS (separadas por coma)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000

# 🍪 Cookies
ALLOW_COOKIE_AUTH=false

# 🗄️ PostgreSQL
DB_NAME=inventpro
DB_USER=inventpro_user
DB_PASSWORD=tu_password
DB_HOST=127.0.0.1
DB_PORT=5432
DB_SCHEMA=inventpro_user

# 📚 Swagger (si tu instancia requiere Basic Auth)
SWAGGER_USER=docs
SWAGGER_PASS=docs-password

# 🚦 Rate limits (global y login)
RATE_GLOBAL_WINDOW_MS=60000
RATE_GLOBAL_MAX=120
RATE_LOGIN_WINDOW_MS=900000
RATE_LOGIN_MAX=5

# (Opcional) Admin por seed script
ADMIN_NAME=Admin InventPro
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@inventpro.cl
ADMIN_PASSWORD=Admin123!
ADMIN_ROLE=admin
```

> **Tips**
>
> * Genera secretos con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
> * Si vas a usar cookies para el token, deja `ALLOW_COOKIE_AUTH=true` y configura CORS/HTTPS correctamente.

---

## 🗄️ Preparar la base de datos (PostgreSQL)

1. **Crea usuario y base** (ajusta contraseña):

   ```sql
   -- Conéctate como postgres (psql o PgAdmin)
   CREATE USER inventpro_user WITH PASSWORD 'tu_password';
   CREATE DATABASE inventpro OWNER inventpro_user;
   ``

   ```

2. **Extensiones y esquema** (recomendado):

   ```sql
   \c inventpro;
   CREATE SCHEMA IF NOT EXISTS inventpro_user AUTHORIZATION inventpro_user;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

3. **Aplica estructura** (elige una opción):

   * **Opción A – Script SQL completo**

     ```bash
     # En la raíz del proyecto
     psql -h 127.0.0.1 -U postgres -d inventpro -f scripts/script.sql
     ```
   * **Opción B – Migraciones Sequelize**

     ```bash
     npx sequelize-cli db:migrate --config config/config.cjs
     ```

> Si usas migraciones, asegúrate de que `config/config.cjs` toma tus variables del `.env` y usa el **schema** `inventpro_user`.

---

## 👑 Crear el usuario Administrador

Elige **una** forma (no ejecutes varias veces para evitar duplicados):

**A) Seeder de Sequelize CLI**

```bash
npx sequelize-cli db:seed --seed 20250923153907-seed-admin.cjs
```

**B) Script Node (lee credenciales desde `.env`)**

```bash
node scripts/seedAdmin.js
```

**C) Script Node simple (hardcodeado)**

```bash
node scripts/createAdmin.js
```

> El usuario por defecto (ejemplo) suele ser: `admin@inventpro.cl` / `Admin123!` (ajústalo en tu `.env`).

---

## ▶️ Levantar el servidor

```bash
# Instala dependencias
npm install

# Dev con recarga (nodemon)
npm run dev

# Producción (ejemplo)
NODE_ENV=production npm start
```

* La API expone **Swagger** en: `http://localhost:3000/api-docs`
  Si pide credenciales, usa `SWAGGER_USER` / `SWAGGER_PASS` del `.env`.

---

## 🔐 Autenticación (cómo probar)

1. **Login**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inventpro.cl","password":"Admin123!"}'
```

Respuesta esperada (ejemplo):

```json
{
  "token": "<JWT-ACCESS-TOKEN>",
  "user": { "id": "...", "email": "admin@inventpro.cl", "role": "admin" }
}
```

2. **Usar el token** para endpoints protegidos:

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <JWT-ACCESS-TOKEN>"
```

> Endpoints de **refresh**, **profile** y **logout** están en `/api/auth/*`.
> Roles disponibles: `admin`, `vendedor`, `bodeguero`, `user`.

---

## 📚 Mapa de endpoints principales (resumen)

**Auth**

* `POST /api/auth/register` – Registro de usuario
* `POST /api/auth/login` – Login
* `POST /api/auth/refresh` – Renovar token
* `GET /api/auth/profile` – Perfil del usuario (token requerido)
* `POST /api/auth/logout` – Logout

**Usuarios** *(solo admin, excepto get/update de sí mismo)*

* `POST /api/users` – Crear usuario
* `GET /api/users` – Listar (paginado)
* `GET /api/users/:id` – Ver por ID
* `PUT /api/users/:id` – Actualizar
* `DELETE /api/users/:id` – Eliminar

**Clientes**

* `POST /api/clients` – Crear
* `GET /api/clients` – Listar/buscar
* `GET /api/clients/:id` – Ver
* `PUT /api/clients/:id` – Actualizar
* `DELETE /api/clients/:id` – Eliminar

**Proveedores**

* `POST /api/suppliers`
* `GET /api/suppliers`
* `GET /api/suppliers/:id`
* `PUT /api/suppliers/:id`
* `DELETE /api/suppliers/:id`

**Categorías**

* `POST /api/categories`
* `GET /api/categories`
* `GET /api/categories/:id`
* `PUT /api/categories/:id`
* `DELETE /api/categories/:id`

**Productos**

* `POST /api/products` – Requiere `categoryId` y **uno**: `supplierId` **o** `supplierRut`
* `GET /api/products` – Paginado, incluye categoría y proveedor
* `GET /api/products/:id`
* `PUT /api/products/:id` – `replaceStock` opcional
* `DELETE /api/products/:id`

**Órdenes**

* `POST /api/orders` – Crear por `clientId` **o** por `rut` del cliente
* `GET /api/orders` – Listar
* `GET /api/orders/:id` – Detalle con ítems
* `PUT /api/orders/:id/status` – Cambiar estado (`pending → processing → completed` o `cancelled`)
* `DELETE /api/orders/:id` – Eliminar (restaura stock)
* `GET /api/orders/by-rut/:rut` – Listar por RUT del cliente

**Items de Orden (OrderProducts)**

* `POST /api/order-products` – Crear o **merge** (incrementa cantidad si ya existe)
* `PUT /api/order-products/:id` – Actualizar cantidad (ajusta stock y total)
* `DELETE /api/order-products/:id` – Eliminar (devuelve stock y ajusta total)

**Inventario Manual** *(solo admin)*

* `POST /api/manual-inventories` – `increase`/`decrease` (si baja, requiere `reason`)
* `GET /api/manual-inventories` – Listar (incluye producto y `performedBy`)
* `GET /api/manual-inventories/:id`
* `DELETE /api/manual-inventories/:id`

**Reportes**

* `POST /api/reports`
* `GET /api/reports` – Filtros: `status`, `type`, `search`
* `GET /api/reports/:id`
* `PUT /api/reports/:id`
* `DELETE /api/reports/:id`

**Dashboard** *(admin/bodeguero)*

* `GET /api/dashboard/summary`

> La **documentación Swagger** detalla bodies, respuestas y roles por endpoint: `/api-docs`.

---

## 🔧 Middlewares y seguridad

* **JWT**: `Authorization: Bearer <token>` (header). Opcional por cookie si `ALLOW_COOKIE_AUTH=true`.
* **Roles**: `admin`, `vendedor`, `bodeguero`, `user` (middlewares `requireRole`, `requireRoleOrSelf`).
* **Validación**: `Zod` en body/params/query; `validateUUID` para IDs.
* **Rate Limiting**: login (5 intentos / 15 min). Puedes habilitar un **global limiter** con tus envs.
* **XSS**: Sanitización de `req.body/query/params`.
* **Logs**: `Winston` a consola + archivos (`logs/*`).

---

## 🧪 Pruebas (si aplica en tu repo)

* Ejecuta `npm test` (si tu proyecto incluye tests configurados).
* Para **entorno de test**, asegúrate de un `.env.test` y de que la BD de prueba esté configurada.

---

## 🆘 Solución de problemas (FAQ)

### 1) `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`

Significa que `DB_PASSWORD` está **vacío** o no llega como string. Revisa tu `.env` y que `dotenv` se cargue correctamente.

### 2) `psql: could not translate host name "5432" to address`

En **psql** el parámetro de host va en `-h` y el **puerto** en `-p`. Ejemplo correcto:

```bash
psql -h 127.0.0.1 -p 5432 -U inventpro_user -d inventpro
```

### 3) `jwt malformed / invalid signature / expired`

El token no es válido o expiró. Vuelve a **login** para obtener un token fresco.

### 4) `Invalid UUID format`

Estás pasando un ID que **no** es UUID v4 (ej.: 24 hex de Mongo). Usa IDs como `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

### 5) `relation "..." does not exist`

Faltan migraciones o no aplicaste el script SQL. Ejecuta:

```bash
npx sequelize-cli db:migrate --config config/config.cjs
# o
psql -h 127.0.0.1 -U postgres -d inventpro -f scripts/script.sql
```

### 6) `duplicate key value violates unique constraint`

Estás creando un registro con `email/username/rut/name` que **ya existe**. Cambia el valor o elimina el duplicado previo.

### 7) Swagger pide usuario/clave

Usa `SWAGGER_USER` / `SWAGGER_PASS` del `.env`.

---

## 🛡️ Recomendaciones para producción

* Usa **secrets** fuertes (JWT/Refresh distintos) y **HTTPS**.
* Configura **CORS** solo con orígenes permitidos.
* Considera `app.set('trust proxy', true)` si estás detrás de Nginx/Ingress.
* Logs a **stdout** en contenedores (o rotación de archivos).
* Mantén `.env` **fuera** del repositorio (ya está en `.gitignore`).
* Considera backups y monitoreo de BD.

---

## 👥 Roles y reglas de negocio (resumen)

* **admin**: gestión total (usuarios, inventario, etc.).
* **vendedor**: puede crear órdenes de clientes.
* **bodeguero**: acceso a dashboard y operaciones de bodega.
* **user**: acceso limitado a su perfil y funcionalidades básicas.

**Inventario / Órdenes**

* Al crear orden: el stock se **descuenta** (puede quedar negativo → `isBackorder=true`).
* Al eliminar orden: el stock se **restaura**.
* Ajustes manuales: `increase`/`decrease` (si baja, `reason` requerido).

---

## 🤝 Contribuir

* Crea una rama `feature/tu-cambio`.
* Haz commits claros.
* Abre PR con descripción y screenshots si aplica.

---

## 📄 Licencia

Proyecto académico MIT.

---


