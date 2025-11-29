// src/test/suppliers.test.js
import request from 'supertest'
import app from '../app.js'
import { connectDB } from '../config/db.js'

import User from '../models/user.model.js'
import Supplier from '../models/supplier.model.js'

/** @jest-environment node */

describe('Suppliers API', () => {
  let adminToken, userToken

  beforeEach(async () => {
    await connectDB()

    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Password123' })
    adminToken = loginAdmin.body.token

    const loginUser = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'Password123' })
    userToken = loginUser.body.token
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
})
