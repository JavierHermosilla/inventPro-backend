// src/test/suppliers.test.js
import request from 'supertest'
import app from '../app.js'
import mongoose from 'mongoose'
import User from '../models/user.model.js'
import { createAccessToken } from '../libs/jwt.js'

// Función para calcular DV de un RUT
function calculateDV (rut) {
  let sum = 0
  let multiplier = 2
  const reversed = rut.split('').reverse()
  for (const digit of reversed) {
    sum += parseInt(digit, 10) * multiplier
    multiplier = multiplier < 7 ? multiplier + 1 : 2
  }
  const dvCalc = 11 - (sum % 11)
  if (dvCalc === 11) return '0'
  if (dvCalc === 10) return 'K'
  return dvCalc.toString()
}

// Función para armar RUT completo con DV
function formatRUT (rutBase) {
  return `${rutBase}-${calculateDV(rutBase)}`
}

describe('Suppliers API', () => {
  let adminToken
  let userToken

  beforeAll(async () => {
    await User.deleteMany({})
    // Crear admin
    const adminUser = await User.create({
      username: 'adminTest',
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'Password123',
      phone: '+56912345678',
      role: 'admin'
    })
    adminToken = await createAccessToken({ id: adminUser.id })

    // Crear usuario normal
    const normalUser = await User.create({
      username: 'userTest',
      name: 'User Test',
      email: 'user@test.com',
      password: 'Password123',
      phone: '+56987654321',
      role: 'user'
    })
    userToken = await createAccessToken({ id: normalUser.id })
  })

  beforeEach(async () => {
    const collections = mongoose.connection.collections
    if (collections.suppliers) await collections.suppliers.deleteMany({})
  })

  const createSupplier = async (data, token = adminToken) => {
    const res = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send(data)
    return res.body.supplier?._id
  }

  // ---------- POST ----------
  describe('POST /api/suppliers', () => {
    it('Admin puede crear supplier válido', async () => {
      const rut = formatRUT('20362511')
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Proveedor 1', rut, email: 'proveedor1@test.com' })
      expect(res.statusCode).toBe(201)
      expect(res.body.supplier).toHaveProperty('_id')
    })

    it('Usuario normal no puede crear supplier', async () => {
      const rut = formatRUT('20362511')
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Proveedor Bloqueado', rut, email: 'bloqueado@test.com' })
      expect(res.statusCode).toBe(403)
    })

    it('Debería crear supplier con DV K', async () => {
      const rut = formatRUT('7646400')
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Proveedor K', rut, email: 'proveedork@test.com' })
      expect(res.statusCode).toBe(201)
      expect(res.body.supplier).toHaveProperty('_id')
    })

    it('Rechazar RUT con DV incorrecto', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Proveedor Mal DV', rut: '7646400-1', email: 'incorrecto@test.com' })
      expect(res.statusCode).toBe(400)
      expect(res.body.errors[0].message).toMatch(/Invalid RUT/i)
    })

    it('Rechazar RUT sin guion', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Proveedor Sin Guion', rut: '203625111', email: 'noguion@test.com' })
      expect(res.statusCode).toBe(400)
      expect(res.body.errors[0].message).toMatch(/Invalid RUT format/i)
    })

    it('Rechazar email inválido', async () => {
      const rut = formatRUT('20362511')
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Email Mal', rut, email: 'mal-email' })
      expect(res.statusCode).toBe(400)
      expect(res.body.errors[0].message).toMatch(/Invalid email/i)
    })

    it('Rechazar duplicados', async () => {
      const rut = formatRUT('20362511')
      await createSupplier({ name: 'Duplicado 1', rut })
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Duplicado 2', rut })
      expect(res.statusCode).toBe(400)
    })

    it('Campos opcionales aceptan vacío o no enviados', async () => {
      const rut = formatRUT('20362512')
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Opcionales Vacíos',
          rut,
          email: 'opcionales@test.com',
          phone: '',
          address: '',
          website: '',
          paymentTerms: '',
          categories: [],
          status: '',
          notes: ''
        })
      expect(res.statusCode).toBe(201)
      expect(res.body.supplier).toHaveProperty('_id')
    })
  })

  // ---------- GET ----------
  describe('GET /api/suppliers', () => {
    it('Listar todos los suppliers', async () => {
      const rut = formatRUT('20362511')
      await createSupplier({ name: 'Listado', rut })
      const res = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body.suppliers)).toBe(true)
      expect(res.body.suppliers.length).toBeGreaterThan(0)
    })

    it('GET por ID válido', async () => {
      const rut = formatRUT('20362511')
      const id = await createSupplier({ name: 'Por ID', rut })
      const res = await request(app)
        .get(`/api/suppliers/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(200)
      expect(res.body.supplier._id).toBe(id)
    })

    it('GET por ID inexistente devuelve 404', async () => {
      const res = await request(app)
        .get(`/api/suppliers/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(404)
    })
  })

  // ---------- PUT ----------
  describe('PUT /api/suppliers/:id', () => {
    it('Admin puede actualizar supplier', async () => {
      const rut = formatRUT('20362511')
      const id = await createSupplier({ name: 'Actualizar', rut })
      const res = await request(app)
        .put(`/api/suppliers/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Actualizado', address: 'Nueva Calle' })
      expect(res.statusCode).toBe(200)
      expect(res.body.supplier.name).toBe('Actualizado')
      expect(res.body.supplier.address).toBe('Nueva Calle')
    })

    it('Usuario normal no puede actualizar', async () => {
      const rut = formatRUT('20362511')
      const id = await createSupplier({ name: 'NoActualizar', rut })
      const res = await request(app)
        .put(`/api/suppliers/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Intento Mal' })
      expect(res.statusCode).toBe(403)
    })
  })

  // ---------- DELETE ----------
  describe('DELETE /api/suppliers/:id', () => {
    it('Admin puede eliminar supplier', async () => {
      const rut = formatRUT('20362511')
      const id = await createSupplier({ name: 'Eliminar', rut })
      const res = await request(app)
        .delete(`/api/suppliers/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toMatch(/deleted/i)
    })

    it('Usuario normal no puede eliminar', async () => {
      const rut = formatRUT('20362511')
      const id = await createSupplier({ name: 'NoEliminar', rut })
      const res = await request(app)
        .delete(`/api/suppliers/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
      expect(res.statusCode).toBe(403)
    })

    it('Eliminar ID inexistente devuelve 404', async () => {
      const res = await request(app)
        .delete(`/api/suppliers/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.statusCode).toBe(404)
    })
  })
})
