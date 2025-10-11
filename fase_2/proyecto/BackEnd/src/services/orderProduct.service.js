// src/services/orderProduct.service.js
import { sequelize, models } from '../models/index.js'

const { Order, OrderProduct, Product } = models

const asNumber = (v, def = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

const ensureOrderMutable = (order) => {
  // bloquea cambios si la orden está finalizada/cancelada
  if (order.status === 'completed' || order.status === 'cancelled') {
    const e = new Error('No se puede modificar una orden finalizada o cancelada')
    e.status = 409
    throw e
  }
}

/**
 * Listar ítems (con paginación y filtros básicos)
 */
export const getAllOrderProductsService = async ({ page = 1, limit = 10, orderId, productId }) => {
  const pageInt = Math.max(parseInt(page, 10) || 1, 1)
  const limitInt = Math.max(parseInt(limit, 10) || 10, 1)
  const offset = (pageInt - 1) * limitInt

  const where = {}
  if (orderId) where.orderId = orderId
  if (productId) where.productId = productId

  const { rows, count } = await OrderProduct.findAndCountAll({
    where,
    limit: limitInt,
    offset,
    order: [['created_at', 'DESC']]
  })

  return {
    items: rows,
    total: count,
    page: pageInt,
    limit: limitInt,
    totalPages: Math.ceil(count / limitInt)
  }
}

/**
 * Obtener un ítem por id
 */
export const getOrderProductByIdService = async (id) => {
  const op = await OrderProduct.findByPk(id)
  if (!op) {
    const e = new Error('OrderProduct no encontrado')
    e.status = 404
    throw e
  }
  return op
}

/**
 * Crear línea de orden con snapshot de precio (y ajustar stock/total)
 */
export const createOrderProductService = async ({ orderId, productId, quantity }) => {
  return await sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!order) {
      const e = new Error('Orden no encontrada'); e.status = 404; throw e
    }
    ensureOrderMutable(order)

    const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!product) {
      const e = new Error('Producto no encontrado'); e.status = 404; throw e
    }

    const qty = asNumber(quantity, 0)
    if (qty <= 0) {
      const e = new Error('quantity debe ser ≥ 1'); e.status = 400; throw e
    }

    // snapshot del precio actual del producto
    const unitPrice = asNumber(product.price, 0)

    // si ya existe, suma cantidad; si no, crea
    let op = await OrderProduct.findOne({
      where: { orderId, productId },
      transaction: t,
      lock: t.LOCK.UPDATE
    })

    if (op) {
      // no tocar el price (es inmutable); usa el snapshot ya guardado en la línea
      op.quantity = asNumber(op.quantity, 0) + qty
      await op.save({ transaction: t, fields: ['quantity'] })
    } else {
      op = await OrderProduct.create({
        orderId,
        productId,
        quantity: qty,
        price: unitPrice // snapshot
      }, { transaction: t })
    }

    // Ajustar stock (se permite negativo)
    product.stock = asNumber(product.stock) - qty
    await product.save({ transaction: t })

    // Ajustar total con el snapshot correcto
    const priceToUse = op ? asNumber(op.price) : unitPrice
    order.totalAmount = asNumber(order.totalAmount) + priceToUse * qty
    await order.save({ transaction: t })

    return op
  })
}

/**
 * Actualizar cantidad de una línea (no toca el price)
 */
export const updateOrderProductService = async (id, { quantity }) => {
  return await sequelize.transaction(async (t) => {
    const op = await OrderProduct.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
    if (!op) { const e = new Error('OrderProduct no encontrado'); e.status = 404; throw e }

    const order = await Order.findByPk(op.orderId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!order) { const e = new Error('Orden no encontrada'); e.status = 404; throw e }
    ensureOrderMutable(order)

    const product = await Product.findByPk(op.productId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!product) { const e = new Error('Producto no encontrado'); e.status = 404; throw e }

    const neu = asNumber(quantity)
    if (!Number.isInteger(neu) || neu < 1) {
      const e = new Error('quantity debe ser entero ≥ 1'); e.status = 400; throw e
    }

    const cur = asNumber(op.quantity)
    const delta = neu - cur // + aumenta, - disminuye
    if (delta === 0) return op

    // Ajustar stock (se permite negativo)
    product.stock = asNumber(product.stock) - delta
    await product.save({ transaction: t })

    // Ajustar total con el snapshot guardado en la línea
    const unitPrice = asNumber(op.price)
    order.totalAmount = asNumber(order.totalAmount) + unitPrice * delta
    await order.save({ transaction: t })

    // No tocar price (inmutable)
    op.quantity = neu
    await op.save({ transaction: t, fields: ['quantity'] })

    return op
  })
}

/**
 * Borrar línea (restaurar stock y ajustar total)
 */
export const deleteOrderProductService = async (id) => {
  return await sequelize.transaction(async (t) => {
    const op = await OrderProduct.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
    if (!op) { const e = new Error('OrderProduct no encontrado'); e.status = 404; throw e }

    const order = await Order.findByPk(op.orderId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!order) { const e = new Error('Orden no encontrada'); e.status = 404; throw e }
    ensureOrderMutable(order)

    const product = await Product.findByPk(op.productId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!product) { const e = new Error('Producto no encontrado'); e.status = 404; throw e }

    const qty = asNumber(op.quantity)
    const price = asNumber(op.price)

    // Restaurar stock
    product.stock = asNumber(product.stock) + qty
    await product.save({ transaction: t })

    // Ajustar total (no permitir negativos por seguridad)
    order.totalAmount = Math.max(0, asNumber(order.totalAmount) - price * qty)
    await order.save({ transaction: t })

    await op.destroy({ transaction: t })
    return { message: 'OrderProduct eliminado, stock restaurado y total actualizado' }
  })
}
