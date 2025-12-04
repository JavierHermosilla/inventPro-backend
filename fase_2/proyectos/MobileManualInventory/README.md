# InventPro · Mobile Manual Inventory

Aplicación Expo + React Native exclusiva para personal de **Bodega** (`bodeguero`) y **Administración**. Permite operar el flujo To-Be de ajustes manuales desde el celular reutilizando los mismos endpoints del backend InventPro.

## Características

- Inicio de sesión contra `/api/auth` con tokens guardados en `SecureStore`.
- Tab **Resumen**: métricas clave, tareas urgentes y alertas recientes.
- Tab **Ajustes**: confirmación o rechazo de discrepancias con captura de cantidad contada y notas.
- Tab **Alertas**: bandeja para notificaciones operativas (marcar como leídas).
- Store global con Zustand y cliente Axios compartido (`lib/api.ts`).
- Configuración de notificaciones locales (`expo-notifications`) y branding alineado al FrontEnd.

## Requisitos

- Node.js 20 LTS
- Expo CLI (opcional) y Android Studio / Xcode o Expo Go en dispositivo físico

## Configuración

```bash
cd fase_2/proyectos/MobileManualInventory
npm install
```

1. Copia `.env.example` a los archivos que necesites (`.env.development`, `.env.production` o simplemente `.env`) y ajusta los valores:

   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   EXPO_PUBLIC_USE_API_MOCKS=false
   EXPO_PUBLIC_TASKS_POLLING_MS=20000
   EXPO_WEB_PORT=5174
   ```

   - Expo web (localhost): `http://localhost:3000/api`.
   - Emulador Android: `http://10.0.2.2:3000/api`.
   - Dispositivo físico: `http://TU_IP_LOCAL:3000/api`.
   - Producción (Railway / dominio público): URL HTTPS correspondiente.
   - Solo activar `EXPO_PUBLIC_USE_API_MOCKS=true` para desarrollo sin backend.

2. (Opcional) Define los package IDs para las tiendas:

   ```env
   EXPO_ANDROID_PACKAGE=com.inventpro.mobilemanualinventory
   EXPO_IOS_BUNDLE_IDENTIFIER=com.inventpro.mobilemanualinventory
   ```

3. Si usas EAS, agrega `EXPO_PROJECT_ID` con el UUID que entrega `eas init`.

Ejecuta según plataforma:

```bash
npm run start    # Expo CLI (QR / simuladores nativos)
npm run android  # Emulador Android
npm run ios      # Simulator iOS (macOS)
npm run web      # Expo web en http://localhost:5174 (no choca con el FrontEnd Vite)
```

> Nota: el backend acepta CORS desde `http://localhost:5173` (FrontEnd Vite) y `http://localhost:5174` (Expo web).  
> El script `npm run web` fija el puerto 5174 para no colisionar con el FrontEnd.  
> Si levantaste Expo con `expo start` y presionaste `w`, reinicia la terminal para que los `EXPO_PUBLIC_*` se apliquen o ejecuta `npm run web`.  
> Puedes tener FrontEnd web y Expo web a la vez: usa 5173 para Vite y 5174 para Expo (o emuladores nativos para la app movil).

## Estructura relevante

- `app/` – rutas Expo Router (`login`, tabs `index`, `inventory`, `alerts`).
- `store/` – Zustand para auth (con restricción de roles) e inventario manual.
- `lib/` – configuración, cliente Axios y normalizadores conectados al backend. Los mocks solo se usan si `EXPO_PUBLIC_USE_API_MOCKS=true`.
- `components/` – UI reutilizable (tarjetas, resúmenes, estados vacíos, etc.).

## Builds y publicación

El archivo `eas.json` define dos perfiles:

- `preview`: genera APK (Android) y build para simulador iOS, ideal para QA interno.
- `production`: genera AAB/IPA listos para Play Store / App Store.

Pasos recomendados:

```bash
npm install -g eas-cli        # una sola vez
eas login                     # autentícate con tu cuenta Expo
eas init --id <PROJECT_ID>    # si aún no existe el proyecto en EAS

# Build interno (APK)
eas build -p android --profile preview

# Build para tiendas
eas build -p android --profile production
eas build -p ios --profile production
```

Al finalizar, descarga el artefacto desde la consola de EAS o con `eas build:run`.
Para publicar en las tiendas puedes usar `eas submit -p android --profile production`
y el equivalente para iOS.

## Próximos pasos sugeridos

1. Ajustar el backend para exponer endpoints específicos para bodegueros (confirmar/denegar ajustes) y permitir su rol en `/api/manual-inventory`.
2. Activar notificaciones push remotas con tokens Expo si se requiere alertar fuera de la app.
3. Agregar pruebas unitarias/e2e una vez que el contrato de APIs quede estable.

> ⚠️ Este proyecto es independiente del FrontEnd web y del BackEnd. Evita tocar esas carpetas desde aquí.
