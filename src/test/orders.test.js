import request from 'supertest'
import app from '../app.js'
import sequelize, { connectDB } from '../config/db.js'

import User from '../models/user.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import { createAccessToken } from '../libs/jwt.js'

let adminToken, userToken
let admin, user
let product1Id, product2Id

beforeAll(async () => {
  await connectDB()

  // Obtener usuarios de la DB
  admin = await User.findOne({ where: { role: 'admin' } })
  user = await User.findOne({ where: { role: 'user' } })

  adminToken = createAccessToken({ id: admin.id, role: 'admin' })
  userToken = createAccessToken({ id: user.id, role: 'user' })

  // Productos de prueba
  const products = await Product.findAll({ limit: 2 })
  product1Id = products[0].id
  product2Id = products[1].id
})

afterAll(async () => {
  await sequelize.close()
})

beforeEach(async () => {
  // Resetear stock de productos
  await Product.update({ stock: 10 }, { where: { id: product1Id } })
  await Product.update({ stock: 5 }, { where: { id: product2Id } })

  // Limpiar órdenes
  await Order.destroy({ where: {} })
})

describe('Orders API - PostgreSQL', () => {
  // ---------------------------
  // CREAR ORDEN
  // ---------------------------
  it('POST /api/orders → usuario puede crear orden válida y stock se actualiza', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user.id,
        products: [
          { productId: product1Id, quantity: 2 },
          { productId: product2Id, quantity: 1 }
        ]
      })

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('id')

    const updatedProd1 = await Product.findByPk(product1Id)
    const updatedProd2 = await Product.findByPk(product2Id)
    expect(updatedProd1.stock).toBe(8)
    expect(updatedProd2.stock).toBe(4)
  })

  it('POST → falla si producto no existe', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user.id,
        products: [{ productId: 999999, quantity: 1 }]
      })

    expect(res.statusCode).toBe(404)
  })

  it('POST → falla si stock insuficiente', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user.id,
        products: [{ productId: product2Id, quantity: 100 }]
      })

    expect(res.statusCode).toBe(400)
  })

  it('POST → falla sin token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerId: user.id,
        products: [{ productId: product1Id, quantity: 1 }]
      })

    expect(res.statusCode).toBe(401)
  })

  // ---------------------------
  // CANCELAR ORDEN
  // ---------------------------
  it('PUT /:id → admin cancela orden y stock se restaura', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user.id,
        products: [
          { productId: product1Id, quantity: 2 },
          { productId: product2Id, quantity: 1 }
        ]
      })

    const res = await request(app)
      .put(`/api/orders/${orderRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('cancelled')

    const prod1 = await Product.findByPk(product1Id)
    const prod2 = await Product.findByPk(product2Id)
    expect(prod1.stock).toBe(10)
    expect(prod2.stock).toBe(5)
  })

  it('PUT /:id → usuario cancela su propia orden y stock se restaura', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user.id,
        products: [
          { productId: product1Id, quantity: 2 },
          { productId: product2Id, quantity: 1 }
        ]
      })

    const res = await request(app)
      .put(`/api/orders/${orderRes.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('cancelled')

    const prod1 = await Product.findByPk(product1Id)
    const prod2 = await Product.findByPk(product2Id)
    expect(prod1.stock).toBe(10)
    expect(prod2.stock).toBe(5)
  })

  it('PUT → falla si usuario no admin intenta cancelar otra orden', async () => {
    const otherOrder = await Order.create({
      customerId: 999999,
      totalAmount: 100,
      status: 'pending',
      stockRestored: false
    })

    const res = await request(app)
      .put(`/api/orders/${otherOrder.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(403)
  })

  it('PUT → falla si id inválido', async () => {
    const res = await request(app)
      .put('/api/orders/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(400)
  })

  it('PUT → falla si orden no existe', async () => {
    const res = await request(app)
      .put('/api/orders/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' })

    expect(res.statusCode).toBe(404)
  })

  // ---------------------------
  // ELIMINAR ORDEN
  // ---------------------------
  it('DELETE /:id → admin elimina orden y stock se restaura', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user.id,
        products: [
          { productId: product1Id, quantity: 1 },
          { productId: product2Id, quantity: 2 }
        ]
      })

    const res = await request(app)
      .delete(`/api/orders/${orderRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message', 'Orden eliminada y stock restaurado')

    const prod1 = await Product.findByPk(product1Id)
    const prod2 = await Product.findByPk(product2Id)
    expect(prod1.stock).toBe(10)
    expect(prod2.stock).toBe(5)

    const deletedOrder = await Order.findByPk(orderRes.body.id)
    expect(deletedOrder).toBeNull()
  })

  it('DELETE → falla si usuario no admin', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user.id,
        products: [{ productId: product1Id, quantity: 1 }]
      })

    const res = await request(app)
      .delete(`/api/orders/${orderRes.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.statusCode).toBe(403)
  })

  it('DELETE → falla si id inválido', async () => {
    const res = await request(app)
      .delete('/api/orders/abc')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(400)
  })

  it('DELETE → falla si orden no existe', async () => {
    const res = await request(app)
      .delete('/api/orders/999999')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toBe(404)
  })

  it('DELETE → falla sin token', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customerId: user.id,
        products: [{ productId: product1Id, quantity: 1 }]
      })

    const res = await request(app)
      .delete(`/api/orders/${orderRes.body.id}`)

    expect(res.statusCode).toBe(401)
  })
})
