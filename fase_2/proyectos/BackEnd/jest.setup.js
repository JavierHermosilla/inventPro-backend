import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Sequelize } from 'sequelize'
import { initializeModels, models } from '../models/index.js' // Importa tu index.js central

let container
let sequelize

jest.setTimeout(30000)

beforeAll(async () => {
  // 1️⃣ Levantar contenedor PostgreSQL
  container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('inventpro_test')
    .withUsername('testuser')
    .withPassword('testpass')
    .start()

  // 2️⃣ Conectar Sequelize al contenedor
  sequelize = new Sequelize(container.getConnectionUri(), { logging: false })

  // 3️⃣ Inicializar modelos y relaciones
  initializeModels(sequelize)

  // 4️⃣ Sincronizar tablas
  await sequelize.sync({ force: true })
})

beforeEach(async () => {
  // Limpiar datos de todas las tablas antes de cada test
  await Promise.all(Object.values(models).map(model => model.destroy({ where: {} })))
})

afterAll(async () => {
  await sequelize.close()
  await container.stop()
})

export { sequelize, models }
