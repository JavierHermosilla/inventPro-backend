import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app.js'
import User from '../models/user.model.js'
import Client from '../models/client.model.js'
import { createAccessToken } from '../libs/jwt.js'
import { setupTests, teardownTests, adminId, normalUserId } from './setup.js'

describe('Clients API - Full Coverage', () => {
  let adminToken, userToken
  let adminIdLocal, userIdLocal

  const adminData = {
    username: 'adminuser',
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Password123!',
    phone: '+56911111111',
    role: 'admin'
  }

  const userData = {
    username: 'normaluser',
    name: 'Normal User',
    email: 'user@test.com',
    password: 'Password123!',
    phone: '+56922222222',
    role: 'user'
  }

  const validClient = {
    rut: '12345678-9',
    name: 'Cliente Test',
    address: 'Calle Falsa 123',
    phone: '+56912345678',
    email: 'cliente@test.com'
  }

  const invalidClient = {
    rut: 'invalid-rut',
    name: '',
    address: '',
    phone: '123',
    email: 'not-an-email'
  }

  beforeAll(async () => {
    await setupTests()

    // Crear admin
    const existingAdmin = await User.findOne({ email: adminData.email })
    if (!existingAdmin) {
      const savedAdmin = await new User(adminData).save()
      adminIdLocal = savedAdmin._id.toString()
    } else adminIdLocal = existingAdmin._id.toString()
    adminToken = await createAccessToken({ id: adminIdLocal, role: 'admin' })

    // Crear user normal
    const existingUser = await User.findOne({ email: userData.email })
    if (!existingUser) {
      const savedUser = await new User(userData).save()
      userIdLocal = savedUser._id.toString()
    } else userIdLocal = existingUser._id.toString()
    userToken = await createAccessToken({ id: userIdLocal, role: 'user' })
  })

  beforeEach(async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
      if (key !== 'users') await collections[key].deleteMany({})
    }
  })

  afterAll(async () => {
    await teardownTests()
  })

  // ------------------ CREATE ------------------
  describe('POST /api/clients', () => {
    test('should create a valid client as admin', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validClient)

      expect(res.statusCode).toBe(201)
      expect(res.body).toMatchObject(validClient)
    })

    test('should fail without token', async () => {
      const res = await request(app).post('/api/clients').send(validClient)
      expect(res.statusCode).toBe(401)
    })

    test('should fail with role user', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validClient)
      expect(res.statusCode).toBe(403)
    })

    test('should fail with invalid data', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidClient)
      expect(res.statusCode).toBe(400)
    })

    test('should fail if rut duplicated', async () => {
      await Client.create(validClient)
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validClient)
      expect(res.statusCode).toBe(409)
    })
  })

  // ------------------ READ ALL ------------------
  describe('GET /api/clients', () => {
    test('should return all clients as admin', async () => {
      await Client.create(validClient)
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toMatchObject(validClient)
    })

    test('should fail without token', async () => {
      const res = await request(app).get('/api/clients')
      expect(res.statusCode).toBe(401)
    })

    test('should fail with role user', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
      expect(res.statusCode).toBe(403)
    })
  })

  // ------------------ READ ONE ------------------
  describe('GET /api/clients/:id', () => {
    test('should get client by id', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .get(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body._id).toBe(client._id.toString())
    })

    test('should return 404 if client not exists', async () => {
      const id = new mongoose.Types.ObjectId()
      const res = await request(app)
        .get(`/api/clients/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(404)
    })

    test('should return 400 if id invalid', async () => {
      const res = await request(app)
        .get('/api/clients/invalidid')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(400)
    })

    test('should fail without token', async () => {
      const client = await Client.create(validClient)
      const res = await request(app).get(`/api/clients/${client._id}`)
      expect(res.statusCode).toBe(401)
    })

    test('should fail with role user', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .get(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${userToken}`)
      expect(res.statusCode).toBe(403)
    })
  })

  // ------------------ UPDATE ------------------
  describe('PUT /api/clients/:id', () => {
    test('should update client as admin', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .put(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cliente Actualizado' })

      expect(res.statusCode).toBe(200)
      expect(res.body.name).toBe('Cliente Actualizado')
    })

    test('should fail with invalid data', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .put(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid-email' })

      expect(res.statusCode).toBe(400)
    })

    test('should return 404 if client not exists', async () => {
      const id = new mongoose.Types.ObjectId()
      const res = await request(app)
        .put(`/api/clients/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cliente' })
      expect(res.statusCode).toBe(404)
    })

    test('should return 400 if id invalid', async () => {
      const res = await request(app)
        .put('/api/clients/invalidid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cliente' })
      expect(res.statusCode).toBe(400)
    })

    test('should fail without token', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .put(`/api/clients/${client._id}`)
        .send({ name: 'Cliente' })
      expect(res.statusCode).toBe(401)
    })

    test('should fail with role user', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .put(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Cliente' })
      expect(res.statusCode).toBe(403)
    })
  })

  // ------------------ DELETE ------------------
  describe('DELETE /api/clients/:id', () => {
    test('should delete client as admin', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .delete(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      const deleted = await Client.findById(client._id)
      expect(deleted).toBeNull()
    })

    test('should return 404 if client not exists', async () => {
      const id = new mongoose.Types.ObjectId()
      const res = await request(app)
        .delete(`/api/clients/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(404)
    })

    test('should return 400 if id invalid', async () => {
      const res = await request(app)
        .delete('/api/clients/invalidid')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(400)
    })

    test('should fail without token', async () => {
      const client = await Client.create(validClient)
      const res = await request(app).delete(`/api/clients/${client._id}`)
      expect(res.statusCode).toBe(401)
    })

    test('should fail with role user', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .delete(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${userToken}`)
      expect(res.statusCode).toBe(403)
    })
  })
})
