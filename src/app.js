import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoSanitize from 'mongo-sanitize'
import cors from 'cors'
import setupSwagger from './config/swagger.js'
import xssClean from 'xss-clean'

import authRoutes from './routes/auth.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import orderRoutes from './routes/order.routes.js'
import productRoutes from './routes/product.routes.js'
import supplierRoutes from './routes/supplier.routes.js'
import userRoutes from './routes/user.routes.js'

const app = express()

app.disable('x-powered-by')

app.use(morgan('dev'))
app.use(cookieParser())
app.use(helmet())
app.use(express.json())
app.use(xssClean())

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
  credential: true
}
app.use(cors(corsOptions))

app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize(req.body)
  if (req.params) req.params = mongoSanitize(req.params)
  // NO tocar req.query para evitar error
  next()
})

setupSwagger(app)

app.use('/api/auths', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/dashboard', dashboardRoutes)

export default app
