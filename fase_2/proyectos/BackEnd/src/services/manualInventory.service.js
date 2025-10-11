// src/services/manualInventory.service.js
import { sequelize, models } from '../models/index.js'
const { Product, ManualInventory } = models

// create: usa userId (NO performedBy)
export async function createManualInventoryService ({ productId, type, quantity, reason }, actor) {
  return sequelize.transaction(async (t) => {
    const p = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!p) { const e = new Error('Product not found'); e.status = 404; throw e }

    const q = Number(quantity)
    if (!Number.isFinite(q) || q <= 0) { const e = new Error('Cantidad inválida'); e.status = 400; throw e }

    if (type === 'increase') p.stock = Number(p.stock || 0) + q
    else if (type === 'decrease') p.stock = Number(p.stock || 0) - q
    else { const e = new Error('Tipo inválido'); e.status = 400; throw e }

    await p.save({ transaction: t })

    const record = await ManualInventory.create({
      productId,
      userId: actor?.id || null, // <- correcto según tu modelo
      type,
      quantity: q,
      reason: reason || null
    }, { transaction: t })

    return { record, product: p }
  })
}

// list: incluye producto y usuario con el alias definido en associations.js (performedBy)
export async function listManualInventoriesService (params = {}) {
  const page = Math.max(parseInt(params.page ?? 1, 10), 1)
  const limit = Math.min(Math.max(parseInt(params.limit ?? 10, 10), 1), 100)
  const offset = (page - 1) * limit

  const { rows, count } = await ManualInventory.findAndCountAll({
    include: [
      { association: 'product', required: false },
      { association: 'performedBy', required: false }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  })

  return { page, limit, total: count, pages: Math.max(Math.ceil(count / limit), 1), records: rows }
}

// delete (si lo usas aquí)
export async function deleteManualInventoryService (id, actor) {
  if (actor?.role !== 'admin') { const e = new Error('No tienes permisos'); e.status = 403; throw e }
  const rec = await ManualInventory.findByPk(id)
  if (!rec) { const e = new Error('Registro no encontrado'); e.status = 404; throw e }
  await rec.destroy()
  return { message: 'Registro eliminado' }
}
