import request from 'supertest'
import app from '../app.js'
import sequeliz, { connectDB } from '../config/db.js'

import User from '../models/user.model.js'
import Client from '../models/client.model.js'
import { createAccessToken } from '../libs/jwt.js'

describe('Clients API - Full Coverage', () => {
  let adminToken, userToken
  let adminUser, normalUser
  let clientId

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
    await connectDB()

    // Limpiamos usuarios y clientes
    await User.destroy({ where: {} })
    await Client.destroy({ where: {} })

    adminUser = await User.create(adminData)
    normalUser = await User.create(userData)

    adminToken = createAccessToken({ id: adminUser.id, role: 'admin' })
    userToken = createAccessToken({ id: normalUser.id, role: 'user' })
  })

  beforeEach(async () => {
    await Client.destroy({ where: {} })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  // ------------------ CREATE ------------------
  describe('POST /api/clients', () => {
    test('admin puede crear cliente', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validClient)

      expect(res.statusCode).toBe(201)
      expect(res.body).toMatchObject(validClient)
      clientId = res.body.id
    })

    test('falla sin token', async () => {
      const res = await request(app).post('/api/clients').send(validClient)
      expect(res.statusCode).toBe(401)
    })

    test('falla con rol user', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validClient)
      expect(res.statusCode).toBe(403)
    })

    test('falla con datos inválidos', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidClient)
      expect(res.statusCode).toBe(400)
    })

    test('falla si RUT duplicado', async () => {
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
    test('admin obtiene todos los clientes', async () => {
      await Client.create(validClient)
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toMatchObject(validClient)
    })

    test('falla sin token', async () => {
      const res = await request(app).get('/api/clients')
      expect(res.statusCode).toBe(401)
    })

    test('falla con rol user', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
      expect(res.statusCode).toBe(403)
    })
  })

  // ------------------ READ ONE ------------------
  describe('GET /api/clients/:id', () => {
    test('admin obtiene cliente por id', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .get(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.id).toBe(client.id)
    })

    test('falla si cliente no existe', async () => {
      const res = await request(app)
        .get('/api/clients/999999')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(404)
    })

    test('falla si id inválido', async () => {
      const res = await request(app)
        .get('/api/clients/abc')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(400)
    })
  })

  // ------------------ UPDATE ------------------
  describe('PUT /api/clients/:id', () => {
    test('admin puede actualizar', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cliente Actualizado' })

      expect(res.statusCode).toBe(200)
      expect(res.body.name).toBe('Cliente Actualizado')
    })

    test('falla con datos inválidos', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid-email' })

      expect(res.statusCode).toBe(400)
    })

    test('falla si cliente no existe', async () => {
      const res = await request(app)
        .put('/api/clients/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cliente' })
      expect(res.statusCode).toBe(404)
    })

    test('falla sin token', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .put(`/api/clients/${client.id}`)
        .send({ name: 'Cliente' })
      expect(res.statusCode).toBe(401)
    })

    test('falla con rol user', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Cliente' })
      expect(res.statusCode).toBe(403)
    })
  })

  // ------------------ DELETE ------------------
  describe('DELETE /api/clients/:id', () => {
    test('admin puede eliminar', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .delete(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      const deleted = await Client.findByPk(client.id)
      expect(deleted).toBeNull()
    })

    test('falla si cliente no existe', async () => {
      const res = await request(app)
        .delete('/api/clients/999999')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(404)
    })

    test('falla sin token', async () => {
      const client = await Client.create(validClient)
      const res = await request(app).delete(`/api/clients/${client.id}`)
      expect(res.statusCode).toBe(401)
    })

    test('falla con rol user', async () => {
      const client = await Client.create(validClient)
      const res = await request(app)
        .delete(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${userToken}`)
      expect(res.statusCode).toBe(403)
    })
  })
})
