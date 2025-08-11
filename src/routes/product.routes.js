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

// Rutas públicas: listar productos y obtener producto por ID
router.get('/', products) // listar productos paginados
router.get('/:id', validateObjectId('id'), productById) // obtener producto por id

// Rutas protegidas: solo admin puede crear, actualizar o eliminar productos
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
  validateObjectId('id'),
  validateSchema(productUpdateSchema),
  updateProduct
)

router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateObjectId('id'),
  deleteProduct
)

export default router
