// src/routes/product.routes.js
import { Router } from 'express'
import {
  createProduct,
  products,
  productById,
  updateProduct,
  deleteProduct,
  exportProductsCSV,
  exportProductsPDF,
  exportProductsXLSX
} from '../controllers/product.controller.js'

import { validateSchema } from '../middleware/validator.middleware.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { productSchema, productUpdateSchema } from '../schemas/product.schema.js'

const router = Router()

// Export (solo admin) — primero para evitar colisión con '/:id'
router.get('/export.csv', verifyTokenMiddleware, requireRole('admin'), exportProductsCSV)
router.get('/export.pdf', verifyTokenMiddleware, requireRole('admin'), exportProductsPDF)
router.get('/export.xlsx', verifyTokenMiddleware, requireRole('admin'), exportProductsXLSX)

// Públicos (lectura)
router.get('/', products)
router.get('/:id', validateUUID('id'), productById)

// Mutaciones (solo admin)
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
  validateUUID('id'),
  validateSchema(productUpdateSchema),
  updateProduct
)

router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteProduct
)

export default router
