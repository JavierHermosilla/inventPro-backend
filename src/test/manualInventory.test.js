import request from 'supertest'
import app from '../app.js'
import Product from '../models/product.model.js'
import ManualInventory from '../models/manualInventory.model.js'
import User from '../models/user.model.js'
import Supplier from '../models/supplier.model.js'
import Category from '../models/category.model.js'
import { createAccessToken } from '../libs/jwt.js'
import { ROLES } from '../config/roles.js'
import { setupTests, teardownTests, clearDatabase } from './setup.js'
import mongoose from 'mongoose'

describe('Manual Inventory API - Full Coverage', () => {
  let adminToken, userToken, bodegueroToken
  let adminUser, normalUser, bodegueroUser
  let testProduct, testSupplier, testCategory

  jest.setTimeout(30000)

  beforeAll(async () => {
    await setupTests() // conecta MongoMemoryServer y carga seedDatabase

    // Obtener usuarios de seedDatabase
    adminUser = await User.findOne({ role: ROLES.ADMIN })
    normalUser = await User.findOne({ role: ROLES.USER })
    bodegueroUser = await User.findOne({ role: ROLES.BODEGUERO })

    adminToken = await createAccessToken({ id: adminUser._id.toString(), role: ROLES.ADMIN })
    userToken = await createAccessToken({ id: normalUser._id.toString(), role: ROLES.USER })
    bodegueroToken = await createAccessToken({ id: bodegueroUser._id.toString(), role: ROLES.BODEGUERO })

    // Obtener proveedor y categoría existentes del seed
    testSupplier = await Supplier.findOne({ rut: '12345678-9' })
    testCategory = await Category.findOne({ name: 'Categoría prueba' })
  })

  beforeEach(async () => {
    await clearDatabase() // limpia colecciones excepto users, suppliers, categories

    // Crear producto único por test
    testProduct = await Product.create({
      name: `Producto prueba ${Date.now()}`,
      price: 1000,
      stock: 10,
      supplier: testSupplier._id,
      category: testCategory._id
    })
  })

  afterAll(async () => {
    await teardownTests()
  })

  // ------------------ CREAR AJUSTE ------------------
  describe('POST /api/manual-inventory', () => {
    test('admin puede crear ajuste positivo', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: testProduct._id, quantity: 5, type: 'increase', reason: 'Stock inicial' })
        .expect(201)

      expect(res.body).toHaveProperty('adjustment')
      const updatedProduct = await Product.findById(testProduct._id)
      expect(updatedProduct.stock).toBe(15)
    })

    test('admin puede crear ajuste negativo con reason', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: testProduct._id, quantity: 3, type: 'decrease', reason: 'Corrección' })
        .expect(201)

      const updatedProduct = await Product.findById(testProduct._id)
      expect(updatedProduct.stock).toBe(7)
    })

    test('falla si decrease sin reason', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: testProduct._id, quantity: 2, type: 'decrease' })
        .expect(400)

      expect(res.body).toHaveProperty('errors')
    })

    test('falla con producto inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: fakeId, quantity: 2, type: 'increase', reason: 'Test' })
        .expect(404)

      expect(res.body.message).toMatch(/product not found/i)
    })

    test('falla con tipo inválido', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: testProduct._id, quantity: 2, type: 'invalid', reason: 'Test' })
        .expect(400)

      expect(res.body).toHaveProperty('errors')
    })

    test('user normal no puede crear ajuste', async () => {
      await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProduct._id, quantity: 5, type: 'increase', reason: 'Test' })
        .expect(403)
    })

    test('bodeguero no puede crear ajuste', async () => {
      await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${bodegueroToken}`)
        .send({ productId: testProduct._id, quantity: 5, type: 'increase', reason: 'Test' })
        .expect(403)
    })
  })

  // ------------------ LISTAR AJUSTES ------------------
  describe('GET /api/manual-inventory', () => {
    test('admin puede listar todos los ajustes', async () => {
      // Crear ajuste manual con todos los campos
      await ManualInventory.create({
        productId: testProduct._id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser._id
      })

      const res = await request(app)
        .get('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.records.length).toBe(1)
      expect(res.body.records[0].productId._id.toString()).toBe(testProduct._id.toString())
    })
  })

  // ------------------ OBTENER AJUSTE POR ID ------------------
  describe('GET /api/manual-inventory/:id', () => {
    test('admin puede obtener ajuste por id', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct._id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser._id
      })

      const res = await request(app)
        .get(`/api/manual-inventory/${adjustment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body._id).toBe(adjustment._id.toString())
    })

    test('400 si id inválido', async () => {
      const res = await request(app)
        .get('/api/manual-inventory/invalidid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(res.body.message).toMatch(/invalid id/i)
    })

    test('404 si ajuste no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .get(`/api/manual-inventory/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(res.body.message).toMatch(/adjustment not found/i)
    })
  })

  // ------------------ ELIMINAR AJUSTE ------------------
  describe('DELETE /api/manual-inventory/:id', () => {
    test('admin puede eliminar ajuste', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct._id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser._id
      })

      await request(app)
        .delete(`/api/manual-inventory/${adjustment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      const deleted = await ManualInventory.findById(adjustment._id)
      expect(deleted).toBeNull()
    })

    test('400 si id inválido', async () => {
      const res = await request(app)
        .delete('/api/manual-inventory/invalidid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(res.body.message).toMatch(/invalid id/i)
    })

    test('404 si ajuste no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .delete(`/api/manual-inventory/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(res.body.message).toMatch(/adjustment not found/i)
    })

    test('user normal no puede eliminar', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct._id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser._id
      })

      await request(app)
        .delete(`/api/manual-inventory/${adjustment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
    })

    test('bodeguero no puede eliminar', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct._id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser._id
      })

      await request(app)
        .delete(`/api/manual-inventory/${adjustment._id}`)
        .set('Authorization', `Bearer ${bodegueroToken}`)
        .expect(403)
    })

    test('falla sin token', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct._id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser._id
      })

      await request(app)
        .delete(`/api/manual-inventory/${adjustment._id}`)
        .expect(401)
    })
  })
})
