// src/controllers/supplier.controller.js
import logger from '../utils/logger.js'
import { models } from '../models/index.js'
import {
  createSupplierService,
  updateSupplierService,
  deleteSupplierService
} from '../services/supplier.service.js'

const { Supplier } = models

// POST /api/suppliers
export const createSupplier = async (req, res) => {
  try {
    const supplier = await createSupplierService(req.body)
    return res.status(201).json({ message: 'Proveedor creado', supplier })
  } catch (err) {
    logger?.error?.(`createSupplier error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error creando proveedor' })
  }
}

// GET /api/suppliers
export const listSuppliers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page ?? 1, 10), 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? 10, 10), 1), 100)
    const offset = (page - 1) * limit

    const { count, rows } = await Supplier.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']]
    })

    return res.json({
      total: count,
      page,
      pages: Math.max(Math.ceil(count / limit), 1),
      suppliers: rows
    })
  } catch (err) {
    logger?.error?.(`listSuppliers error: ${err.message}`)
    return res.status(500).json({ message: 'Error listando proveedores', error: err.message })
  }
}

// GET /api/suppliers/:id
export const getSupplierById = async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id)
    if (!s) return res.status(404).json({ message: 'Proveedor no encontrado' })
    return res.json(s)
  } catch (err) {
    logger?.error?.(`getSupplierById error: ${err.message}`)
    return res.status(500).json({ message: 'Error obteniendo proveedor', error: err.message })
  }
}

// PATCH /api/suppliers/:id
export const updateSupplier = async (req, res) => {
  try {
    const s = await updateSupplierService(req.params.id, req.body)
    return res.json({ message: 'Proveedor actualizado', supplier: s })
  } catch (err) {
    logger?.error?.(`updateSupplier error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error actualizando proveedor' })
  }
}

// DELETE /api/suppliers/:id
export const deleteSupplier = async (req, res) => {
  try {
    const out = await deleteSupplierService(req.params.id)
    return res.json(out)
  } catch (err) {
    logger?.error?.(`deleteSupplier error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error eliminando proveedor' })
  }
}
