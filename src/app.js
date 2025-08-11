import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoSanitize from 'mongo-sanitize'
import cors from 'cors'
import setupSwagger from './config/swagger.js'

import authRoutes from './routes/auth.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import orderRoutes from './routes/order.routes.js'
import productRoutes from './routes/product.routes.js'
import supplierRoutes from './routes/supplier.routes.js'
import userRoutes from './routes/user.routes.js'
import manualInventoryRoutes from './routes/manualInventory.routes.js'

import { sanitizeInput } from './middleware/sanitizeInput.js'
import { zodErrorHandler } from './middleware/zodErrorHandler.js'
import { attachClientIP } from './middleware/attachClientIP.middleware.js'

const app = express()

app.disable('x-powered-by')

// Middleware para pruebas: simular req.clientIP
if (process.env.NODE_ENV === 'test') {
  app.use((req, res, next) => {
    req.clientIP = '127.0.0.1' // Valor fijo en tests
    next()
  })
} else {
  // Middleware real en producción/desarrollo
  app.use(attachClientIP)
}

app.use(helmet())
app.use(morgan('dev'))
app.use(cookieParser())
app.use(express.json())
app.use(sanitizeInput)

const whitelist = [
  'http://localhost:3000',
  'http://localhost:5173'
  // 'https://midominio.com' // Cambia esto por tu dominio real de producción
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (whitelist.includes(origin)) callback(null, true)
    else callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}

app.use(cors(corsOptions))

app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize(req.body)
  if (req.params) req.params = mongoSanitize(req.params)
  // NO tocar req.query para evitar error
  next()
})

setupSwagger(app)

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/manual-inventory', manualInventoryRoutes)

app.use(zodErrorHandler)

export default app
