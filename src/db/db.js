// 📦 src/db/db.js
import path from 'node:path'
import dotenv from 'dotenv'
import { Sequelize } from 'sequelize'

// ------- Modelos -------
import User from '../models/user.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import OrderProduct from '../models/orderProduct.model.js'
import Category from '../models/category.model.js'
import Supplier from '../models/supplier.model.js'
import ManualInventory from '../models/manualInventory.model.js'
import Report from '../models/reports.model.js'
import Client from '../models/client.model.js'

// ------- Carga robusta de .env (independiente del cwd) -------
const candidateEnvPaths = [
  // 1) src/.env
  path.resolve(process.cwd(), 'src/.env'),
  // 2) repo/.env
  path.resolve(process.cwd(), '.env'),
  // 3) Respeta DOTENV_CONFIG_PATH si lo defines en scripts
  process.env.DOTENV_CONFIG_PATH
].filter(Boolean)

let loadedFrom = null
for (const p of candidateEnvPaths) {
  const res = dotenv.config({ path: p, override: false })
  if (!res.error && res.parsed && Object.keys(res.parsed).length > 0) {
    loadedFrom = p
    break
  }
}
if (!loadedFrom) {
  // No reventamos aún: puede que vengan del entorno del sistema/CI.
  // Dejamos que la validación más abajo avise si falta algo clave.
  console.warn('[env] No .env file loaded via fallback paths. Using process.env as-is.')
} else {
  console.log(`[env] loaded from: ${loadedFrom}`)
}

// ------- Esquema según ambiente -------
const DB_SCHEMA = process.env.DB_SCHEMA || 'inventpro_user'

// ------- Validación de variables de entorno críticas -------
const REQUIRED = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT']
const missing = REQUIRED.filter(k => !process.env[k] || String(process.env[k]).length === 0)
if (missing.length) {
  // Mensaje claro y único para que no te quedes atrapado
  throw new Error(`Missing required env vars: ${missing.join(', ')}. ` +
                  'Asegúrate de tener BackEnd/.env con esas claves.')
}

// ------- Casteos seguros -------
const DB_NAME = String(process.env.DB_NAME)
const DB_USER = String(process.env.DB_USER)
const DB_PASSWORD = String(process.env.DB_PASSWORD)
const DB_HOST = String(process.env.DB_HOST || '127.0.0.1')
const DB_PORT = Number(process.env.DB_PORT || 5432)

// ⚠ Nota: timezone aquí afecta serialización; para TZ de sesión usa PGTZ a nivel de conexión.
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false,
  timezone: 'America/Santiago',
  define: {
    schema: DB_SCHEMA,
    underscored: true, // created_at / updated_at / deleted_at
    paranoid: true, // soft delete
    freezeTableName: true // respeta tableName exacto
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
})

// ------- Registrar e inicializar modelos -------
export const models = {
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

Object.values(models).forEach(model => model.initialize(sequelize))

// ------- Asociaciones -------
import('../models/associations.js')
  .then(() => console.log('Associations loaded'))
  .catch(err => console.error('Failed to load associations:', err))

// ------- Helpers -------
export const syncDB = async () => {
  try {
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

export default sequelize
