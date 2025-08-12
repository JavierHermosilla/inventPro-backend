import request from 'supertest'
import app from '../app.js'
import mongoose from 'mongoose'
import User from '../models/user.model.js'
import { createAccessToken } from '../libs/jwt.js'

describe('Auth API', () => {
  const userData = {
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123',
    phone: '+56912345678'
  }

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    }
  })

  beforeEach(async () => {
    await User.deleteMany()
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  test('should register user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(userData)
    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('_id')
    expect(res.body.email).toBe(userData.email)
  })

  test('should NOT register user with existing email', async () => {
    await request(app).post('/api/auth/register').send(userData)
    const res = await request(app).post('/api/auth/register').send(userData)
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('errors')
    expect(res.body.errors[0]).toHaveProperty('path', 'email')
  })

  test('should login successfully with valid credentials', async () => {
    // Aquí no hash de password para que el login funcione con middleware real
    const user = new User(userData)
    await user.save()

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password })

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.email).toBe(userData.email)
  })

  test('should NOT login with wrong password', async () => {
    const user = new User(userData)
    await user.save()

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: 'wrongpassword' })

    expect(res.statusCode).toBe(401)
  })

  test('should access protected profile route with valid token', async () => {
    const user = new User(userData)
    const savedUser = await user.save()

    const token = await createAccessToken({ id: savedUser._id.toString() })

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('email', userData.email)
    expect(res.body).not.toHaveProperty('password') // password no debe enviarse
  })

  test('should NOT access profile route without token', async () => {
    const res = await request(app).get('/api/auth/profile')
    expect(res.statusCode).toBe(401)
  })
})
