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
  beforeAll(async () => {
    await connectDB()

    let admin = await User.findOne({ where: { email: adminUser.email } })
    if (!admin) {
      admin = await User.create({
        username: 'adminuser',
        name: 'Admin User',
        email: adminUser.email,
        password: adminUser.password,
        phone: '+56912345678',
        role: 'admin'
      })
    }

    // login para token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password })

    token = loginRes.body.token
  })

  beforeEach(async () => {
    // Limpiamos las tablas antes de cada test
    await Product.destroy({ where: {} })
    await Category.destroy({ where: {} })
    await Supplier.destroy({ where: {} })

    // creamos la categoria fresh
    const category = await Category.create({ name: 'Electronics' })
    categoryId = category.id

    // creamos proveedor fersh
    const supplier = await Supplier.create({
      name: 'Proveedor Test',
      rut: '12345678-9'
    })
    supplierId = supplier.id
  })

  afterAll(async () => {
    // cerramos la conexion
    await sequelize.close()
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
