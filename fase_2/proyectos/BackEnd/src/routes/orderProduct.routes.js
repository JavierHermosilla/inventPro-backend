// src/routes/orderProduct.routes.js
import { Router } from 'express'
import {
  getAllOrderProducts,
  getOrderProductById,
  createOrderProduct,
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

// Lectura (puedes abrirla a más roles si tu requireRole soporta múltiples)
router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  getAllOrderProducts
)

router.get(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  getOrderProductById
)

// Crear item → solo admin
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createOrderProductSchema),
  createOrderProduct
)

// Actualizar cantidad → solo admin
router.patch(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(updateOrderProductSchema),
  updateOrderProduct
)

// Eliminar item → solo admin
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteOrderProduct
)

export default router
