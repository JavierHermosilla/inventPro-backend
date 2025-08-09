import { Router } from 'express'
import {
  listUsers,
  userById,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js'

import { verifyTokenMiddleware, requireRole, requireRoleOrSelf } from '../middleware/auth.middleware.js'
import { updateUserSchema } from '../schemas/user.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { validateObjectId } from '../middleware/validateObjectId.js'

const router = Router()

router.get('/', verifyTokenMiddleware, requireRole('admin'), listUsers)
router.get('/:id', verifyTokenMiddleware, requireRoleOrSelf('admin'), validateObjectId(), userById)
router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRoleOrSelf('admin'),
  validateObjectId(),
  validateSchema(updateUserSchema),
  updateUser
)
router.delete('/:id', verifyTokenMiddleware, requireRole('admin'), validateObjectId(), deleteUser)

export default router
