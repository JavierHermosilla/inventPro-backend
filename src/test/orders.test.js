import request from 'supertest'
import app from '../app.js' // Ajusta según tu entrypoint
import User from '../models/user.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import Category from '../models/category.model.js'
import Supplier from '../models/supplier.model.js'
import mongoose from 'mongoose'
import { setupTests, teardownTests, clearDatabase } from './setup.js'

let userToken
let adminToken
let createdOrderId
let productId
let user
let admin

beforeAll(async () => {
  await setupTests()

  // Crear usuario normal
  user = await User.create({
    name: 'Test User',
    username: 'testuser',
    email: 'user@test.com',
    password: '123456',
    phone: '+56912345678',
    role: 'user'
  })

  // Crear admin
  admin = await User.create({
    name: 'Admin User',
    username: 'adminuser',
    email: 'admin@test.com',
    password: '123456',
    phone: '+56987654321',
    role: 'admin'
  })

  // Crear category
  const category = await Category.create({
    name: 'Categoria Test',
    description: 'Descripción de prueba'
  })

  // Crear supplier
  const supplier = await Supplier.create({
    name: 'Proveedor Test',
    rut: '12345678-9',
    contact: 'supplier@test.com',
    phone: '+56912345678'
  })

  // Crear producto de prueba
  const product = await Product.create({
    name: 'Producto Test',
    description: 'Producto para testing',
    price: 1000,
    stock: 10,
    category: category._id,
    supplier: supplier._id
  })
  productId = product._id.toString()

  // Tokens
  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: '123456' })
  userToken = userLogin.body.token

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: '123456' })
  adminToken = adminLogin.body.token
})

afterAll(async () => {
  await teardownTests()
})

afterEach(async () => {
  await clearDatabase() // Limpia colecciones excepto users
})

describe('Orders API - Seguridad completa', () => {
  it('POST /api/orders → debe crear una orden con datos válidos', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [{ productId, quantity: 2, price: 1000 }],
        totalAmount: 2000
      })

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('_id')
    createdOrderId = res.body._id
  })

  it('POST /api/orders → falla sin token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerId: user._id.toString(),
        products: [{ productId, quantity: 2, price: 1000 }]
      })

    expect(res.statusCode).toBe(401)
  })

  it('POST /api/orders → falla con productos vacíos', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: []
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('POST /api/orders → falla con quantity=0 o price negativo', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [{ productId, quantity: 0, price: -100 }]
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('GET /api/orders → debe listar todas las órdenes', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /api/orders → falla sin token', async () => {
    const res = await request(app).get('/api/orders')
    expect(res.statusCode).toBe(401)
  })

  it('GET /api/orders/:id → obtener orden por ID válida', async () => {
    const order = await Order.create({
      customerId: user._id.toString(),
      products: [{ productId, quantity: 1, price: 1000 }],
      totalAmount: 1000
    })
    const res = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('_id', order._id.toString())
  })

  it('GET /api/orders/:id → falla con ID inválido', async () => {
    const res = await request(app)
      .get('/api/orders/123')
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.statusCode).toBe(400)
  })

  it('PUT /api/orders/:id → admin puede actualizar', async () => {
    const order = await Order.create({
      customerId: user._id.toString(),
      products: [{ productId, quantity: 1, price: 1000 }],
      totalAmount: 1000
    })

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'processing' })

    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('processing')
  })

  it('PUT /api/orders/:id → user normal no puede actualizar', async () => {
    const order = await Order.create({
      customerId: user._id.toString(),
      products: [{ productId, quantity: 1, price: 1000 }],
      totalAmount: 1000
    })

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'completed' })

    expect(res.statusCode).toBe(403)
  })

  it('PUT /api/orders/:id → falla sin token', async () => {
    const order = await Order.create({
      customerId: user._id.toString(),
      products: [{ productId, quantity: 1, price: 1000 }],
      totalAmount: 1000
    })

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .send({ status: 'completed' })

    expect(res.statusCode).toBe(401)
  })

  it('DELETE /api/orders/:id → admin puede eliminar', async () => {
    const order = await Order.create({
      customerId: user._id.toString(),
      products: [{ productId, quantity: 1, price: 1000 }],
      totalAmount: 1000
    })

    const res = await request(app)
      .delete(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message')
  })

  it('DELETE /api/orders/:id → user normal no puede eliminar', async () => {
    const order = await Order.create({
      customerId: user._id.toString(),
      products: [{ productId, quantity: 1, price: 1000 }],
      totalAmount: 1000
    })

    const res = await request(app)
      .delete(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.statusCode).toBe(403)
  })

  it('DELETE /api/orders/:id → falla sin token', async () => {
    const order = await Order.create({
      customerId: user._id.toString(),
      products: [{ productId, quantity: 1, price: 1000 }],
      totalAmount: 1000
    })

    const res = await request(app)
      .delete(`/api/orders/${order._id}`)

    expect(res.statusCode).toBe(401)
  })
})
