// src/db/db.js
import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

// Importar modelos
import User from '../models/user.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import OrderProduct from '../models/orderProduct.model.js'
import Category from '../models/category.model.js'
import Supplier from '../models/supplier.model.js'
import ManualInventory from '../models/manualInventory.model.js'
import Report from '../models/reports.model.js'

dotenv.config()

// Instancia de Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
      schema: (process.env.NODE_ENV === 'test' ? 'test' : 'inventpro_user')
    }
  }
)

// Agregar todos los modelos en un solo objeto
const models = {
  User,
  Product,
  Order,
  OrderProduct,
  Category,
  Supplier,
  ManualInventory,
  Report
}

// Inicializar modelos
Object.values(models).forEach(model => model.initialize(sequelize))

// Asociaciones
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models)
  }
}
)

// Helpers de DB
export const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true })
    console.log('✅ Database synchronized!')
  } catch (err) {
    console.error('❌ Failed to sync database:', err)
  }
}

export const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('>>> PostgreSQL connected successfully!')
  } catch (err) {
    console.error('Unable to connect to the database:', err)
    process.exit(1)
  }
}

export { sequelize, models }
export default sequelize
