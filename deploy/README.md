# Deploy InventPro (Backend + Frontend)

Guía breve para levantar en producción sin depender de contenedores:

## 1) Preparar variables
- Backend: copia `deploy/backend.env.example` al servidor como `.env` y rellena TODO con valores reales (DB, secrets, CORS, swagger/metrics).
- Frontend: copia `deploy/frontend.env.example` como `.env.production` en `fase_2/proyectos/FrontEnd` y ajusta `VITE_API_URL` al dominio público del backend.

## 2) Base de datos
```bash
# En tu host o runner CI
cd fase_2/proyectos/BackEnd
export $(grep -v '^#' ../../deploy/backend.env.example | xargs) # o carga tu .env real
npm ci
npm run db:migrate
```
(Usa un usuario de BD con permisos mínimos y TLS si tu proveedor lo exige).

## 3) Backend (pm2 + Nginx)
```bash
cd fase_2/proyectos/BackEnd
npm ci
NODE_ENV=production pm2 start src/server.js --name inventpro
pm2 save
```
- Coloca Nginx/Caddy al frente con HTTPS y `proxy_set_header X-Forwarded-For` / `X-Forwarded-Proto`.
- Protege `/api-docs` y `/metrics` con las credenciales de tu `.env`.

## 4) Frontend (build estático)
```bash
cd fase_2/proyectos/FrontEnd
npm ci
cp ../../deploy/frontend.env.example .env.production  # si aún no lo hiciste, luego edita
npm run build
# Sirve la carpeta dist/ en tu hosting/CDN (HTTPS)
```

## 5) Chequeos rápidos post-deploy
- Health: `GET https://api.tu-dominio.com/api/health` → `{"status":"ok"}`
- Login con admin y bodeguero.
- Crear ajuste manual (admin/bodeguero).
- Reportes accesibles solo con admin.

## 6) Monitoreo y respaldos
- `/metrics` detrás de basic auth → agrega a tu scraper (Prometheus/Grafana).
- Rotación de logs (pm2-logrotate o syslog).
- Backups diarios de PostgreSQL (`pg_dump` o snapshots del proveedor).

## Opcional
- Code splitting en el frontend si necesitas reducir el bundle (configurar `build.rollupOptions.output.manualChunks` en vite.config).
- Expo (MobileManualInventory): ajusta `EXPO_PUBLIC_API_URL` al backend público antes de distribuir (EAS/internal o emuladores).
