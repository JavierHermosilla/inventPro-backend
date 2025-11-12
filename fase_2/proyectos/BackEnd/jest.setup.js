import { jest } from '@jest/globals'
import { PostgreSqlContainer } from '@testcontainers/postgresql'

let container
let containerStarted = false
let sequelize
let models

const applyEnvFromUri = (uri) => {
  const url = new URL(uri)
  process.env.DB_NAME = url.pathname.replace('/', '')
  process.env.DB_USER = decodeURIComponent(url.username)
  process.env.DB_PASSWORD = decodeURIComponent(url.password)
  process.env.DB_HOST = url.hostname
  process.env.DB_PORT = url.port
  process.env.DB_SCHEMA = process.env.DB_SCHEMA || 'inventpro_user'
}

const ensureSchema = async () => {
  const schema = process.env.DB_SCHEMA || 'inventpro_user'
  if (!schema || sequelize.getDialect() !== 'postgres') return
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
}

const ensureTestIndexes = async () => {
  if (sequelize.getDialect() !== 'postgres') return
  const schema = process.env.DB_SCHEMA || 'inventpro_user'
  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS clients_rut_active_idx
      ON "${schema}"."clients"(rut)
      WHERE deleted_at IS NULL
  `)
}

const seedAdmin = async () => {
  if (!models?.User) return
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@inventpro.cl'
  const adminUsername = process.env.TEST_ADMIN_USERNAME || 'admin'
  const exists = await models.User.findOne({ where: { email: adminEmail } })
  if (exists) return
  try {
    await models.User.create({
      username: adminUsername,
      name: process.env.TEST_ADMIN_NAME || 'Administrador',
      email: adminEmail,
      password: process.env.TEST_ADMIN_PASSWORD || 'Admin123!',
      role: 'admin'
    })
  } catch (err) {
    console.error('[jest] failed to seed admin', err)
    throw err
  }
}

jest.setTimeout(40000)

beforeAll(async () => {
  try {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('inventpro_test')
      .withUsername('testuser')
      .withPassword('testpass')
      .start()

    containerStarted = true
    applyEnvFromUri(container.getConnectionUri())
  } catch (err) {
    console.warn('[jest] No se pudo iniciar testcontainers, usando variables locales:', err.message)
  }

  const { sequelize: orm, models: modelsMap } = await import('./src/models/index.js')
  sequelize = orm
  models = modelsMap

  await ensureSchema()
  try {
    await sequelize.sync({ force: true })
  } catch (err) {
    console.error('[jest] sequelize.sync failed', err)
    throw err
  }
  await ensureTestIndexes()
  await seedAdmin()
  const tables = await sequelize.getQueryInterface().showAllTables()
  console.log('[jest] tables after sync', tables)
})

beforeEach(async () => {
  if (!models) return
  await Promise.all(
    Object.values(models).map(model =>
      model.destroy({
        where: {},
        truncate: true,
        cascade: true,
        force: true,
        restartIdentity: true
      })
    )
  )
  await seedAdmin()
})

afterAll(async () => {
  if (sequelize) await sequelize.close()
  if (container && containerStarted) {
    await container.stop()
  }
})

export { sequelize, models }
