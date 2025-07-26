import { Router } from 'express'
import {
  createProduct,
  products,
  productById,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js'

import { verifyToken, requireRole } from '../middleware/auth.middleware.js'
import { productSchema } from '../schemas/product.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'

const router = Router()

// publico: se pueden ver todos los productos y detalles
router.get('/', verifyToken, products) // listar productos
router.get('/:id', verifyToken, productById) // producto por id

// solo ADMIN: crear, actualizar, eliminar
router.post(
  '/',
  verifyToken,
  requireRole('admin'), // ✅ correcto
  validateSchema(productSchema),
  createProduct
)

router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  validateSchema(productSchema),
  updateProduct
) // actualizar producto

router.delete('/:id', verifyToken, requireRole('admin'), deleteProduct) // eliminar producto

export default router
