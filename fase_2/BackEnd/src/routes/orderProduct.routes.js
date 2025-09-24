import { Router } from 'express'
import {
  createOrderProduct,
  getAllOrderProducts,
  getOrderProductById,
  updateOrderProduct,
  deleteOrderProduct
} from '../controllers/orderProduct.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import {
  createOrderProductSchema,
  updateOrderProductSchema
} from '../schemas/orderProduct.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'

const router = Router()

// Crear un OrderProduct → solo admin
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createOrderProductSchema),
  createOrderProduct
)

// Obtener todos los OrderProducts → admin y bodeguero
router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin', 'bodeguero'),
  getAllOrderProducts
)

// Obtener un OrderProduct por ID → admin y bodeguero
router.get(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin', 'bodeguero'),
  validateUUID('id'),
  getOrderProductById
)

// Actualizar un OrderProduct por ID → solo admin
router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(updateOrderProductSchema),
  updateOrderProduct
)

// Eliminar un OrderProduct por ID → solo admin
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteOrderProduct
)

export default router
