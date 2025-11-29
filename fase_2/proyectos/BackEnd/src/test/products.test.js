import request from 'supertest'
import app from '../app.js'
import sequelize, { connectDB } from '../config/db.js'

import User from '../models/user.model.js'
import Supplier from '../models/supplier.model.js'
import Category from '../models/category.model.js'
import Product from '../models/product.model.js'

/** @jest-environment node */

describe('Products API', () => {
  const adminUser = { email: 'admin@example.com', password: 'admin1234' }

  let token
  let supplierId, categoryId

  const productData = {
    name: 'Test Product',
    description: 'A test product',
    price: 100,
    stock: 10
  }

  // ------------------ SETUP ------------------
  beforeEach(async () => {
    await connectDB()

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password })

    token = loginRes.body.token

    const category = await Category.findOne({ where: { name: 'Electronics' } })
    categoryId = category?.id

    const supplier = await Supplier.findOne({ where: { rut: '12345678-9' } })
    supplierId = supplier?.id
  })

  // ------------------ CREATE ------------------
  it('should create a product', async () => {
    const productToSend = {
      ...productData,
      categoryId, // ➡ CAMBIO: foreign key en Sequelize
      supplierId
    }

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productToSend)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('message', 'Product created successfully.')
    expect(res.body).toHaveProperty('productId')
  })

  // ------------------ READ ------------------
  it('should get product by id', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productData, categoryId, supplierId })

    const productId = createRes.body.productId

    const res = await request(app)
      .get(`/api/products/${productId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('id', productId) // ➡ CAMBIO: Sequelize usa id
  })

  // ------------------ UPDATE ------------------
  it('should update a product', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productData, categoryId, supplierId })

    const productId = createRes.body.productId

    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 150 })

    expect(res.statusCode).toBe(200)
    expect(res.body.product).toHaveProperty('price', 150)
  })

  // ------------------ DELETE ------------------
  it('should delete a product', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productData, categoryId, supplierId })

    const productId = createRes.body.productId

    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message')
    expect(res.body.message).toMatch(/deleted/i)
  })
})
