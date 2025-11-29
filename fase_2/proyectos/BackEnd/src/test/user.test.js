// src/test/user.test.js
import request from 'supertest'
import app from '../app.js'
import { models } from '../models/index.js'

describe('User API', () => {
  let adminToken

  beforeEach(async () => {
    const tokenRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'Password123'
    })
    adminToken = tokenRes.body.token
  })

  test('should create a new user as admin', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'javier',
        name: 'Javier Hermosilla',
        email: 'javier@test.com',
        password: 'Password123!',
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
      password: 'Password123!',
      role: 'user'
    })

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.users.length).toBeGreaterThanOrEqual(2)
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
