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

  let token = ''

  jest.setTimeout(20000)

  beforeAll(async () => {
    await connect()

    await request(app).post('/api/auth/register').send(userData)

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password })

    token = loginRes.body.token
  })

  afterAll(async () => {
    await clearDatabase()
    await closeDatabase()
  })

  it('should register a new user', async () => {
    const newUser = { ...userData, email: 'newuser@example.com', username: 'newuser' }
    const res = await request(app).post('/api/auth/register').send(newUser)
    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('username', newUser.username)
  })

  it('should NOT register user with existing email', async () => {
    const res = await request(app).post('/api/auth/register').send(userData)
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('errors')
  })

  it('should NOT register with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...userData, email: 'newemail@example.com', password: '123' })
    expect(res.statusCode).toBe(400)
    expect(res.body.errors[0].message).toMatch(/contraseña/i)
  })

  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password })
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('should NOT login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: 'WrongPassword!' })
    expect(res.statusCode).toBe(401)
    expect(res.body).toHaveProperty('message')
  })

  it('should access protected profile route with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('email', userData.email)
  })

  it('should NOT access profile without token', async () => {
    const res = await request(app).get('/api/auth/profile')
    expect(res.statusCode).toBe(401)
  })

  it('should logout successfully', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message')
  })
})
