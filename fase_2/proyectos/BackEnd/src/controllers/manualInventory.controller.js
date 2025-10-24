// src/controllers/manualInventory.controller.js
import logger from '../utils/logger.js'
import { models } from '../models/index.js'
import {
  createManualInventoryService,
  listManualInventoriesService,
  deleteManualInventoryService
} from '../services/manualInventory.service.js'

const { ManualInventory } = models

function toPositiveInt (n) {
  const v = Number(n)
  return Number.isFinite(v) ? Math.trunc(v) : NaN
}

// POST /api/manual-inventory
export const createManualInventory = async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body ?? {}

    // Validación básica defensiva (si ya usas Zod en el schema, puedes omitir esto)
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'productId es requerido y debe ser UUID' })
    }
    if (type !== 'increase' && type !== 'decrease') {
      return res.status(400).json({ message: 'type debe ser "increase" o "decrease"' })
    }
    const q = toPositiveInt(quantity)
    if (!Number.isFinite(q) || q <= 0) {
      return res.status(400).json({ message: 'quantity debe ser entero positivo' })
    }

    const { adjustmentId, newStock, product, adjustment } =
      await createManualInventoryService({ productId, type, quantity: q, reason }, req.user)

    return res.status(201).json({
      message: 'Manual inventory adjustment created.',
      adjustmentId, // ← lo que tu script muestra
      newStock, // ← lo que tu script muestra
      product: {
        id: product.id,
        name: product.name,
        stock: product.stock
      },
      adjustment: {
        id: adjustment.id,
        productId: adjustment.productId,
        userId: adjustment.userId,
        type: adjustment.type,
        quantity: adjustment.quantity,
        reason: adjustment.reason,
        created_at: adjustment.created_at
      }
    })
  } catch (err) {
    logger?.error?.(`createManualInventory error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error creando ajuste' })
  }
}

// GET /api/manual-inventory
export const listManualInventories = async (req, res) => {
  try {
    const result = await listManualInventoriesService(req.query)
    return res.json(result)
  } catch (err) {
    logger?.error?.(`listManualInventories error: ${err.message}`)
    return res.status(500).json({ message: 'Error listando ajustes', error: err.message })
  }
}

// GET /api/manual-inventory/:id
export const manualInventoryById = async (req, res) => {
  try {
    const row = await ManualInventory.findByPk(req.params.id, {
      include: [
        { association: 'product', required: false },
        { association: 'performedBy', required: false }
      ]
    })
    if (!row) return res.status(404).json({ message: 'Registro no encontrado' })
    return res.json(row)
  } catch (err) {
    logger?.error?.(`manualInventoryById error: ${err.message}`)
    return res.status(500).json({ message: 'Error obteniendo ajuste', error: err.message })
  }
}

// DELETE /api/manual-inventory/:id
export const deleteManualInventory = async (req, res) => {
  try {
    const out = await deleteManualInventoryService(req.params.id, req.user)
    return res.json(out)
  } catch (err) {
    logger?.error?.(`deleteManualInventory error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error eliminando ajuste' })
  }
}

// Alias de compatibilidad
export { listManualInventories as getAllManualInventories }
