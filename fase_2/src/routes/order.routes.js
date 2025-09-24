// src/routes/order.routes.js
import { Router } from 'express'
import {
  listOrders,
  listOrderById,
  createOrder,
  updateOrder,
  deleteOrder
} from '../controllers/order.controller.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { canUpdateOrder } from '../middleware/order.middleware.js'

const router = Router()

// Listar todas las órdenes - cualquier usuario autenticado
router.get(
  '/',
  verifyTokenMiddleware,
  listOrders
)

// Obtener orden por id - cualquier usuario autenticado
router.get(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  listOrderById
)

// Crear orden - validación de "self vs admin" la hace el controlador
router.post(
  '/',
  verifyTokenMiddleware,
  createOrder
)

// Actualizar orden - reglas en canUpdateOrder (admin o dueño según estado)
router.put(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  canUpdateOrder,
  updateOrder
)

// Eliminar orden - solo admin
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteOrder
)

export default router
