import request from 'supertest'
import app from '../app.js'
import sequelize, { connectDB } from '../config/db.js'

import Product from '../models/product.model.js'
import ManualInventory from '../models/manualInventory.model.js'
import User from '../models/user.model.js'
import Supplier from '../models/supplier.model.js'
import Category from '../models/category.model.js'
import { createAccessToken } from '../libs/jwt.js'
import { ROLES } from '../config/roles.js'

describe('Manual Inventory API - Full Coverage', () => {
  let adminToken, userToken, bodegueroToken
  let adminUser, normalUser, bodegueroUser
  let testProduct, testSupplier, testCategory

  jest.setTimeout(30000)

  beforeAll(async () => {
    await connectDB()

    // Limpiar tablas
    await ManualInventory.destroy({ where: {} })
    await Product.destroy({ where: {} })

    // Obtener usuarios, proveedores y categorías
    adminUser = await User.findOne({ where: { role: ROLES.ADMIN } })
    normalUser = await User.findOne({ where: { role: ROLES.USER } })
    bodegueroUser = await User.findOne({ where: { role: ROLES.BODEGUERO } })

    adminToken = createAccessToken({ id: adminUser.id, role: ROLES.ADMIN })
    userToken = createAccessToken({ id: normalUser.id, role: ROLES.USER })
    bodegueroToken = createAccessToken({ id: bodegueroUser.id, role: ROLES.BODEGUERO })

    testSupplier = await Supplier.findOne({ where: { rut: '12345678-9' } })
    testCategory = await Category.findOne({ where: { name: 'Categoría prueba' } })
  })

  beforeEach(async () => {
    await ManualInventory.destroy({ where: {} })
    await Product.destroy({ where: {} })

    // Crear producto único
    testProduct = await Product.create({
      name: `Producto prueba ${Date.now()}`,
      price: 1000,
      stock: 10,
      supplierId: testSupplier.id,
      categoryId: testCategory.id
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  // ------------------ CREAR AJUSTE ------------------
  describe('POST /api/manual-inventory', () => {
    test('admin puede crear ajuste positivo', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: testProduct.id, quantity: 5, type: 'increase', reason: 'Stock inicial' })
        .expect(201)

      expect(res.body).toHaveProperty('adjustment')

      const updatedProduct = await Product.findByPk(testProduct.id)
      expect(updatedProduct.stock).toBe(15)
    })

    test('admin puede crear ajuste negativo con reason', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: testProduct.id, quantity: 3, type: 'decrease', reason: 'Corrección' })
        .expect(201)

      const updatedProduct = await Product.findByPk(testProduct.id)
      expect(updatedProduct.stock).toBe(7)
    })

    test('falla si decrease sin reason', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: testProduct.id, quantity: 2, type: 'decrease' })
        .expect(400)

      expect(res.body).toHaveProperty('errors')
    })

    test('falla con producto inexistente', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: 999999, quantity: 2, type: 'increase', reason: 'Test' })
        .expect(404)

      expect(res.body.message).toMatch(/product not found/i)
    })

    test('falla con tipo inválido', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: testProduct.id, quantity: 2, type: 'invalid', reason: 'Test' })
        .expect(400)

      expect(res.body).toHaveProperty('errors')
    })

    test('user normal no puede crear ajuste', async () => {
      await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProduct.id, quantity: 5, type: 'increase', reason: 'Test' })
        .expect(403)
    })

    test('bodeguero no puede crear ajuste', async () => {
      await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${bodegueroToken}`)
        .send({ productId: testProduct.id, quantity: 5, type: 'increase', reason: 'Test' })
        .expect(403)
    })
  })

  // ------------------ LISTAR AJUSTES ------------------
  describe('GET /api/manual-inventory', () => {
    test('admin puede listar todos los ajustes', async () => {
      await ManualInventory.create({
        productId: testProduct.id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser.id
      })

      const res = await request(app)
        .get('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.records.length).toBe(1)
      expect(res.body.records[0].productId).toBe(testProduct.id)
    })
  })

  // ------------------ OBTENER AJUSTE POR ID ------------------
  describe('GET /api/manual-inventory/:id', () => {
    test('admin puede obtener ajuste por id', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct.id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser.id
      })

      const res = await request(app)
        .get(`/api/manual-inventory/${adjustment.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.id).toBe(adjustment.id)
    })

    test('400 si id inválido', async () => {
      const res = await request(app)
        .get('/api/manual-inventory/abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(res.body.message).toMatch(/invalid id/i)
    })

    test('404 si ajuste no existe', async () => {
      const res = await request(app)
        .get('/api/manual-inventory/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(res.body.message).toMatch(/adjustment not found/i)
    })
  })

  // ------------------ ELIMINAR AJUSTE ------------------
  describe('DELETE /api/manual-inventory/:id', () => {
    test('admin puede eliminar ajuste', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct.id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser.id
      })

      await request(app)
        .delete(`/api/manual-inventory/${adjustment.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      const deleted = await ManualInventory.findByPk(adjustment.id)
      expect(deleted).toBeNull()
    })

    test('400 si id inválido', async () => {
      const res = await request(app)
        .delete('/api/manual-inventory/abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(res.body.message).toMatch(/invalid id/i)
    })

    test('404 si ajuste no existe', async () => {
      const res = await request(app)
        .delete('/api/manual-inventory/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(res.body.message).toMatch(/adjustment not found/i)
    })

    test('user normal no puede eliminar', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct.id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser.id
      })

      await request(app)
        .delete(`/api/manual-inventory/${adjustment.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
    })

    test('bodeguero no puede eliminar', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct.id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser.id
      })

      await request(app)
        .delete(`/api/manual-inventory/${adjustment.id}`)
        .set('Authorization', `Bearer ${bodegueroToken}`)
        .expect(403)
    })

    test('falla sin token', async () => {
      const adjustment = await ManualInventory.create({
        productId: testProduct.id,
        type: 'increase',
        quantity: 5,
        reason: 'Test',
        userId: adminUser.id
      })

      await request(app)
        .delete(`/api/manual-inventory/${adjustment.id}`)
        .expect(401)
    })
  })
})
