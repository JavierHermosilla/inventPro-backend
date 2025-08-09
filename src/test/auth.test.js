import request from 'supertest'
import app from '../app.js'
import { clearDatabase, closeDatabase, connect } from './setup.js'

/** @jest-environment node */
describe('Auth API', () => {
  const userData = {
    username: 'testuser',
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'test1234',
    phone: '+56912345678'
  }

  jest.setTimeout(20000)

  beforeAll(async () => {
    await connect()

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'test1234',
        phone: '+56912345678'
      })
    console.log('Register user beforeAll status:', res.statusCode)
    console.log('Register user beforeAll body:', res.body)
  })

  afterAll(async () => {
    await clearDatabase()
    await closeDatabase()
  })

  it('should register a new user', async () => {
    const newUser = { ...userData, email: 'newuser@example.com', username: 'newuser' }
    const res = await request(app)
      .post('/api/auth/register')
      .send(newUser)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('username', newUser.username)
  })

  it('should login teh user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('token')
  })
})
