import { Router } from 'express'
import {
  listOrders,
  listOrderById,
  createOrder,
  updateOrder,
  deleteOrder
} from '../controllers/order.controller.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateObjectId } from '../middleware/validateObjectId.js'
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
  validateObjectId('id'),
  listOrderById
)

// Crear orden - usuario autenticado
router.post(
  '/',
  verifyTokenMiddleware,
  async (req, res, next) => {
    // Garantizar que el cliente solo cree orden para sí mismo
    if (req.body.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Cannot create order for another user' })
    }
    next()
  },
  createOrder
)

// Actualizar orden
router.put(
  '/:id',
  verifyTokenMiddleware,
  validateObjectId('id'),
  canUpdateOrder,
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
