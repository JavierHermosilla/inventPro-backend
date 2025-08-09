import request from 'supertest'
import User from '../models/user.model.js'
import Supplier from '../models/supplier.model.js'
import app from '../app.js'
import { connect, clearDatabase, closeDatabase } from './setup.js'

/** @jest-environment node */

describe('Products API', () => {
  const adminUser = {
    email: 'admin@example.com',
    password: 'admin1234'
  }
  let token
  let supplierId

  const productData = {
    name: 'Test Product',
    description: 'A test product',
    price: 100,
    stock: 10,
    category: 'Electronics'
  }

  beforeAll(async () => {
    await connect()
  })

  beforeEach(async () => {
    await clearDatabase()

    // Crear adminUser fresh
    await User.create({
      username: 'adminuser',
      name: 'Admin User',
      email: adminUser.email,
      password: adminUser.password,
      phone: '+56912345678',
      role: 'admin'
    })

    // Crear proveedor fresh
    const supplier = await Supplier.create({
      name: 'Proveedor Test',
      contact: 'contacto@proveedor.com',
      rut: '12345678-9'
    })
    supplierId = supplier._id
    console.log('Supplier ID created:', supplierId)

    // Login fresh para token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password })
    token = loginRes.body.token
  })

  afterAll(async () => {
    await clearDatabase()
    await closeDatabase()
  })

  it('should create a product', async () => {
    const productToSend = { ...productData, supplier: supplierId }
    console.log('Sending product:', productToSend)

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productToSend)

    console.log('Create product response:', res.body)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('message', 'Product created successfully.')
    expect(res.body).toHaveProperty('productId')
  })

  it('should get product by id', async () => {
    // Crear producto fresh para este test
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productData, supplier: supplierId })

    expect(createRes.statusCode).toBe(201)
    expect(createRes.body).toHaveProperty('productId')

    const productId = createRes.body.productId

    const res = await request(app)
      .get(`/api/products/${productId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('_id', productId)
  })

  it('should update a product', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productData, supplier: supplierId })

    expect(createRes.statusCode).toBe(201) // <-- AQUÍ
    expect(createRes.body).toHaveProperty('productId')

    const productId = createRes.body.productId

    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 150 })

    expect(res.statusCode).toBe(200)
    expect(res.body.product).toHaveProperty('price', 150)
  })

  it('should delete a product', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productData, supplier: supplierId })

    expect(createRes.statusCode).toBe(201)
    expect(createRes.body).toHaveProperty('productId')

    const productId = createRes.body.productId

    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message', expect.stringContaining('deleted'))
  })
})
