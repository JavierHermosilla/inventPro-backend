import { Router } from 'express'
import {
  listUsers,
  userById,
  updateUser,
  deleteUser,
  createUser
} from '../controllers/user.controller.js'

import { verifyTokenMiddleware, requireRole, requireRoleOrSelf } from '../middleware/auth.middleware.js'
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { validateObjectId } from '../middleware/validateObjectId.js'
import { checkUserUniqueness } from '../middleware/checkUserUniqueness.js'

const router = Router()

// Crear usuario (solo admin)
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createUserSchema),
  checkUserUniqueness,
  createUser
)
// Listar todos los usuarios (solo admin)
router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  listUsers
)

// Obtener usuario por id (admin o el propio usuario)
router.get(
  '/:id',
  verifyTokenMiddleware,
  requireRoleOrSelf('admin'),
  validateObjectId('id'),
  userById
)

// Actualizar usuario (admin o el propio usuario)
router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRoleOrSelf('admin'),
  validateObjectId('id'),
  validateSchema(updateUserSchema),
  checkUserUniqueness,
  updateUser
)

// Eliminar usuario (solo admin)
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateObjectId('id'),
  deleteUser
)

export default router
