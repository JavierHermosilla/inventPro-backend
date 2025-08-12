import request from 'supertest'
import app from '../app.js'
import ManualInventory from '../models/manualInventory.model.js'
import Product from '../models/product.model.js'
import User from '../models/user.model.js'
import Supplier from '../models/supplier.model.js'
import Category from '../models/category.model.js'
import { createAccessToken } from '../libs/jwt.js'
import { ROLES } from '../config/roles.js'
import { createManualInventorySchema } from '../schemas/manualInventory.schema.js'

describe('Manual Inventory API', () => {
  let testUser
  let testProduct
  let testSupplier
  let testCategory
  let token

  jest.setTimeout(20000) // más tiempo para conexiones DB

  beforeAll(async () => {
    testSupplier = await Supplier.create({
      name: 'Proveedor prueba',
      rut: '12345678-9'
    })

    testCategory = await Category.create({
      name: 'Categoría prueba'
    })
  })

  beforeEach(async () => {
    await ManualInventory.deleteMany({})
    await Product.deleteMany({})
    await User.deleteMany({})

    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      name: 'Usuario Test',
      phone: '+56912345678',
      role: ROLES.ADMIN
    })

    testProduct = await Product.create({
      name: 'Producto prueba',
      price: 1000,
      stock: 10,
      supplier: testSupplier._id,
      category: testCategory._id
    })

    token = await createAccessToken({ id: testUser._id.toString(), role: testUser.role })
  })

  afterAll(async () => {
    await ManualInventory.deleteMany({})
    await Product.deleteMany({})
    await User.deleteMany({})
    await Supplier.deleteMany({})
    await Category.deleteMany({})
  })

  test('Debería crear un ajuste manual con cantidad positiva', async () => {
    const res = await request(app)
      .post('/api/manual-inventory')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testProduct._id.toString(),
        quantity: 5,
        reason: 'stock inicial corregido',
        type: 'increase'
      })
      .expect(201)

    expect(res.body).toHaveProperty('adjustment')
    expect(res.body.adjustment.quantity).toBe(5)

    const updatedProduct = await Product.findById(testProduct._id)
    expect(updatedProduct.stock).toBe(15)
  })

  test('Debería fallar si falta reason en cantidad negativa', async () => {
    const res = await request(app)
      .post('/api/manual-inventory')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testProduct._id.toString(),
        type: 'decrease',
        quantity: 5
      })
      .expect(400)

    expect(res.body).toHaveProperty('errors')
    expect(res.body.errors[0].message).toMatch(/reason/i)
  })

  test('Schema Zod: falla si type es decrease y no hay reason', () => {
    const data = {
      productId: '507f191e810c19729de860ea',
      type: 'decrease',
      quantity: 5
    }

    const result = createManualInventorySchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('reason')
      expect(result.error.issues[0].message).toMatch(/reason is required/i)
    }
  })
})
