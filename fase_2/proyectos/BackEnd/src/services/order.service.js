// src/services/order.service.js
import { sequelize, models } from '../models/index.js'
const { Order, OrderProduct, Product, Client, Supplier } = models

// Helpers
const asNum = (v) => Number(v ?? 0)

const ensureAuthCanActForClient = (user, clientId) => {
  if (!['admin', 'vendedor'].includes(user?.role) && user?.id !== clientId) {
    const e = new Error('You can only create orders for yourself')
    e.status = 403
    throw e
  }
}

const allowedTransitions = new Set([
  'pending->processing',
  'processing->completed',
  'pending->cancelled',
  'processing->cancelled'
])

export async function createOrderService (payload, user) {
  const t = await sequelize.transaction()
  try {
    let { clientId, rut, products } = payload

    // Resolver clientId por RUT si aplica
    if (!clientId && rut) {
      const cli = await Client.findOne({ where: { rut }, transaction: t, lock: t.LOCK.UPDATE })
      if (!cli) { const e = new Error('Client not found by RUT'); e.status = 404; throw e }
      clientId = cli.id
    }
    if (!clientId) { const e = new Error('clientId is required'); e.status = 400; throw e }

    ensureAuthCanActForClient(user, clientId)

    if (!Array.isArray(products) || products.length === 0) {
      const e = new Error('At least one product is required'); e.status = 400; throw e
    }

    let totalAmount = 0
    let isBackorder = false
    const itemsRows = []

    // Descontar stock (permitiendo negativo) y armar líneas
    for (const it of products) {
      const qty = asNum(it.quantity)
      if (!Number.isFinite(qty) || qty <= 0) {
        const e = new Error('Invalid quantity in one of the products'); e.status = 400; throw e
      }

      const p = await Product.findByPk(it.productId, { transaction: t, lock: t.LOCK.UPDATE })
      if (!p) { const e = new Error(`Product ${it.productId} not found`); e.status = 404; throw e }

      p.stock = asNum(p.stock) - qty // ✅ stock puede ser negativo
      if (p.stock < 0) isBackorder = true
      await p.save({ transaction: t })

      const price = asNum(p.price)
      totalAmount += price * qty

      itemsRows.push({
        orderId: null, // se setea luego
        productId: p.id,
        quantity: qty,
        price
      })
    }

    const order = await Order.create({
      clientId,
      totalAmount,
      status: 'pending',
      isBackorder,
      stockRestored: false
    }, { transaction: t })

    for (const row of itemsRows) {
      row.orderId = order.id
      await OrderProduct.create(row, { transaction: t })
    }

    await t.commit()
    return {
      id: order.id,
      status: order.status,
      totalAmount,
      isBackorder,
      products: itemsRows.map(r => ({ productId: r.productId, quantity: r.quantity, price: r.price }))
    }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

export async function listOrdersService () {
  return Order.findAll({
    include: [
      {
        model: OrderProduct,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }
    ],
    order: [['created_at', 'DESC']]
  })
}

export async function getOrderService (id) {
  const order = await Order.findByPk(id, {
    include: [
      {
        model: OrderProduct,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }
    ]
  })
  if (!order) { const e = new Error('Order not found'); e.status = 404; throw e }
  return order
}

export async function updateOrderStatusService (id, nextStatus) {
  const t = await sequelize.transaction()
  try {
    const order = await Order.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
    if (!order) { const e = new Error('Order not found'); e.status = 404; throw e }

    if (order.status === nextStatus) {
      await t.commit()
      return getOrderService(id)
    }

    const key = `${order.status}->${nextStatus}`
    if (!allowedTransitions.has(key)) {
      const e = new Error(`Invalid status transition: ${key}`)
      e.status = 409
      throw e
    }

    order.status = nextStatus
    await order.save({ transaction: t })
    await t.commit()
    return getOrderService(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

export async function deleteOrderService (id) {
  const t = await sequelize.transaction()
  try {
    // 1) Bloquear orden
    const order = await Order.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
    if (!order) { const e = new Error('Order not found'); e.status = 404; throw e }

    // 2) Traer/bloquear items
    const items = await OrderProduct.findAll({
      where: { orderId: id },
      transaction: t,
      lock: t.LOCK.UPDATE
    })

    // 3) Restaurar stock (sumar cantidades) – stock puede quedar positivo o seguir negativo
    if (items.length) {
      const productIds = [...new Set(items.map(i => i.productId))]
      const products = await Product.findAll({
        where: { id: productIds },
        transaction: t,
        lock: t.LOCK.UPDATE
      })
      const map = new Map(products.map(p => [p.id, p]))

      for (const it of items) {
        const p = map.get(it.productId)
        if (p) {
          p.stock = asNum(p.stock) + asNum(it.quantity)
          await p.save({ transaction: t })
        }
      }

      await OrderProduct.destroy({ where: { orderId: id }, transaction: t })
    }

    await order.destroy({ transaction: t })
    await t.commit()
    return { message: 'Order deleted and stock restored' }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

export async function listOrdersByRutService (rut) {
  const client = await Client.findOne({ where: { rut } })
  if (!client) { const e = new Error('Cliente no encontrado'); e.status = 404; throw e }

  const orders = await Order.findAll({
    where: { clientId: client.id },
    include: [{
      model: OrderProduct,
      as: 'items',
      required: false,
      include: [{ model: Product, as: 'product', required: false }]
    }],
    order: [['created_at', 'DESC']]
  })

  return { client: { id: client.id, rut: client.rut, name: client.name }, orders }
}

export async function createOrderBySupplierRutService ({ supplierRut, clientId, products }, user) {
  const supplier = await Supplier.findOne({ where: { rut: supplierRut } })
  if (!supplier) { const e = new Error('Proveedor no encontrado'); e.status = 404; throw e }

  // Validar items pertenecen al proveedor
  const ids = products.map(p => p.productId)
  const found = await Product.findAll({ where: { id: ids } })
  const missing = ids.filter(id => !found.some(f => f.id === id))
  if (missing.length) {
    const e = new Error('Productos no encontrados')
    e.status = 404
    e.missing = missing
    throw e
  }
  const wrong = found.filter(p => p.supplierId !== supplier.id)
  if (wrong.length) {
    const e = new Error('Algunos productos no pertenecen al proveedor indicado')
    e.status = 409
    e.mismatches = wrong.map(p => ({ productId: p.id, productName: p.name }))
    throw e
  }

  // Reutiliza createOrderService
  return createOrderService({ clientId, products }, user)
}
