// src/controllers/order.controller.js
import {
  orderCreateSchema,
  normalizeOrderCreate,
  orderUpdateSchema,
  orderByRutSchema
} from '../schemas/order.schema.js'

import {
  createOrderService,
  listOrdersService,
  getOrderService,
  updateOrderStatusService,
  deleteOrderService,
  listOrdersByRutService
} from '../services/order.service.js'

// --------------------- CREATE ORDER ---------------------
export const createOrder = async (req, res) => {
  try {
    const parsed = orderCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors })
    }
    const payload = normalizeOrderCreate(req.body)
    const out = await createOrderService(payload, req.user)
    return res.status(201).json(out)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

// --------------------- LIST ORDERS ---------------------
export const listOrders = async (_req, res) => {
  try {
    const orders = await listOrdersService()
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// --------------------- LIST ORDER BY ID ---------------------
export const listOrderById = async (req, res) => {
  try {
    const order = await getOrderService(req.params.id)
    res.json(order)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

// --------------------- UPDATE ORDER (solo status) ---------------------
export const updateOrder = async (req, res) => {
  try {
    const parsed = orderUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors })
    }
    const full = await updateOrderStatusService(req.params.id, parsed.data.status)
    return res.json({ message: 'Order updated', order: full })
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

// --------------------- DELETE ORDER ---------------------
export const deleteOrder = async (req, res) => {
  try {
    const out = await deleteOrderService(req.params.id)
    res.json(out)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

// --------------------- CREATE ORDER BY RUT (cliente) ---------------------
export const createOrderByRut = async (req, res) => {
  try {
    const parsed = orderByRutSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors })
    }
    const payload = { rut: parsed.data.rut, products: parsed.data.products }
    const out = await createOrderService(payload, req.user)
    return res.status(201).json(out)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Error al crear orden por RUT' })
  }
}

// --------------------- LIST ORDERS BY RUT (cliente) ---------------------
export const listOrdersByRut = async (req, res) => {
  try {
    const rut = String(req.params.rut || '').trim()
    if (!rut) return res.status(400).json({ message: 'RUT requerido' })
    const data = await listOrdersByRutService(rut)
    return res.json(data)
  } catch (err) {
    return res.status(err.status || 500).json({ message: 'Error al buscar órdenes por RUT', error: err?.message })
  }
}
