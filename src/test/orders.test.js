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
  // Resetear stock de productos antes de cada test
  await Product.findByIdAndUpdate(product1Id, { stock: 10 })
  await Product.findByIdAndUpdate(product2Id, { stock: 5 })

  // Limpiar órdenes
  await Order.deleteMany({})
})

describe('Orders API - Cobertura completa extendida', () => {
  // ---------------------------
  // CREAR ORDEN
  // ---------------------------
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

  // ---------------------------
  // CANCELAR ORDEN
  // ---------------------------
  it('PUT /:id → admin cancela orden y stock se restaura', async () => {
    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [
          { productId: product1Id.toString(), quantity: 2 },
          { productId: product2Id.toString(), quantity: 1 }
        ]
      })

    const res = await request(app)
      .put(`/api/orders/${order.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('cancelled')

    const prod1 = await Product.findById(product1Id)
    const prod2 = await Product.findById(product2Id)
    expect(prod1.stock).toBe(10)
    expect(prod2.stock).toBe(5)
  })

  it('PUT /:id → usuario cancela su propia orden y stock se restaura', async () => {
    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [
          { productId: product1Id.toString(), quantity: 2 },
          { productId: product2Id.toString(), quantity: 1 }
        ]
      })

    const res = await request(app)
      .put(`/api/orders/${order.body._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('cancelled')

    const prod1 = await Product.findById(product1Id)
    const prod2 = await Product.findById(product2Id)
    expect(prod1.stock).toBe(10)
    expect(prod2.stock).toBe(5)
  })

  it('PUT → falla si usuario no admin intenta cancelar otra orden', async () => {
    const otherUserId = new mongoose.Types.ObjectId()
    const order = await Order.create({
      customerId: otherUserId.toString(),
      products: [{ productId: product1Id, quantity: 1, price: 100 }],
      totalAmount: 100,
      status: 'pending',
      stockRestored: false
    })

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(403)
  })

  it('PUT → falla si id inválido', async () => {
    const res = await request(app)
      .put('/api/orders/invalidid')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(400)
  })

  it('PUT → falla si orden no existe', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .put(`/api/orders/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(404)
  })

  // ---------------------------
  // ELIMINAR ORDEN
  // ---------------------------
  it('DELETE /:id → admin elimina orden y stock se restaura', async () => {
    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [
          { productId: product1Id.toString(), quantity: 1 },
          { productId: product2Id.toString(), quantity: 2 }
        ]
      })

    const res = await request(app)
      .delete(`/api/orders/${order.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message', 'Orden eliminada y stock restaurado')

    const prod1 = await Product.findById(product1Id)
    const prod2 = await Product.findById(product2Id)
    expect(prod1.stock).toBe(10)
    expect(prod2.stock).toBe(5)

    const deletedOrder = await Order.findById(order.body._id)
    expect(deletedOrder).toBeNull()
  })

  it('DELETE → falla si usuario no admin', async () => {
    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [{ productId: product1Id.toString(), quantity: 1 }]
      })

    const res = await request(app)
      .delete(`/api/orders/${order.body._id}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.statusCode).toBe(403)
  })

  it('DELETE → falla si id inválido', async () => {
    const res = await request(app)
      .delete('/api/orders/invalidid')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(400)
  })

  it('DELETE → falla si orden no existe', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .delete(`/api/orders/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(404)
  })

  it('DELETE → falla sin token', async () => {
    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user._id.toString(),
        products: [{ productId: product1Id.toString(), quantity: 1 }]
      })

    const res = await request(app)
      .delete(`/api/orders/${order.body._id}`)

    expect(res.statusCode).toBe(401)
  })
})
