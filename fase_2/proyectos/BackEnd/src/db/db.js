// 📦 src/db/db.js
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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
import applyAssociations from '../models/associations.js'

const IS_TEST = process.env.NODE_ENV === 'test'
const TEST_DATABASE_URL = process.env.DB_TEST_URL || process.env.TEST_DATABASE_URL

// ------- Carga robusta de .env (independiente del cwd) -------
let sequelize = null
let models = {}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!IS_TEST) {
  const candidateEnvPaths = [
    // 1) BackEnd/.env  (estando en src/db/db.js)
    path.resolve(__dirname, '../.env'),
    // 2) fase_2/.env
    path.resolve(__dirname, '../../.env'),
    // 3) cwd/.env (por si corres desde otra ruta)
    path.resolve(process.cwd(), '.env'),
    // 4) Respeta DOTENV_CONFIG_PATH si lo defines en scripts
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
    console.warn('[env] No .env file loaded via fallback paths. Using process.env as-is.')
  } else {
    console.log(`[env] loaded from: ${loadedFrom}`)
  }
}

// ------- Esquema según ambiente -------
// Alineado con migrations/config: por defecto usamos "inventpro_user" (no "public")
const DB_SCHEMA = IS_TEST ? undefined : (process.env.DB_SCHEMA || 'inventpro_user')

if (IS_TEST && TEST_DATABASE_URL) {
  sequelize = new Sequelize(TEST_DATABASE_URL, {
    logging: false,
    dialect: 'postgres',
    define: {
      underscored: true,
      paranoid: true,
      freezeTableName: true
    }
  })
} else {
  // ------- Validación de variables de entorno críticas -------
  const REQUIRED = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT']
  const missing = REQUIRED.filter(k => !process.env[k] || String(process.env[k]).length === 0)
  if (missing.length) {
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
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
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
      idle: 10000,
      async afterCreate (connection) {
        if (DB_SCHEMA) {
          // Fuerza el search_path en cada conexión del pool
          await connection.query(`SET search_path TO "${DB_SCHEMA}", public;`)
        }
      }
    }
  })
}

// ------- Registrar e inicializar modelos -------
const modelRegistry = {
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

export const initializeModels = async (sequelizeInstance, options = {}) => {
  const { schema = DB_SCHEMA, withAssociations = true } = options
  const targetSchema = schema || DB_SCHEMA

  Object.values(modelRegistry).forEach(model => {
    model.initialize(sequelizeInstance)
    if (targetSchema) model.schema(targetSchema)
  })

  if (withAssociations) {
    applyAssociations(modelRegistry, targetSchema)
  }

  if (IS_TEST) {
    sequelize = sequelizeInstance
  }
  models = modelRegistry
  return modelRegistry
}

if (sequelize) {
  await initializeModels(sequelize)
}

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
  if (!sequelize) return
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
