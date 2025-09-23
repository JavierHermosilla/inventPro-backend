// src/db/db.js
import { Sequelize } from 'sequelize'

// Modelos
import User from '../models/user.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import OrderProduct from '../models/orderProduct.model.js'
import Category from '../models/category.model.js'
import Supplier from '../models/supplier.model.js'
import ManualInventory from '../models/manualInventory.model.js'
import Report from '../models/reports.model.js'
import Client from '../models/client.model.js'

const DB_SCHEMA =
  process.env.NODE_ENV === 'test'
    ? 'test'
    : (process.env.DB_SCHEMA || 'inventpro_user')

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    timezone: 'America/Santiago', // timestamps coherentes con CL
    define: {
      schema: DB_SCHEMA,
      underscored: true, // => created_at / updated_at / deleted_at
      paranoid: true, // soft delete por defecto
      freezeTableName: true // respeta tableName exacto
      // IMPORTANTE: no sobrescribimos createdAt/updatedAt/deletedAt aquí
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
)

// Registrar modelos
const models = {
  User,
  Product,
  Order,
  OrderProduct,
  Category,
  Supplier,
  ManualInventory,
  Report,
  Client
}

// Inicializar modelos (cada uno llama super.init)
Object.values(models).forEach(model => model.initialize(sequelize))

// Asociaciones
import('../models/associations.js')
  .then(() => console.log('Associations loaded'))
  .catch(err => console.error('Failed to load associations:', err))

// Helpers
export const syncDB = async () => {
  try {
    // En dev sin alter para evitar choques; usa migraciones para cambios
    await sequelize.sync()
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
