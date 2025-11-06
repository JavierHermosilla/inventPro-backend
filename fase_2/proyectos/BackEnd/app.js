// src/app.js
import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import hpp from 'hpp'
import setupSwagger from './config/swagger.js'
import { v4 as uuidv4 } from 'uuid'
import client from 'prom-client'

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import productRoutes from './routes/product.routes.js'
import orderRoutes from './routes/order.routes.js'
import supplierRoutes from './routes/supplier.routes.js'
import manualInventoryRoutes from './routes/manualInventory.routes.js'
import categoryRoutes from './routes/category.routes.js'
import clientRoutes from './routes/client.routes.js'
import reportsRoutes from './routes/reports.routes.js'
import OrderProductRoutes from './routes/orderProduct.routes.js'
import exportRoutes from './routes/export.routes.js'

import { sanitizeInput } from './middleware/sanitizeInput.js'
import { zodErrorHandler } from './middleware/zodErrorHandler.js'
import { attachClientIP } from './middleware/attachClientIP.middleware.js'
import { globalRateLimiter } from './middleware/rateLimit.js'

const app = express()
app.disable('x-powered-by')
// Ajusta según tu cadena de proxies/CDN (1 si hay 1 proxy como Nginx)
app.set('trust proxy', 1)

// ▶️ Request ID para correlación
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4()
  res.set('x-request-id', req.id)
  next()
})

// ▶️ Middlewares globales de seguridad y saneamiento
app.use(express.json({ limit: '1mb' }))
app.use(hpp())
app.use(sanitizeInput)
app.use(helmet({
  contentSecurityPolicy: false, // API, no HTML
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))
app.use(morgan('dev'))
app.use(cookieParser())

// ▶️ CORS por ENV
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use(cors({
  origin (origin, cb) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    return cb(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

// ▶️ IP real del cliente
app.use(attachClientIP)

// ▶️ Rate limit GLOBAL (excluye /api/health, /metrics y swagger)
app.use(globalRateLimiter)

// ▶️ Swagger / OpenAPI
setupSwagger(app)

// ▶️ Rutas de la API
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/manual-inventory', manualInventoryRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/order-products', OrderProductRoutes)
app.use('/api/exports', exportRoutes)

// ▶️ Healthz
app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok' })
})

// ▶️ Prometheus metrics
client.collectDefaultMetrics()
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType)
  res.end(await client.register.metrics())
})

// ▶️ Handler de errores Zod (validaciones)
app.use(zodErrorHandler)

// ▶️ Error handler seguro (sin filtrar detalles en producción)
app.use((err, _req, res, _next) => {
  const status = err.status || 500
  const payload = { message: err.publicMessage || 'Internal server error' }
  if (process.env.NODE_ENV !== 'production') payload.stack = err.stack
  res.status(status).json(payload)
})

export default app
