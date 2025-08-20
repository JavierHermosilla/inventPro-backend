import request from 'supertest'
import app from '../app.js'
import mongoose from 'mongoose'
import User from '../models/user.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import { createAccessToken } from '../libs/jwt.js'
import { setupTests, teardownTests, adminId, normalUserId, product1Id, product2Id } from './setup.js'

let adminToken, userToken
let admin, user

beforeAll(async () => {
  await setupTests()

  admin = await User.findById(adminId)
  user = await User.findById(normalUserId)

  adminToken = await createAccessToken({ id: admin._id.toString(), role: 'admin' })
  userToken = await createAccessToken({ id: user._id.toString(), role: 'user' })
})

afterAll(async () => {
  await teardownTests()
})

beforeEach(async () => {
  // Restaurar stock de productos
  await Product.findByIdAndUpdate(product1Id, { stock: 10 })
  await Product.findByIdAndUpdate(product2Id, { stock: 5 })

  // Limpiar órdenes
  await Order.deleteMany({})
})

describe('Orders API - Cobertura completa', () => {
  it('POST /api/orders → usuario puede crear orden válida y stock se actualiza', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [
          { productId: product1Id.toString(), quantity: 2 },
          { productId: product2Id.toString(), quantity: 1 }
        ]
      })

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('_id')

    const updatedProd1 = await Product.findById(product1Id)
    const updatedProd2 = await Product.findById(product2Id)
    expect(updatedProd1.stock).toBe(8)
    expect(updatedProd2.stock).toBe(4)
  })

  it('POST → falla si producto no existe', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [{ productId: fakeId.toString(), quantity: 1 }]
      })

    expect(res.statusCode).toBe(404)
  })

  it('POST → falla si stock insuficiente', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [{ productId: product2Id.toString(), quantity: 100 }]
      })

    expect(res.statusCode).toBe(400)
  })

  it('POST → falla sin token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerId: user._id.toString(),
        products: [{ productId: product1Id.toString(), quantity: 1 }]
      })

    expect(res.statusCode).toBe(401)
  })

  it('PUT /:id → admin cancela orden y stock se restaura', async () => {
    const order = await Order.create({
      customerId: user._id.toString(),
      products: [
        { productId: product1Id, quantity: 2, price: 100 },
        { productId: product2Id, quantity: 1, price: 50 }
      ],
      totalAmount: 250,
      status: 'pending',
      stockRestored: false
    })

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('cancelled')

    const prod1 = await Product.findById(product1Id)
    const prod2 = await Product.findById(product2Id)
    expect(prod1.stock).toBe(10)
    expect(prod2.stock).toBe(5)
  })

  it('DELETE /:id → admin elimina orden y stock se restaura', async () => {
  // Reducir stock manualmente como si se hubiera creado la orden
    await Product.findByIdAndUpdate(product1Id, { $inc: { stock: -1 } })
    await Product.findByIdAndUpdate(product2Id, { $inc: { stock: -2 } })

    const order = await Order.create({
      customerId: user._id.toString(),
      products: [
        { productId: product1Id, quantity: 1, price: 100 },
        { productId: product2Id, quantity: 2, price: 50 }
      ],
      totalAmount: 200,
      status: 'pending',
      stockRestored: false
    })

    const res = await request(app)
      .delete(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message', 'Orden eliminada y stock restaurado')

    const prod1 = await Product.findById(product1Id)
    const prod2 = await Product.findById(product2Id)
    expect(prod1.stock).toBe(10) // stock original restaurado
    expect(prod2.stock).toBe(5)

    const deletedOrder = await Order.findById(order._id)
    expect(deletedOrder).toBeNull()
  })
})
