import { Router } from 'express'
import {
  listUsers,
  updateUser,
  deleteUser,
  createUser,
  getUserById
} from '../controllers/user.controller.js'

import { verifyTokenMiddleware, requireRole, requireRoleOrSelf } from '../middleware/auth.middleware.js'
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
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

// Listar todos (solo admin)
router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  listUsers
)

// 👇 Ver usuario por id (admin o el mismo usuario)
router.get(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  requireRoleOrSelf('admin'),
  getUserById
)

// 👇 Actualizar usuario (admin o el mismo usuario)
router.put(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  requireRoleOrSelf('admin'),
  validateSchema(updateUserSchema),
  checkUserUniqueness,
  updateUser
)

// Eliminar (solo admin)
router.delete(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  requireRole('admin'),
  deleteUser
)

export default router
