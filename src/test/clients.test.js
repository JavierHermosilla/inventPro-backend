import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app.js'
import User from '../models/user.model.js'
import Client from '../models/client.model.js'
import { createAccessToken } from '../libs/jwt.js'
import { connect, clearDatabase, closeDatabase } from './setup.js'

describe('Clients API', () => {
  let adminToken
  let adminId

  const adminData = {
    username: 'adminuser',
    name: 'Admin User',
    email: 'admin@test.com', // email fijo
    password: 'Password123!',
    phone: '+56911111111',
    role: 'admin'
  }

  const clientData = {
    rut: '12345678-9',
    name: 'Cliente Test',
    address: 'Calle Falsa 123',
    phone: '+56912345678',
    email: 'cliente@test.com'
  }

  beforeAll(async () => {
    await connect()

    // Crear admin solo una vez por suite
    const existingAdmin = await User.findOne({ email: adminData.email })
    if (!existingAdmin) {
      const savedAdmin = await new User(adminData).save()
      adminId = savedAdmin._id.toString()
    } else {
      adminId = existingAdmin._id.toString()
    }
    adminToken = await createAccessToken({ id: adminId, role: 'admin' })
  })

  beforeEach(async () => {
    // Limpiar solo collections que no sean users
    const collections = mongoose.connection.collections
    for (const key in collections) {
      if (key !== 'users') await collections[key].deleteMany({})
    }
  })

  afterAll(async () => {
    await closeDatabase()
  })

  test('should create a client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(clientData)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('_id')
    expect(res.body.name).toBe(clientData.name)
  })

  test('should get all clients', async () => {
    await Client.create(clientData)

    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  test('should get a client by ID', async () => {
    const client = await Client.create(clientData)

    const res = await request(app)
      .get(`/api/clients/${client._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('_id', client._id.toString())
  })

  test('should update a client', async () => {
    const client = await Client.create(clientData)

    const res = await request(app)
      .put(`/api/clients/${client._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cliente Actualizado' })

    expect(res.statusCode).toBe(200)
    expect(res.body.name).toBe('Cliente Actualizado')
  })

  test('should delete a client', async () => {
    const client = await Client.create(clientData)

    const res = await request(app)
      .delete(`/api/clients/${client._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)

    const deletedClient = await Client.findById(client._id)
    expect(deletedClient).toBeNull()
  })
})
