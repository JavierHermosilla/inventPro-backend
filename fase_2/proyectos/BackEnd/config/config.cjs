// config/config.cjs
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../src/.env') })

const toInt = (v, def) => Number.isFinite(Number(v)) ? Number(v) : def
const toStr = (v, def = '') => (v ?? def).toString()

const DB_SCHEMA = toStr(process.env.DB_SCHEMA || 'inventpro_user')

module.exports = {
  development: {
    username: toStr(process.env.DB_USER),
    password: toStr(process.env.DB_PASSWORD),
    database: toStr(process.env.DB_NAME),
    host: toStr(process.env.DB_HOST || '127.0.0.1'),
    port: toInt(process.env.DB_PORT, 5432),
    dialect: 'postgres',
    logging: console.log,

    // 🔒 fuerza el esquema por defecto
    searchPath: DB_SCHEMA,
    define: {
      schema: DB_SCHEMA,
      underscored: true,
      freezeTableName: true
    },

    // 🗃 guarda SequelizeMeta / SequelizeData en tu schema (no en public)
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
    migrationStorageTableSchema: DB_SCHEMA,
    seederStorage: 'sequelize',
    seederStorageTableName: 'SequelizeData',
    seederStorageTableSchema: DB_SCHEMA,

    // ⏱ opcional
    timezone: 'America/Santiago'
  },

  test: {
    username: toStr(process.env.DB_USER),
    password: toStr(process.env.DB_PASSWORD),
    database: toStr(process.env.DB_NAME),
    host: toStr(process.env.DB_HOST || '127.0.0.1'),
    port: toInt(process.env.DB_PORT, 5432),
    dialect: 'postgres',
    logging: false,

    searchPath: DB_SCHEMA,
    define: {
      schema: DB_SCHEMA,
      underscored: true,
      freezeTableName: true
    },
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
    migrationStorageTableSchema: DB_SCHEMA,
    seederStorage: 'sequelize',
    seederStorageTableName: 'SequelizeData',
    seederStorageTableSchema: DB_SCHEMA
  },

  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres'
    // Si usas un proveedor gestionado con SSL:
    // dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    // searchPath: DB_SCHEMA,
    // define: { schema: DB_SCHEMA, underscored: true, freezeTableName: true }
  }
}
