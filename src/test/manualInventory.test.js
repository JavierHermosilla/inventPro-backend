import request from 'supertest'
import app from '../app.js'
import Product from '../models/product.model.js'
import User from '../models/user.model.js'
import Supplier from '../models/supplier.model.js'
import Category from '../models/category.model.js'
import { createAccessToken } from '../libs/jwt.js'
import { ROLES } from '../config/roles.js'
import { setupTests, teardownTests, clearDatabase } from './setup.js'

describe('Manual Inventory API - Cobertura completa', () => {
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

    // ⚡ Generar tokens correctamente usando await
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
      name: `Producto prueba ${Date.now()}`, // nombre único
      price: 1000,
      stock: 10,
      supplier: testSupplier._id,
      category: testCategory._id
    })
  })

  afterAll(async () => {
    await teardownTests() // cierra MongoMemoryServer
  })

  // ---------------------------------------
  // CREAR AJUSTE MANUAL
  // ---------------------------------------
  test('POST → admin puede crear ajuste positivo', async () => {
    const res = await request(app)
      .post('/api/manual-inventory')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProduct._id, quantity: 5, type: 'increase', reason: 'Stock inicial' })
      .expect(201)

    expect(res.body).toHaveProperty('adjustment')
    const updatedProduct = await Product.findById(testProduct._id)
    expect(updatedProduct.stock).toBe(15)
  })

  test('POST → admin puede crear ajuste negativo con reason', async () => {
    const res = await request(app)
      .post('/api/manual-inventory')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProduct._id, quantity: 3, type: 'decrease', reason: 'Corrección' })
      .expect(201)

    const updatedProduct = await Product.findById(testProduct._id)
    expect(updatedProduct.stock).toBe(7)
  })

  test('POST → falla si decrease sin reason', async () => {
    const res = await request(app)
      .post('/api/manual-inventory')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProduct._id, quantity: 2, type: 'decrease' })
      .expect(400)

    expect(res.body).toHaveProperty('errors')
  })

  // ---------------------------------------
  // PERMISOS SEGÚN ROLES
  // ---------------------------------------
  test('POST → user normal no puede crear ajuste', async () => {
    await request(app)
      .post('/api/manual-inventory')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ productId: testProduct._id, quantity: 5, type: 'increase', reason: 'Test' })
      .expect(403)
  })

  test('POST → bodeguero no puede crear ajuste', async () => {
    await request(app)
      .post('/api/manual-inventory')
      .set('Authorization', `Bearer ${bodegueroToken}`)
      .send({ productId: testProduct._id, quantity: 5, type: 'increase', reason: 'Test' })
      .expect(403)
  })
})
