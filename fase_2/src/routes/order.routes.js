// src/routes/order.routes.js
import { Router } from 'express'
import {
  createOrder,
  updateOrder,
  deleteOrder,
  listOrderById,
  listOrders,
  createOrderByRut,
  listOrdersByRut
} from '../controllers/order.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'

import {
  orderCreateSchema,
  orderUpdateSchema,
  orderByRutSchema
} from '../schemas/order.schema.js'

const router = Router()

// Listar todas las órdenes (auth requerido)
router.get('/', verifyTokenMiddleware, listOrders)

// Listar órdenes por RUT de cliente (poner antes de '/:id')
router.get(
  '/by-rut/:rut',
  verifyTokenMiddleware,
  requireRole('admin', 'vendedor', 'bodeguero'),
  listOrdersByRut
)

// Crear orden (acepta clientId o customerId; el schema normaliza)
router.post(
  '/',
  verifyTokenMiddleware,
  validateSchema(orderCreateSchema),
  createOrder
)

// Crear orden por RUT de cliente
router.post(
  '/by-rut',
  verifyTokenMiddleware,
  requireRole('admin', 'vendedor'),
  validateSchema(orderByRutSchema),
  createOrderByRut
)

// Obtener una orden por ID
router.get(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  listOrderById
)

// Actualizar orden (solo status) — PATCH
router.patch(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(orderUpdateSchema),
  updateOrder
)

// Eliminar orden
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteOrder
)

export default router
