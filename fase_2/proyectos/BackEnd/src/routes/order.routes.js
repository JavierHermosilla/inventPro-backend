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
import { canUpdateOrder } from '../middleware/order.middleware.js'

import {
  orderCreateSchema,
  orderUpdateSchema,
  orderByRutSchema
} from '../schemas/order.schema.js'

const router = Router()

// 🌐 Listar todas las órdenes (auth requerido)
router.get('/', verifyTokenMiddleware, listOrders)

// 🔎 Listar órdenes por RUT de cliente (antes de '/:id')
router.get(
  '/by-rut/:rut',
  verifyTokenMiddleware,
  requireRole('admin', 'vendedor', 'bodeguero'),
  listOrdersByRut
)

// ➕ Crear orden (acepta clientId o rut; el schema valida/normaliza)
router.post(
  '/',
  verifyTokenMiddleware,
  validateSchema(orderCreateSchema),
  createOrder
)

// ➕ Crear orden por RUT (en el body)
router.post(
  '/by-rut',
  verifyTokenMiddleware,
  requireRole('admin', 'vendedor'),
  validateSchema(orderByRutSchema),
  createOrderByRut
)

// 📄 Obtener una orden por ID
router.get(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  listOrderById
)

// ✏️ Actualizar estado de una orden (solo admin)
router.patch(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(orderUpdateSchema),
  canUpdateOrder, // 👈 agrega la validación final de permisos
  updateOrder
)

// 🗑️ Eliminar orden (solo admin)
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteOrder
)

export default router
