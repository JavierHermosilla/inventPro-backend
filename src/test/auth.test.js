import request from 'supertest'
import app from '../app.js'
import mongoose from 'mongoose'
import Client from '../models/client.model.js'
import User from '../models/user.model.js'
import { createAccessToken } from '../libs/jwt.js'

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
    rut: '12345678-9',
    name: 'Cliente Test',
    address: 'Calle Falsa 123',
    phone: '+56912345678',
    email: 'cliente@test.com'
  }

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    }

    await User.deleteMany()
    await Client.deleteMany()

    adminUser = await new User(adminData).save()
    normalUser = await new User(normalUserData).save()
    bodegueroUser = await new User(bodegueroData).save()

    adminToken = await createAccessToken({ id: adminUser._id.toString() })
    userToken = await createAccessToken({ id: normalUser._id.toString() })
    bodegueroToken = await createAccessToken({ id: bodegueroUser._id.toString() })
  })

  beforeEach(async () => {
    await Client.deleteMany()
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  // ---------------------------------------
  // CREAR CLIENTE
  // ---------------------------------------
  test('POST /api/clients → admin puede crear cliente', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(clientData)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('_id')
    clientId = res.body._id
  })

  test('POST /api/clients → falla si rut duplicado', async () => {
    await new Client(clientData).save()
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(clientData)

    expect(res.statusCode).toBe(409)
    expect(res.body).toHaveProperty('message', 'Cliente con este RUT ya existe')
  })

  test('POST /api/clients → user normal no puede crear cliente', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${userToken}`)
      .send(clientData)

    expect(res.statusCode).toBe(403)
  })

  test('POST /api/clients → falla sin token', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send(clientData)

    expect(res.statusCode).toBe(401)
  })

  test('POST /api/clients → falla con datos inválidos', async () => {
    const invalidClient = { ...clientData, email: 'invalid', phone: '123', rut: '' }
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidClient)

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('errors')
  })

  // ---------------------------------------
  // OBTENER CLIENTES
  // ---------------------------------------
  test('GET /api/clients → debe listar todos los clientes', async () => {
    await new Client(clientData).save()
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  test('GET /api/clients → falla sin token', async () => {
    const res = await request(app).get('/api/clients')
    expect(res.statusCode).toBe(401)
  })

  test('GET /api/clients/:id → obtiene cliente válido', async () => {
    const client = await new Client(clientData).save()
    const res = await request(app)
      .get(`/api/clients/${client._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('_id', client._id.toString())
  })

  test('GET /api/clients/:id → falla con ID inválido', async () => {
    const res = await request(app)
      .get('/api/clients/123')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(400)
  })

  test('GET /api/clients/:id → falla con ID inexistente', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .get(`/api/clients/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('message', 'Cliente no encontrado')
  })

  // ---------------------------------------
  // ACTUALIZAR CLIENTE
  // ---------------------------------------
  test('PUT /api/clients/:id → admin puede actualizar', async () => {
    const client = await new Client(clientData).save()
    const res = await request(app)
      .put(`/api/clients/${client._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cliente Actualizado' })

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('name', 'Cliente Actualizado')
  })

  test('PUT /api/clients/:id → user normal no puede actualizar', async () => {
    const client = await new Client(clientData).save()
    const res = await request(app)
      .put(`/api/clients/${client._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Cliente Actualizado' })

    expect(res.statusCode).toBe(403)
  })

  test('PUT /api/clients/:id → falla con ID inválido', async () => {
    const res = await request(app)
      .put('/api/clients/123')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cliente Actualizado' })

    expect(res.statusCode).toBe(400)
  })

  test('PUT /api/clients/:id → falla con ID inexistente', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .put(`/api/clients/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cliente Actualizado' })

    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('message', 'Cliente no encontrado')
  })

  // ---------------------------------------
  // ELIMINAR CLIENTE
  // ---------------------------------------
  test('DELETE /api/clients/:id → admin puede eliminar', async () => {
    const client = await new Client(clientData).save()
    const res = await request(app)
      .delete(`/api/clients/${client._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
  })

  test('DELETE /api/clients/:id → user normal no puede eliminar', async () => {
    const client = await new Client(clientData).save()
    const res = await request(app)
      .delete(`/api/clients/${client._id}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.statusCode).toBe(403)
  })

  test('DELETE /api/clients/:id → falla con ID inválido', async () => {
    const res = await request(app)
      .delete('/api/clients/123')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(400)
  })

  test('DELETE /api/clients/:id → falla con ID inexistente', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .delete(`/api/clients/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('message', 'cliente no encontrado')
  })

  // ---------------------------------------
  // JWT MALFORMADO / EXPIRADO
  // ---------------------------------------
  test('POST /api/clients → falla con token inválido', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', 'Bearer xyz.invalid.token')
      .send(clientData)

    expect(res.statusCode).toBe(401)
  })
})
