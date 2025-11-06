// src/controllers/orderProduct.controller.js
import logger from '../utils/logger.js'
import {
  getAllOrderProductsService,
  getOrderProductByIdService,
  createOrderProductService,
  updateOrderProductService,
  deleteOrderProductService
} from '../services/orderProduct.service.js'

// helpers
const toInt = (v, def) => {
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : def
}

// GET /api/order-products?page=&limit=&orderId=&productId=&include=product
export const getAllOrderProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, orderId, productId, include } = req.query
    const out = await getAllOrderProductsService({
      page: toInt(page, 1),
      limit: toInt(limit, 10),
      orderId,
      productId,
      include
    })
    return res.json(out)
  } catch (err) {
    logger?.error?.(`getAllOrderProducts error: ${err.message}`)
    return res
      .status(err.status || 500)
      .json({ message: err.message || 'Error listando order_products' })
  }
}

// GET /api/order-products/:id
export const getOrderProductById = async (req, res) => {
  try {
    const include = req.query.include // e.g. include=product
    const op = await getOrderProductByIdService(req.params.id, include)
    return res.json(op)
  } catch (err) {
    logger?.error?.(`getOrderProductById error: ${err.message}`)
    return res
      .status(err.status || 500)
      .json({ message: err.message || 'Error obteniendo order_product' })
  }
}

// POST /api/order-products
export const createOrderProduct = async (req, res) => {
  try {
    const { orderId, productId, quantity } = req.body
    if (!orderId || !productId || quantity === undefined) {
      return res.status(400).json({ message: 'orderId, productId y quantity son requeridos' })
    }
    const op = await createOrderProductService({ orderId, productId, quantity })
    return res.status(201).json(op)
  } catch (err) {
    logger?.error?.(`createOrderProduct error: ${err.message}`)
    return res
      .status(err.status || 500)
      .json({ message: err.message || 'Error creando item de orden' })
  }
}

// PATCH /api/order-products/:id
export const updateOrderProduct = async (req, res) => {
  try {
    const { quantity } = req.body
    if (quantity === undefined) {
      return res.status(400).json({ message: 'quantity es requerido' })
    }
    const op = await updateOrderProductService(req.params.id, { quantity })
    return res.json(op)
  } catch (err) {
    logger?.error?.(`updateOrderProduct error: ${err.message}`)
    return res
      .status(err.status || 500)
      .json({ message: err.message || 'Error actualizando item de orden' })
  }
}

// DELETE /api/order-products/:id
export const deleteOrderProduct = async (req, res) => {
  try {
    const out = await deleteOrderProductService(req.params.id)
    return res.json(out)
  } catch (err) {
    logger?.error?.(`deleteOrderProduct error: ${err.message}`)
    return res
      .status(err.status || 500)
      .json({ message: err.message || 'Error eliminando item de orden' })
  }
}
