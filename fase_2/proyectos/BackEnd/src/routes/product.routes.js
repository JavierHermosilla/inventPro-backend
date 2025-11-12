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

// Todas las rutas requieren autenticación
router.use(verifyTokenMiddleware)

// Export (solo admin) - primero para evitar colisión con '/:id'
router.get('/export.csv', requireRole('admin'), exportProductsCSV)
router.get('/export.pdf', requireRole('admin'), exportProductsPDF)
router.get('/export.xlsx', requireRole('admin'), exportProductsXLSX)

// Lectura (roles operativos)
router.get('/', requireRole('admin', 'bodeguero', 'vendedor'), products)
router.get(
  '/:id',
  requireRole('admin', 'bodeguero', 'vendedor'),
  validateUUID('id'),
  productById
)

// Mutaciones (solo admin)
router.post(
  '/',
  requireRole('admin'),
  validateSchema(productSchema),
  createProduct
)

router.put(
  '/:id',
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(productUpdateSchema),
  updateProduct
)

router.delete(
  '/:id',
  requireRole('admin'),
  validateUUID('id'),
  deleteProduct
)

export default router
