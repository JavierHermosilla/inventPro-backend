// src/test/setup.js
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { Sequelize as SequelizePkg } from 'sequelize'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import pg from 'pg'

let container
let sequelize

// Util para forzar strings numéricas en env
const setEnv = (key, value) => {
  if (value !== undefined && value !== null) {
    process.env[key] = String(value)
  }
}

// Arranca PostgreSQL efímero y prepara Sequelize
export const setupTests = async () => {
  if (sequelize) return

  const useTc = String(process.env.USE_TESTCONTAINERS || 'false').toLowerCase() === 'true'
  const targetSchema = process.env.DB_SCHEMA || 'inventpro_user'

  try {
    if (useTc) {
      container = await new PostgreSqlContainer('postgres:16-alpine').start()
      setEnv('DB_NAME', container.getDatabase())
      setEnv('DB_USER', container.getUsername())
      setEnv('DB_PASSWORD', container.getPassword())
      setEnv('DB_HOST', container.getHost())
      setEnv('DB_PORT', container.getMappedPort(5432))
    }

    // Env obligatorios antes de importar sequelize/db
    setEnv('NODE_ENV', 'test')
    setEnv('DB_SCHEMA', process.env.DB_SCHEMA || 'inventpro_user')
    setEnv('JWT_SECRET', process.env.JWT_SECRET || 'test-secret')
    setEnv('REFRESH_TOKEN_SECRET', process.env.REFRESH_TOKEN_SECRET || 'test-refresh')
    // Para manualInventory en pruebas preferimos bloquear stock negativo
    setEnv('ALLOW_NEGATIVE_STOCK', process.env.ALLOW_NEGATIVE_STOCK || 'false')

    // Espera a que la BD esté arriba (Docker puede tardar)
    await waitForPostgres({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    // Carga la instancia de Sequelize con las env ya seteadas
    const db = await import('../db/db.js')
    // Asegura asociaciones cargadas antes del sync
    await import('../models/associations.js')

    sequelize = db.sequelize

    // Crea schema si no existe y aplica migraciones reales
    // Arranca siempre con schema limpio
    await sequelize.query(`DROP SCHEMA IF EXISTS "${targetSchema}" CASCADE`)
    await sequelize.createSchema(targetSchema, { logging: false, ifNotExists: true }).catch(() => {})
    await runMigrations()
  } catch (err) {
    console.error('❌ No se pudo preparar el entorno de pruebas:', err)
    throw err
  }
}

// Limpia todas las tablas entre tests
export const clearDatabase = async () => {
  if (!sequelize) return
  const schema = process.env.DB_SCHEMA || 'inventpro_user'
  const tables = sequelize.modelManager.models
    .map(m => `"${m.options.schema || schema}"."${m.tableName}"`)
    .filter(Boolean)

  if (!tables.length) return

  try {
    await sequelize.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`)
  } catch (err) {
    console.error('❌ Error truncating tables:', err.message)
    throw err
  }
}

// Cierra conexiones y detiene contenedor
export const teardownTests = async () => {
  if (sequelize) {
    await sequelize.close().catch(() => {})
  }
  if (container) {
    await container.stop().catch(() => {})
    container = null
  }
}

// Ejecuta migraciones CJS usando la QueryInterface actual
async function runMigrations () {
  const migrationsDir = path.resolve(process.cwd(), 'migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.cjs')).sort()

  const qi = sequelize.getQueryInterface()
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(migrationsDir, file)).href)
    const migration = mod.default || mod
    if (typeof migration?.up === 'function') {
      await migration.up(qi, SequelizePkg)
    }
  }
}

async function waitForPostgres (cfg, retries = 20, delayMs = 1000) {
  const client = new pg.Client(cfg)
  for (let i = 0; i < retries; i++) {
    try {
      await client.connect()
      await client.end()
      return
    } catch (err) {
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw new Error(`Postgres no disponible en ${cfg.host}:${cfg.port}`)
}
