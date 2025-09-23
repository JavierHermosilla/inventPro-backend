// src/controllers/order.controller.js
import { sequelize, models } from '../models/index.js'
import {
  orderCreateSchema,
  normalizeOrderCreate,
  orderUpdateSchema,
  orderByRutSchema
} from '../schemas/order.schema.js'

const { Order, OrderProduct, Product, Client } = models

// ---------- helpers de include según alias reales ----------
const orderItemsInclude = {
  model: OrderProduct,
  as: 'items', // <- alias real en tu associations
  include: [{ model: Product, as: 'product' }] // <- alias real product
}

// --------------------- CREATE ORDER ---------------------
export const createOrder = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    // normaliza clientId / customerId / rut + valida
    const baseParsed = orderCreateSchema.safeParse(req.body)
    if (!baseParsed.success) {
      await t.rollback()
      return res.status(400).json({ message: 'Validation error', errors: baseParsed.error.errors })
    }
    const { clientId: clientIdRaw, rut, products } = normalizeOrderCreate(req.body)

    // resolver clientId si vino RUT
    let clientId = clientIdRaw
    if (!clientId && rut) {
      const cli = await Client.findOne({ where: { rut }, transaction: t })
      if (!cli) {
        await t.rollback()
        return res.status(404).json({ message: 'Cliente no encontrado' })
      }
      clientId = cli.id
    }

    // seguridad básica: solo admin/vendedor pueden crear para otros
    if (!['admin', 'vendedor'].includes(req.user.role) && req.user.id !== clientId) {
      await t.rollback()
      return res.status(403).json({ message: 'You can only create orders for yourself' })
    }

    let totalAmount = 0
    const itemsToCreate = []
    let hasBackorder = false

    for (const item of products) {
      const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE })
      if (!product) {
        await t.rollback()
        return res.status(404).json({ message: `Product ${item.productId} not found` })
      }

      // descuenta stock (permite backorder)
      product.stock -= item.quantity
      if (product.stock < 0) hasBackorder = true
      await product.save({ transaction: t })

      totalAmount += Number(product.price) * Number(item.quantity)
      itemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      })
    }

    const order = await Order.create({
      clientId, // <- columna real en tu tabla orders
      totalAmount,
      status: 'pending',
      isBackorder: hasBackorder,
      stockRestored: false
    }, { transaction: t })

    // crea items
    for (const it of itemsToCreate) {
      await OrderProduct.create({ ...it, orderId: order.id }, { transaction: t })
    }

    await t.commit()
    return res.status(201).json({
      id: order.id,
      totalAmount,
      status: order.status,
      isBackorder: order.isBackorder,
      products: itemsToCreate
    })
  } catch (err) {
    await t.rollback()
    return res.status(500).json({ message: err.message })
  }
}

// --------------------- LIST ORDERS ---------------------
export const listOrders = async (_req, res) => {
  try {
    const orders = await Order.findAll({
      include: [orderItemsInclude],
      order: [['createdAt', 'DESC']]
    })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// --------------------- LIST ORDER BY ID ---------------------
export const listOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [orderItemsInclude] })
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// --------------------- UPDATE ORDER (solo status) ---------------------
export const updateOrder = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const parsed = orderUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      await t.rollback()
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors })
    }
    const { status } = parsed.data

    const order = await Order.findByPk(req.params.id, { transaction: t })
    if (!order) {
      await t.rollback()
      return res.status(404).json({ message: 'Order not found' })
    }

    if (status) {
      if (order.status === 'completed' && status === 'pending') {
        await t.rollback()
        return res.status(409).json({ message: 'Cannot revert a completed order to pending' })
      }
      order.status = status
    }

    await order.save({ transaction: t })
    await t.commit()

    const full = await Order.findByPk(order.id, { include: [orderItemsInclude] })
    return res.json({ message: 'Order updated', order: full })
  } catch (err) {
    await t.rollback()
    return res.status(500).json({ message: err.message })
  }
}

// --------------------- DELETE ORDER ---------------------
export const deleteOrder = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    // trae con items usando alias correcto
    const order = await Order.findByPk(req.params.id, {
      include: [orderItemsInclude],
      transaction: t,
      lock: t.LOCK.UPDATE
    })
    if (!order) {
      await t.rollback()
      return res.status(404).json({ message: 'Order not found' })
    }

    // restaura stock
    for (const item of order.items) {
      const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE })
      if (product) {
        product.stock += item.quantity
        await product.save({ transaction: t })
      }
    }

    // elimina items y la orden
    await OrderProduct.destroy({ where: { orderId: order.id }, transaction: t })
    await order.destroy({ transaction: t })

    await t.commit()
    res.json({ message: 'Order deleted and stock restored' })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ message: err.message })
  }
}

// --------------------- CREATE ORDER BY RUT (cliente) ---------------------
export const createOrderByRut = async (req, res) => {
  try {
    const parsed = orderByRutSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors })
    }
    // reusa createOrder: solo pasa el body normalizado
    req.body = { rut: parsed.data.rut, products: parsed.data.products }
    return createOrder(req, res)
  } catch (_err) {
    return res.status(500).json({ message: 'Error al crear orden por RUT' })
  }
}

// --------------------- LIST ORDERS BY RUT (cliente) ---------------------
export const listOrdersByRut = async (req, res) => {
  try {
    const rut = String(req.params.rut || '').trim()
    if (!rut) return res.status(400).json({ message: 'RUT requerido' })

    const client = await Client.findOne({ where: { rut } })
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' })

    const orders = await Order.findAll({
      where: { clientId: client.id },
      include: [orderItemsInclude],
      order: [['createdAt', 'DESC']]
    })

    return res.json({ client: { id: client.id, rut: client.rut, name: client.name }, orders })
  } catch (err) {
    return res.status(500).json({ message: 'Error al buscar órdenes por RUT' })
  }
}
