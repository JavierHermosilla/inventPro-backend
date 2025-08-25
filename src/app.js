import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import setupSwagger from './config/swagger.js'

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import productRoutes from './routes/product.routes.js'
import orderRoutes from './routes/order.routes.js'
import supplierRoutes from './routes/supplier.routes.js'
import manualInventoryRoutes from './routes/manualInventory.routes.js'
import categoryRoutes from './routes/category.routes.js'
import clientRoutes from './routes/client.routes.js'

import { sanitizeInput } from './middleware/sanitizeInput.js'
import { zodErrorHandler } from './middleware/zodErrorHandler.js'
import { attachClientIP } from './middleware/attachClientIP.middleware.js'

const app = express()
app.disable('x-powered-by')

// Middleware para IP
app.use(attachClientIP)

// Middlewares globales
app.use(express.json())
app.use(sanitizeInput)
app.use(helmet())
app.use(morgan('dev'))
app.use(cookieParser())

// CORS
const whitelist = ['http://localhost:3000', 'http://localhost:5173']
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}
app.use(cors(corsOptions))

// Swagger
setupSwagger(app)

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/manual-inventory', manualInventoryRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/clients', clientRoutes)

// Error handler Zod
app.use(zodErrorHandler)

export default app
