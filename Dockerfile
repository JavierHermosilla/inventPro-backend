# Dockerfile para InventPro (Node 20 + ESM)
# Construye la app, instala dependencias (incluye dev para sequelize-cli en migraciones)

FROM node:20-alpine AS base

WORKDIR /app

# Copia manifest primero para aprovechar la caché
COPY package.json package-lock.json* ./

# Instala dependencias (incluyendo dev, necesario para sequelize-cli en migraciones)
RUN npm install --legacy-peer-deps

# Copia el resto del código
COPY . .

# Expone el puerto de la app (configurable via PORT)
EXPOSE 3000

# Comando por defecto: aplicar migraciones y arrancar servidor
# (asume que las variables de entorno de DB ya están definidas)
CMD npm run db:migrate && npm start
