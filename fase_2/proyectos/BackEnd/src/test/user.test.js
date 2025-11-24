// src/test/user.test.js
import request from 'supertest'
import app from '../app.js'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Sequelize } from 'sequelize'
import { initializeModels, models } from '../models/index.js' // importamos todo desde index.js

jest.setTimeout(30000)

let container
let sequelize

beforeAll(async () => {
  // 1️⃣ Crear contenedor PostgreSQL aislado para tests
  container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('inventpro_test')
    .withUsername('testuser')
    .withPassword('testpass')
    .start()

  // 2️⃣ Conectar Sequelize al contenedor
  sequelize = new Sequelize(container.getConnectionUri(), { logging: false })

  // 3️⃣ Inicializar todos los modelos y relaciones
  initializeModels(sequelize)

  // 4️⃣ Sincronizar tablas
  await sequelize.sync({ force: true })
  console.log('>>> Test DB connected and synced!')
})

beforeEach(async () => {
  // Limpiar datos de todas las tablas antes de cada test
  await Promise.all(
    Object.values(models).map(model => model.destroy({ where: {}, force: true }))
  )
})

afterAll(async () => {
  await sequelize.close()
  await container.stop()
})

describe('User API', () => {
  test('should create a new user as admin', async () => {
    const admin = await models.User.create({
      username: 'adminuser',
      name: 'Admin',
      email: 'admin@test.com',
      password: '123456A@a',
      role: 'admin'
    })

    const tokenRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: '123456A@a'
    })
    const token = tokenRes.body.token

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'javier',
        name: 'Javier Hermosilla',
        email: 'javier@test.com',
        password: '123456A@a',
        role: 'admin'
      })

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('user')
    expect(res.body.user.email).toBe('javier@test.com')
  })

  test('should fetch all users as admin', async () => {
    await models.User.create({
      username: 'testuser',
      name: 'Test User',
      email: 'test@test.com',
      password: '123456A@a',
      role: 'user'
    })

    const admin = await models.User.create({
      username: 'adminuser',
      name: 'Admin',
      email: 'admin@test.com',
      password: '123456A@a',
      role: 'admin'
    })

    const tokenRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: '123456A@a'
    })
    const token = tokenRes.body.token

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.users.length).toBe(2)
    expect(res.body.users.some(u => u.email === 'test@test.com')).toBe(true)
  })

  test('should NOT create a user without token', async () => {
    const res = await request(app).post('/api/users').send({
      username: 'noauth',
      name: 'No Auth',
      email: 'noauth@test.com',
      password: '123456A@a',
      role: 'user'
    })

    expect(res.statusCode).toBe(401)
    expect(res.body).toHaveProperty('message')
  })
})
