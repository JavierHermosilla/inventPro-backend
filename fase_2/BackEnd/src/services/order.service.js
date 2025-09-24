// src/services/order.service.js
import { sequelize } from '../db/db.js'
import Order from '../models/order.model.js'
import OrderProduct from '../models/orderProduct.model.js'
import Product from '../models/product.model.js'
import Client from '../models/client.model.js'
import Supplier from '../models/supplier.model.js'

/**
 * Crea una orden.
 * payload: { clientId? , rut? , products:[{productId, quantity}] }
 * user: req.user (para reglas de autorización básica)
 */
export async function createOrderService (payload, user) {
  const t = await sequelize.transaction()
  try {
    // Resolver clientId si viene rut
    let { clientId, rut, products } = payload
    if (!clientId && rut) {
      const client = await Client.findOne({ where: { rut }, transaction: t, lock: t.LOCK.UPDATE })
      if (!client) throw new Error('Client not found by RUT')
      clientId = client.id
    }
    if (!clientId) throw new Error('clientId is required')

    // Regla mínima de autorización:
    // admin y vendedor: pueden crear para cualquiera; otros: sólo para sí mismos
    if (!['admin', 'vendedor'].includes(user.role) && user.id !== clientId) {
      throw new Error('You can only create orders for yourself')
    }

    let totalAmount = 0
    let isBackorder = false
    const itemsToCreate = []

    for (const it of products) {
      const product = await Product.findByPk(it.productId, {
        transaction: t,
        lock: t.LOCK.UPDATE
      })
      if (!product) throw new Error(`Product ${it.productId} not found`)

      // Tomamos el precio actual del producto
      const lineTotal = Number(product.price) * Number(it.quantity)
      totalAmount += lineTotal

      // Decrementamos stock (permitimos backorder => stock negativo)
      product.stock = Number(product.stock) - Number(it.quantity)
      if (product.stock < 0) isBackorder = true
      await product.save({ transaction: t })

      itemsToCreate.push({
        orderId: null, // se asigna luego
        productId: product.id,
        quantity: it.quantity,
        price: product.price // precio inmutable copiado al item
      })
    }

    const order = await Order.create({
      clientId,
      totalAmount,
      status: 'pending',
      isBackorder,
      stockRestored: false
    }, { transaction: t })

    for (const row of itemsToCreate) {
      row.orderId = order.id
      await OrderProduct.create(row, { transaction: t })
    }

    await t.commit()

    return {
      id: order.id,
      status: order.status,
      totalAmount,
      isBackorder,
      products: itemsToCreate.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price }))
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
        as: 'orderItems',
        include: [{ model: Product, as: 'orderedProduct' }]
      }
    ],
    // usar la columna real para evitar el error de "Category.createdAt"
    order: [['created_at', 'DESC']]
  })
}

export async function getOrderService (id) {
  const order = await Order.findByPk(id, {
    include: [
      {
        model: OrderProduct,
        as: 'orderItems',
        include: [{ model: Product, as: 'orderedProduct' }]
      }
    ]
  })
  if (!order) throw new Error('Order not found')
  return order
}

export async function updateOrderStatusService (id, nextStatus) {
  const t = await sequelize.transaction()
  try {
    const order = await Order.findByPk(id, { transaction: t })
    if (!order) throw new Error('Order not found')

    if (order.status === 'completed' && nextStatus === 'pending') {
      throw new Error('Cannot revert a completed order to pending')
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
    const order = await Order.findByPk(id, {
      include: [{ model: OrderProduct, as: 'orderItems' }],
      transaction: t,
      lock: t.LOCK.UPDATE
    })
    if (!order) throw new Error('Order not found')

    // restaurar stock
    for (const item of order.orderItems) {
      const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE })
      product.stock = Number(product.stock) + Number(item.quantity)
      await product.save({ transaction: t })
    }

    await OrderProduct.destroy({ where: { orderId: order.id }, transaction: t })
    await order.destroy({ transaction: t })

    await t.commit()
    return { message: 'Order deleted and stock restored' }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

export async function createOrderBySupplierRutService ({ supplierRut, customerId, products }, user) {
  // Nota: mantenemos compat por si aún mandas customerId, pero internamente igual exigimos clientId.
  const supplier = await Supplier.findOne({ where: { rut: supplierRut } })
  if (!supplier) throw new Error('Proveedor no encontrado')

  // Validar productos y pertenencia al proveedor
  const ids = products.map(p => p.productId)
  const found = await Product.findAll({ where: { id: ids } })
  const missing = ids.filter(id => !found.some(f => f.id === id))
  if (missing.length) {
    const e = new Error('Productos no encontrados')
    e.missing = missing
    throw e
  }
  const wrongSupplier = found.filter(p => p.supplierId !== supplier.id)
  if (wrongSupplier.length) {
    const e = new Error('Algunos productos no pertenecen al proveedor indicado')
    e.mismatches = wrongSupplier.map(p => ({ productId: p.id, productName: p.name }))
    throw e
  }

  // Reutilizamos el flujo normal (requiere clientId > ver controller para mapeo)
  return { ok: true }
}
