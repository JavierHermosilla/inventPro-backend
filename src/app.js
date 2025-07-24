import express from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import productRoutes from './routes/product.routes.js'
import orderRoutes from './routes/order.routes.js'
import supplierRoutes from './routes/supplier.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'

const app = express()

app.disable('x-powered-by')

app.use(morgan('dev'))
app.use(cookieParser())
app.use(express.json())

app.use('/api/auths', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/dashboard', dashboardRoutes)

export default app
