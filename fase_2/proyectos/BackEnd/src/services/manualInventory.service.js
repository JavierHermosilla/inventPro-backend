// src/services/manualInventory.service.js
import { sequelize, models } from '../models/index.js'

const { Product, ManualInventory } = models

function asInt (n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return NaN
  return Math.trunc(v)
}

/**
 * Crea un ajuste manual y devuelve datos útiles para la respuesta.
 * @param {{productId:string,type:'increase'|'decrease',quantity:number|string,reason?:string}} payload
 * @param {{id?:string, role?:string}|undefined} actor
 * @returns {Promise<{ adjustmentId:string, newStock:number, product:any, adjustment:any }>}
 */
export async function createManualInventoryService ({ productId, type, quantity, reason }, actor) {
  return sequelize.transaction(async (t) => {
    // 1) Producto con bloqueo pesimista
    const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!product) {
      const e = new Error('Product not found')
      e.status = 404
      throw e
    }

    // 2) Validaciones
    const q = asInt(quantity)
    if (!Number.isFinite(q) || q <= 0) {
      const e = new Error('quantity must be a positive integer')
      e.status = 400
      throw e
    }

    if (type !== 'increase' && type !== 'decrease') {
      const e = new Error('type must be "increase" or "decrease"')
      e.status = 400
      throw e
    }

    // 3) Calcular nuevo stock
    const current = Number(product.stock ?? 0)
    const delta = type === 'increase' ? q : -q
    const nextStock = current + delta

    // Regla: impedir stock negativo
    if (nextStock < 0) {
      const e = new Error('Stock would go negative')
      e.status = 400
      throw e
    }

    // 4) Persistir cambios
    product.stock = nextStock
    await product.save({ transaction: t })

    // 5) Crear registro de ajuste
    const adjustment = await ManualInventory.create({
      productId: product.id,
      userId: actor?.id ?? null, // ← guarda el usuario que ejecutó el ajuste
      type,
      quantity: q,
      reason: reason || null
    }, { transaction: t })

    // 6) Responder con datos útiles (lo que tu script espera)
    return {
      adjustmentId: adjustment.id,
      newStock: nextStock,
      product,
      adjustment
    }
  })
}

/**
 * Listado paginado de ajustes manuales
 */
export async function listManualInventoriesService (params = {}) {
  const page = Math.max(parseInt(params.page ?? 1, 10), 1)
  const limit = Math.min(Math.max(parseInt(params.limit ?? 10, 10), 1), 100)
  const offset = (page - 1) * limit

  const { rows, count } = await ManualInventory.findAndCountAll({
    include: [
      { association: 'product', required: false },
      { association: 'performedBy', required: false } // alias al usuario
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  })

  return {
    page,
    limit,
    total: count,
    pages: Math.max(Math.ceil(count / limit), 1),
    records: rows
  }
}

/**
 * Borrado de un ajuste (solo admin)
 */
export async function deleteManualInventoryService (id, actor) {
  if (actor?.role !== 'admin') {
    const e = new Error('No tienes permisos')
    e.status = 403
    throw e
  }
  const rec = await ManualInventory.findByPk(id)
  if (!rec) {
    const e = new Error('Registro no encontrado')
    e.status = 404
    throw e
  }
  await rec.destroy()
  return { message: 'Registro eliminado' }
}
