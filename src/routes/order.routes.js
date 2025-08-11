import { Router } from 'express'
import {
  listOrders,
  listOrderById,
  createOrder,
  updateOrder,
  deleteOrder
} from '../controllers/order.controller.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js' // asumiendo que validateObjectId está aquí o ajusta import
import { validateObjectId } from '../middleware/validateObjectId.js'

// Si validateObjectId está en otro archivo, ajusta la importación.

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
  validateObjectId('id'),
  listOrderById
)

// Crear orden - usuario autenticado
router.post(
  '/',
  verifyTokenMiddleware,
  createOrder
)

// Actualizar orden - solo admin (podrías ajustar si quieres que clientes puedan actualizar ciertas cosas)
router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateObjectId('id'),
  updateOrder
)

// Eliminar orden - solo admin
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateObjectId('id'),
  deleteOrder
)

export default router
