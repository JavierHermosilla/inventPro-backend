import { Router } from 'express'
import {
  createCategory,
  listCategories,
  listCategoryById,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { categorySchema } from '../schemas/category.schema.js'

const router = Router()

// Crear categoría (solo admin)
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(categorySchema),
  createCategory
)

// Listar categorías
router.get(
  '/',
  verifyTokenMiddleware,
  listCategories
)

// Obtener categoría por ID
router.get(
  '/:id',
  verifyTokenMiddleware,
  listCategoryById
)

// Actualizar categoría (solo admin)
router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(categorySchema.partial()),
  updateCategory
)

// Eliminar categoría (solo admin)
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  deleteCategory
)

export default router
