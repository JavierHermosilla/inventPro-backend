// src/services/manualInventory.service.js
import { Op } from 'sequelize'
import { sequelize, models } from '../models/index.js'

const { Product, ManualInventory } = models

// Política global de stock negativo (usa la misma que Order/OrderProduct)
const ALLOW_NEGATIVE_STOCK =
  String(process.env.ALLOW_NEGATIVE_STOCK ?? 'true').trim().toLowerCase() === 'true'

// Helpers
const asInt = (n) => {
  const v = Number(n)
  return Number.isFinite(v) ? Math.trunc(v) : NaN
}

/**
 * Crea un ajuste manual de inventario (increase|decrease).
 * - Bloquea el producto con FOR UPDATE
 * - Aplica política ALLOW_NEGATIVE_STOCK
 * - Requiere "reason" si type === 'decrease' (por seguridad extra aunque ya lo valide Zod)
 * @param {{productId:string,type:'increase'|'decrease',quantity:number|string,reason?:string}} payload
 * @param {{id?:string, role?:string}|undefined} actor
 * @returns {Promise<{ adjustmentId:string, newStock:number, product:any, adjustment:any }>}
 */
export async function createManualInventoryService ({ productId, type, quantity, reason }, actor) {
  return sequelize.transaction(async (t) => {
    // 1) Producto con bloqueo pesimista
    const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!product) {
      const e = new Error('Product not found'); e.status = 404; throw e
    }

    // 2) Validaciones de entrada
    const q = asInt(quantity)
    if (!Number.isFinite(q) || q <= 0) {
      const e = new Error('quantity must be a positive integer'); e.status = 400; throw e
    }

    if (type !== 'increase' && type !== 'decrease') {
      const e = new Error('type must be "increase" or "decrease"'); e.status = 400; throw e
    }

    // refuerzo: si es decrease exige reason (además del schema)
    const cleanedReason = (reason ?? '').toString().trim()
    if (type === 'decrease' && cleanedReason.length === 0) {
      const e = new Error('reason is required when type is "decrease"'); e.status = 400; throw e
    }

    // 3) Calcular nuevo stock y aplicar política
    const current = Number(product.stock ?? 0)
    const delta = type === 'increase' ? q : -q
    const nextStock = current + delta

    if (!ALLOW_NEGATIVE_STOCK && nextStock < 0) {
      const e = new Error('Insufficient stock (negative not allowed)'); e.status = 409; throw e
    }

    // 4) Persistir cambios en producto
    product.stock = nextStock
    await product.save({ transaction: t, fields: ['stock'] })

    // 5) Crear registro de ajuste (auditoría)
    const adjustment = await ManualInventory.create({
      productId: product.id,
      userId: actor?.id ?? null, // quién ejecutó el ajuste
      type,
      quantity: q,
      reason: cleanedReason || null
    }, { transaction: t })

    // 6) Respuesta útil
    return {
      adjustmentId: adjustment.id,
      newStock: nextStock,
      product,
      adjustment
    }
  })
}

/**
 * Listado paginado de ajustes manuales con filtros:
 *  - page, limit
 *  - productId?, userId? (performedBy), type? ('increase'|'decrease')
 *  - dateFrom?, dateTo? (rango sobre created_at, ISO string o 'YYYY-MM-DD')
 */
export async function listManualInventoriesService (params = {}) {
  const page = Math.max(parseInt(params.page ?? 1, 10), 1)
  const limit = Math.min(Math.max(parseInt(params.limit ?? 10, 10), 1), 100)
  const offset = (page - 1) * limit

  const where = {}
  if (params.productId) where.productId = String(params.productId)
  if (params.userId) where.userId = String(params.userId)
  if (params.type && (params.type === 'increase' || params.type === 'decrease')) {
    where.type = params.type
  }

  if (params.dateFrom || params.dateTo) {
    where.created_at = {}
    if (params.dateFrom) where.created_at[Op.gte] = new Date(params.dateFrom)
    if (params.dateTo) where.created_at[Op.lte] = new Date(params.dateTo)
  }

  const { rows, count } = await ManualInventory.findAndCountAll({
    where,
    include: [
      { association: 'product', required: false },
      { association: 'performedBy', required: false }
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
 * Nota: No revierte stock por defecto (es un registro de auditoría).
 * Si alguna vez quieres “revertir”, mejor crear un nuevo ajuste inverso para mantener trazabilidad.
 */
export async function deleteManualInventoryService (id, actor) {
  if (actor?.role !== 'admin') {
    const e = new Error('No tienes permisos'); e.status = 403; throw e
  }
  const rec = await ManualInventory.findByPk(id)
  if (!rec) { const e = new Error('Registro no encontrado'); e.status = 404; throw e }
  await rec.destroy()
  return { message: 'Registro eliminado' }
}
