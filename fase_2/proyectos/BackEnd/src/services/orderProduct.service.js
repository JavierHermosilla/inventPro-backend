// src/services/orderProduct.service.js
import { sequelize, models } from '../models/index.js'
const { Order, OrderProduct, Product } = models

const asNumber = (v, def = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

const ensureOrderMutable = (order) => {
  if (!order) {
    const e = new Error('Orden no encontrada'); e.status = 404; throw e
  }
  if (order.status === 'completed' || order.status === 'cancelled') {
    const e = new Error('No se puede modificar una orden finalizada o cancelada')
    e.status = 409
    throw e
  }
}

/**
 * Marca isBackorder=true si el stock quedó negativo
 * (No lo desmarca si vuelve a positivo para mantener trazabilidad simple)
 */
const markBackorderIfNeeded = async (order, product, t) => {
  if (asNumber(product.stock) < 0 && order.isBackorder !== true) {
    order.isBackorder = true
    await order.save({ transaction: t, fields: ['isBackorder'] })
  }
}

/**
 * Listar items con paginación y filtros
 * include=product para traer el producto
 */
export const getAllOrderProductsService = async ({
  page = 1, limit = 10, orderId, productId, include
}) => {
  const pageInt = Math.max(parseInt(page, 10) || 1, 1)
  const limitInt = Math.max(parseInt(limit, 10) || 10, 1)
  const offset = (pageInt - 1) * limitInt

  const where = {}
  if (orderId) where.orderId = orderId
  if (productId) where.productId = productId

  const includeArr = []
  if (String(include).split(',').map(s => s.trim()).includes('product')) {
    includeArr.push({ model: Product, as: 'product', required: false })
  }

  const { rows, count } = await OrderProduct.findAndCountAll({
    where,
    include: includeArr,
    limit: limitInt,
    offset,
    order: [['created_at', 'DESC']]
  })

  return {
    items: rows,
    total: count,
    page: pageInt,
    limit: limitInt,
    totalPages: Math.ceil(count / limitInt) || 1
  }
}

/**
 * Obtener un item por id (con include opcional)
 */
export const getOrderProductByIdService = async (id, include) => {
  const includeArr = []
  if (String(include).split(',').map(s => s.trim()).includes('product')) {
    includeArr.push({ model: Product, as: 'product', required: false })
  }

  const op = await OrderProduct.findByPk(id, { include: includeArr })
  if (!op) {
    const e = new Error('OrderProduct no encontrado')
    e.status = 404
    throw e
  }
  return op
}

/**
 * Crear línea (snapshot de price) y ajustar stock/total
 * - Permite stock negativo (regla actual)
 */
export const createOrderProductService = async ({ orderId, productId, quantity }) => {
  return await sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE })
    ensureOrderMutable(order)

    const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!product) { const e = new Error('Producto no encontrado'); e.status = 404; throw e }

    const qty = asNumber(quantity, 0)
    if (!Number.isInteger(qty) || qty < 1) {
      const e = new Error('quantity debe ser entero ≥ 1'); e.status = 400; throw e
    }

    const unitPrice = asNumber(product.price, NaN)
    if (!Number.isFinite(unitPrice)) {
      const e = new Error('El producto no tiene un precio válido'); e.status = 409; throw e
    }

    // ¿Existe ya la línea? Si sí, sumamos qty manteniendo price snapshot
    let op = await OrderProduct.findOne({
      where: { orderId, productId },
      transaction: t,
      lock: t.LOCK.UPDATE
    })

    if (op) {
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

    // Ajuste de stock (se permite negativo)
    product.stock = asNumber(product.stock) - qty
    await product.save({ transaction: t, fields: ['stock'] })
    await markBackorderIfNeeded(order, product, t)

    // Ajuste del total con snapshot (de la línea)
    const priceToUse = asNumber(op.price)
    order.totalAmount = asNumber(order.totalAmount) + priceToUse * qty
    await order.save({ transaction: t, fields: ['totalAmount'] })

    return op
  })
}

/**
 * Actualizar cantidad (mantiene snapshot de price)
 */
export const updateOrderProductService = async (id, { quantity }) => {
  return await sequelize.transaction(async (t) => {
    const op = await OrderProduct.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
    if (!op) { const e = new Error('OrderProduct no encontrado'); e.status = 404; throw e }

    const order = await Order.findByPk(op.orderId, { transaction: t, lock: t.LOCK.UPDATE })
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

    // Stock (permite negativo)
    product.stock = asNumber(product.stock) - delta
    await product.save({ transaction: t, fields: ['stock'] })
    await markBackorderIfNeeded(order, product, t)

    // Total con snapshot de la línea
    const unitPrice = asNumber(op.price)
    order.totalAmount = asNumber(order.totalAmount) + unitPrice * delta
    await order.save({ transaction: t, fields: ['totalAmount'] })

    // Cantidad nueva (price inmutable)
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
    ensureOrderMutable(order)

    const product = await Product.findByPk(op.productId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!product) { const e = new Error('Producto no encontrado'); e.status = 404; throw e }

    const qty = asNumber(op.quantity)
    const price = asNumber(op.price)

    // Restaurar stock
    product.stock = asNumber(product.stock) + qty
    await product.save({ transaction: t, fields: ['stock'] })

    // Ajustar total (cap en 0 por seguridad)
    order.totalAmount = Math.max(0, asNumber(order.totalAmount) - price * qty)
    await order.save({ transaction: t, fields: ['totalAmount'] })

    await op.destroy({ transaction: t })
    return { message: 'OrderProduct eliminado, stock restaurado y total actualizado' }
  })
}
