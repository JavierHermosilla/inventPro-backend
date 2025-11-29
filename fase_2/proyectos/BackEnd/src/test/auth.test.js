import request from 'supertest'
import app from '../app.js'

import User from '../models/user.model.js'
import Client from '../models/client.model.js'
import { signAccessToken } from '../libs/jwt.js'

describe('Clients API - Cobertura completa', () => {
  let adminToken, userToken, bodegueroToken
  let adminUser, normalUser, bodegueroUser
  let clientId

  const adminData = {
    username: 'adminuser',
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Admin123!',
    phone: '+56912345678',
    role: 'admin'
  }

  const normalUserData = {
    username: 'normaluser',
    name: 'Normal User',
    email: 'user@test.com',
    password: 'User123!',
    phone: '+56987654321',
    role: 'user'
  }

  const bodegueroData = {
    username: 'bodeguerouser',
    name: 'Bodeguero User',
    email: 'bodeguero@test.com',
    password: 'Bode123!',
    phone: '+56911223344',
    role: 'bodeguero'
  }

  const clientData = {
    rut: '12345678-5',
    name: 'Cliente Test',
    address: 'Calle Falsa 123',
    phone: '+56912345678',
    email: 'cliente@test.com'
  }

  // -------------------------------
  // SETUP BASE
  // -------------------------------
  beforeEach(async () => {
    adminUser = await User.findOne({ where: { email: adminData.email } }) || await User.create(adminData)
    normalUser = await User.findOne({ where: { email: normalUserData.email } }) || await User.create(normalUserData)
    bodegueroUser = await User.findOne({ where: { email: bodegueroData.email } }) || await User.create(bodegueroData)

    adminToken = signAccessToken({ id: adminUser.id, role: adminUser.role })
    userToken = signAccessToken({ id: normalUser.id, role: normalUser.role })
    bodegueroToken = signAccessToken({ id: bodegueroUser.id, role: bodegueroUser.role })

    await Client.destroy({ where: {} })
  })

  // -------------------------------
  // CREACIÓN DE CLIENTES
  // -------------------------------
  describe('POST /api/clients', () => {
    it('admin puede crear cliente', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)

      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty('id')
      clientId = res.body.id
    })

    it('falla si rut duplicado', async () => {
      await Client.create(clientData)
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)

      expect(res.statusCode).toBe(409)
      expect(res.body).toHaveProperty('message', 'Cliente con este RUT ya existe')
    })

    it('user normal no puede crear cliente', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send(clientData)

      expect(res.statusCode).toBe(403)
    })

    it('falla sin token', async () => {
      const res = await request(app).post('/api/clients').send(clientData)
      expect(res.statusCode).toBe(401)
    })

    it('falla con datos inválidos', async () => {
      const invalidClient = { ...clientData, email: 'invalid', phone: '123', rut: '' }
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidClient)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty('errors')
    })
  })

  // -------------------------------
  // OBTENER CLIENTES
  // -------------------------------
  describe('GET /api/clients', () => {
    it('admin puede listar clientes', async () => {
      await Client.create(clientData)
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('falla sin token', async () => {
      const res = await request(app).get('/api/clients')
      expect(res.statusCode).toBe(401)
    })

    it('user normal no puede listar', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
      expect(res.statusCode).toBe(403)
    })
  })

  // -------------------------------
  // OBTENER CLIENTE POR ID
  // -------------------------------
  describe('GET /api/clients/:id', () => {
    it('admin obtiene cliente válido', async () => {
      const client = await Client.create(clientData)
      const res = await request(app)
        .get(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('id', client.id)
    })

    it('falla con ID inexistente', async () => {
      const fakeId = 999999
      const res = await request(app)
        .get(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(400)
    })
  })

  // -------------------------------
  // ACTUALIZAR CLIENTE
  // -------------------------------
  describe('PUT /api/clients/:id', () => {
    it('admin puede actualizar', async () => {
      const client = await Client.create(clientData)
      const res = await request(app)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cliente Actualizado' })
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('name', 'Cliente Actualizado')
    })
  })

  // -------------------------------
  // ELIMINAR CLIENTE
  // -------------------------------
  describe('DELETE /api/clients/:id', () => {
    it('admin puede eliminar', async () => {
      const client = await Client.create(clientData)
      const res = await request(app)
        .delete(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.message).toMatch(/eliminado/i)
    })
  })
})
