// src/test/suppliers.test.js
import request from 'supertest'
import app from '../app.js'
import sequelize, { connectDB } from '../config/db.js'

import User from '../models/user.model.js'
import { createAccessToken } from '../libs/jwt.js'

/** @jest-environment node */

describe('Suppliers API', () => {
  let adminToken, userToken

  beforeAll(async () => {
    await User.deleteMany({})
    beforeAll(async () => {
    await connectDB()

    // Crear admin
    let admin = await User.findOne({ where: { email: 'admin@test.com' } })
    if (!admin) {
      admin = await User.create({
        username: 'adminTest',
        name: 'Admin Test',
        email: 'admin@test.com',
        password: 'Password123',
        phone: '+56912345678',
        role: 'admin'
      })
    }

    // Crear usuario normal
    let normalUser = await User.findOne({ where: { email: 'user@test.com' } })
    if (!normalUser) {
      normalUser = await User.create({
        username: 'userTest',
        name: 'User Test',
        email: 'user@test.com',
        password: 'Password123',
        phone: '+56987654321',
        role: 'user'
      })
    }

     // Login para obtener tokens
    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Password123' })
    adminToken = loginAdmin.body.token

    const loginUser = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'Password123' })
    userToken = loginUser.body.token
  })

  beforeEach(async () => {
    // Limpiar tabla suppliers antes de cada test
    await Supplier.destroy({ where: {} })
  })

  const createSupplier = async (data, token = adminToken) => {
    const res = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send(data)
    return res.body.supplier?.id
  }
// ---------- POST ----------
  it('Admin puede crear supplier válido', async () => {
    const res = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Proveedor 1', rut: '20362511-1', email: 'proveedor1@test.com' })
    expect(res.statusCode).toBe(201)
    expect(res.body.supplier).toHaveProperty('id')
  })

  it('Usuario normal no puede crear supplier', async () => {
    const res = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Bloqueado', rut: '20362512-1', email: 'bloqueado@test.com' })
    expect(res.statusCode).toBe(403)
  })

  // ---------- GET ----------
  it('Listar todos los suppliers', async () => {
    await createSupplier({ name: 'Listado', rut: '20362513-1', email: 'listado@test.com' })
    const res = await request(app)
      .get('/api/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body.suppliers)).toBe(true)
  })

  it('GET por ID válido', async () => {
    const id = await createSupplier({ name: 'Por ID', rut: '20362514-1', email: 'porid@test.com' })
    const res = await request(app)
      .get(`/api/suppliers/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.supplier.id).toBe(id)
  })

  // ---------- PUT ----------
  it('Admin puede actualizar supplier', async () => {
    const id = await createSupplier({ name: 'Actualizar', rut: '20362515-1', email: 'actualizar@test.com' })
    const res = await request(app)
      .put(`/api/suppliers/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Actualizado', address: 'Nueva Calle' })
    expect(res.statusCode).toBe(200)
    expect(res.body.supplier.name).toBe('Actualizado')
  })

  // ---------- DELETE ----------
  it('Admin puede eliminar supplier', async () => {
    const id = await createSupplier({ name: 'Eliminar', rut: '20362516-1', email: 'eliminar@test.com' })
    const res = await request(app)
      .delete(`/api/suppliers/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/deleted/i)
  })

  afterAll(async () => {
    await sequelize.close()
  })
})