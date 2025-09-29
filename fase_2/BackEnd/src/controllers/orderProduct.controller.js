// src/controllers/orderProduct.controller.js
import logger from '../utils/logger.js'
import {
  getAllOrderProductsService,
  getOrderProductByIdService,
  createOrderProductService,
  updateOrderProductService,
  deleteOrderProductService
} from '../services/orderProduct.service.js'

// Helpers
const toInt = (v, def) => {
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : def
}

// =================== GET (list) ===================
// GET /api/order-products?page=&limit=&orderId=&productId=
export const getAllOrderProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, orderId, productId } = req.query
    const out = await getAllOrderProductsService({
      page: toInt(page, 1),
      limit: toInt(limit, 10),
      orderId,
      productId
    })
    return res.json(out)
  } catch (err) {
    logger?.error?.(`getAllOrderProducts error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error listando order_products' })
  }
}

// =================== GET (by id) ===================
// GET /api/order-products/:id
export const getOrderProductById = async (req, res) => {
  try {
    const op = await getOrderProductByIdService(req.params.id)
    return res.json(op)
  } catch (err) {
    logger?.error?.(`getOrderProductById error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error obteniendo order_product' })
  }
}

// =================== POST ===================
// POST /api/order-products
export const createOrderProduct = async (req, res) => {
  try {
    const op = await createOrderProductService(req.body)
    return res.status(201).json(op)
  } catch (err) {
    logger?.error?.(`createOrderProduct error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error creando item de orden' })
  }
}

// =================== PATCH ===================
// PATCH /api/order-products/:id
export const updateOrderProduct = async (req, res) => {
  try {
    const op = await updateOrderProductService(req.params.id, req.body)
    return res.json(op)
  } catch (err) {
    logger?.error?.(`updateOrderProduct error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error actualizando item de orden' })
  }
}

// =================== DELETE ===================
// DELETE /api/order-products/:id
export const deleteOrderProduct = async (req, res) => {
  try {
    const out = await deleteOrderProductService(req.params.id)
    return res.json(out)
  } catch (err) {
    logger?.error?.(`deleteOrderProduct error: ${err.message}`)
    return res.status(err.status || 500).json({ message: err.message || 'Error eliminando item de orden' })
  }
}
