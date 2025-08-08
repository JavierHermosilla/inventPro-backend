import { Router } from 'express'
import {
  createProduct,
  products,
  productById,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js'

import { validateObjectId } from '../middleware/validateObjectId.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { productSchema, productUpdateSchema } from '../schemas/product.schema.js'

const router = Router()

// publico: se pueden ver todos los productos y detalles
router.get('/', products) // listar productos
router.get('/:id', validateObjectId(), productById) // producto por id

// solo ADMIN: crear, actualizar, eliminar
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(productSchema),
  createProduct
)

router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateObjectId(),
  validateSchema(productUpdateSchema),
  updateProduct
) // actualizar producto

router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateObjectId(),
  deleteProduct
) // eliminar producto

export default router
