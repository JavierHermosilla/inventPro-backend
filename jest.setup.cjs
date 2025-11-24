// jest.setup.cjs - CJS wrapper para importar el setup ESM

const path = require('path')
const fs = require('fs')

// Normaliza rutas temporales para testcontainers en Windows/WSL
if (!process.env.TESTCONTAINERS_TMP_DIR) {
  process.env.TESTCONTAINERS_TMP_DIR = path.join(process.cwd(), 'tmp', 'testcontainers')
}
if (!process.env.TESTCONTAINERS_HOST_TMP_DIR) {
  process.env.TESTCONTAINERS_HOST_TMP_DIR = process.env.TESTCONTAINERS_TMP_DIR
}
fs.mkdirSync(process.env.TESTCONTAINERS_TMP_DIR, { recursive: true })
// Opcional: deshabilita Ryuk en entornos con restricciones
if (!process.env.TESTCONTAINERS_RYUK_DISABLED) {
  process.env.TESTCONTAINERS_RYUK_DISABLED = 'true'
}

// 📦 Usa Postgres local en vez de Testcontainers por defecto (ajustable)
process.env.USE_TESTCONTAINERS = process.env.USE_TESTCONTAINERS || 'false'
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1'
process.env.DB_PORT = process.env.DB_PORT || '5433'
process.env.DB_NAME = process.env.DB_NAME || 'inventpro_test'
process.env.DB_USER = process.env.DB_USER || 'postgres'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres'
process.env.DB_SCHEMA = process.env.DB_SCHEMA || 'inventpro_user'
process.env.ALLOW_NEGATIVE_STOCK = process.env.ALLOW_NEGATIVE_STOCK || 'false'

let setupTests
let teardownTests
let clearDatabase

beforeAll(async () => {
  if (!setupTests) {
    ({ setupTests, teardownTests, clearDatabase } = await import('./src/test/setup.js'))
  }
  await setupTests()
})

afterAll(async () => {
  if (teardownTests) await teardownTests()
})

afterEach(async () => {
  if (clearDatabase) await clearDatabase()
})
