// src/services/order.service.js
import { sequelize, models } from '../models/index.js'
import { normalizeRut } from '../utils/rut.js'
const { Order, OrderProduct, Product, Client, Supplier } = models

// ================== Config negocio ==================
const ALLOW_NEGATIVE_STOCK = true // reglas actuales: descontar aunque deje negativo

// ================== Helpers ==================
const asNum = (v) => Number(v ?? 0)

const ensureAuthCanActForClient = (user, clientId) => {
  // Ajusta a tu negocio. Si el "cliente" es entidad aparte, normalmente basta con rol.
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

// ================== Create ==================
/**
 * Crea una orden:
 * - Input: { clientId? | rut?, products[{ productId, quantity }] }
 * - Resuelve clientId por RUT si corresponde
 * - Toma unitPrice desde Product.price
 * - Persiste ítems con el atributo `price` (mapeado a columna DB `unit_price`)
 * - Descuenta stock (permite negativo si ALLOW_NEGATIVE_STOCK)
 * - Devuelve { id, status, totalAmount, isBackorder, items[] }
 */
export async function createOrderService (payload, user) {
  const t = await sequelize.transaction()
  try {
    let { clientId, rut, products } = payload

    // Resolver clientId por RUT
    if (!clientId && rut) {
      const cli = await Client.findOne({
        where: { rut },
        transaction: t,
        lock: t.LOCK.UPDATE
      })
      if (!cli) {
        const e = new Error('Client not found by RUT')
        e.status = 404
        throw e
      }
      clientId = cli.id
    }
    if (!clientId) {
      const e = new Error('clientId is required')
      e.status = 400
      throw e
    }

    ensureAuthCanActForClient(user, clientId)

    if (!Array.isArray(products) || products.length === 0) {
      const e = new Error('At least one product is required')
      e.status = 400
      throw e
    }

    // Bloquear productos
    const ids = products.map(p => p.productId)
    const dbProducts = await Product.findAll({
      where: { id: ids },
      transaction: t,
      lock: t.LOCK.UPDATE
    })
    const map = new Map(dbProducts.map(p => [p.id, p]))

    // Crear orden base
    const order = await Order.create({
      clientId,
      status: 'pending',
      totalAmount: 0,
      isBackorder: false,
      stockRestored: false
    }, { transaction: t })

    let totalAmount = 0
    let isBackorder = false
    const itemsRows = []

    for (const it of products) {
      const qty = asNum(it.quantity)
      if (!Number.isFinite(qty) || qty <= 0) {
        const e = new Error('Invalid quantity in one of the products')
        e.status = 400
        throw e
      }

      const p = map.get(it.productId)
      if (!p) {
        const e = new Error(`Product ${it.productId} not found`)
        e.status = 404
        throw e
      }

      const before = asNum(p.stock)
      const unitPrice = asNum(p.price)
      if (!Number.isFinite(unitPrice)) {
        const e = new Error(`Product ${p.id} has no valid price`)
        e.status = 400
        throw e
      }

      // Descuento de stock
      const after = before - qty
      if (after < 0) isBackorder = true

      if (!ALLOW_NEGATIVE_STOCK && after < 0) {
        const e = new Error(`Insufficient stock for product ${p.id}`)
        e.status = 409
        throw e
      }

      p.stock = after
      await p.save({ transaction: t })

      totalAmount += unitPrice * qty

      // IMPORTANTE:
      // El atributo del modelo es "price" pero en DB debe mapear a columna "unit_price"
      // (defínelo así en el modelo: price: { type: DECIMAL, allowNull:false, field:'unit_price' })
      itemsRows.push({
        orderId: order.id,
        productId: p.id,
        quantity: qty,
        price: unitPrice // <- atributo del modelo, columna DB = unit_price
      })
    }

    // Inserción ítems
    await OrderProduct.bulkCreate(itemsRows, { transaction: t })

    // Guardar totales/flags
    await order.update({ totalAmount, isBackorder }, { transaction: t })

    await t.commit()

    return {
      id: order.id,
      status: order.status,
      totalAmount,
      isBackorder,
      items: itemsRows.map(r => ({
        productId: r.productId,
        quantity: r.quantity,
        unitPrice: r.price
      }))
    }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// ================== List ==================
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

// ================== By Id ==================
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
  if (!order) {
    const e = new Error('Order not found')
    e.status = 404
    throw e
  }
  return order
}

// ================== Update Status ==================
export async function updateOrderStatusService (id, nextStatus) {
  const t = await sequelize.transaction()
  try {
    const order = await Order.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
    if (!order) {
      const e = new Error('Order not found')
      e.status = 404
      throw e
    }

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

    // Modelo con negativos: no tocamos stock en processing/completed.
    // Si quisieras restaurar stock al cancelar, podrías hacerlo SOLO en pending/processing,
    // pero por ahora el diseño deja el reverso a deleteOrderService.
    order.status = nextStatus
    await order.save({ transaction: t })

    await t.commit()
    return getOrderService(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// ================== Delete (restaura stock) ==================
export async function deleteOrderService (id) {
  const t = await sequelize.transaction()
  try {
    const order = await Order.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
    if (!order) {
      const e = new Error('Order not found')
      e.status = 404
      throw e
    }

    const items = await OrderProduct.findAll({
      where: { orderId: id },
      transaction: t,
      lock: t.LOCK.UPDATE
    })

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

    // order.stockRestored = true
    // await order.save({ transaction: t })

    await order.destroy({ transaction: t })
    await t.commit()
    return { message: 'Order deleted and stock restored' }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// ================== By RUT ==================
export async function listOrdersByRutService (rutInput) {
  const rut = normalizeRut(rutInput)

  const client = await Client.findOne({ where: { rut } })
  if (!client) {
    const e = new Error('Cliente no encontrado')
    e.status = 404
    throw e
  }

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

// ================== By Supplier RUT ==================
export async function createOrderBySupplierRutService ({ supplierRut, clientId, products }, user) {
  const supplier = await Supplier.findOne({ where: { rut: supplierRut } })
  if (!supplier) {
    const e = new Error('Proveedor no encontrado')
    e.status = 404
    throw e
  }

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

  return createOrderService({ clientId, products }, user)
}
