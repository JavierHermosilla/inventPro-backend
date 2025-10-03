// src/controllers/manualInventory.controller.js
import logger from '../utils/logger.js'
import { models } from '../models/index.js'
import {
  createManualInventoryService,
  listManualInventoriesService,
  deleteManualInventoryService
} from '../services/manualInventory.service.js'

const { ManualInventory } = models

// POST /api/manual-inventory
export const createManualInventory = async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body
    if (!productId || !type || quantity === undefined) {
      return res.status(400).json({ message: 'productId, type y quantity son requeridos' })
    }
    const out = await createManualInventoryService({ productId, type, quantity, reason }, req.user)
    return res.status(201).json({ message: 'Ajuste registrado', ...out })
  } catch (err) {
    logger?.error?.(`createManualInventory error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error creando ajuste' })
  }
}

// GET /api/manual-inventory  (listado paginado)
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
        { association: 'performedBy', required: false } // alias definido en associations
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

// Alias para que tu ruta actual que importa getAllManualInventories siga funcionando
export { listManualInventories as getAllManualInventories }
