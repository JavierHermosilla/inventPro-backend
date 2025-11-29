import { jest } from '@jest/globals'
import { PostgreSqlContainer } from '@testcontainers/postgresql'

jest.setTimeout(120000)

let container
let sequelize
let models
let initializeModels

const seedBaseData = async () => {
  const { User, Supplier, Category, Product } = models

  const supplier = await Supplier.create({
    name: 'Proveedor Test',
    rut: '12345678-9',
    email: 'proveedor@test.com'
  })

  const category = await Category.create({ name: 'Categoría prueba' })
  const category2 = await Category.create({ name: 'Electronics' })

  await User.create({
    username: 'adminInventpro',
    name: 'Admin Inventpro',
    email: 'admin@inventpro.cl',
    password: 'Admin123!',
    phone: '+56911111111',
    role: 'admin'
  })

  await User.create({
    username: 'adminExample',
    name: 'Admin Example',
    email: 'admin@example.com',
    password: 'admin1234',
    phone: '+56922222222',
    role: 'admin'
  })

  await User.create({
    username: 'adminTest',
    name: 'Admin Test',
    email: 'admin@test.com',
    password: 'Password123',
    phone: '+56933333333',
    role: 'admin'
  })

  await User.create({
    username: 'userTest',
    name: 'User Test',
    email: 'user@test.com',
    password: 'Password123',
    phone: '+56944444444',
    role: 'user'
  })

  await User.create({
    username: 'bodegueroTest',
    name: 'Bodeguero Test',
    email: 'bodeguero@test.com',
    password: 'Password123',
    phone: '+56955555555',
    role: 'bodeguero'
  })

  await Product.create({
    name: 'Producto A',
    description: 'Producto base A',
    price: 1000,
    stock: 10,
    supplierId: supplier.id,
    categoryId: category.id
  })

  await Product.create({
    name: 'Producto B',
    description: 'Producto base B',
    price: 500,
    stock: 5,
    supplierId: supplier.id,
    categoryId: category2.id
  })
}

// Inicializa el contenedor y la conexión ANTES de cargar los tests
const bootstrap = async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
  process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test-refresh'
  process.env.DB_SCHEMA = 'test'

  container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('inventpro_test')
    .withUsername('testuser')
    .withPassword('testpass')
    .start()

  process.env.DB_TEST_URL = container.getConnectionUri()

  const dbModule = await import('../db/db.js')
  const modelsModule = await import('../models/index.js')
  sequelize = dbModule.sequelize
  models = modelsModule.models
  initializeModels = modelsModule.initializeModels

  await initializeModels(sequelize, { schema: 'test', withAssociations: true })
  await sequelize.sync({ force: true })
  await seedBaseData()
}

await bootstrap()

beforeEach(async () => {
  await sequelize.sync({ force: true })
  await seedBaseData()
})

afterAll(async () => {
  await sequelize.close()
  if (container) await container.stop()
})

export { sequelize, models }
